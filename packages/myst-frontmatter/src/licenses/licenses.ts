import type { License } from './types.js';

// This file can be updated by:
// node bin/fetchLicenses.js
// Copy licenses.json into this file and format it

const licenses: Record<string, Omit<License, 'id' | 'url'>> = {
  '0BSD': {
    name: 'BSD Zero Clause License',
    osi: true,
  },
  '3D-Slicer-1.0': {
    name: '3D Slicer License v1.0',
  },
  AAL: {
    name: 'Attribution Assurance License',
    osi: true,
  },
  Abstyles: {
    name: 'Abstyles License',
  },
  'AdaCore-doc': {
    name: 'AdaCore Doc License',
  },
  'Adobe-2006': {
    name: 'Adobe Systems Incorporated Source Code License Agreement',
  },
  'Adobe-Display-PostScript': {
    name: 'Adobe Display PostScript License',
  },
  'Adobe-Glyph': {
    name: 'Adobe Glyph List License',
  },
  'Adobe-Utopia': {
    name: 'Adobe Utopia Font License',
  },
  ADSL: {
    name: 'Amazon Digital Services License',
  },
  'AFL-1.1': {
    name: 'Academic Free License v1.1',
    osi: true,
    free: true,
  },
  'AFL-1.2': {
    name: 'Academic Free License v1.2',
    osi: true,
    free: true,
  },
  'AFL-2.0': {
    name: 'Academic Free License v2.0',
    osi: true,
    free: true,
  },
  'AFL-2.1': {
    name: 'Academic Free License v2.1',
    osi: true,
    free: true,
  },
  'AFL-3.0': {
    name: 'Academic Free License v3.0',
    osi: true,
    free: true,
  },
  Afmparse: {
    name: 'Afmparse License',
  },
  'AGPL-1.0-only': {
    name: 'Affero General Public License v1.0 only',
  },
  'AGPL-1.0-or-later': {
    name: 'Affero General Public License v1.0 or later',
  },
  'AGPL-3.0-only': {
    name: 'GNU Affero General Public License v3.0 only',
    osi: true,
    free: true,
  },
  'AGPL-3.0-or-later': {
    name: 'GNU Affero General Public License v3.0 or later',
    osi: true,
    free: true,
  },
  Aladdin: {
    name: 'Aladdin Free Public License',
  },
  'AMD-newlib': {
    name: 'AMD newlib License',
  },
  AMDPLPA: {
    name: "AMD's plpa_map.c License",
  },
  AML: {
    name: 'Apple MIT License',
  },
  'AML-glslang': {
    name: 'AML glslang variant License',
  },
  AMPAS: {
    name: 'Academy of Motion Picture Arts and Sciences BSD',
  },
  'ANTLR-PD': {
    name: 'ANTLR Software Rights Notice',
  },
  'ANTLR-PD-fallback': {
    name: 'ANTLR Software Rights Notice with license fallback',
  },
  'any-OSI': {
    name: 'Any OSI License',
  },
  'Apache-1.0': {
    name: 'Apache License 1.0',
    free: true,
  },
  'Apache-1.1': {
    name: 'Apache License 1.1',
    osi: true,
    free: true,
  },
  'Apache-2.0': {
    name: 'Apache License 2.0',
    osi: true,
    free: true,
  },
  APAFML: {
    name: 'Adobe Postscript AFM License',
  },
  'APL-1.0': {
    name: 'Adaptive Public License 1.0',
    osi: true,
  },
  'App-s2p': {
    name: 'App::s2p License',
  },
  'APSL-1.0': {
    name: 'Apple Public Source License 1.0',
    osi: true,
  },
  'APSL-1.1': {
    name: 'Apple Public Source License 1.1',
    osi: true,
  },
  'APSL-1.2': {
    name: 'Apple Public Source License 1.2',
    osi: true,
  },
  'APSL-2.0': {
    name: 'Apple Public Source License 2.0',
    osi: true,
    free: true,
  },
  'Arphic-1999': {
    name: 'Arphic Public License',
  },
  'Artistic-1.0': {
    name: 'Artistic License 1.0',
    osi: true,
  },
  'Artistic-1.0-cl8': {
    name: 'Artistic License 1.0 w/clause 8',
    osi: true,
  },
  'Artistic-1.0-Perl': {
    name: 'Artistic License 1.0 (Perl)',
    osi: true,
  },
  'Artistic-2.0': {
    name: 'Artistic License 2.0',
    osi: true,
    free: true,
  },
  'ASWF-Digital-Assets-1.0': {
    name: 'ASWF Digital Assets License version 1.0',
  },
  'ASWF-Digital-Assets-1.1': {
    name: 'ASWF Digital Assets License 1.1',
  },
  Baekmuk: {
    name: 'Baekmuk License',
  },
  Bahyph: {
    name: 'Bahyph License',
  },
  Barr: {
    name: 'Barr License',
  },
  'bcrypt-Solar-Designer': {
    name: 'bcrypt Solar Designer License',
  },
  Beerware: {
    name: 'Beerware License',
  },
  'Bitstream-Charter': {
    name: 'Bitstream Charter Font License',
  },
  'Bitstream-Vera': {
    name: 'Bitstream Vera Font License',
  },
  'BitTorrent-1.0': {
    name: 'BitTorrent Open Source License v1.0',
  },
  'BitTorrent-1.1': {
    name: 'BitTorrent Open Source License v1.1',
    free: true,
  },
  blessing: {
    name: 'SQLite Blessing',
  },
  'BlueOak-1.0.0': {
    name: 'Blue Oak Model License 1.0.0',
    osi: true,
  },
  'Boehm-GC': {
    name: 'Boehm-Demers-Weiser GC License',
  },
  Borceux: {
    name: 'Borceux license',
  },
  'Brian-Gladman-2-Clause': {
    name: 'Brian Gladman 2-Clause License',
  },
  'Brian-Gladman-3-Clause': {
    name: 'Brian Gladman 3-Clause License',
  },
  'BSD-1-Clause': {
    name: 'BSD 1-Clause License',
    osi: true,
  },
  'BSD-2-Clause': {
    name: 'BSD 2-Clause "Simplified" License',
    osi: true,
    free: true,
  },
  'BSD-2-Clause-Darwin': {
    name: 'BSD 2-Clause - Ian Darwin variant',
  },
  'BSD-2-Clause-first-lines': {
    name: 'BSD 2-Clause - first lines requirement',
  },
  'BSD-2-Clause-Patent': {
    name: 'BSD-2-Clause Plus Patent License',
    osi: true,
  },
  'BSD-2-Clause-Views': {
    name: 'BSD 2-Clause with views sentence',
  },
  'BSD-3-Clause': {
    name: 'BSD 3-Clause "New" or "Revised" License',
    osi: true,
    free: true,
  },
  'BSD-3-Clause-acpica': {
    name: 'BSD 3-Clause acpica variant',
  },
  'BSD-3-Clause-Attribution': {
    name: 'BSD with attribution',
  },
  'BSD-3-Clause-Clear': {
    name: 'BSD 3-Clause Clear License',
    free: true,
  },
  'BSD-3-Clause-flex': {
    name: 'BSD 3-Clause Flex variant',
  },
  'BSD-3-Clause-HP': {
    name: 'Hewlett-Packard BSD variant license',
  },
  'BSD-3-Clause-LBNL': {
    name: 'Lawrence Berkeley National Labs BSD variant license',
    osi: true,
  },
  'BSD-3-Clause-Modification': {
    name: 'BSD 3-Clause Modification',
  },
  'BSD-3-Clause-No-Military-License': {
    name: 'BSD 3-Clause No Military License',
  },
  'BSD-3-Clause-No-Nuclear-License': {
    name: 'BSD 3-Clause No Nuclear License',
  },
  'BSD-3-Clause-No-Nuclear-License-2014': {
    name: 'BSD 3-Clause No Nuclear License 2014',
  },
  'BSD-3-Clause-No-Nuclear-Warranty': {
    name: 'BSD 3-Clause No Nuclear Warranty',
  },
  'BSD-3-Clause-Open-MPI': {
    name: 'BSD 3-Clause Open MPI variant',
  },
  'BSD-3-Clause-Sun': {
    name: 'BSD 3-Clause Sun Microsystems',
  },
  'BSD-4-Clause': {
    name: 'BSD 4-Clause "Original" or "Old" License',
    free: true,
  },
  'BSD-4-Clause-Shortened': {
    name: 'BSD 4 Clause Shortened',
  },
  'BSD-4-Clause-UC': {
    name: 'BSD-4-Clause (University of California-Specific)',
  },
  'BSD-4.3RENO': {
    name: 'BSD 4.3 RENO License',
  },
  'BSD-4.3TAHOE': {
    name: 'BSD 4.3 TAHOE License',
  },
  'BSD-Advertising-Acknowledgement': {
    name: 'BSD Advertising Acknowledgement License',
  },
  'BSD-Attribution-HPND-disclaimer': {
    name: 'BSD with Attribution and HPND disclaimer',
  },
  'BSD-Inferno-Nettverk': {
    name: 'BSD-Inferno-Nettverk',
  },
  'BSD-Protection': {
    name: 'BSD Protection License',
  },
  'BSD-Source-beginning-file': {
    name: 'BSD Source Code Attribution - beginning of file variant',
  },
  'BSD-Source-Code': {
    name: 'BSD Source Code Attribution',
  },
  'BSD-Systemics': {
    name: 'Systemics BSD variant license',
  },
  'BSD-Systemics-W3Works': {
    name: 'Systemics W3Works BSD variant license',
  },
  'BSL-1.0': {
    name: 'Boost Software License 1.0',
    osi: true,
    free: true,
  },
  'BUSL-1.1': {
    name: 'Business Source License 1.1',
  },
  'bzip2-1.0.6': {
    name: 'bzip2 and libbzip2 License v1.0.6',
  },
  'C-UDA-1.0': {
    name: 'Computational Use of Data Agreement v1.0',
  },
  'CAL-1.0': {
    name: 'Cryptographic Autonomy License 1.0',
    osi: true,
  },
  'CAL-1.0-Combined-Work-Exception': {
    name: 'Cryptographic Autonomy License 1.0 (Combined Work Exception)',
    osi: true,
  },
  Caldera: {
    name: 'Caldera License',
  },
  'Caldera-no-preamble': {
    name: 'Caldera License (without preamble)',
  },
  Catharon: {
    name: 'Catharon License',
  },
  'CATOSL-1.1': {
    name: 'Computer Associates Trusted Open Source License 1.1',
    osi: true,
  },
  'CC-BY-1.0': {
    name: 'Creative Commons Attribution 1.0 Generic',
    CC: true,
  },
  'CC-BY-2.0': {
    name: 'Creative Commons Attribution 2.0 Generic',
    CC: true,
  },
  'CC-BY-2.5': {
    name: 'Creative Commons Attribution 2.5 Generic',
    CC: true,
  },
  'CC-BY-2.5-AU': {
    name: 'Creative Commons Attribution 2.5 Australia',
    CC: true,
  },
  'CC-BY-3.0': {
    name: 'Creative Commons Attribution 3.0 Unported',
    CC: true,
  },
  'CC-BY-3.0-AT': {
    name: 'Creative Commons Attribution 3.0 Austria',
    CC: true,
  },
  'CC-BY-3.0-AU': {
    name: 'Creative Commons Attribution 3.0 Australia',
    CC: true,
  },
  'CC-BY-3.0-DE': {
    name: 'Creative Commons Attribution 3.0 Germany',
    CC: true,
  },
  'CC-BY-3.0-IGO': {
    name: 'Creative Commons Attribution 3.0 IGO',
    CC: true,
  },
  'CC-BY-3.0-NL': {
    name: 'Creative Commons Attribution 3.0 Netherlands',
    CC: true,
  },
  'CC-BY-3.0-US': {
    name: 'Creative Commons Attribution 3.0 United States',
    CC: true,
  },
  'CC-BY-4.0': {
    name: 'Creative Commons Attribution 4.0 International',
    free: true,
    CC: true,
  },
  'CC-BY-NC-1.0': {
    name: 'Creative Commons Attribution Non Commercial 1.0 Generic',
    CC: true,
  },
  'CC-BY-NC-2.0': {
    name: 'Creative Commons Attribution Non Commercial 2.0 Generic',
    CC: true,
  },
  'CC-BY-NC-2.5': {
    name: 'Creative Commons Attribution Non Commercial 2.5 Generic',
    CC: true,
  },
  'CC-BY-NC-3.0': {
    name: 'Creative Commons Attribution Non Commercial 3.0 Unported',
    CC: true,
  },
  'CC-BY-NC-3.0-DE': {
    name: 'Creative Commons Attribution Non Commercial 3.0 Germany',
    CC: true,
  },
  'CC-BY-NC-4.0': {
    name: 'Creative Commons Attribution Non Commercial 4.0 International',
    CC: true,
  },
  'CC-BY-NC-ND-1.0': {
    name: 'Creative Commons Attribution Non Commercial No Derivatives 1.0 Generic',
    CC: true,
  },
  'CC-BY-NC-ND-2.0': {
    name: 'Creative Commons Attribution Non Commercial No Derivatives 2.0 Generic',
    CC: true,
  },
  'CC-BY-NC-ND-2.5': {
    name: 'Creative Commons Attribution Non Commercial No Derivatives 2.5 Generic',
    CC: true,
  },
  'CC-BY-NC-ND-3.0': {
    name: 'Creative Commons Attribution Non Commercial No Derivatives 3.0 Unported',
    CC: true,
  },
  'CC-BY-NC-ND-3.0-DE': {
    name: 'Creative Commons Attribution Non Commercial No Derivatives 3.0 Germany',
    CC: true,
  },
  'CC-BY-NC-ND-3.0-IGO': {
    name: 'Creative Commons Attribution Non Commercial No Derivatives 3.0 IGO',
    CC: true,
  },
  'CC-BY-NC-ND-4.0': {
    name: 'Creative Commons Attribution Non Commercial No Derivatives 4.0 International',
    CC: true,
  },
  'CC-BY-NC-SA-1.0': {
    name: 'Creative Commons Attribution Non Commercial Share Alike 1.0 Generic',
    CC: true,
  },
  'CC-BY-NC-SA-2.0': {
    name: 'Creative Commons Attribution Non Commercial Share Alike 2.0 Generic',
    CC: true,
  },
  'CC-BY-NC-SA-2.0-DE': {
    name: 'Creative Commons Attribution Non Commercial Share Alike 2.0 Germany',
    CC: true,
  },
  'CC-BY-NC-SA-2.0-FR': {
    name: 'Creative Commons Attribution-NonCommercial-ShareAlike 2.0 France',
    CC: true,
  },
  'CC-BY-NC-SA-2.0-UK': {
    name: 'Creative Commons Attribution Non Commercial Share Alike 2.0 England and Wales',
    CC: true,
  },
  'CC-BY-NC-SA-2.5': {
    name: 'Creative Commons Attribution Non Commercial Share Alike 2.5 Generic',
    CC: true,
  },
  'CC-BY-NC-SA-3.0': {
    name: 'Creative Commons Attribution Non Commercial Share Alike 3.0 Unported',
    CC: true,
  },
  'CC-BY-NC-SA-3.0-DE': {
    name: 'Creative Commons Attribution Non Commercial Share Alike 3.0 Germany',
    CC: true,
  },
  'CC-BY-NC-SA-3.0-IGO': {
    name: 'Creative Commons Attribution Non Commercial Share Alike 3.0 IGO',
    CC: true,
  },
  'CC-BY-NC-SA-4.0': {
    name: 'Creative Commons Attribution Non Commercial Share Alike 4.0 International',
    CC: true,
  },
  'CC-BY-ND-1.0': {
    name: 'Creative Commons Attribution No Derivatives 1.0 Generic',
    CC: true,
  },
  'CC-BY-ND-2.0': {
    name: 'Creative Commons Attribution No Derivatives 2.0 Generic',
    CC: true,
  },
  'CC-BY-ND-2.5': {
    name: 'Creative Commons Attribution No Derivatives 2.5 Generic',
    CC: true,
  },
  'CC-BY-ND-3.0': {
    name: 'Creative Commons Attribution No Derivatives 3.0 Unported',
    CC: true,
  },
  'CC-BY-ND-3.0-DE': {
    name: 'Creative Commons Attribution No Derivatives 3.0 Germany',
    CC: true,
  },
  'CC-BY-ND-4.0': {
    name: 'Creative Commons Attribution No Derivatives 4.0 International',
    CC: true,
  },
  'CC-BY-SA-1.0': {
    name: 'Creative Commons Attribution Share Alike 1.0 Generic',
    CC: true,
  },
  'CC-BY-SA-2.0': {
    name: 'Creative Commons Attribution Share Alike 2.0 Generic',
    CC: true,
  },
  'CC-BY-SA-2.0-UK': {
    name: 'Creative Commons Attribution Share Alike 2.0 England and Wales',
    CC: true,
  },
  'CC-BY-SA-2.1-JP': {
    name: 'Creative Commons Attribution Share Alike 2.1 Japan',
    CC: true,
  },
  'CC-BY-SA-2.5': {
    name: 'Creative Commons Attribution Share Alike 2.5 Generic',
    CC: true,
  },
  'CC-BY-SA-3.0': {
    name: 'Creative Commons Attribution Share Alike 3.0 Unported',
    CC: true,
  },
  'CC-BY-SA-3.0-AT': {
    name: 'Creative Commons Attribution Share Alike 3.0 Austria',
    CC: true,
  },
  'CC-BY-SA-3.0-DE': {
    name: 'Creative Commons Attribution Share Alike 3.0 Germany',
    CC: true,
  },
  'CC-BY-SA-3.0-IGO': {
    name: 'Creative Commons Attribution-ShareAlike 3.0 IGO',
    CC: true,
  },
  'CC-BY-SA-4.0': {
    name: 'Creative Commons Attribution Share Alike 4.0 International',
    free: true,
    CC: true,
  },
  'CC-PDDC': {
    name: 'Creative Commons Public Domain Dedication and Certification',
    CC: true,
  },
  'CC0-1.0': {
    name: 'Creative Commons Zero v1.0 Universal',
    free: true,
    CC: true,
  },
  'CDDL-1.0': {
    name: 'Common Development and Distribution License 1.0',
    osi: true,
    free: true,
  },
  'CDDL-1.1': {
    name: 'Common Development and Distribution License 1.1',
  },
  'CDL-1.0': {
    name: 'Common Documentation License 1.0',
  },
  'CDLA-Permissive-1.0': {
    name: 'Community Data License Agreement Permissive 1.0',
  },
  'CDLA-Permissive-2.0': {
    name: 'Community Data License Agreement Permissive 2.0',
  },
  'CDLA-Sharing-1.0': {
    name: 'Community Data License Agreement Sharing 1.0',
  },
  'CECILL-1.0': {
    name: 'CeCILL Free Software License Agreement v1.0',
  },
  'CECILL-1.1': {
    name: 'CeCILL Free Software License Agreement v1.1',
  },
  'CECILL-2.0': {
    name: 'CeCILL Free Software License Agreement v2.0',
    free: true,
  },
  'CECILL-2.1': {
    name: 'CeCILL Free Software License Agreement v2.1',
    osi: true,
  },
  'CECILL-B': {
    name: 'CeCILL-B Free Software License Agreement',
    free: true,
  },
  'CECILL-C': {
    name: 'CeCILL-C Free Software License Agreement',
    free: true,
  },
  'CERN-OHL-1.1': {
    name: 'CERN Open Hardware Licence v1.1',
  },
  'CERN-OHL-1.2': {
    name: 'CERN Open Hardware Licence v1.2',
  },
  'CERN-OHL-P-2.0': {
    name: 'CERN Open Hardware Licence Version 2 - Permissive',
    osi: true,
  },
  'CERN-OHL-S-2.0': {
    name: 'CERN Open Hardware Licence Version 2 - Strongly Reciprocal',
    osi: true,
  },
  'CERN-OHL-W-2.0': {
    name: 'CERN Open Hardware Licence Version 2 - Weakly Reciprocal',
    osi: true,
  },
  CFITSIO: {
    name: 'CFITSIO License',
  },
  'check-cvs': {
    name: 'check-cvs License',
  },
  checkmk: {
    name: 'Checkmk License',
  },
  ClArtistic: {
    name: 'Clarified Artistic License',
    free: true,
  },
  Clips: {
    name: 'Clips License',
  },
  'CMU-Mach': {
    name: 'CMU Mach License',
  },
  'CMU-Mach-nodoc': {
    name: 'CMU    Mach - no notices-in-documentation variant',
  },
  'CNRI-Jython': {
    name: 'CNRI Jython License',
  },
  'CNRI-Python': {
    name: 'CNRI Python License',
    osi: true,
  },
  'CNRI-Python-GPL-Compatible': {
    name: 'CNRI Python Open Source GPL Compatible License Agreement',
  },
  'COIL-1.0': {
    name: 'Copyfree Open Innovation License',
  },
  'Community-Spec-1.0': {
    name: 'Community Specification License 1.0',
  },
  'Condor-1.1': {
    name: 'Condor Public License v1.1',
    free: true,
  },
  'copyleft-next-0.3.0': {
    name: 'copyleft-next 0.3.0',
  },
  'copyleft-next-0.3.1': {
    name: 'copyleft-next 0.3.1',
  },
  'Cornell-Lossless-JPEG': {
    name: 'Cornell Lossless JPEG License',
  },
  'CPAL-1.0': {
    name: 'Common Public Attribution License 1.0',
    osi: true,
    free: true,
  },
  'CPL-1.0': {
    name: 'Common Public License 1.0',
    osi: true,
    free: true,
  },
  'CPOL-1.02': {
    name: 'Code Project Open License 1.02',
  },
  Cronyx: {
    name: 'Cronyx License',
  },
  Crossword: {
    name: 'Crossword License',
  },
  CrystalStacker: {
    name: 'CrystalStacker License',
  },
  'CUA-OPL-1.0': {
    name: 'CUA Office Public License v1.0',
    osi: true,
  },
  Cube: {
    name: 'Cube License',
  },
  curl: {
    name: 'curl License',
  },
  'cve-tou': {
    name: 'Common Vulnerability Enumeration ToU License',
  },
  'D-FSL-1.0': {
    name: 'Deutsche Freie Software Lizenz',
  },
  'DEC-3-Clause': {
    name: 'DEC 3-Clause License',
  },
  diffmark: {
    name: 'diffmark license',
  },
  'DL-DE-BY-2.0': {
    name: 'Data licence Germany – attribution – version 2.0',
  },
  'DL-DE-ZERO-2.0': {
    name: 'Data licence Germany – zero – version 2.0',
  },
  DOC: {
    name: 'DOC License',
  },
  'DocBook-Schema': {
    name: 'DocBook Schema License',
  },
  'DocBook-XML': {
    name: 'DocBook XML License',
  },
  Dotseqn: {
    name: 'Dotseqn License',
  },
  'DRL-1.0': {
    name: 'Detection Rule License 1.0',
  },
  'DRL-1.1': {
    name: 'Detection Rule License 1.1',
  },
  DSDP: {
    name: 'DSDP License',
  },
  dtoa: {
    name: 'David M. Gay dtoa License',
  },
  dvipdfm: {
    name: 'dvipdfm License',
  },
  'ECL-1.0': {
    name: 'Educational Community License v1.0',
    osi: true,
  },
  'ECL-2.0': {
    name: 'Educational Community License v2.0',
    osi: true,
    free: true,
  },
  'EFL-1.0': {
    name: 'Eiffel Forum License v1.0',
    osi: true,
  },
  'EFL-2.0': {
    name: 'Eiffel Forum License v2.0',
    osi: true,
    free: true,
  },
  eGenix: {
    name: 'eGenix.com Public License 1.1.0',
  },
  'Elastic-2.0': {
    name: 'Elastic License 2.0',
  },
  Entessa: {
    name: 'Entessa Public License v1.0',
    osi: true,
  },
  EPICS: {
    name: 'EPICS Open License',
  },
  'EPL-1.0': {
    name: 'Eclipse Public License 1.0',
    osi: true,
    free: true,
  },
  'EPL-2.0': {
    name: 'Eclipse Public License 2.0',
    osi: true,
    free: true,
  },
  'ErlPL-1.1': {
    name: 'Erlang Public License v1.1',
  },
  'etalab-2.0': {
    name: 'Etalab Open License 2.0',
  },
  EUDatagrid: {
    name: 'EU DataGrid Software License',
    osi: true,
    free: true,
  },
  'EUPL-1.0': {
    name: 'European Union Public License 1.0',
  },
  'EUPL-1.1': {
    name: 'European Union Public License 1.1',
    osi: true,
    free: true,
  },
  'EUPL-1.2': {
    name: 'European Union Public License 1.2',
    osi: true,
    free: true,
  },
  Eurosym: {
    name: 'Eurosym License',
  },
  Fair: {
    name: 'Fair License',
    osi: true,
  },
  FBM: {
    name: 'Fuzzy Bitmap License',
  },
  'FDK-AAC': {
    name: 'Fraunhofer FDK AAC Codec Library',
  },
  'Ferguson-Twofish': {
    name: 'Ferguson Twofish License',
  },
  'Frameworx-1.0': {
    name: 'Frameworx Open License 1.0',
    osi: true,
  },
  'FreeBSD-DOC': {
    name: 'FreeBSD Documentation License',
  },
  FreeImage: {
    name: 'FreeImage Public License v1.0',
  },
  FSFAP: {
    name: 'FSF All Permissive License',
    free: true,
  },
  'FSFAP-no-warranty-disclaimer': {
    name: 'FSF All Permissive License (without Warranty)',
  },
  FSFUL: {
    name: 'FSF Unlimited License',
  },
  FSFULLR: {
    name: 'FSF Unlimited License (with License Retention)',
  },
  FSFULLRWD: {
    name: 'FSF Unlimited License (With License Retention and Warranty Disclaimer)',
  },
  FTL: {
    name: 'Freetype Project License',
    free: true,
  },
  Furuseth: {
    name: 'Furuseth License',
  },
  fwlw: {
    name: 'fwlw License',
  },
  'GCR-docs': {
    name: 'Gnome GCR Documentation License',
  },
  GD: {
    name: 'GD License',
  },
  'GFDL-1.1-invariants-only': {
    name: 'GNU Free Documentation License v1.1 only - invariants',
  },
  'GFDL-1.1-invariants-or-later': {
    name: 'GNU Free Documentation License v1.1 or later - invariants',
  },
  'GFDL-1.1-no-invariants-only': {
    name: 'GNU Free Documentation License v1.1 only - no invariants',
  },
  'GFDL-1.1-no-invariants-or-later': {
    name: 'GNU Free Documentation License v1.1 or later - no invariants',
  },
  'GFDL-1.1-only': {
    name: 'GNU Free Documentation License v1.1 only',
    free: true,
  },
  'GFDL-1.1-or-later': {
    name: 'GNU Free Documentation License v1.1 or later',
    free: true,
  },
  'GFDL-1.2-invariants-only': {
    name: 'GNU Free Documentation License v1.2 only - invariants',
  },
  'GFDL-1.2-invariants-or-later': {
    name: 'GNU Free Documentation License v1.2 or later - invariants',
  },
  'GFDL-1.2-no-invariants-only': {
    name: 'GNU Free Documentation License v1.2 only - no invariants',
  },
  'GFDL-1.2-no-invariants-or-later': {
    name: 'GNU Free Documentation License v1.2 or later - no invariants',
  },
  'GFDL-1.2-only': {
    name: 'GNU Free Documentation License v1.2 only',
    free: true,
  },
  'GFDL-1.2-or-later': {
    name: 'GNU Free Documentation License v1.2 or later',
    free: true,
  },
  'GFDL-1.3-invariants-only': {
    name: 'GNU Free Documentation License v1.3 only - invariants',
  },
  'GFDL-1.3-invariants-or-later': {
    name: 'GNU Free Documentation License v1.3 or later - invariants',
  },
  'GFDL-1.3-no-invariants-only': {
    name: 'GNU Free Documentation License v1.3 only - no invariants',
  },
  'GFDL-1.3-no-invariants-or-later': {
    name: 'GNU Free Documentation License v1.3 or later - no invariants',
  },
  'GFDL-1.3-only': {
    name: 'GNU Free Documentation License v1.3 only',
    free: true,
  },
  'GFDL-1.3-or-later': {
    name: 'GNU Free Documentation License v1.3 or later',
    free: true,
  },
  Giftware: {
    name: 'Giftware License',
  },
  GL2PS: {
    name: 'GL2PS License',
  },
  Glide: {
    name: '3dfx Glide License',
  },
  Glulxe: {
    name: 'Glulxe License',
  },
  GLWTPL: {
    name: 'Good Luck With That Public License',
  },
  gnuplot: {
    name: 'gnuplot License',
    free: true,
  },
  'GPL-1.0-only': {
    name: 'GNU General Public License v1.0 only',
  },
  'GPL-1.0-or-later': {
    name: 'GNU General Public License v1.0 or later',
  },
  'GPL-2.0-only': {
    name: 'GNU General Public License v2.0 only',
    osi: true,
    free: true,
  },
  'GPL-2.0-or-later': {
    name: 'GNU General Public License v2.0 or later',
    osi: true,
    free: true,
  },
  'GPL-3.0-only': {
    name: 'GNU General Public License v3.0 only',
    osi: true,
    free: true,
  },
  'GPL-3.0-or-later': {
    name: 'GNU General Public License v3.0 or later',
    osi: true,
    free: true,
  },
  'Graphics-Gems': {
    name: 'Graphics Gems License',
  },
  'gSOAP-1.3b': {
    name: 'gSOAP Public License v1.3b',
  },
  gtkbook: {
    name: 'gtkbook License',
  },
  Gutmann: {
    name: 'Gutmann License',
  },
  HaskellReport: {
    name: 'Haskell Language Report License',
  },
  hdparm: {
    name: 'hdparm License',
  },
  HIDAPI: {
    name: 'HIDAPI License',
  },
  'Hippocratic-2.1': {
    name: 'Hippocratic License 2.1',
  },
  'HP-1986': {
    name: 'Hewlett-Packard 1986 License',
  },
  'HP-1989': {
    name: 'Hewlett-Packard 1989 License',
  },
  HPND: {
    name: 'Historical Permission Notice and Disclaimer',
    osi: true,
    free: true,
  },
  'HPND-DEC': {
    name: 'Historical Permission Notice and Disclaimer - DEC variant',
  },
  'HPND-doc': {
    name: 'Historical Permission Notice and Disclaimer - documentation variant',
  },
  'HPND-doc-sell': {
    name: 'Historical Permission Notice and Disclaimer - documentation sell variant',
  },
  'HPND-export-US': {
    name: 'HPND with US Government export control warning',
  },
  'HPND-export-US-acknowledgement': {
    name: 'HPND with US Government export control warning and acknowledgment',
  },
  'HPND-export-US-modify': {
    name: 'HPND with US Government export control warning and modification rqmt',
  },
  'HPND-export2-US': {
    name: 'HPND with US Government export control and 2 disclaimers',
  },
  'HPND-Fenneberg-Livingston': {
    name: 'Historical Permission Notice and Disclaimer - Fenneberg-Livingston variant',
  },
  'HPND-INRIA-IMAG': {
    name: 'Historical Permission Notice and Disclaimer    - INRIA-IMAG variant',
  },
  'HPND-Intel': {
    name: 'Historical Permission Notice and Disclaimer - Intel variant',
  },
  'HPND-Kevlin-Henney': {
    name: 'Historical Permission Notice and Disclaimer - Kevlin Henney variant',
  },
  'HPND-Markus-Kuhn': {
    name: 'Historical Permission Notice and Disclaimer - Markus Kuhn variant',
  },
  'HPND-merchantability-variant': {
    name: 'Historical Permission Notice and Disclaimer - merchantability variant',
  },
  'HPND-MIT-disclaimer': {
    name: 'Historical Permission Notice and Disclaimer with MIT disclaimer',
  },
  'HPND-Netrek': {
    name: 'Historical Permission Notice and Disclaimer - Netrek variant',
  },
  'HPND-Pbmplus': {
    name: 'Historical Permission Notice and Disclaimer - Pbmplus variant',
  },
  'HPND-sell-MIT-disclaimer-xserver': {
    name: 'Historical Permission Notice and Disclaimer - sell xserver variant with MIT disclaimer',
  },
  'HPND-sell-regexpr': {
    name: 'Historical Permission Notice and Disclaimer - sell regexpr variant',
  },
  'HPND-sell-variant': {
    name: 'Historical Permission Notice and Disclaimer - sell variant',
  },
  'HPND-sell-variant-MIT-disclaimer': {
    name: 'HPND sell variant with MIT disclaimer',
  },
  'HPND-sell-variant-MIT-disclaimer-rev': {
    name: 'HPND sell variant with MIT disclaimer - reverse',
  },
  'HPND-UC': {
    name: 'Historical Permission Notice and Disclaimer - University of California variant',
  },
  'HPND-UC-export-US': {
    name: 'Historical Permission Notice and Disclaimer - University of California, US export warning',
  },
  HTMLTIDY: {
    name: 'HTML Tidy License',
  },
  'IBM-pibs': {
    name: 'IBM PowerPC Initialization and Boot Software',
  },
  ICU: {
    name: 'ICU License',
    osi: true,
  },
  'IEC-Code-Components-EULA': {
    name: 'IEC    Code Components End-user licence agreement',
  },
  IJG: {
    name: 'Independent JPEG Group License',
    free: true,
  },
  'IJG-short': {
    name: 'Independent JPEG Group License - short',
  },
  ImageMagick: {
    name: 'ImageMagick License',
  },
  iMatix: {
    name: 'iMatix Standard Function Library Agreement',
    free: true,
  },
  Imlib2: {
    name: 'Imlib2 License',
    free: true,
  },
  'Info-ZIP': {
    name: 'Info-ZIP License',
  },
  'Inner-Net-2.0': {
    name: 'Inner Net License v2.0',
  },
  Intel: {
    name: 'Intel Open Source License',
    osi: true,
    free: true,
  },
  'Intel-ACPI': {
    name: 'Intel ACPI Software License Agreement',
  },
  'Interbase-1.0': {
    name: 'Interbase Public License v1.0',
  },
  IPA: {
    name: 'IPA Font License',
    osi: true,
    free: true,
  },
  'IPL-1.0': {
    name: 'IBM Public License v1.0',
    osi: true,
    free: true,
  },
  ISC: {
    name: 'ISC License',
    osi: true,
    free: true,
  },
  'ISC-Veillard': {
    name: 'ISC Veillard variant',
  },
  Jam: {
    name: 'Jam License',
    osi: true,
  },
  'JasPer-2.0': {
    name: 'JasPer License',
  },
  'JPL-image': {
    name: 'JPL Image Use Policy',
  },
  JPNIC: {
    name: 'Japan Network Information Center License',
  },
  JSON: {
    name: 'JSON License',
  },
  Kastrup: {
    name: 'Kastrup License',
  },
  Kazlib: {
    name: 'Kazlib License',
  },
  'Knuth-CTAN': {
    name: 'Knuth CTAN License',
  },
  'LAL-1.2': {
    name: 'Licence Art Libre 1.2',
  },
  'LAL-1.3': {
    name: 'Licence Art Libre 1.3',
  },
  Latex2e: {
    name: 'Latex2e License',
  },
  'Latex2e-translated-notice': {
    name: 'Latex2e with translated notice permission',
  },
  Leptonica: {
    name: 'Leptonica License',
  },
  'LGPL-2.0-only': {
    name: 'GNU Library General Public License v2 only',
    osi: true,
  },
  'LGPL-2.0-or-later': {
    name: 'GNU Library General Public License v2 or later',
    osi: true,
  },
  'LGPL-2.1-only': {
    name: 'GNU Lesser General Public License v2.1 only',
    osi: true,
    free: true,
  },
  'LGPL-2.1-or-later': {
    name: 'GNU Lesser General Public License v2.1 or later',
    osi: true,
    free: true,
  },
  'LGPL-3.0-only': {
    name: 'GNU Lesser General Public License v3.0 only',
    osi: true,
    free: true,
  },
  'LGPL-3.0-or-later': {
    name: 'GNU Lesser General Public License v3.0 or later',
    osi: true,
    free: true,
  },
  LGPLLR: {
    name: 'Lesser General Public License For Linguistic Resources',
  },
  Libpng: {
    name: 'libpng License',
  },
  'libpng-2.0': {
    name: 'PNG Reference Library version 2',
  },
  'libselinux-1.0': {
    name: 'libselinux public domain notice',
  },
  libtiff: {
    name: 'libtiff License',
  },
  'libutil-David-Nugent': {
    name: 'libutil David Nugent License',
  },
  'LiLiQ-P-1.1': {
    name: 'Licence Libre du Québec – Permissive version 1.1',
    osi: true,
  },
  'LiLiQ-R-1.1': {
    name: 'Licence Libre du Québec – Réciprocité version 1.1',
    osi: true,
  },
  'LiLiQ-Rplus-1.1': {
    name: 'Licence Libre du Québec – Réciprocité forte version 1.1',
    osi: true,
  },
  'Linux-man-pages-1-para': {
    name: 'Linux man-pages - 1 paragraph',
  },
  'Linux-man-pages-copyleft': {
    name: 'Linux man-pages Copyleft',
  },
  'Linux-man-pages-copyleft-2-para': {
    name: 'Linux man-pages Copyleft - 2 paragraphs',
  },
  'Linux-man-pages-copyleft-var': {
    name: 'Linux man-pages Copyleft Variant',
  },
  'Linux-OpenIB': {
    name: 'Linux Kernel Variant of OpenIB.org license',
  },
  LOOP: {
    name: 'Common Lisp LOOP License',
  },
  'LPD-document': {
    name: 'LPD Documentation License',
  },
  'LPL-1.0': {
    name: 'Lucent Public License Version 1.0',
    osi: true,
  },
  'LPL-1.02': {
    name: 'Lucent Public License v1.02',
    osi: true,
    free: true,
  },
  'LPPL-1.0': {
    name: 'LaTeX Project Public License v1.0',
  },
  'LPPL-1.1': {
    name: 'LaTeX Project Public License v1.1',
  },
  'LPPL-1.2': {
    name: 'LaTeX Project Public License v1.2',
    free: true,
  },
  'LPPL-1.3a': {
    name: 'LaTeX Project Public License v1.3a',
    free: true,
  },
  'LPPL-1.3c': {
    name: 'LaTeX Project Public License v1.3c',
    osi: true,
  },
  lsof: {
    name: 'lsof License',
  },
  'Lucida-Bitmap-Fonts': {
    name: 'Lucida Bitmap Fonts License',
  },
  'LZMA-SDK-9.11-to-9.20': {
    name: 'LZMA SDK License (versions 9.11 to 9.20)',
  },
  'LZMA-SDK-9.22': {
    name: 'LZMA SDK License (versions 9.22 and beyond)',
  },
  'Mackerras-3-Clause': {
    name: 'Mackerras 3-Clause License',
  },
  'Mackerras-3-Clause-acknowledgment': {
    name: 'Mackerras 3-Clause - acknowledgment variant',
  },
  magaz: {
    name: 'magaz License',
  },
  mailprio: {
    name: 'mailprio License',
  },
  MakeIndex: {
    name: 'MakeIndex License',
  },
  'Martin-Birgmeier': {
    name: 'Martin Birgmeier License',
  },
  'McPhee-slideshow': {
    name: 'McPhee Slideshow License',
  },
  metamail: {
    name: 'metamail License',
  },
  Minpack: {
    name: 'Minpack License',
  },
  MirOS: {
    name: 'The MirOS Licence',
    osi: true,
  },
  MIT: {
    name: 'MIT License',
    osi: true,
    free: true,
  },
  'MIT-0': {
    name: 'MIT No Attribution',
    osi: true,
  },
  'MIT-advertising': {
    name: 'Enlightenment License (e16)',
  },
  'MIT-CMU': {
    name: 'CMU License',
  },
  'MIT-enna': {
    name: 'enna License',
  },
  'MIT-feh': {
    name: 'feh License',
  },
  'MIT-Festival': {
    name: 'MIT Festival Variant',
  },
  'MIT-Khronos-old': {
    name: 'MIT Khronos - old variant',
  },
  'MIT-Modern-Variant': {
    name: 'MIT License Modern Variant',
    osi: true,
  },
  'MIT-open-group': {
    name: 'MIT Open Group variant',
  },
  'MIT-testregex': {
    name: 'MIT testregex Variant',
  },
  'MIT-Wu': {
    name: 'MIT Tom Wu Variant',
  },
  MITNFA: {
    name: 'MIT +no-false-attribs license',
  },
  MMIXware: {
    name: 'MMIXware License',
  },
  Motosoto: {
    name: 'Motosoto License',
    osi: true,
  },
  'MPEG-SSG': {
    name: 'MPEG Software Simulation',
  },
  'mpi-permissive': {
    name: 'mpi Permissive License',
  },
  mpich2: {
    name: 'mpich2 License',
  },
  'MPL-1.0': {
    name: 'Mozilla Public License 1.0',
    osi: true,
  },
  'MPL-1.1': {
    name: 'Mozilla Public License 1.1',
    osi: true,
    free: true,
  },
  'MPL-2.0': {
    name: 'Mozilla Public License 2.0',
    osi: true,
    free: true,
  },
  'MPL-2.0-no-copyleft-exception': {
    name: 'Mozilla Public License 2.0 (no copyleft exception)',
    osi: true,
  },
  mplus: {
    name: 'mplus Font License',
  },
  'MS-LPL': {
    name: 'Microsoft Limited Public License',
  },
  'MS-PL': {
    name: 'Microsoft Public License',
    osi: true,
    free: true,
  },
  'MS-RL': {
    name: 'Microsoft Reciprocal License',
    osi: true,
    free: true,
  },
  MTLL: {
    name: 'Matrix Template Library License',
  },
  'MulanPSL-1.0': {
    name: 'Mulan Permissive Software License, Version 1',
  },
  'MulanPSL-2.0': {
    name: 'Mulan Permissive Software License, Version 2',
    osi: true,
  },
  Multics: {
    name: 'Multics License',
    osi: true,
  },
  Mup: {
    name: 'Mup License',
  },
  'NAIST-2003': {
    name: 'Nara Institute of Science and Technology License (2003)',
  },
  'NASA-1.3': {
    name: 'NASA Open Source Agreement 1.3',
    osi: true,
  },
  Naumen: {
    name: 'Naumen Public License',
    osi: true,
  },
  'NBPL-1.0': {
    name: 'Net Boolean Public License v1',
  },
  'NCBI-PD': {
    name: 'NCBI Public Domain Notice',
  },
  'NCGL-UK-2.0': {
    name: 'Non-Commercial Government Licence',
  },
  NCL: {
    name: 'NCL Source Code License',
  },
  NCSA: {
    name: 'University of Illinois/NCSA Open Source License',
    osi: true,
    free: true,
  },
  NetCDF: {
    name: 'NetCDF license',
  },
  Newsletr: {
    name: 'Newsletr License',
  },
  NGPL: {
    name: 'Nethack General Public License',
    osi: true,
  },
  'NICTA-1.0': {
    name: 'NICTA Public Software License, Version 1.0',
  },
  'NIST-PD': {
    name: 'NIST Public Domain Notice',
  },
  'NIST-PD-fallback': {
    name: 'NIST Public Domain Notice with license fallback',
  },
  'NIST-Software': {
    name: 'NIST Software License',
  },
  'NLOD-1.0': {
    name: 'Norwegian Licence for Open Government Data (NLOD) 1.0',
  },
  'NLOD-2.0': {
    name: 'Norwegian Licence for Open Government Data (NLOD) 2.0',
  },
  NLPL: {
    name: 'No Limit Public License',
  },
  Nokia: {
    name: 'Nokia Open Source License',
    osi: true,
    free: true,
  },
  NOSL: {
    name: 'Netizen Open Source License',
    free: true,
  },
  Noweb: {
    name: 'Noweb License',
  },
  'NPL-1.0': {
    name: 'Netscape Public License v1.0',
    free: true,
  },
  'NPL-1.1': {
    name: 'Netscape Public License v1.1',
    free: true,
  },
  'NPOSL-3.0': {
    name: 'Non-Profit Open Software License 3.0',
    osi: true,
  },
  NRL: {
    name: 'NRL License',
  },
  NTP: {
    name: 'NTP License',
    osi: true,
  },
  'NTP-0': {
    name: 'NTP No Attribution',
  },
  'O-UDA-1.0': {
    name: 'Open Use of Data Agreement v1.0',
  },
  OAR: {
    name: 'OAR License',
  },
  'OCCT-PL': {
    name: 'Open CASCADE Technology Public License',
  },
  'OCLC-2.0': {
    name: 'OCLC Research Public License 2.0',
    osi: true,
  },
  'ODbL-1.0': {
    name: 'Open Data Commons Open Database License v1.0',
    free: true,
  },
  'ODC-By-1.0': {
    name: 'Open Data Commons Attribution License v1.0',
  },
  OFFIS: {
    name: 'OFFIS License',
  },
  'OFL-1.0': {
    name: 'SIL Open Font License 1.0',
    free: true,
  },
  'OFL-1.0-no-RFN': {
    name: 'SIL Open Font License 1.0 with no Reserved Font Name',
  },
  'OFL-1.0-RFN': {
    name: 'SIL Open Font License 1.0 with Reserved Font Name',
  },
  'OFL-1.1': {
    name: 'SIL Open Font License 1.1',
    osi: true,
    free: true,
  },
  'OFL-1.1-no-RFN': {
    name: 'SIL Open Font License 1.1 with no Reserved Font Name',
    osi: true,
  },
  'OFL-1.1-RFN': {
    name: 'SIL Open Font License 1.1 with Reserved Font Name',
    osi: true,
  },
  'OGC-1.0': {
    name: 'OGC Software License, Version 1.0',
  },
  'OGDL-Taiwan-1.0': {
    name: 'Taiwan Open Government Data License, version 1.0',
  },
  'OGL-Canada-2.0': {
    name: 'Open Government Licence - Canada',
  },
  'OGL-UK-1.0': {
    name: 'Open Government Licence v1.0',
  },
  'OGL-UK-2.0': {
    name: 'Open Government Licence v2.0',
  },
  'OGL-UK-3.0': {
    name: 'Open Government Licence v3.0',
  },
  OGTSL: {
    name: 'Open Group Test Suite License',
    osi: true,
  },
  'OLDAP-1.1': {
    name: 'Open LDAP Public License v1.1',
  },
  'OLDAP-1.2': {
    name: 'Open LDAP Public License v1.2',
  },
  'OLDAP-1.3': {
    name: 'Open LDAP Public License v1.3',
  },
  'OLDAP-1.4': {
    name: 'Open LDAP Public License v1.4',
  },
  'OLDAP-2.0': {
    name: 'Open LDAP Public License v2.0 (or possibly 2.0A and 2.0B)',
  },
  'OLDAP-2.0.1': {
    name: 'Open LDAP Public License v2.0.1',
  },
  'OLDAP-2.1': {
    name: 'Open LDAP Public License v2.1',
  },
  'OLDAP-2.2': {
    name: 'Open LDAP Public License v2.2',
  },
  'OLDAP-2.2.1': {
    name: 'Open LDAP Public License v2.2.1',
  },
  'OLDAP-2.2.2': {
    name: 'Open LDAP Public License 2.2.2',
  },
  'OLDAP-2.3': {
    name: 'Open LDAP Public License v2.3',
    free: true,
  },
  'OLDAP-2.4': {
    name: 'Open LDAP Public License v2.4',
  },
  'OLDAP-2.5': {
    name: 'Open LDAP Public License v2.5',
  },
  'OLDAP-2.6': {
    name: 'Open LDAP Public License v2.6',
  },
  'OLDAP-2.7': {
    name: 'Open LDAP Public License v2.7',
    free: true,
  },
  'OLDAP-2.8': {
    name: 'Open LDAP Public License v2.8',
    osi: true,
  },
  'OLFL-1.3': {
    name: 'Open Logistics Foundation License Version 1.3',
    osi: true,
  },
  OML: {
    name: 'Open Market License',
  },
  'OpenPBS-2.3': {
    name: 'OpenPBS v2.3 Software License',
  },
  OpenSSL: {
    name: 'OpenSSL License',
    free: true,
  },
  'OpenSSL-standalone': {
    name: 'OpenSSL License - standalone',
  },
  OpenVision: {
    name: 'OpenVision License',
  },
  'OPL-1.0': {
    name: 'Open Public License v1.0',
  },
  'OPL-UK-3.0': {
    name: 'United    Kingdom Open Parliament Licence v3.0',
  },
  'OPUBL-1.0': {
    name: 'Open Publication License v1.0',
  },
  'OSET-PL-2.1': {
    name: 'OSET Public License version 2.1',
    osi: true,
  },
  'OSL-1.0': {
    name: 'Open Software License 1.0',
    osi: true,
    free: true,
  },
  'OSL-1.1': {
    name: 'Open Software License 1.1',
    free: true,
  },
  'OSL-2.0': {
    name: 'Open Software License 2.0',
    osi: true,
    free: true,
  },
  'OSL-2.1': {
    name: 'Open Software License 2.1',
    osi: true,
    free: true,
  },
  'OSL-3.0': {
    name: 'Open Software License 3.0',
    osi: true,
    free: true,
  },
  PADL: {
    name: 'PADL License',
  },
  'Parity-6.0.0': {
    name: 'The Parity Public License 6.0.0',
  },
  'Parity-7.0.0': {
    name: 'The Parity Public License 7.0.0',
  },
  'PDDL-1.0': {
    name: 'Open Data Commons Public Domain Dedication & License 1.0',
  },
  'PHP-3.0': {
    name: 'PHP License v3.0',
    osi: true,
  },
  'PHP-3.01': {
    name: 'PHP License v3.01',
    osi: true,
    free: true,
  },
  Pixar: {
    name: 'Pixar License',
  },
  pkgconf: {
    name: 'pkgconf License',
  },
  Plexus: {
    name: 'Plexus Classworlds License',
  },
  pnmstitch: {
    name: 'pnmstitch License',
  },
  'PolyForm-Noncommercial-1.0.0': {
    name: 'PolyForm Noncommercial License 1.0.0',
  },
  'PolyForm-Small-Business-1.0.0': {
    name: 'PolyForm Small Business License 1.0.0',
  },
  PostgreSQL: {
    name: 'PostgreSQL License',
    osi: true,
  },
  PPL: {
    name: 'Peer Production License',
  },
  'PSF-2.0': {
    name: 'Python Software Foundation License 2.0',
  },
  psfrag: {
    name: 'psfrag License',
  },
  psutils: {
    name: 'psutils License',
  },
  'Python-2.0': {
    name: 'Python License 2.0',
    osi: true,
    free: true,
  },
  'Python-2.0.1': {
    name: 'Python License 2.0.1',
  },
  'python-ldap': {
    name: 'Python ldap License',
  },
  Qhull: {
    name: 'Qhull License',
  },
  'QPL-1.0': {
    name: 'Q Public License 1.0',
    osi: true,
    free: true,
  },
  'QPL-1.0-INRIA-2004': {
    name: 'Q Public License 1.0 - INRIA 2004 variant',
  },
  radvd: {
    name: 'radvd License',
  },
  Rdisc: {
    name: 'Rdisc License',
  },
  'RHeCos-1.1': {
    name: 'Red Hat eCos Public License v1.1',
  },
  'RPL-1.1': {
    name: 'Reciprocal Public License 1.1',
    osi: true,
  },
  'RPL-1.5': {
    name: 'Reciprocal Public License 1.5',
    osi: true,
  },
  'RPSL-1.0': {
    name: 'RealNetworks Public Source License v1.0',
    osi: true,
    free: true,
  },
  'RSA-MD': {
    name: 'RSA Message-Digest License',
  },
  RSCPL: {
    name: 'Ricoh Source Code Public License',
    osi: true,
  },
  Ruby: {
    name: 'Ruby License',
    free: true,
  },
  'Ruby-pty': {
    name: 'Ruby pty extension license',
  },
  'SAX-PD': {
    name: 'Sax Public Domain Notice',
  },
  'SAX-PD-2.0': {
    name: 'Sax Public Domain Notice 2.0',
  },
  Saxpath: {
    name: 'Saxpath License',
  },
  SCEA: {
    name: 'SCEA Shared Source License',
  },
  SchemeReport: {
    name: 'Scheme Language Report License',
  },
  Sendmail: {
    name: 'Sendmail License',
  },
  'Sendmail-8.23': {
    name: 'Sendmail License 8.23',
  },
  'SGI-B-1.0': {
    name: 'SGI Free Software License B v1.0',
  },
  'SGI-B-1.1': {
    name: 'SGI Free Software License B v1.1',
  },
  'SGI-B-2.0': {
    name: 'SGI Free Software License B v2.0',
    free: true,
  },
  'SGI-OpenGL': {
    name: 'SGI OpenGL License',
  },
  SGP4: {
    name: 'SGP4 Permission Notice',
  },
  'SHL-0.5': {
    name: 'Solderpad Hardware License v0.5',
  },
  'SHL-0.51': {
    name: 'Solderpad Hardware License, Version 0.51',
  },
  'SimPL-2.0': {
    name: 'Simple Public License 2.0',
    osi: true,
  },
  SISSL: {
    name: 'Sun Industry Standards Source License v1.1',
    osi: true,
    free: true,
  },
  'SISSL-1.2': {
    name: 'Sun Industry Standards Source License v1.2',
  },
  SL: {
    name: 'SL License',
  },
  Sleepycat: {
    name: 'Sleepycat License',
    osi: true,
    free: true,
  },
  SMLNJ: {
    name: 'Standard ML of New Jersey License',
    free: true,
  },
  SMPPL: {
    name: 'Secure Messaging Protocol Public License',
  },
  SNIA: {
    name: 'SNIA Public License 1.1',
  },
  snprintf: {
    name: 'snprintf License',
  },
  softSurfer: {
    name: 'softSurfer License',
  },
  Soundex: {
    name: 'Soundex License',
  },
  'Spencer-86': {
    name: 'Spencer License 86',
  },
  'Spencer-94': {
    name: 'Spencer License 94',
  },
  'Spencer-99': {
    name: 'Spencer License 99',
  },
  'SPL-1.0': {
    name: 'Sun Public License v1.0',
    osi: true,
    free: true,
  },
  'ssh-keyscan': {
    name: 'ssh-keyscan License',
  },
  'SSH-OpenSSH': {
    name: 'SSH OpenSSH license',
  },
  'SSH-short': {
    name: 'SSH short notice',
  },
  'SSLeay-standalone': {
    name: 'SSLeay License - standalone',
  },
  'SSPL-1.0': {
    name: 'Server Side Public License, v 1',
  },
  'SugarCRM-1.1.3': {
    name: 'SugarCRM Public License v1.1.3',
  },
  'Sun-PPP': {
    name: 'Sun PPP License',
  },
  'Sun-PPP-2000': {
    name: 'Sun PPP License (2000)',
  },
  SunPro: {
    name: 'SunPro License',
  },
  SWL: {
    name: 'Scheme Widget Library (SWL) Software License Agreement',
  },
  swrule: {
    name: 'swrule License',
  },
  Symlinks: {
    name: 'Symlinks License',
  },
  'TAPR-OHL-1.0': {
    name: 'TAPR Open Hardware License v1.0',
  },
  TCL: {
    name: 'TCL/TK License',
  },
  'TCP-wrappers': {
    name: 'TCP Wrappers License',
  },
  TermReadKey: {
    name: 'TermReadKey License',
  },
  'TGPPL-1.0': {
    name: 'Transitive Grace Period Public Licence 1.0',
  },
  threeparttable: {
    name: 'threeparttable License',
  },
  TMate: {
    name: 'TMate Open Source License',
  },
  'TORQUE-1.1': {
    name: 'TORQUE v2.5+ Software License v1.1',
  },
  TOSL: {
    name: 'Trusster Open Source License',
  },
  TPDL: {
    name: 'Time::ParseDate License',
  },
  'TPL-1.0': {
    name: 'THOR Public License 1.0',
  },
  TTWL: {
    name: 'Text-Tabs+Wrap License',
  },
  TTYP0: {
    name: 'TTYP0 License',
  },
  'TU-Berlin-1.0': {
    name: 'Technische Universitaet Berlin License 1.0',
  },
  'TU-Berlin-2.0': {
    name: 'Technische Universitaet Berlin License 2.0',
  },
  'Ubuntu-font-1.0': {
    name: 'Ubuntu Font Licence v1.0',
  },
  UCAR: {
    name: 'UCAR License',
  },
  'UCL-1.0': {
    name: 'Upstream Compatibility License v1.0',
    osi: true,
  },
  ulem: {
    name: 'ulem License',
  },
  'UMich-Merit': {
    name: 'Michigan/Merit Networks License',
  },
  'Unicode-3.0': {
    name: 'Unicode License v3',
    osi: true,
  },
  'Unicode-DFS-2015': {
    name: 'Unicode License Agreement - Data Files and Software (2015)',
  },
  'Unicode-DFS-2016': {
    name: 'Unicode License Agreement - Data Files and Software (2016)',
    osi: true,
  },
  'Unicode-TOU': {
    name: 'Unicode Terms of Use',
  },
  UnixCrypt: {
    name: 'UnixCrypt License',
  },
  Unlicense: {
    name: 'The Unlicense',
    osi: true,
    free: true,
  },
  'UPL-1.0': {
    name: 'Universal Permissive License v1.0',
    osi: true,
    free: true,
  },
  'URT-RLE': {
    name: 'Utah Raster Toolkit Run Length Encoded License',
  },
  Vim: {
    name: 'Vim License',
    free: true,
  },
  VOSTROM: {
    name: 'VOSTROM Public License for Open Source',
  },
  'VSL-1.0': {
    name: 'Vovida Software License v1.0',
    osi: true,
  },
  W3C: {
    name: 'W3C Software Notice and License (2002-12-31)',
    osi: true,
    free: true,
  },
  'W3C-19980720': {
    name: 'W3C Software Notice and License (1998-07-20)',
  },
  'W3C-20150513': {
    name: 'W3C Software Notice and Document License (2015-05-13)',
    osi: true,
  },
  w3m: {
    name: 'w3m License',
  },
  'Watcom-1.0': {
    name: 'Sybase Open Watcom Public License 1.0',
    osi: true,
  },
  'Widget-Workshop': {
    name: 'Widget Workshop License',
  },
  Wsuipa: {
    name: 'Wsuipa License',
  },
  WTFPL: {
    name: 'Do What The F*ck You Want To Public License',
    free: true,
  },
  X11: {
    name: 'X11 License',
    free: true,
  },
  'X11-distribute-modifications-variant': {
    name: 'X11 License Distribution Modification Variant',
  },
  'X11-swapped': {
    name: 'X11 swapped final paragraphs',
  },
  'Xdebug-1.03': {
    name: 'Xdebug License v 1.03',
  },
  Xerox: {
    name: 'Xerox License',
  },
  Xfig: {
    name: 'Xfig License',
  },
  'XFree86-1.1': {
    name: 'XFree86 License 1.1',
    free: true,
  },
  xinetd: {
    name: 'xinetd License',
    free: true,
  },
  'xkeyboard-config-Zinoviev': {
    name: 'xkeyboard-config Zinoviev License',
  },
  xlock: {
    name: 'xlock License',
  },
  Xnet: {
    name: 'X.Net License',
    osi: true,
  },
  xpp: {
    name: 'XPP License',
  },
  XSkat: {
    name: 'XSkat License',
  },
  xzoom: {
    name: 'xzoom License',
  },
  'YPL-1.0': {
    name: 'Yahoo! Public License v1.0',
  },
  'YPL-1.1': {
    name: 'Yahoo! Public License v1.1',
    free: true,
  },
  Zed: {
    name: 'Zed License',
  },
  Zeeff: {
    name: 'Zeeff License',
  },
  'Zend-2.0': {
    name: 'Zend License v2.0',
    free: true,
  },
  'Zimbra-1.3': {
    name: 'Zimbra Public License v1.3',
    free: true,
  },
  'Zimbra-1.4': {
    name: 'Zimbra Public License v1.4',
  },
  Zlib: {
    name: 'zlib License',
    osi: true,
    free: true,
  },
  'zlib-acknowledgement': {
    name: 'zlib/libpng License with Acknowledgement',
  },
  'ZPL-1.1': {
    name: 'Zope Public License 1.1',
  },
  'ZPL-2.0': {
    name: 'Zope Public License 2.0',
    osi: true,
    free: true,
  },
  'ZPL-2.1': {
    name: 'Zope Public License 2.1',
    osi: true,
    free: true,
  },
};
export default licenses;
