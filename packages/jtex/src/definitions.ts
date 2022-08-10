export const curvenoteDef = `
% Start Curvenote Definitions

% Pass Options Section
% base
\\PassOptionsToPackage{normalem}{ulem}
\\PassOptionsToPackage{utf8}{inputenc}

% template
\\PassOptionsToPackage{framemethod=TikZ}{mdframed}
\\PassOptionsToPackage{x11names, svgnames}{xcolor}

%%% PACKAGES

% base
\\usepackage{inputenc}
\\usepackage{url}
\\usepackage{graphicx}
\\usepackage{adjustbox}
\\usepackage{amssymb}
\\usepackage{amsfonts}
\\usepackage{amsmath}
\\usepackage{enumitem}
\\usepackage{nicefrac}
\\usepackage{booktabs}
\\usepackage{microtype}
\\usepackage{hyperref}
\\usepackage{ulem}
\\usepackage{enumitem}
\\usepackage{float}
\\usepackage{datetime}
\\usepackage{xkeyval}
\\usepackage{framed}
\\usepackage{doi}

% template
\\usepackage{natbib}
\\usepackage{fancyvrb}
\\usepackage{mdframed}
\\usepackage{xcolor}

%%%


%%%% Setup Section

% base
\\graphicspath{{.}}
% template
\\sloppy
\\newenvironment{aside}{\\begin{framed}}{\\end{framed}}
\\newmdenv[linewidth=2pt,linecolor=CornflowerBlue,topline=false,bottomline=false,rightline=false,leftline=true,skipabove=20,skipbelow=20,leftmargin=20,rightmargin=20]{callout}
\\newfloat{code}{thp}{loc}
\\floatname{code}{Program}
\\raggedbottom
\\bibliographystyle{abbrvnat}
\\setcitestyle{authoryear,open={(},close={)},semicolon,aysep={,}}

% End Curvenote Definitions
`;
