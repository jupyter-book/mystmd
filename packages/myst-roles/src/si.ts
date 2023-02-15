import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const siRole: RoleSpec = {
  name: 'si',
  body: {
    type: ParseTypesEnum.string,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const value = data.body as string;
    const match = value.match(/([0-9]+)\s?<([\\a-zA-Z]+)>/);
    if (!match) {
      return [{ type: 'si', error: true, value }];
    }
    const [, number, units] = match;
    const parsed = [...units.matchAll(/\\([a-zA-Z]+)/g)];
    const translated = parsed.map(([, c]) => UNITS[c] ?? c);
    return [
      {
        type: 'si',
        number,
        units: parsed.join(' '),
        value: `${number} ${translated.join('')}`,
      },
    ];
  },
};

const UNITS: Record<string, string> = {
  ampere: 'A',
  candela: 'cd',
  kelvin: 'K',
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
  // SI prefixes
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
  // Special
  angstrom: 'Å',
};
