const licenses = [
  {
    title: 'BSD Zero Clause License',
    id: '0BSD',
    osi: true,
  },
  {
    title: 'Attribution Assurance License',
    id: 'AAL',
    osi: true,
  },
  {
    title: 'Abstyles License',
    id: 'Abstyles',
  },
  {
    title: 'Adobe Systems Incorporated Source Code License Agreement',
    id: 'Adobe-2006',
  },
  {
    title: 'Adobe Glyph List License',
    id: 'Adobe-Glyph',
  },
  {
    title: 'Amazon Digital Services License',
    id: 'ADSL',
  },
  {
    title: 'Academic Free License v1.1',
    id: 'AFL-1.1',
    free: true,
    osi: true,
  },
  {
    title: 'Academic Free License v1.2',
    id: 'AFL-1.2',
    free: true,
    osi: true,
  },
  {
    title: 'Academic Free License v2.0',
    id: 'AFL-2.0',
    free: true,
    osi: true,
  },
  {
    title: 'Academic Free License v2.1',
    id: 'AFL-2.1',
    free: true,
    osi: true,
  },
  {
    title: 'Academic Free License v3.0',
    id: 'AFL-3.0',
    free: true,
    osi: true,
  },
  {
    title: 'Afmparse License',
    id: 'Afmparse',
  },
  {
    title: 'Affero General Public License v1.0 only',
    id: 'AGPL-1.0-only',
  },
  {
    title: 'Affero General Public License v1.0 or later',
    id: 'AGPL-1.0-or-later',
  },
  {
    title: 'GNU Affero General Public License v3.0 only',
    id: 'AGPL-3.0-only',
    free: true,
    osi: true,
  },
  {
    title: 'GNU Affero General Public License v3.0 or later',
    id: 'AGPL-3.0-or-later',
    free: true,
    osi: true,
  },
  {
    title: 'Aladdin Free Public License',
    id: 'Aladdin',
  },
  {
    title: "AMD's plpa_map.c License",
    id: 'AMDPLPA',
  },
  {
    title: 'Apple MIT License',
    id: 'AML',
  },
  {
    title: 'Academy of Motion Picture Arts and Sciences BSD',
    id: 'AMPAS',
  },
  {
    title: 'ANTLR Software Rights Notice',
    id: 'ANTLR-PD',
  },
  {
    title: 'ANTLR Software Rights Notice with license fallback',
    id: 'ANTLR-PD-fallback',
  },
  {
    title: 'Apache License 1.0',
    id: 'Apache-1.0',
    free: true,
  },
  {
    title: 'Apache License 1.1',
    id: 'Apache-1.1',
    free: true,
    osi: true,
  },
  {
    title: 'Apache License 2.0',
    id: 'Apache-2.0',
    free: true,
    osi: true,
  },
  {
    title: 'Adobe Postscript AFM License',
    id: 'APAFML',
  },
  {
    title: 'Adaptive Public License 1.0',
    id: 'APL-1.0',
    osi: true,
  },
  {
    title: 'App::s2p License',
    id: 'App-s2p',
  },
  {
    title: 'Apple Public Source License 1.0',
    id: 'APSL-1.0',
    osi: true,
  },
  {
    title: 'Apple Public Source License 1.1',
    id: 'APSL-1.1',
    osi: true,
  },
  {
    title: 'Apple Public Source License 1.2',
    id: 'APSL-1.2',
    osi: true,
  },
  {
    title: 'Apple Public Source License 2.0',
    id: 'APSL-2.0',
    free: true,
    osi: true,
  },
  {
    title: 'Artistic License 1.0',
    id: 'Artistic-1.0',
    osi: true,
  },
  {
    title: 'Artistic License 1.0 w/clause 8',
    id: 'Artistic-1.0-cl8',
    osi: true,
  },
  {
    title: 'Artistic License 1.0 (Perl)',
    id: 'Artistic-1.0-Perl',
    osi: true,
  },
  {
    title: 'Artistic License 2.0',
    id: 'Artistic-2.0',
    free: true,
    osi: true,
  },
  {
    title: 'Bahyph License',
    id: 'Bahyph',
  },
  {
    title: 'Barr License',
    id: 'Barr',
  },
  {
    title: 'Beerware License',
    id: 'Beerware',
  },
  {
    title: 'BitTorrent Open Source License v1.0',
    id: 'BitTorrent-1.0',
  },
  {
    title: 'BitTorrent Open Source License v1.1',
    id: 'BitTorrent-1.1',
    free: true,
  },
  {
    title: 'SQLite Blessing',
    id: 'blessing',
  },
  {
    title: 'Blue Oak Model License 1.0.0',
    id: 'BlueOak-1.0.0',
  },
  {
    title: 'Borceux license',
    id: 'Borceux',
  },
  {
    title: 'BSD 1-Clause License',
    id: 'BSD-1-Clause',
    osi: true,
  },
  {
    title: 'BSD 2-Clause "Simplified" License',
    id: 'BSD-2-Clause',
    free: true,
    osi: true,
  },
  {
    title: 'BSD-2-Clause Plus Patent License',
    id: 'BSD-2-Clause-Patent',
    osi: true,
  },
  {
    title: 'BSD 2-Clause with views sentence',
    id: 'BSD-2-Clause-Views',
  },
  {
    title: 'BSD 3-Clause "New" or "Revised" License',
    id: 'BSD-3-Clause',
    free: true,
    osi: true,
  },
  {
    title: 'BSD with attribution',
    id: 'BSD-3-Clause-Attribution',
  },
  {
    title: 'BSD 3-Clause Clear License',
    id: 'BSD-3-Clause-Clear',
    free: true,
  },
  {
    title: 'Lawrence Berkeley National Labs BSD variant license',
    id: 'BSD-3-Clause-LBNL',
    osi: true,
  },
  {
    title: 'BSD 3-Clause Modification',
    id: 'BSD-3-Clause-Modification',
  },
  {
    title: 'BSD 3-Clause No Military License',
    id: 'BSD-3-Clause-No-Military-License',
  },
  {
    title: 'BSD 3-Clause No Nuclear License',
    id: 'BSD-3-Clause-No-Nuclear-License',
  },
  {
    title: 'BSD 3-Clause No Nuclear License 2014',
    id: 'BSD-3-Clause-No-Nuclear-License-2014',
  },
  {
    title: 'BSD 3-Clause No Nuclear Warranty',
    id: 'BSD-3-Clause-No-Nuclear-Warranty',
  },
  {
    title: 'BSD 3-Clause Open MPI variant',
    id: 'BSD-3-Clause-Open-MPI',
  },
  {
    title: 'BSD 4-Clause "Original" or "Old" License',
    id: 'BSD-4-Clause',
    free: true,
  },
  {
    title: 'BSD 4 Clause Shortened',
    id: 'BSD-4-Clause-Shortened',
  },
  {
    title: 'BSD-4-Clause (University of California-Specific)',
    id: 'BSD-4-Clause-UC',
  },
  {
    title: 'BSD Protection License',
    id: 'BSD-Protection',
  },
  {
    title: 'BSD Source Code Attribution',
    id: 'BSD-Source-Code',
  },
  {
    title: 'Boost Software License 1.0',
    id: 'BSL-1.0',
    free: true,
    osi: true,
  },
  {
    title: 'Business Source License 1.1',
    id: 'BUSL-1.1',
  },
  {
    title: 'bzip2 and libbzip2 License v1.0.6',
    id: 'bzip2-1.0.6',
  },
  {
    title: 'Computational Use of Data Agreement v1.0',
    id: 'C-UDA-1.0',
  },
  {
    title: 'Cryptographic Autonomy License 1.0',
    id: 'CAL-1.0',
    osi: true,
  },
  {
    title: 'Cryptographic Autonomy License 1.0 (Combined Work Exception)',
    id: 'CAL-1.0-Combined-Work-Exception',
    osi: true,
  },
  {
    title: 'Caldera License',
    id: 'Caldera',
  },
  {
    title: 'Computer Associates Trusted Open Source License 1.1',
    id: 'CATOSL-1.1',
    osi: true,
  },
  {
    title: 'Creative Commons Attribution 1.0 Generic',
    id: 'CC-BY-1.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution 2.0 Generic',
    id: 'CC-BY-2.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution 2.5 Generic',
    id: 'CC-BY-2.5',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution 2.5 Australia',
    id: 'CC-BY-2.5-AU',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution 3.0 Unported',
    id: 'CC-BY-3.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution 3.0 Austria',
    id: 'CC-BY-3.0-AT',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution 3.0 Germany',
    id: 'CC-BY-3.0-DE',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution 3.0 Netherlands',
    id: 'CC-BY-3.0-NL',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution 3.0 United States',
    id: 'CC-BY-3.0-US',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution 4.0 International',
    id: 'CC-BY-4.0',
    CC: true,
    free: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial 1.0 Generic',
    id: 'CC-BY-NC-1.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial 2.0 Generic',
    id: 'CC-BY-NC-2.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial 2.5 Generic',
    id: 'CC-BY-NC-2.5',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial 3.0 Unported',
    id: 'CC-BY-NC-3.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial 3.0 Germany',
    id: 'CC-BY-NC-3.0-DE',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial 4.0 International',
    id: 'CC-BY-NC-4.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial No Derivatives 1.0 Generic',
    id: 'CC-BY-NC-ND-1.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial No Derivatives 2.0 Generic',
    id: 'CC-BY-NC-ND-2.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial No Derivatives 2.5 Generic',
    id: 'CC-BY-NC-ND-2.5',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial No Derivatives 3.0 Unported',
    id: 'CC-BY-NC-ND-3.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial No Derivatives 3.0 Germany',
    id: 'CC-BY-NC-ND-3.0-DE',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial No Derivatives 3.0 IGO',
    id: 'CC-BY-NC-ND-3.0-IGO',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial No Derivatives 4.0 International',
    id: 'CC-BY-NC-ND-4.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial Share Alike 1.0 Generic',
    id: 'CC-BY-NC-SA-1.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial Share Alike 2.0 Generic',
    id: 'CC-BY-NC-SA-2.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution-NonCommercial-ShareAlike 2.0 France',
    id: 'CC-BY-NC-SA-2.0-FR',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial Share Alike 2.0 England and Wales',
    id: 'CC-BY-NC-SA-2.0-UK',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial Share Alike 2.5 Generic',
    id: 'CC-BY-NC-SA-2.5',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial Share Alike 3.0 Unported',
    id: 'CC-BY-NC-SA-3.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial Share Alike 3.0 Germany',
    id: 'CC-BY-NC-SA-3.0-DE',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial Share Alike 3.0 IGO',
    id: 'CC-BY-NC-SA-3.0-IGO',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Non Commercial Share Alike 4.0 International',
    id: 'CC-BY-NC-SA-4.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution No Derivatives 1.0 Generic',
    id: 'CC-BY-ND-1.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution No Derivatives 2.0 Generic',
    id: 'CC-BY-ND-2.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution No Derivatives 2.5 Generic',
    id: 'CC-BY-ND-2.5',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution No Derivatives 3.0 Unported',
    id: 'CC-BY-ND-3.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution No Derivatives 3.0 Germany',
    id: 'CC-BY-ND-3.0-DE',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution No Derivatives 4.0 International',
    id: 'CC-BY-ND-4.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Share Alike 1.0 Generic',
    id: 'CC-BY-SA-1.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Share Alike 2.0 Generic',
    id: 'CC-BY-SA-2.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Share Alike 2.0 England and Wales',
    id: 'CC-BY-SA-2.0-UK',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Share Alike 2.1 Japan',
    id: 'CC-BY-SA-2.1-JP',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Share Alike 2.5 Generic',
    id: 'CC-BY-SA-2.5',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Share Alike 3.0 Unported',
    id: 'CC-BY-SA-3.0',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Share Alike 3.0 Austria',
    id: 'CC-BY-SA-3.0-AT',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Share Alike 3.0 Germany',
    id: 'CC-BY-SA-3.0-DE',
    CC: true,
  },
  {
    title: 'Creative Commons Attribution Share Alike 4.0 International',
    id: 'CC-BY-SA-4.0',
    CC: true,
    free: true,
  },
  {
    title: 'Creative Commons Public Domain Dedication and Certification',
    id: 'CC-PDDC',
    CC: true,
  },
  {
    title: 'Creative Commons Zero v1.0 Universal',
    id: 'CC0-1.0',
    CC: true,
    free: true,
  },
  {
    title: 'Common Development and Distribution License 1.0',
    id: 'CDDL-1.0',
    free: true,
    osi: true,
  },
  {
    title: 'Common Development and Distribution License 1.1',
    id: 'CDDL-1.1',
  },
  {
    title: 'Common Documentation License 1.0',
    id: 'CDL-1.0',
  },
  {
    title: 'Community Data License Agreement Permissive 1.0',
    id: 'CDLA-Permissive-1.0',
  },
  {
    title: 'Community Data License Agreement Permissive 2.0',
    id: 'CDLA-Permissive-2.0',
  },
  {
    title: 'Community Data License Agreement Sharing 1.0',
    id: 'CDLA-Sharing-1.0',
  },
  {
    title: 'CeCILL Free Software License Agreement v1.0',
    id: 'CECILL-1.0',
  },
  {
    title: 'CeCILL Free Software License Agreement v1.1',
    id: 'CECILL-1.1',
  },
  {
    title: 'CeCILL Free Software License Agreement v2.0',
    id: 'CECILL-2.0',
    free: true,
  },
  {
    title: 'CeCILL Free Software License Agreement v2.1',
    id: 'CECILL-2.1',
    osi: true,
  },
  {
    title: 'CeCILL-B Free Software License Agreement',
    id: 'CECILL-B',
    free: true,
  },
  {
    title: 'CeCILL-C Free Software License Agreement',
    id: 'CECILL-C',
    free: true,
  },
  {
    title: 'CERN Open Hardware Licence v1.1',
    id: 'CERN-OHL-1.1',
  },
  {
    title: 'CERN Open Hardware Licence v1.2',
    id: 'CERN-OHL-1.2',
  },
  {
    title: 'CERN Open Hardware Licence Version 2 - Permissive',
    id: 'CERN-OHL-P-2.0',
    osi: true,
  },
  {
    title: 'CERN Open Hardware Licence Version 2 - Strongly Reciprocal',
    id: 'CERN-OHL-S-2.0',
    osi: true,
  },
  {
    title: 'CERN Open Hardware Licence Version 2 - Weakly Reciprocal',
    id: 'CERN-OHL-W-2.0',
    osi: true,
  },
  {
    title: 'Clarified Artistic License',
    id: 'ClArtistic',
    free: true,
  },
  {
    title: 'CNRI Jython License',
    id: 'CNRI-Jython',
  },
  {
    title: 'CNRI Python License',
    id: 'CNRI-Python',
    osi: true,
  },
  {
    title: 'CNRI Python Open Source GPL Compatible License Agreement',
    id: 'CNRI-Python-GPL-Compatible',
  },
  {
    title: 'Copyfree Open Innovation License',
    id: 'COIL-1.0',
  },
  {
    title: 'Community Specification License 1.0',
    id: 'Community-Spec-1.0',
  },
  {
    title: 'Condor Public License v1.1',
    id: 'Condor-1.1',
    free: true,
  },
  {
    title: 'copyleft-next 0.3.0',
    id: 'copyleft-next-0.3.0',
  },
  {
    title: 'copyleft-next 0.3.1',
    id: 'copyleft-next-0.3.1',
  },
  {
    title: 'Common Public Attribution License 1.0',
    id: 'CPAL-1.0',
    free: true,
    osi: true,
  },
  {
    title: 'Common Public License 1.0',
    id: 'CPL-1.0',
    free: true,
    osi: true,
  },
  {
    title: 'Code Project Open License 1.02',
    id: 'CPOL-1.02',
  },
  {
    title: 'Crossword License',
    id: 'Crossword',
  },
  {
    title: 'CrystalStacker License',
    id: 'CrystalStacker',
  },
  {
    title: 'CUA Office Public License v1.0',
    id: 'CUA-OPL-1.0',
    osi: true,
  },
  {
    title: 'Cube License',
    id: 'Cube',
  },
  {
    title: 'curl License',
    id: 'curl',
  },
  {
    title: 'Deutsche Freie Software Lizenz',
    id: 'D-FSL-1.0',
  },
  {
    title: 'diffmark license',
    id: 'diffmark',
  },
  {
    title: 'Data licence Germany - attribution - version 2.0',
    id: 'DL-DE-BY-2.0',
  },
  {
    title: 'DOC License',
    id: 'DOC',
  },
  {
    title: 'Dotseqn License',
    id: 'Dotseqn',
  },
  {
    title: 'Detection Rule License 1.0',
    id: 'DRL-1.0',
  },
  {
    title: 'DSDP License',
    id: 'DSDP',
  },
  {
    title: 'dvipdfm License',
    id: 'dvipdfm',
  },
  {
    title: 'Educational Community License v1.0',
    id: 'ECL-1.0',
    osi: true,
  },
  {
    title: 'Educational Community License v2.0',
    id: 'ECL-2.0',
    free: true,
    osi: true,
  },
  {
    title: 'Eiffel Forum License v1.0',
    id: 'EFL-1.0',
    osi: true,
  },
  {
    title: 'Eiffel Forum License v2.0',
    id: 'EFL-2.0',
    free: true,
    osi: true,
  },
  {
    title: 'eGenix.com Public License 1.1.0',
    id: 'eGenix',
  },
  {
    title: 'Elastic License 2.0',
    id: 'Elastic-2.0',
  },
  {
    title: 'Entessa Public License v1.0',
    id: 'Entessa',
    osi: true,
  },
  {
    title: 'EPICS Open License',
    id: 'EPICS',
  },
  {
    title: 'Eclipse Public License 1.0',
    id: 'EPL-1.0',
    free: true,
    osi: true,
  },
  {
    title: 'Eclipse Public License 2.0',
    id: 'EPL-2.0',
    free: true,
    osi: true,
  },
  {
    title: 'Erlang Public License v1.1',
    id: 'ErlPL-1.1',
  },
  {
    title: 'Etalab Open License 2.0',
    id: 'etalab-2.0',
  },
  {
    title: 'EU DataGrid Software License',
    id: 'EUDatagrid',
    free: true,
    osi: true,
  },
  {
    title: 'European Union Public License 1.0',
    id: 'EUPL-1.0',
  },
  {
    title: 'European Union Public License 1.1',
    id: 'EUPL-1.1',
    free: true,
    osi: true,
  },
  {
    title: 'European Union Public License 1.2',
    id: 'EUPL-1.2',
    free: true,
    osi: true,
  },
  {
    title: 'Eurosym License',
    id: 'Eurosym',
  },
  {
    title: 'Fair License',
    id: 'Fair',
    osi: true,
  },
  {
    title: 'Fraunhofer FDK AAC Codec Library',
    id: 'FDK-AAC',
  },
  {
    title: 'Frameworx Open License 1.0',
    id: 'Frameworx-1.0',
    osi: true,
  },
  {
    title: 'FreeBSD Documentation License',
    id: 'FreeBSD-DOC',
  },
  {
    title: 'FreeImage Public License v1.0',
    id: 'FreeImage',
  },
  {
    title: 'FSF All Permissive License',
    id: 'FSFAP',
    free: true,
  },
  {
    title: 'FSF Unlimited License',
    id: 'FSFUL',
  },
  {
    title: 'FSF Unlimited License (with License Retention)',
    id: 'FSFULLR',
  },
  {
    title: 'Freetype Project License',
    id: 'FTL',
    free: true,
  },
  {
    title: 'GD License',
    id: 'GD',
  },
  {
    title: 'GNU Free Documentation License v1.1 only - invariants',
    id: 'GFDL-1.1-invariants-only',
  },
  {
    title: 'GNU Free Documentation License v1.1 or later - invariants',
    id: 'GFDL-1.1-invariants-or-later',
  },
  {
    title: 'GNU Free Documentation License v1.1 only - no invariants',
    id: 'GFDL-1.1-no-invariants-only',
  },
  {
    title: 'GNU Free Documentation License v1.1 or later - no invariants',
    id: 'GFDL-1.1-no-invariants-or-later',
  },
  {
    title: 'GNU Free Documentation License v1.1 only',
    id: 'GFDL-1.1-only',
    free: true,
  },
  {
    title: 'GNU Free Documentation License v1.1 or later',
    id: 'GFDL-1.1-or-later',
    free: true,
  },
  {
    title: 'GNU Free Documentation License v1.2 only - invariants',
    id: 'GFDL-1.2-invariants-only',
  },
  {
    title: 'GNU Free Documentation License v1.2 or later - invariants',
    id: 'GFDL-1.2-invariants-or-later',
  },
  {
    title: 'GNU Free Documentation License v1.2 only - no invariants',
    id: 'GFDL-1.2-no-invariants-only',
  },
  {
    title: 'GNU Free Documentation License v1.2 or later - no invariants',
    id: 'GFDL-1.2-no-invariants-or-later',
  },
  {
    title: 'GNU Free Documentation License v1.2 only',
    id: 'GFDL-1.2-only',
    free: true,
  },
  {
    title: 'GNU Free Documentation License v1.2 or later',
    id: 'GFDL-1.2-or-later',
    free: true,
  },
  {
    title: 'GNU Free Documentation License v1.3 only - invariants',
    id: 'GFDL-1.3-invariants-only',
  },
  {
    title: 'GNU Free Documentation License v1.3 or later - invariants',
    id: 'GFDL-1.3-invariants-or-later',
  },
  {
    title: 'GNU Free Documentation License v1.3 only - no invariants',
    id: 'GFDL-1.3-no-invariants-only',
  },
  {
    title: 'GNU Free Documentation License v1.3 or later - no invariants',
    id: 'GFDL-1.3-no-invariants-or-later',
  },
  {
    title: 'GNU Free Documentation License v1.3 only',
    id: 'GFDL-1.3-only',
    free: true,
  },
  {
    title: 'GNU Free Documentation License v1.3 or later',
    id: 'GFDL-1.3-or-later',
    free: true,
  },
  {
    title: 'Giftware License',
    id: 'Giftware',
  },
  {
    title: 'GL2PS License',
    id: 'GL2PS',
  },
  {
    title: '3dfx Glide License',
    id: 'Glide',
  },
  {
    title: 'Glulxe License',
    id: 'Glulxe',
  },
  {
    title: 'Good Luck With That Public License',
    id: 'GLWTPL',
  },
  {
    title: 'gnuplot License',
    id: 'gnuplot',
    free: true,
  },
  {
    title: 'GNU General Public License v1.0 only',
    id: 'GPL-1.0-only',
  },
  {
    title: 'GNU General Public License v1.0 or later',
    id: 'GPL-1.0-or-later',
  },
  {
    title: 'GNU General Public License v2.0 only',
    id: 'GPL-2.0-only',
    free: true,
    osi: true,
  },
  {
    title: 'GNU General Public License v2.0 or later',
    id: 'GPL-2.0-or-later',
    free: true,
    osi: true,
  },
  {
    title: 'GNU General Public License v3.0 only',
    id: 'GPL-3.0-only',
    free: true,
    osi: true,
  },
  {
    title: 'GNU General Public License v3.0 or later',
    id: 'GPL-3.0-or-later',
    free: true,
    osi: true,
  },
  {
    title: 'gSOAP Public License v1.3b',
    id: 'gSOAP-1.3b',
  },
  {
    title: 'Haskell Language Report License',
    id: 'HaskellReport',
  },
  {
    title: 'Hippocratic License 2.1',
    id: 'Hippocratic-2.1',
  },
  {
    title: 'Historical Permission Notice and Disclaimer',
    id: 'HPND',
    free: true,
    osi: true,
  },
  {
    title: 'Historical Permission Notice and Disclaimer - sell variant',
    id: 'HPND-sell-variant',
  },
  {
    title: 'HTML Tidy License',
    id: 'HTMLTIDY',
  },
  {
    title: 'IBM PowerPC Initialization and Boot Software',
    id: 'IBM-pibs',
  },
  {
    title: 'ICU License',
    id: 'ICU',
  },
  {
    title: 'Independent JPEG Group License',
    id: 'IJG',
    free: true,
  },
  {
    title: 'ImageMagick License',
    id: 'ImageMagick',
  },
  {
    title: 'iMatix Standard Function Library Agreement',
    id: 'iMatix',
    free: true,
  },
  {
    title: 'Imlib2 License',
    id: 'Imlib2',
    free: true,
  },
  {
    title: 'Info-ZIP License',
    id: 'Info-ZIP',
  },
  {
    title: 'Intel Open Source License',
    id: 'Intel',
    free: true,
    osi: true,
  },
  {
    title: 'Intel ACPI Software License Agreement',
    id: 'Intel-ACPI',
  },
  {
    title: 'Interbase Public License v1.0',
    id: 'Interbase-1.0',
  },
  {
    title: 'IPA Font License',
    id: 'IPA',
    free: true,
    osi: true,
  },
  {
    title: 'IBM Public License v1.0',
    id: 'IPL-1.0',
    free: true,
    osi: true,
  },
  {
    title: 'ISC License',
    id: 'ISC',
    free: true,
    osi: true,
  },
  {
    title: 'Jam License',
    id: 'Jam',
  },
  {
    title: 'JasPer License',
    id: 'JasPer-2.0',
  },
  {
    title: 'Japan Network Information Center License',
    id: 'JPNIC',
  },
  {
    title: 'JSON License',
    id: 'JSON',
  },
  {
    title: 'Licence Art Libre 1.2',
    id: 'LAL-1.2',
  },
  {
    title: 'Licence Art Libre 1.3',
    id: 'LAL-1.3',
  },
  {
    title: 'Latex2e License',
    id: 'Latex2e',
  },
  {
    title: 'Leptonica License',
    id: 'Leptonica',
  },
  {
    title: 'GNU Library General Public License v2 only',
    id: 'LGPL-2.0-only',
    osi: true,
  },
  {
    title: 'GNU Library General Public License v2 or later',
    id: 'LGPL-2.0-or-later',
    osi: true,
  },
  {
    title: 'GNU Lesser General Public License v2.1 only',
    id: 'LGPL-2.1-only',
    free: true,
    osi: true,
  },
  {
    title: 'GNU Lesser General Public License v2.1 or later',
    id: 'LGPL-2.1-or-later',
    free: true,
    osi: true,
  },
  {
    title: 'GNU Lesser General Public License v3.0 only',
    id: 'LGPL-3.0-only',
    free: true,
    osi: true,
  },
  {
    title: 'GNU Lesser General Public License v3.0 or later',
    id: 'LGPL-3.0-or-later',
    free: true,
    osi: true,
  },
  {
    title: 'Lesser General Public License For Linguistic Resources',
    id: 'LGPLLR',
  },
  {
    title: 'libpng License',
    id: 'Libpng',
  },
  {
    title: 'PNG Reference Library version 2',
    id: 'libpng-2.0',
  },
  {
    title: 'libselinux public domain notice',
    id: 'libselinux-1.0',
  },
  {
    title: 'libtiff License',
    id: 'libtiff',
  },
  {
    title: 'Licence Libre du Québec - Permissive version 1.1',
    id: 'LiLiQ-P-1.1',
    osi: true,
  },
  {
    title: 'Licence Libre du Québec - Réciprocité version 1.1',
    id: 'LiLiQ-R-1.1',
    osi: true,
  },
  {
    title: 'Licence Libre du Québec - Réciprocité forte version 1.1',
    id: 'LiLiQ-Rplus-1.1',
    osi: true,
  },
  {
    title: 'Linux man-pages Copyleft',
    id: 'Linux-man-pages-copyleft',
  },
  {
    title: 'Linux Kernel Variant of OpenIB.org license',
    id: 'Linux-OpenIB',
  },
  {
    title: 'Lucent Public License Version 1.0',
    id: 'LPL-1.0',
    osi: true,
  },
  {
    title: 'Lucent Public License v1.02',
    id: 'LPL-1.02',
    free: true,
    osi: true,
  },
  {
    title: 'LaTeX Project Public License v1.0',
    id: 'LPPL-1.0',
  },
  {
    title: 'LaTeX Project Public License v1.1',
    id: 'LPPL-1.1',
  },
  {
    title: 'LaTeX Project Public License v1.2',
    id: 'LPPL-1.2',
    free: true,
  },
  {
    title: 'LaTeX Project Public License v1.3a',
    id: 'LPPL-1.3a',
    free: true,
  },
  {
    title: 'LaTeX Project Public License v1.3c',
    id: 'LPPL-1.3c',
    osi: true,
  },
  {
    title: 'MakeIndex License',
    id: 'MakeIndex',
  },
  {
    title: 'The MirOS Licence',
    id: 'MirOS',
    osi: true,
  },
  {
    title: 'MIT License',
    id: 'MIT',
    free: true,
    osi: true,
  },
  {
    title: 'MIT No Attribution',
    id: 'MIT-0',
    osi: true,
  },
  {
    title: 'Enlightenment License (e16)',
    id: 'MIT-advertising',
  },
  {
    title: 'CMU License',
    id: 'MIT-CMU',
  },
  {
    title: 'enna License',
    id: 'MIT-enna',
  },
  {
    title: 'feh License',
    id: 'MIT-feh',
  },
  {
    title: 'MIT License Modern Variant',
    id: 'MIT-Modern-Variant',
    osi: true,
  },
  {
    title: 'MIT Open Group variant',
    id: 'MIT-open-group',
  },
  {
    title: 'MIT +no-false-attribs license',
    id: 'MITNFA',
  },
  {
    title: 'Motosoto License',
    id: 'Motosoto',
    osi: true,
  },
  {
    title: 'mpich2 License',
    id: 'mpich2',
  },
  {
    title: 'Mozilla Public License 1.0',
    id: 'MPL-1.0',
    osi: true,
  },
  {
    title: 'Mozilla Public License 1.1',
    id: 'MPL-1.1',
    free: true,
    osi: true,
  },
  {
    title: 'Mozilla Public License 2.0',
    id: 'MPL-2.0',
    free: true,
    osi: true,
  },
  {
    title: 'Mozilla Public License 2.0 (no copyleft exception)',
    id: 'MPL-2.0-no-copyleft-exception',
    osi: true,
  },
  {
    title: 'Microsoft Public License',
    id: 'MS-PL',
    free: true,
    osi: true,
  },
  {
    title: 'Microsoft Reciprocal License',
    id: 'MS-RL',
    free: true,
    osi: true,
  },
  {
    title: 'Matrix Template Library License',
    id: 'MTLL',
  },
  {
    title: 'Mulan Permissive Software License, Version 1',
    id: 'MulanPSL-1.0',
  },
  {
    title: 'Mulan Permissive Software License, Version 2',
    id: 'MulanPSL-2.0',
    osi: true,
  },
  {
    title: 'Multics License',
    id: 'Multics',
    osi: true,
  },
  {
    title: 'Mup License',
    id: 'Mup',
  },
  {
    title: 'Nara Institute of Science and Technology License (2003)',
    id: 'NAIST-2003',
  },
  {
    title: 'NASA Open Source Agreement 1.3',
    id: 'NASA-1.3',
    osi: true,
  },
  {
    title: 'Naumen Public License',
    id: 'Naumen',
    osi: true,
  },
  {
    title: 'Net Boolean Public License v1',
    id: 'NBPL-1.0',
  },
  {
    title: 'Non-Commercial Government Licence',
    id: 'NCGL-UK-2.0',
  },
  {
    title: 'University of Illinois/NCSA Open Source License',
    id: 'NCSA',
    free: true,
    osi: true,
  },
  {
    title: 'Net-SNMP License',
    id: 'Net-SNMP',
  },
  {
    title: 'NetCDF license',
    id: 'NetCDF',
  },
  {
    title: 'Newsletr License',
    id: 'Newsletr',
  },
  {
    title: 'Nethack General Public License',
    id: 'NGPL',
    osi: true,
  },
  {
    title: 'NIST Public Domain Notice',
    id: 'NIST-PD',
  },
  {
    title: 'NIST Public Domain Notice with license fallback',
    id: 'NIST-PD-fallback',
  },
  {
    title: 'Norwegian Licence for Open Government Data (NLOD) 1.0',
    id: 'NLOD-1.0',
  },
  {
    title: 'Norwegian Licence for Open Government Data (NLOD) 2.0',
    id: 'NLOD-2.0',
  },
  {
    title: 'No Limit Public License',
    id: 'NLPL',
  },
  {
    title: 'Nokia Open Source License',
    id: 'Nokia',
    free: true,
    osi: true,
  },
  {
    title: 'Netizen Open Source License',
    id: 'NOSL',
    free: true,
  },
  {
    title: 'Noweb License',
    id: 'Noweb',
  },
  {
    title: 'Netscape Public License v1.0',
    id: 'NPL-1.0',
    free: true,
  },
  {
    title: 'Netscape Public License v1.1',
    id: 'NPL-1.1',
    free: true,
  },
  {
    title: 'Non-Profit Open Software License 3.0',
    id: 'NPOSL-3.0',
    osi: true,
  },
  {
    title: 'NRL License',
    id: 'NRL',
  },
  {
    title: 'NTP License',
    id: 'NTP',
    osi: true,
  },
  {
    title: 'NTP No Attribution',
    id: 'NTP-0',
  },
  {
    title: 'Open Use of Data Agreement v1.0',
    id: 'O-UDA-1.0',
  },
  {
    title: 'Open CASCADE Technology Public License',
    id: 'OCCT-PL',
  },
  {
    title: 'OCLC Research Public License 2.0',
    id: 'OCLC-2.0',
    osi: true,
  },
  {
    title: 'Open Data Commons Open Database License v1.0',
    id: 'ODbL-1.0',
    free: true,
  },
  {
    title: 'Open Data Commons Attribution License v1.0',
    id: 'ODC-By-1.0',
  },
  {
    title: 'SIL Open Font License 1.0',
    id: 'OFL-1.0',
    free: true,
  },
  {
    title: 'SIL Open Font License 1.0 with no Reserved Font Name',
    id: 'OFL-1.0-no-RFN',
  },
  {
    title: 'SIL Open Font License 1.0 with Reserved Font Name',
    id: 'OFL-1.0-RFN',
  },
  {
    title: 'SIL Open Font License 1.1',
    id: 'OFL-1.1',
    free: true,
    osi: true,
  },
  {
    title: 'SIL Open Font License 1.1 with no Reserved Font Name',
    id: 'OFL-1.1-no-RFN',
    osi: true,
  },
  {
    title: 'SIL Open Font License 1.1 with Reserved Font Name',
    id: 'OFL-1.1-RFN',
    osi: true,
  },
  {
    title: 'OGC Software License, Version 1.0',
    id: 'OGC-1.0',
  },
  {
    title: 'Taiwan Open Government Data License, version 1.0',
    id: 'OGDL-Taiwan-1.0',
  },
  {
    title: 'Open Government Licence - Canada',
    id: 'OGL-Canada-2.0',
  },
  {
    title: 'Open Government Licence v1.0',
    id: 'OGL-UK-1.0',
  },
  {
    title: 'Open Government Licence v2.0',
    id: 'OGL-UK-2.0',
  },
  {
    title: 'Open Government Licence v3.0',
    id: 'OGL-UK-3.0',
  },
  {
    title: 'Open Group Test Suite License',
    id: 'OGTSL',
    osi: true,
  },
  {
    title: 'Open LDAP Public License v1.1',
    id: 'OLDAP-1.1',
  },
  {
    title: 'Open LDAP Public License v1.2',
    id: 'OLDAP-1.2',
  },
  {
    title: 'Open LDAP Public License v1.3',
    id: 'OLDAP-1.3',
  },
  {
    title: 'Open LDAP Public License v1.4',
    id: 'OLDAP-1.4',
  },
  {
    title: 'Open LDAP Public License v2.0 (or possibly 2.0A and 2.0B)',
    id: 'OLDAP-2.0',
  },
  {
    title: 'Open LDAP Public License v2.0.1',
    id: 'OLDAP-2.0.1',
  },
  {
    title: 'Open LDAP Public License v2.1',
    id: 'OLDAP-2.1',
  },
  {
    title: 'Open LDAP Public License v2.2',
    id: 'OLDAP-2.2',
  },
  {
    title: 'Open LDAP Public License v2.2.1',
    id: 'OLDAP-2.2.1',
  },
  {
    title: 'Open LDAP Public License 2.2.2',
    id: 'OLDAP-2.2.2',
  },
  {
    title: 'Open LDAP Public License v2.3',
    id: 'OLDAP-2.3',
    free: true,
  },
  {
    title: 'Open LDAP Public License v2.4',
    id: 'OLDAP-2.4',
  },
  {
    title: 'Open LDAP Public License v2.5',
    id: 'OLDAP-2.5',
  },
  {
    title: 'Open LDAP Public License v2.6',
    id: 'OLDAP-2.6',
  },
  {
    title: 'Open LDAP Public License v2.7',
    id: 'OLDAP-2.7',
    free: true,
  },
  {
    title: 'Open LDAP Public License v2.8',
    id: 'OLDAP-2.8',
    osi: true,
  },
  {
    title: 'Open Market License',
    id: 'OML',
  },
  {
    title: 'OpenSSL License',
    id: 'OpenSSL',
    free: true,
  },
  {
    title: 'Open Public License v1.0',
    id: 'OPL-1.0',
  },
  {
    title: 'Open Publication License v1.0',
    id: 'OPUBL-1.0',
  },
  {
    title: 'OSET Public License version 2.1',
    id: 'OSET-PL-2.1',
    osi: true,
  },
  {
    title: 'Open Software License 1.0',
    id: 'OSL-1.0',
    free: true,
    osi: true,
  },
  {
    title: 'Open Software License 1.1',
    id: 'OSL-1.1',
    free: true,
  },
  {
    title: 'Open Software License 2.0',
    id: 'OSL-2.0',
    free: true,
    osi: true,
  },
  {
    title: 'Open Software License 2.1',
    id: 'OSL-2.1',
    free: true,
    osi: true,
  },
  {
    title: 'Open Software License 3.0',
    id: 'OSL-3.0',
    free: true,
    osi: true,
  },
  {
    title: 'The Parity Public License 6.0.0',
    id: 'Parity-6.0.0',
  },
  {
    title: 'The Parity Public License 7.0.0',
    id: 'Parity-7.0.0',
  },
  {
    title: 'Open Data Commons Public Domain Dedication &amp; License 1.0',
    id: 'PDDL-1.0',
  },
  {
    title: 'PHP License v3.0',
    id: 'PHP-3.0',
    osi: true,
  },
  {
    title: 'PHP License v3.01',
    id: 'PHP-3.01',
    free: true,
    osi: true,
  },
  {
    title: 'Plexus Classworlds License',
    id: 'Plexus',
  },
  {
    title: 'PolyForm Noncommercial License 1.0.0',
    id: 'PolyForm-Noncommercial-1.0.0',
  },
  {
    title: 'PolyForm Small Business License 1.0.0',
    id: 'PolyForm-Small-Business-1.0.0',
  },
  {
    title: 'PostgreSQL License',
    id: 'PostgreSQL',
    osi: true,
  },
  {
    title: 'Python Software Foundation License 2.0',
    id: 'PSF-2.0',
  },
  {
    title: 'psfrag License',
    id: 'psfrag',
  },
  {
    title: 'psutils License',
    id: 'psutils',
  },
  {
    title: 'Python License 2.0',
    id: 'Python-2.0',
    free: true,
    osi: true,
  },
  {
    title: 'Qhull License',
    id: 'Qhull',
  },
  {
    title: 'Q Public License 1.0',
    id: 'QPL-1.0',
    free: true,
    osi: true,
  },
  {
    title: 'Rdisc License',
    id: 'Rdisc',
  },
  {
    title: 'Red Hat eCos Public License v1.1',
    id: 'RHeCos-1.1',
  },
  {
    title: 'Reciprocal Public License 1.1',
    id: 'RPL-1.1',
    osi: true,
  },
  {
    title: 'Reciprocal Public License 1.5',
    id: 'RPL-1.5',
    osi: true,
  },
  {
    title: 'RealNetworks Public Source License v1.0',
    id: 'RPSL-1.0',
    free: true,
    osi: true,
  },
  {
    title: 'RSA Message-Digest License',
    id: 'RSA-MD',
  },
  {
    title: 'Ricoh Source Code Public License',
    id: 'RSCPL',
    osi: true,
  },
  {
    title: 'Ruby License',
    id: 'Ruby',
    free: true,
  },
  {
    title: 'Sax Public Domain Notice',
    id: 'SAX-PD',
  },
  {
    title: 'Saxpath License',
    id: 'Saxpath',
  },
  {
    title: 'SCEA Shared Source License',
    id: 'SCEA',
  },
  {
    title: 'Scheme Language Report License',
    id: 'SchemeReport',
  },
  {
    title: 'Sendmail License',
    id: 'Sendmail',
  },
  {
    title: 'Sendmail License 8.23',
    id: 'Sendmail-8.23',
  },
  {
    title: 'SGI Free Software License B v1.0',
    id: 'SGI-B-1.0',
  },
  {
    title: 'SGI Free Software License B v1.1',
    id: 'SGI-B-1.1',
  },
  {
    title: 'SGI Free Software License B v2.0',
    id: 'SGI-B-2.0',
    free: true,
  },
  {
    title: 'Solderpad Hardware License v0.5',
    id: 'SHL-0.5',
  },
  {
    title: 'Solderpad Hardware License, Version 0.51',
    id: 'SHL-0.51',
  },
  {
    title: 'Simple Public License 2.0',
    id: 'SimPL-2.0',
    osi: true,
  },
  {
    title: 'Sun Industry Standards Source License v1.1',
    id: 'SISSL',
    free: true,
    osi: true,
  },
  {
    title: 'Sun Industry Standards Source License v1.2',
    id: 'SISSL-1.2',
  },
  {
    title: 'Sleepycat License',
    id: 'Sleepycat',
    free: true,
    osi: true,
  },
  {
    title: 'Standard ML of New Jersey License',
    id: 'SMLNJ',
    free: true,
  },
  {
    title: 'Secure Messaging Protocol Public License',
    id: 'SMPPL',
  },
  {
    title: 'SNIA Public License 1.1',
    id: 'SNIA',
  },
  {
    title: 'Spencer License 86',
    id: 'Spencer-86',
  },
  {
    title: 'Spencer License 94',
    id: 'Spencer-94',
  },
  {
    title: 'Spencer License 99',
    id: 'Spencer-99',
  },
  {
    title: 'Sun Public License v1.0',
    id: 'SPL-1.0',
    free: true,
    osi: true,
  },
  {
    title: 'SSH OpenSSH license',
    id: 'SSH-OpenSSH',
  },
  {
    title: 'SSH short notice',
    id: 'SSH-short',
  },
  {
    title: 'Server Side Public License, v 1',
    id: 'SSPL-1.0',
  },
  {
    title: 'SugarCRM Public License v1.1.3',
    id: 'SugarCRM-1.1.3',
  },
  {
    title: 'Scheme Widget Library (SWL) Software License Agreement',
    id: 'SWL',
  },
  {
    title: 'TAPR Open Hardware License v1.0',
    id: 'TAPR-OHL-1.0',
  },
  {
    title: 'TCL/TK License',
    id: 'TCL',
  },
  {
    title: 'TCP Wrappers License',
    id: 'TCP-wrappers',
  },
  {
    title: 'TMate Open Source License',
    id: 'TMate',
  },
  {
    title: 'TORQUE v2.5+ Software License v1.1',
    id: 'TORQUE-1.1',
  },
  {
    title: 'Trusster Open Source License',
    id: 'TOSL',
  },
  {
    title: 'Technische Universitaet Berlin License 1.0',
    id: 'TU-Berlin-1.0',
  },
  {
    title: 'Technische Universitaet Berlin License 2.0',
    id: 'TU-Berlin-2.0',
  },
  {
    title: 'Upstream Compatibility License v1.0',
    id: 'UCL-1.0',
    osi: true,
  },
  {
    title: 'Unicode License Agreement - Data Files and Software (2015)',
    id: 'Unicode-DFS-2015',
  },
  {
    title: 'Unicode License Agreement - Data Files and Software (2016)',
    id: 'Unicode-DFS-2016',
    osi: true,
  },
  {
    title: 'Unicode Terms of Use',
    id: 'Unicode-TOU',
  },
  {
    title: 'The Unlicense',
    id: 'Unlicense',
    free: true,
    osi: true,
  },
  {
    title: 'Universal Permissive License v1.0',
    id: 'UPL-1.0',
    free: true,
    osi: true,
  },
  {
    title: 'Vim License',
    id: 'Vim',
    free: true,
  },
  {
    title: 'VOSTROM Public License for Open Source',
    id: 'VOSTROM',
  },
  {
    title: 'Vovida Software License v1.0',
    id: 'VSL-1.0',
    osi: true,
  },
  {
    title: 'W3C Software Notice and License (2002-12-31)',
    id: 'W3C',
    free: true,
    osi: true,
  },
  {
    title: 'W3C Software Notice and License (1998-07-20)',
    id: 'W3C-19980720',
  },
  {
    title: 'W3C Software Notice and Document License (2015-05-13)',
    id: 'W3C-20150513',
  },
  {
    title: 'Sybase Open Watcom Public License 1.0',
    id: 'Watcom-1.0',
    osi: true,
  },
  {
    title: 'Wsuipa License',
    id: 'Wsuipa',
  },
  {
    title: 'Do What The F*ck You Want To Public License',
    id: 'WTFPL',
    free: true,
  },
  {
    title: 'X11 License',
    id: 'X11',
    free: true,
  },
  {
    title: 'X11 License Distribution Modification Variant',
    id: 'X11-distribute-modifications-variant',
  },
  {
    title: 'Xerox License',
    id: 'Xerox',
  },
  {
    title: 'XFree86 License 1.1',
    id: 'XFree86-1.1',
    free: true,
  },
  {
    title: 'xinetd License',
    id: 'xinetd',
    free: true,
  },
  {
    title: 'X.Net License',
    id: 'Xnet',
    osi: true,
  },
  {
    title: 'XPP License',
    id: 'xpp',
  },
  {
    title: 'XSkat License',
    id: 'XSkat',
  },
  {
    title: 'Yahoo! Public License v1.0',
    id: 'YPL-1.0',
  },
  {
    title: 'Yahoo! Public License v1.1',
    id: 'YPL-1.1',
    free: true,
  },
  {
    title: 'Zed License',
    id: 'Zed',
  },
  {
    title: 'Zend License v2.0',
    id: 'Zend-2.0',
    free: true,
  },
  {
    title: 'Zimbra Public License v1.3',
    id: 'Zimbra-1.3',
    free: true,
  },
  {
    title: 'Zimbra Public License v1.4',
    id: 'Zimbra-1.4',
  },
  {
    title: 'zlib License',
    id: 'Zlib',
    free: true,
    osi: true,
  },
  {
    title: 'zlib/libpng License with Acknowledgement',
    id: 'zlib-acknowledgement',
  },
  {
    title: 'Zope Public License 1.1',
    id: 'ZPL-1.1',
  },
  {
    title: 'Zope Public License 2.0',
    id: 'ZPL-2.0',
    free: true,
    osi: true,
  },
  {
    title: 'Zope Public License 2.1',
    id: 'ZPL-2.1',
    free: true,
    osi: true,
  },
];

export default licenses;
