import fs from 'node:fs';
import path from 'node:path';
import { filter } from 'unist-util-filter';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import {
  MystTransformer,
  SphinxTransformer,
  type IReferenceStateResolver,
  type MultiPageReferenceResolver,
} from 'myst-transforms';
import type { GenericNode, GenericParent } from 'myst-common';
import {
  copyNode,
  liftChildren,
  normalizeLabel,
  fileError,
  isTargetIdentifierNode,
  selectMdastNodes,
  NotebookCell,
} from 'myst-common';
import type { Dependency, Embed, Container, CrossReference, Link } from 'myst-spec-ext';
import { selectFile } from '../process/file.js';
import type { ISession } from '../session/types.js';
import { watch } from '../store/reducers.js';
import { castSession } from '../session/cache.js';
import type { MystData } from './crossReferences.js';
import { fetchMystLinkData, fetchMystXRefData, nodesFromMystXRefData } from './crossReferences.js';
import { fileFromRelativePath } from './links.js';

function mutateEmbedNode(
  node: Embed,
  targetNode?: GenericNode | null,
  opts?: { url?: string; dataUrl?: string; targetFile?: string; sourceFile?: string },
) {
  const { url, dataUrl, targetFile, sourceFile } = opts ?? {};
  if (targetNode && node['remove-output']) {
    targetNode = filter(targetNode, (n: GenericNode) => {
      return n.type !== 'output' && n.data?.type !== 'output';
    });
  }
  if (targetNode && node['remove-input']) {
    targetNode = filter(
      targetNode,
      (
        n: GenericNode,
        index: number | null | undefined,
        parent: GenericNode | undefined | null,
      ) => {
        // If we have a code cell with a NotebookCell parent, assume its an input cell and remove.
        return (
          !(n.type === 'code' && parent?.type === 'block' && parent?.kind === NotebookCell.code) ||
          n.data?.type === 'output'
        );
      },
    );
  }
  selectAll('[identifier],[label],[html_id]', targetNode).forEach((idNode: GenericNode) => {
    // Non-target nodes may keep these properties
    if (!isTargetIdentifierNode(idNode)) return;
    delete idNode.identifier;
    delete idNode.label;
    delete idNode.html_id;
  });
  (selectAll('crossReference', targetNode) as CrossReference[]).forEach((targetXRef) => {
    if (!targetXRef.remote) {
      targetXRef.url = url;
      targetXRef.dataUrl = dataUrl;
      targetXRef.remote = true;
    }
  });
  if (targetFile && sourceFile) {
    // TODO: Other node types that point to a file?
    selectAll('image', targetNode).forEach((imageNode: GenericNode) => {
      if (imageNode.url) {
        const absoluteUrl = path.resolve(path.dirname(sourceFile), imageNode.url);
        if (fs.existsSync(absoluteUrl)) {
          imageNode.url = path.relative(path.dirname(targetFile), absoluteUrl);
        }
      }
      if (imageNode.urlSource) {
        const absoluteUrlSource = path.resolve(path.dirname(sourceFile), imageNode.urlSource);
        if (fs.existsSync(absoluteUrlSource)) {
          imageNode.urlSource = path.relative(path.dirname(targetFile), absoluteUrlSource);
        }
      }
    });
  }
  if (!targetNode) {
    node.children = [];
  } else if (targetNode.type === 'block') {
    // Do not nest a single block inside an embed
    node.children = targetNode.children as any[];
  } else {
    node.children = [targetNode as any];
  }
}

function targetsToTarget(targets: GenericNode[]): GenericNode {
  if (targets.length === 1) return copyNode(targets[0]);
  return { type: 'block', children: copyNode(targets) };
}

/**
 * This is the {embed} directive, that embeds nodes from elsewhere in a page.
 */
