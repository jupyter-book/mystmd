import type { GenericNode } from 'myst-common';
import { RuleId, fileWarn } from 'myst-common';
import type { SiUnit } from 'myst-spec-ext';
import type { VFile } from 'vfile';
import { NARROW_NO_BREAK_SPACE } from './characters.js';
import type { Handler } from './types.js';
import { getArguments, texToText } from './utils.js';

const UNITS: Record<string, string> = {
  ampere: 'A',
  candela: 'cd',
  kelvin: 'K',
  gram: 'g',
  kilogram: 'kg',
  metre: 'm',
  meter: 'm',
  mole: 'mol',
  second: 's',
  becquerel: 'Bq',
  degreeCelsius: '°C',
  coulomb: 'C',
  farad: 'F',
  gray: 'Gy',
  hertz: 'Hz',
  henry: 'H',
  joule: 'J',
  lumen: 'lm',
  katal: 'kat',
  lux: 'lx',
  newton: 'N',
  ohm: 'Ω',
  pascal: 'Pa',
  radian: 'rad',
  siemens: 'S',
  sievert: 'Sv',
  steradian: 'sr',
  tesla: 'T',
  volt: 'V',
  watt: 'W',
  weber: 'Wb',
  astronomicalunit: 'au',
  bel: 'B',
  dalton: 'Da',
  day: 'd',
  decibel: 'dB',
  degree: '°',
  electronvolt: 'eV',
  hectare: 'ha',
  hour: 'h',
  litre: 'L',
  liter: 'L',
  arcminute: '′', // minute (plane angle) U+2032
  minute: 'min', // minute (time)
  arcsecond: '″', // second (plane angle) U+2033
  neper: 'Np',
  tonne: 't',
};

// SI prefixes
const PREFIXES: Record<string, string> = {
  quecto: 'q', // -30
  ronto: 'r', // -27
  yocto: 'y', // -24
  zepto: 'z', // -21
  atto: 'a', // -18
  femto: 'f', // -15
  pico: 'p', // -12
  nano: 'n', // -9
  micro: 'µ', // -6
  milli: 'm', // -3
  centi: 'c', // -2
  deci: 'd', // -1
  deca: 'da', // 1
  hecto: 'h', // 2
  kilo: 'k', // 3
  mega: 'M', // 6
  giga: 'G', // 9
  tera: 'T', // 12
  peta: 'P', // 15
  exa: 'E', // 18
  zetta: 'Z', // 21
  yotta: 'Y', // 24
  ronna: 'R', // 27
  quetta: 'Q', // 30
};

