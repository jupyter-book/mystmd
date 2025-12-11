import type { GenericNode } from 'myst-common';
import type { Handler, ITexParser } from './types.js';
import { getArguments, texToText } from './utils.js';

const colors: Record<string, string> = {
  // Standard html colors:
  black: 'black', // #000000
  blue: 'blue', // #0000FF
  brown: 'brown', // #A52A2A
  cyan: 'cyan', // #00FFFF
  darkgray: 'darkgray', // #A9A9A9
  gray: 'gray', // #808080
  green: 'green', // #008000
  lightgray: 'lightgray', // #D3D3D3
  lime: 'lime', // #00FF00
  magenta: 'magenta', // #FF00FF
  olive: 'olive', // #808000
  orange: 'orange', // #FFA500
  pink: 'pink', // #FFC0CB
  purple: 'purple', // #800080
  red: 'red', // #FF0000
  teal: 'teal', // #008080
  violet: 'violet', // #EE82EE
  white: 'white', // #FFFFFF
  yellow: 'yellow', // #FFFF00
  // Other named latex colors
  Apricot: '#FBB982',
  Aquamarine: '#00B5BE',
  Bittersweet: '#C04F17',
  Black: '#221E1F',
  Blue: '#2D2F92',
  BlueGreen: '#00B3B8',
  BlueViolet: '#473992',
  BrickRed: '#B6321C',
  Brown: '#792500',
  BurntOrange: '#F7921D',
  CadetBlue: '#74729A',
  CarnationPink: '#F282B4',
  Cerulean: '#00A2E3',
  CornflowerBlue: '#41B0E4',
  Cyan: '#00AEEF',
  Dandelion: '#FDBC42',
  DarkOrchid: '#A4538A',
  Emerald: '#00A99D',
  ForestGreen: '#009B55',
  Fuchsia: '#8C368C',
  Goldenrod: '#FFDF42',
  Gray: '#949698',
  Green: '#00A64F',
  GreenYellow: '#DFE674',
  JungleGreen: '#00A99A',
  Lavender: '#F49EC4',
  LimeGreen: '#8DC73E',
  Magenta: '#EC008C',
  Mahogany: '#A9341F',
  Maroon: '#AF3235',
  Melon: '#F89E7B',
  MidnightBlue: '#006795',
  Mulberry: '#A93C93',
  NavyBlue: '#006EB8',
  OliveGreen: '#3C8031',
  Orange: '#F58137',
  OrangeRed: '#ED135A',
  Orchid: '#AF72B0',
  Peach: '#F7965A',
  Periwinkle: '#7977B8',
  PineGreen: '#008B72',
  Plum: '#92268F',
  ProcessBlue: '#00B0F0',
  Purple: '#99479B',
  RawSienna: '#974006',
  Red: '#ED1B23',
  RedOrange: '#F26035',
  RedViolet: '#A1246B',
  Rhodamine: '#EF559F',
  RoyalBlue: '#0071BC',
  RoyalPurple: '#613F99',
  RubineRed: '#ED017D',
  Salmon: '#F69289',
  SeaGreen: '#3FBC9D',
  Sepia: '#671800',
  SkyBlue: '#46C5DD',
  SpringGreen: '#C6DC67',
  Tan: '#DA9D76',
  TealBlue: '#00AEB3',
  Thistle: '#D883B7',
  Turquoise: '#00B4CE',
  Violet: '#58429B',
  VioletRed: '#EF58A0',
  White: '#FFFFFF',
  WildStrawberry: '#EE2967',
  Yellow: '#FFF200',
  YellowGreen: '#98CC70',
  YellowOrange: '#FAA21A',
};

