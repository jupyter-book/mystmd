/* eslint-disable no-param-reassign */
import MarkdownIt from 'markdown-it'
import StateBlock from 'markdown-it/lib/rules_block/state_block'
import Renderer from 'markdown-it/lib/renderer'
import { escapeHtml } from 'markdown-it/lib/common/utils'
import { RuleCore } from 'markdown-it/lib/parser_core'
import { getStateEnv, StateEnv, newTarget, TargetKind } from './state'

// % A comment
const COMMENT_PATTERN = /^%\s(.*)$/
// (my_id)=
const TARGET_PATTERN = /^\(([a-zA-Z0-9|@<>*./_\-+:]{1,100})\)=\s*$/
// +++ {"meta": "data"}
const BLOCK_BREAK_PATTERN = /^\+\+\+\s?(\{.*\})?$/

function checkTarget(
  state: StateBlock,
  startLine: number,
  str: string,
  silent: boolean
) {
  const match = TARGET_PATTERN.exec(str)
  if (match == null) return false
  if (silent) return true
  state.line = startLine + 1
  const token = state.push('myst_target', '', 0)
  const id = match?.[1] ?? ''
  token.attrSet('id', id)
  token.map = [startLine, state.line]
  newTarget(state, id, TargetKind.ref)
  return true
}

function checkComment(
  state: StateBlock,
  startLine: number,
  str: string,
  silent: boolean
): boolean {
  const match = COMMENT_PATTERN.exec(str)
  if (match == null) return false
  if (silent) return true
  state.line = startLine + 1
  const token = state.push('myst_comment', '', 0)
  const comment = match?.[1] ?? ''
  token.attrSet('comment', comment)
  token.map = [startLine, state.line]
  return true
}

function checkBlockBreak(
  state: StateBlock,
  startLine: number,
  str: string,
  silent: boolean
) {
  const match = BLOCK_BREAK_PATTERN.exec(str)
  if (match == null) return false
  if (silent) return true
  state.line = startLine + 1
  const token = state.push('myst_block_break', '', 0)
  const metadataString = match?.[1] ?? '{}'
  let metadata = {}
  try {
    metadata = JSON.parse(metadataString)
  } catch (error) {
    console.warn('Could not parse metadata for block break: ', metadataString)
  }
  token.meta = { ...token.meta, metadata }
  token.map = [startLine, state.line]
  return true
}

const blockPlugins = [checkTarget, checkComment, checkBlockBreak]

function blocks(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean
) {
  const pos = state.bMarks[startLine] + state.tShift[startLine]
  const maximum = state.eMarks[startLine]

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) return false

  const str = state.src.slice(pos, maximum)
  return blockPlugins.reduce(
    (complete, plug) => complete || plug(state, startLine, str, silent),
    false
  )
}

const renderTarget: Renderer.RenderRule = (tokens, idx, opts, env: StateEnv) => {
  const ref = tokens[idx].attrGet('id') ?? ''
  const id = env.targets[ref]?.id
  // TODO: This should be better as part of the next element, and then hide this
  return `<span id="${id}"></span>\n`
}

const renderComment: Renderer.RenderRule = (tokens, idx) => {
  const comment = tokens[idx].attrGet('comment') ?? ''
  return `<!-- ${escapeHtml(comment)} -->\n`
}

const renderBlockBreak: Renderer.RenderRule = (tokens, idx) => {
  const { metadata } = tokens[idx].meta
  console.log('Not sure what to do with metadata for block break:', metadata)
  return '<!-- Block Break -->\n'
}

const addBlockTitles: RuleCore = state => {
  const { tokens } = state
  const env = getStateEnv(state)
  for (let index = 0; index < tokens.length; index += 1) {
    const prev = tokens[index - 1]
    const token = tokens[index]
    const next = tokens[index + 1]
    if (prev?.type === 'myst_target' && token.type === 'heading_open') {
      const id = prev.attrGet('id') ?? ''
      // TODO: Should likely have this actually be the rendered content?
      env.targets[id].title = escapeHtml(next.content)
    }
  }
  return true
}

const updateLinkHrefs: RuleCore = state => {
  const { tokens } = state
  const env = getStateEnv(state)
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.type === 'inline' && token.children) {
      token.children.forEach(t => {
        if (t.type === 'link_open') {
          const target = env.targets[t.attrGet('href') ?? '']
          if (target) {
            t.attrSet('title', target.title ?? '')
            t.attrSet('href', `#${target.id}`)
          }
        }
      })
    }
  }
  return true
}

export function plugin(md: MarkdownIt): void {
  md.block.ruler.before('hr', 'myst_blocks', blocks, {
    alt: ['paragraph', 'reference', 'blockquote', 'list', 'footnote_def']
  })
  md.core.ruler.after('block', 'add_block_titles', addBlockTitles)
  md.core.ruler.after('inline', 'update_link_hrefs', updateLinkHrefs)
  md.renderer.rules.myst_target = renderTarget
  md.renderer.rules.myst_comment = renderComment
  md.renderer.rules.myst_block_break = renderBlockBreak
}