const ABBREVIATIONS: Record<string, string> = {
  fg: 'femto gram',
  pg: 'pico gram',
  ng: 'nano gram',
  ug: 'micro gram',
  mg: 'milli gram',
  g: 'gram',
  kg: 'kilo gram',
  pm: 'pico metre',
  nm: 'nano metre',
  um: 'micro metre',
  mm: 'milli metre',
  cm: 'centi metre',
  dm: 'deci metre',
  m: 'metre',
  km: 'kilo metre',
  as: 'atto second',
  fs: 'femto second',
  ps: 'pico second',
  ns: 'nano second',
  us: 'micro second',
  ms: 'milli second',
  s: 'second',
  fmol: 'femto mole',
  pmol: 'pico mole',
  nmol: 'nano mole',
  umol: 'micro mole',
  mmol: 'milli mole',
  mol: 'mole',
  kmol: 'kilo mole',
  pA: 'pico ampere',
  nA: 'nano ampere',
  uA: 'micro ampere',
  mA: 'milli ampere',
  A: 'ampere',
  kA: 'kilo ampere',
  ul: 'micro litre',
  ml: 'milli litre',
  l: 'litre',
  hl: 'hecto litre',
  uL: 'micro liter',
  mL: 'milli liter',
  L: 'liter',
  hL: 'hecto liter',
  mHz: 'milli hertz',
  Hz: 'hertz',
  kHz: 'kilo hertz',
  MHz: 'mega hertz',
  GHz: 'giga hertz',
  THz: 'tera hertz',
  mN: 'milli newton',
  N: 'newton',
  kN: 'kilo newton',
  MN: 'mega newton',
  Pa: 'pascal',
  kPa: 'kilo pascal',
  MPa: 'mega pacal',
  GPa: 'giga pascal',
  mohm: 'milli ohm',
  kohm: 'kilo ohm', // kilohm
  Mohm: 'mega ohm', // megohm
  pV: 'pico volt',
  nV: 'nano volt',
  uV: 'micro volt',
  mV: 'milli volt',
  V: 'volt',
  kV: 'kilo volt',
  W: 'watt',
  nW: 'nano watt',
  uW: 'micro watt',
  mW: 'milli watt',
  kW: 'kilo watt',
  MW: 'mega watt',
  GW: 'giga watt',
  J: 'joule',
  uJ: 'micro joule',
  mJ: 'milli joule',
  kJ: 'kilo joule',
  eV: 'electronvolt',
  meV: 'milli electronvolt',
  keV: 'kilo electronvolt',
  MeV: 'mega electronvolt',
  GeV: 'giga electronvolt',
  TeV: 'tera electronvolt',
  kWh: 'kilo watt hour',
  F: 'farad',
  fF: 'femto farad',
  pF: 'pico farad',
  nF: 'nano farad',
  uF: 'micro farad',
  mF: 'milli farad',
  H: 'henry',
  fH: 'femto henry',
  pH: 'pico henry',
  nH: 'nano henry',
  mH: 'milli henry',
  uH: 'micro henry',
  C: 'coulomb',
  nC: 'nano coulomb',
  mC: 'milli coulomb',
  uC: 'micro coulomb',
  K: 'kelvin',
  dB: 'decibel',
};

type Power = {
  before?: boolean;
  number: number;
};
// SI prefixes
const POWERS: Record<string, Power> = {
  per: { before: true, number: -1 },
  square: { before: true, number: 2 },
  squared: { number: 2 },
  cubic: { before: true, number: 3 },
  cubed: { number: 3 },
};

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '.': '⋅',
  '-': '⁻',
};

function asSuperscript(num: number) {
  return `${num}`
    .split('')
    .map((v) => SUPERSCRIPT[v] ?? v)
    .join('');
}

function unitToString(unit: Unit): string {
  const value = `${unit.prefix ?? ''}${unit.unit ?? ''}`;
  if (!unit.power) return value;
  return `${value}${asSuperscript(unit.power.number)}`;
}

function addPower(orig?: Power, next?: Power): Power | undefined {
  if (!orig) return next;
  if (!next) return orig;
  return { number: orig.number * next.number };
}

type Unit = { unit?: string; prefix?: string; power?: Power };

