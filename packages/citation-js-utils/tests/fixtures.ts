export const bibtex = `@article{Cockett2015SimPEG,
  author = {Cockett,   Rowan and Kang, Seogi and Heagy, Lindsey J. and Pidlisecky, Adam and Oldenburg, Douglas W.  },
  journal = {Computers & Geosciences   },
  year = { 2015},
  month = {12 },
  pages = { 142--154},
  title = {   SimPEG: An open source framework for simulation and gradient based parameter estimation in geophysical applications },
  volume = { 85 },
  doi = { 10.1016/j.cageo.2015.09.015  },
  issn = {0098-3004   },
  url = {   http://dx.doi.org/10.1016/j.cageo.2015.09.015  },
}`;

export const doiInNote = `@article{cury2020sparse,
  title={A sparse EEG-informed fMRI model for hybrid EEG-fMRI neurofeedback prediction},
  author={Cury, Claire and Maurel, Pierre and Gribonval, R{\\'e}mi and Barillot, Christian},
  journal={Frontiers in neuroscience},
	note = { See the DOI in \\url{https://doi.org/10.3389/fnins.2019.01451}, for example.},
  volume={13},
  pages={1451},
  year={2020},
  publisher={Frontiers}
}`;

export const doiInURL = `@article{cury2020sparse,
  title={A sparse EEG-informed fMRI model for hybrid EEG-fMRI neurofeedback prediction},
  author={Cury, Claire and Maurel, Pierre and Gribonval, R{\\'e}mi and Barillot, Christian},
  journal={Frontiers in neuroscience},
	url = { https://doi.org/10.3389/fnins.2019.01451 },
  volume={13},
  pages={1451},
  year={2020},
  publisher={Frontiers}
}`;

export const TEST_DOI_IN_OTHER_FIELD = '10.3389/fnins.2019.01451';

export const TEST_DATA_JSON =
  '{"type":"article","label":"Cockett2015SimPEG","properties":{"author":"Cockett, Rowan and Kang, Seogi and Heagy, Lindsey J. and Pidlisecky, Adam and Oldenburg, Douglas W.","journal":"Computers & Geosciences","year":"2015","month":"12","pages":"142--154","title":"SimPEG: An open source framework for simulation and gradient based parameter estimation in geophysical applications","volume":"85","doi": "10.1016/j.cageo.2015.09.015","issn": "0098-3004","url": "http://dx.doi.org/10.1016/j.cageo.2015.09.015"}}';
export const TEST_DATA_RIS =
  '{"AU":["Cockett, Rowan","Kang, Seogi","Heagy, Lindsey J.","Pidlisecky, Adam","Oldenburg, Douglas W."],"DA":"2015/12//","DB":"Crossref","DO":"10.1016/j.cageo.2015.09.015","J2":"Computers & Geosciences","LA":"en","SN":"0098-3004","SP":"142-154","T2":"Computers & Geosciences","TI":"SimPEG: An open source framework for simulation and gradient based parameter estimation in geophysical applications","TY":"JOUR","UR":"http://dx.doi.org/10.1016/j.cageo.2015.09.015","VL":"85"}';

export const FORMATED_CONTENT_APA =
  'Cockett, R., Kang, S., Heagy, L. J., Pidlisecky, A., & Oldenburg, D. W. (2015). SimPEG: An open source framework for simulation and gradient based parameter estimation in geophysical applications. Computers & Geosciences, 85, 142–154. https://doi.org/10.1016/j.cageo.2015.09.015';
export const FORMATED_CONTENT_HARVARD =
  'Cockett, R. et al., 2015. SimPEG: An open source framework for simulation and gradient based parameter estimation in geophysical applications. Computers & Geosciences, 85, pp.142–154. Available at: http://dx.doi.org/10.1016/j.cageo.2015.09.015.';
export const FORMATED_CONTENT_VANCOUVER =
  'Cockett R, Kang S, Heagy LJ, Pidlisecky A, Oldenburg DW. SimPEG: An open source framework for simulation and gradient based parameter estimation in geophysical applications. Computers & Geosciences. 2015 Dec;85:142–54. Available from: http://dx.doi.org/10.1016/j.cageo.2015.09.015';

// sanitized
export const TEST_APA_HTML =
  'Cockett, R., Kang, S., Heagy, L. J., Pidlisecky, A., & Oldenburg, D. W. (2015). SimPEG: An open source framework for simulation and gradient based parameter estimation in geophysical applications. <i>Computers & Geosciences</i>, <i>85</i>, 142–154. <a target="_blank" rel="noreferrer" href="https://doi.org/10.1016/j.cageo.2015.09.015">10.1016/j.cageo.2015.09.015</a>';
export const TEST_VANCOUVER_HTML =
  'Cockett R, Kang S, Heagy LJ, Pidlisecky A, Oldenburg DW. SimPEG: An open source framework for simulation and gradient based parameter estimation in geophysical applications. Computers & Geosciences [Internet]. 2015 Dec;85:142–54. Available from: <a target="_blank" rel="noreferrer" href="https://doi.org/10.1016/j.cageo.2015.09.015">10.1016/j.cageo.2015.09.015</a>';
// straight outta citation-js
export const TEST_DATA_HTML_DIRTY =
  'Cockett, R., Kang, S., Heagy, L. J., Pidlisecky, A., &#38; Oldenburg, D. W. (2015). SimPEG: An open source framework for simulation and gradient based parameter estimation in geophysical applications. <i>Computers &#38; Geosciences</i>, <i>85</i>, 142–154. <a href="https://doi.org/10.1016/j.cageo.2015.09.015" target="_blank">10.1016/j.cageo.2015.09.015</a>';