export async function embedTransform(
  session: ISession,
  mdast: GenericParent,
  file: string,
  dependencies: Dependency[],
  state: IReferenceStateResolver,
) {
  const references = Object.values(castSession(session).$externalReferences);
  const mystTransformer = new MystTransformer(references);
  const embedNodes = selectAll('embed', mdast) as Embed[];
  await Promise.all(
    embedNodes.map(async (node) => {
      const vfile = state.vfile;
      const label = node.source?.label;
      if (!label) {
        fileError(vfile, 'Embed node does not have a label', { node });
        return;
      }
      if (label.startsWith('xref:') || label.startsWith('myst:')) {
        if (!mystTransformer.test(label)) {
          let note: string;
          const sphinxTransformer = new SphinxTransformer(references);
          if (sphinxTransformer.test(label)) {
            note = 'Embed target must be a MyST project, not intersphinx.';
          } else {
            note = 'Embed target must be a MyST project and included in your project references.';
          }
          fileError(vfile, `Cannot embed "${label}"`, { node, note });
          return;
        }
        const referenceLink: Link = {
          type: 'link',
          url: label,
          urlSource: label,
          children: [],
        };
        const transformed = mystTransformer.transform(referenceLink, vfile);
        const referenceXRef = referenceLink as any as CrossReference;
        if (transformed) {
          let data: MystData | undefined;
          let targetNodes: GenericNode[] | undefined;
          if (referenceXRef.identifier) {
            data = await fetchMystXRefData(session, referenceXRef, vfile);
            if (!data) return;
            targetNodes = nodesFromMystXRefData(data, referenceXRef.identifier, vfile, {
              urlSource: label,
              // TODO: maxNodes - settable via embed directive
            });
          } else {
            data = await fetchMystLinkData(session, referenceLink, vfile);
            if (!data?.mdast) return;
            targetNodes = data.mdast.children;
          }
          if (!targetNodes?.length) return;
          const targetNode = targetsToTarget(targetNodes);
          (selectAll('crossReference', targetNode) as CrossReference[]).forEach((targetXRef) => {
            // If target xref already has remoteBaseUrl, it can be unchanged in the embedded context
            if (targetXRef.remoteBaseUrl) return;
            // Otherwise, the remoteBaseUrl is added from the embed context
            targetXRef.remoteBaseUrl = referenceXRef.remoteBaseUrl;
          });
          (selectAll('link', targetNode) as Link[]).forEach((targetLink) => {
            if (!targetLink.internal) return;
            targetLink.internal = false;
            targetLink.url = `${referenceXRef.remoteBaseUrl}${targetLink.url}`;
            if (targetLink.dataUrl) {
              targetLink.dataUrl = `${referenceXRef.remoteBaseUrl}${targetLink.dataUrl}`;
            }
          });
          (selectAll('[source]', targetNode) as { source?: Dependency }[]).forEach((target) => {
            if (!target.source) return;
            target.source.remoteBaseUrl = referenceXRef.remoteBaseUrl;
          });
          mutateEmbedNode(node, targetNode, referenceXRef);
          // Remote dependency, not added as local dependency
          const source: Dependency = {
            url: referenceXRef.url,
            remoteBaseUrl: referenceXRef.remoteBaseUrl,
            label,
          };
          if (data.kind) source.kind = data.kind;
          if (data.slug) source.slug = data.slug;
          if (data.location) source.location = data.location;
          if (data.frontmatter?.title) source.title = data.frontmatter.title;
          if (data.frontmatter?.short_title) source.short_title = data.frontmatter.short_title;
          node.source = source;
        }
        return;
      }
      let hash = label;
      let linkFile: string | undefined;
      if (label.includes('#')) {
        const linkFileWithTarget = fileFromRelativePath(label, file);
        if (!linkFileWithTarget) return;
        linkFile = linkFileWithTarget.split('#')[0];
        hash = linkFileWithTarget.slice(linkFile.length + 1);
      }
      const { identifier } = normalizeLabel(hash) ?? {};
      if (!identifier) {
        fileError(vfile, 'Embed node does not have label', { node });
        return;
      }
      const stateProvider = state.resolveStateProvider(identifier, linkFile);
      if (!stateProvider) return;
      const cache = castSession(session);
      const pageMdast = cache.$getMdast(stateProvider.filePath)?.post?.mdast;
      if (!pageMdast) return;
      let targetNodes: GenericNode[];
      if (stateProvider.getFileTarget(identifier)) {
        targetNodes = pageMdast.children;
      } else {
        targetNodes = selectMdastNodes(pageMdast, identifier).nodes;
      }
      if (!targetNodes?.length) {
        fileError(vfile, `Embed target for "${label}" not found`, { node });
        return;
      }
      const target = targetsToTarget(targetNodes);
      if (!(state as MultiPageReferenceResolver).states) {
        // Single page case - we do not need to update urls/dependencies
        mutateEmbedNode(node, target);
        return;
      }
      const { url, dataUrl, filePath } = stateProvider;
      mutateEmbedNode(node, target, { url, dataUrl, targetFile: file, sourceFile: filePath });
      if (!url) return;
      const source: Dependency = { url, label };
      if (filePath) {
        session.store.dispatch(
          watch.actions.addLocalDependency({
            path: file,
            dependency: filePath,
          }),
        );
        const { kind, slug, frontmatter, location } = selectFile(session, filePath) ?? {};
        if (kind) source.kind = kind;
        if (slug) source.slug = slug;
        if (location) source.location = location;
        if (frontmatter?.title) source.title = frontmatter.title;
        if (frontmatter?.short_title) source.short_title = frontmatter.short_title;
      }
      node.source = source;
      if (!dependencies.map((dep) => dep.url).includes(url)) dependencies.push(source);
    }),
  );
  // If a figure contains a single embed node, move the source info to the figure and lift
  // the embed children, eliminating the embed node.
  const containerNodes = selectAll('container', mdast) as Container[];
  containerNodes.forEach((node: GenericNode) => {
    const containerEmbeds = node.children?.filter((child: GenericNode) => child.type === 'embed');
    if (containerEmbeds?.length === 1) {
      node.source = { ...containerEmbeds[0].source };
      containerEmbeds[0].type = '_lift';
      // If the figure's embedded content is _another_ figure, just lift out the children except caption/legend
      if (
        containerEmbeds[0].children?.length === 1 &&
        containerEmbeds[0].children[0].type === 'container'
      ) {
        containerEmbeds[0].children[0].type = '_lift';
        // It would be nice to keep these if there is not another caption defined on 'node' but that leads to
        // issues with the current figure enumeration resolution, since embedding happens after referencing...
        remove(containerEmbeds[0].children[0], 'caption');
        remove(containerEmbeds[0].children[0], 'legend');
      }
    }
  });
  // If embed node contains a single figure, copy the source info to the figure
  const remainingEmbedNodes = selectAll('embed', mdast) as Embed[];
  remainingEmbedNodes.forEach((node: Embed) => {
    if (node.children?.length === 1 && node.children[0].type === 'container') {
      (node.children[0] as any).source = { ...node.source };
      (node as any).type = '_lift';
    }
  });
  liftChildren(mdast, '_lift');
}