function createSiUnitNode(
  file: VFile,
  node: GenericNode,
  arg: number,
): { units: GenericNode[]; organized: Unit[]; alt: string } {
  const units = getArguments(node, 'group')
    [arg].content.map((n: GenericNode) => {
      // Attempt to deal with strings, e.g. "kg.m/s^2"
      // TODO: this is pretty incomplete, especially the custom "_"
      if (n.type === 'group') {
        fileWarn(file, 'SI Units do not currently parse groups.', {
          node,
          ruleId: RuleId.texParses,
        });
        return n;
      }
      if (n.type !== 'string') return n;
      if (n.content === '.' || n.content === '~') return undefined;
      if (n.content === '/') return { type: 'macro', content: 'per' };
      if (n.content.includes('^')) {
        const [before, ...after] = n.content.split('^');
        return [
          { type: 'macro', content: before },
          { type: 'macro', content: 'tothe', args: [{ content: [{ content: after.join('^') }] }] },
        ];
      }
      return { type: 'macro', content: n.content };
    })
    .filter((n: GenericNode | undefined): n is GenericNode => !!n)
    .flat(1)
    .filter((n: GenericNode) => n.type === 'macro')
    .map(
      (n: GenericNode) =>
        ABBREVIATIONS[n.content]?.split(' ').map((cmd) => ({ type: 'macro', content: cmd })) ?? n,
    )
    .flat(1);
  const organized: Unit[] = units
    .map((n: GenericNode) => {
      const cmd = n.content;
      if (cmd === 'raiseto') {
        return { power: { number: Number(n.args?.[0]?.content?.[0]?.content), before: true } };
      }
      if (cmd === 'tothe') {
        return { power: { number: Number(n.args?.[0]?.content?.[0]?.content) } };
      }
      if (UNITS[cmd]) return { unit: UNITS[cmd] };
      if (PREFIXES[cmd]) return { prefix: PREFIXES[cmd] };
      if (POWERS[cmd]) return { power: POWERS[cmd] };
      fileWarn(file, `Unknown SI unit: "${cmd}"`, { node, ruleId: RuleId.texParses });
      return { unit: cmd };
    })
    .reduce((items: Unit[], next: { unit: string } | { prefix: string } | { power: Power }) => {
      const last = items.slice(-1)?.[0];
      if ('prefix' in next) {
        return [...items, { prefix: next.prefix }];
      }
      if ('unit' in next && last?.unit) {
        return [...items, { unit: next.unit }];
      } else if ('unit' in next) {
        return [...items.slice(0, -1), { ...last, unit: next.unit }];
      }
      if (!last?.unit) {
        return [...items.slice(0, -1), { ...last, power: addPower(last?.power, next.power) }];
      }
      if (next.power.before) {
        return [...items, { power: next.power }];
      }
      return [...items.slice(0, -1), { ...last, power: addPower(last.power, next.power) }];
    }, [] as Unit[]);
  return { units, alt: units.map((n: GenericNode) => n.content).join(' '), organized };
}

const SIUNITX_HANDLERS: Record<string, Handler> = {
  macro_SI(node, state) {
    state.openParagraph();
    const { units, alt, organized } = createSiUnitNode(state.file, node, 1);
    const number = texToText(getArguments(node, 'group')[0]);
    const translated = organized.map(unitToString).join(NARROW_NO_BREAK_SPACE);
    const space = translated.startsWith('°') ? '' : NARROW_NO_BREAK_SPACE;
    const value = `${number}${space}${translated}`;
    state.addLeaf<SiUnit>('si', {
      number,
      unit: translated,
      alt,
      units: units.map((n: GenericNode) => n.content),
      value,
    });
    return;
  },
  macro_qty(node, state) {
    state.openParagraph();
    const { units, alt, organized } = createSiUnitNode(state.file, node, 1);
    const number = texToText(getArguments(node, 'group')[0]);
    const translated = organized.map(unitToString).join(NARROW_NO_BREAK_SPACE);
    const space = translated.startsWith('°') ? '' : NARROW_NO_BREAK_SPACE;
    const value = `${number}${space}${translated}`;
    state.addLeaf<SiUnit>('si', {
      number,
      unit: translated,
      alt,
      units: units.map((n: GenericNode) => n.content),
      value,
    });
    return;
  },
  macro_unit(node, state) {
    state.openParagraph();
    const { units, organized } = createSiUnitNode(state.file, node, 0);
    const value = organized.map(unitToString).join(NARROW_NO_BREAK_SPACE);
    state.addLeaf('si', { unit: value, units: units.map((n: GenericNode) => n.content), value });
    return;
  },
  macro_ang(node, state) {
    const numbers = texToText(node.args[0])
      .split(';')
      .map((n) => {
        if (!n) return '';
        const num = Number(n);
        if (!isNaN(num)) return `${num}`;
        fileWarn(state.file, `Unexpected number for angle: "${n}".`, {
          node,
          ruleId: RuleId.texParses,
        });
        return n;
      });
    const angular_units = ['degree', 'arcminute', 'arcsecond'];
    const alt = numbers.map((v, i) => (v ? `${v} ${angular_units[i]}` : '')).join(' ');
    const translated = numbers.map((v, i) => (v ? `${v}${UNITS[angular_units[i]]}` : '')).join('');
    // TODO: this might be better as separate SI nodes?
    state.addLeaf<SiUnit>('si', { alt, value: translated, unit: 'degree' });
  },
};

export { SIUNITX_HANDLERS };