function convertLatexColor(
  state: ITexParser,
  node: GenericNode,
  kind: string,
  color: string,
): string | undefined {
  if (!kind || !color) {
    // Override with custom colors!
    const myColors = { ...colors, ...state.data.colors };
    const named = myColors[color] ?? myColors[kind];
    if (named) return named;
    state.warn(`Color is not defined: "${color}"`, node, 'color', {
      note: 'Color names are case sensitive',
      url: 'https://en.wikibooks.org/wiki/LaTeX/Colors#Predefined_colors',
    });
    return undefined;
  }
  switch (kind) {
    case 'gray': {
      let good = true;
      const gray = Math.floor(Number(color) * 255);
      if (Number.isNaN(gray) || gray < 0 || gray > 255) {
        good = false;
        state.warn(`Problem with gray color: ${color}`, node, 'color', {
          note: 'The value when using "gray" the value must be between 0 and 1.',
        });
      }
      return good ? `rgb(${gray}, ${gray}, ${gray})` : undefined;
    }
    case 'rgb': {
      let good = true;
      const channels = color.split(',');
      if (channels.length !== 3) {
        good = false;
        state.warn(`The rgb color must define 3 channels.`, node, 'color', {
          note: 'These values are red, green, and blue, each must be between 0 and 1',
        });
      }
      const [r, g, b] = channels.map((v, i) => {
        const value = Math.floor(Number(v) * 255);
        if (Number.isNaN(value) || value < 0 || value > 255) {
          good = false;
          state.warn(
            `Problem with rgb "${['red', 'green', 'blue'][i]}" color channel: ${v}`,
            node,
            'color',
            { note: 'The value when using "rgb" values must be between 0 and 1.' },
          );
        }
        return value;
      });
      return good ? `rgb(${r}, ${g}, ${b})` : undefined;
    }
    case 'RGB': {
      let good = true;
      const channels = color.split(',');
      if (channels.length !== 3) {
        good = false;
        state.warn(`The RGB color must define 3 channels.`, node, 'color', {
          note: 'These values are red, green, and blue, each must be between 0 and 255',
        });
      }
      const [r, g, b] = channels.map((v, i) => {
        const value = Math.floor(Number(v));
        if (Number.isNaN(value) || value < 0 || value > 255) {
          good = false;
          state.warn(
            `Problem with RGB "${['red', 'green', 'blue'][i]}" color channel: ${v}`,
            node,
            'color',
            { note: 'The value when using "RGB" values must be between 0 and 255.' },
          );
        }
        return value;
      });
      return good ? `rgb(${r},${g},${b})` : undefined;
    }
    case 'HTML': {
      let good = true;
      if (
        !(
          color.length === 3 ||
          color.length === 6 ||
          !color.match(/^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        )
      ) {
        good = false;
        state.warn(`Problem with HTML color: ${color}`, node, 'color', {
          note: 'The value when using "HTML" values must be either 3 or 6 hexadecimal (A-F, 0-9) characters.',
        });
      }
      return good ? `#${color.toUpperCase()}` : undefined;
    }
    case 'cmky': {
      let good = true;
      const channels = color.split(',');
      if (channels.length !== 4) {
        good = false;
        state.warn(`The cmky color must define 4 channels.`, node, 'color', {
          note: 'These values are cyan, magenta, yellow, and black, each must be between 0 and 1',
        });
      }
      const [c, m, k, y] = channels.map((v, i) => {
        const value = Math.floor(Number(v) * 100);
        if (Number.isNaN(value) || value < 0 || value > 100) {
          good = false;
          state.warn(
            `Problem with rgb "${['cyan', 'magenta', 'yellow', 'black'][i]}" color channel: ${v}`,
            node,
            'color',
            { note: 'The value when using "cmky" values must be between 0 and 1.' },
          );
        }
        return value;
      });
      return good ? `cmky(${c}%, ${m}%, ${k}%, ${y}%)` : undefined;
    }
    default:
      state.warn(`Unknown color kind of: "${kind}"`, node, 'color', {
        note: 'Use gray, rgb, RGB or cmky',
      });
  }
}

export const COLOR_HANDLERS: Record<string, Handler> = {
  // https://en.wikibooks.org/wiki/LaTeX/Colors#Color_Models
  macro_color(node, state) {
    state.openParagraph();
    const kind = texToText(getArguments(node, 'argument'));
    const color = texToText(getArguments(node, 'group'));
    const style = convertLatexColor(state, node, kind, color);
    state.openNode('span', style ? { style: { color: style } } : undefined);
    state.data.openGroups.push('span');
    state.data.ignoreNextWhitespace = true;
  },
  macro_textcolor(node, state) {
    state.openParagraph();
    const kind = texToText(getArguments(node, 'argument'));
    const [colorNode, children] = getArguments(node, 'group');
    const color = texToText(colorNode);
    const style = convertLatexColor(state, node, kind, color);
    state.renderInline(children, 'span', style ? { style: { color: style } } : undefined);
  },
  macro_definecolor(node, state) {
    state.closeParagraph();
    const [name, kind, spec] = getArguments(node, 'group').map(texToText);
    const color = convertLatexColor(state, node, kind, spec);
    if (color) {
      state.data.colors[name] = color;
    }
  },
};
