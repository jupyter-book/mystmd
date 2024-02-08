declare module 'docx' {
  class Document {
    constructor(options: IPropertiesOptions);
  }
  class File {
    constructor(options: IPropertiesOptions);
  }
  type ParagraphChild =
    | TextRun
    | ImageRun
    | SymbolRun
    | Bookmark
    | PageBreak
    | ColumnBreak
    | SequentialIdentifier
    | FootnoteReferenceRun
    | InternalHyperlink
    | ExternalHyperlink
    | InsertedTextRun
    | DeletedTextRun
    | Math
    | SimpleField
    | SimpleMailMergeField
    | Comments
    | Comment
    | CommentRangeStart
    | CommentRangeEnd
    | CommentReference
    | CheckBox;
  class InternalHyperlink {
    constructor(options: { children: ParagraphChild[]; anchor: string });
  }
  class SimpleField {
    constructor(instruction: string, cachedValue?: string);
  }
  class Bookmark {
    constructor(options: { id: string; children: ParagraphChild[] });
  }
  class SequentialIdentifier {
    constructor(instruction: string);
  }
  class TextRun {
    constructor(options: string);
  }
  class Packer {
    static async toString(file: File, prettify?: boolean): Promise<string>;
    static async toBuffer(file: File, prettify?: boolean): Promise<Buffer>;
    static async toBase64String(file: File, prettify?: boolean): Promise<string>;
    static async toBlob(file: File, prettify?: boolean): Promise<Blob>;
    static toStream(file: File, prettify?: boolean): Stream;
  }
  const SectionType = {
    NEXT_PAGE: 'nextPage',
    NEXT_COLUMN: 'nextColumn',
    CONTINUOUS: 'continuous',
    EVEN_PAGE: 'evenPage',
    ODD_PAGE: 'oddPage',
  };
  class Footer {
    constructor(options: IHeaderOptions = { children: [] });
  }
  interface INumberingOptions {
    config: {
      levels: ILevelsOptions[];
      reference: string;
    }[];
  }
  interface ISectionOptions {
    headers?: {
      default?: Header;
      first?: Header;
      even?: Header;
    };
    footers?: {
      default?: Footer;
      first?: Footer;
      even?: Footer;
    };
    properties?: ISectionPropertiesOptions;
    children: FileChild[];
  }
  class FootnoteReferenceRun {
    constructor(id: number);
  }
  const TabStopPosition = {
    MAX: 9026,
  };
  enum TabStopType {
    LEFT = 'left',
    RIGHT = 'right',
    CENTER = 'center',
    BAR = 'bar',
    CLEAR = 'clear',
    DECIMAL = 'decimal',
    END = 'end',
    NUM = 'num',
    START = 'start',
  }
  enum AlignmentType {
    START = 'start',
    CENTER = 'center',
    END = 'end',
    BOTH = 'both',
    MEDIUM_KASHIDA = 'mediumKashida',
    DISTRIBUTE = 'distribute',
    NUM_TAB = 'numTab',
    HIGH_KASHIDA = 'highKashida',
    LOW_KASHIDA = 'lowKashida',
    THAI_DISTRIBUTE = 'thaiDistribute',
    LEFT = 'left',
    RIGHT = 'right',
    // JUSTIFIED = 'both',
  }
  enum BorderStyle {
    SINGLE = 'single',
    DASH_DOT_STROKED = 'dashDotStroked',
    DASHED = 'dashed',
    DASH_SMALL_GAP = 'dashSmallGap',
    DOT_DASH = 'dotDash',
    DOT_DOT_DASH = 'dotDotDash',
    DOTTED = 'dotted',
    DOUBLE = 'double',
    DOUBLE_WAVE = 'doubleWave',
    INSET = 'inset',
    NIL = 'nil',
    NONE = 'none',
    OUTSET = 'outset',
    THICK = 'thick',
    THICK_THIN_LARGE_GAP = 'thickThinLargeGap',
    THICK_THIN_MEDIUM_GAP = 'thickThinMediumGap',
    THICK_THIN_SMALL_GAP = 'thickThinSmallGap',
    THIN_THICK_LARGE_GAP = 'thinThickLargeGap',
    THIN_THICK_MEDIUM_GAP = 'thinThickMediumGap',
    THIN_THICK_SMALL_GAP = 'thinThickSmallGap',
    THIN_THICK_THIN_LARGE_GAP = 'thinThickThinLargeGap',
    THIN_THICK_THIN_MEDIUM_GAP = 'thinThickThinMediumGap',
    THIN_THICK_THIN_SMALL_GAP = 'thinThickThinSmallGap',
    THREE_D_EMBOSS = 'threeDEmboss',
    THREE_D_ENGRAVE = 'threeDEngrave',
    TRIPLE = 'triple',
    WAVE = 'wave',
  }
  const convertInchesToTwip: (inches: number) => number;
  class ExternalHyperlink {
    constructor(options: { children: ParagraphChild[]; link: string });
  }
  enum HeadingLevel {
    HEADING_1 = 'Heading1',
    HEADING_2 = 'Heading2',
    HEADING_3 = 'Heading3',
    HEADING_4 = 'Heading4',
    HEADING_5 = 'Heading5',
    HEADING_6 = 'Heading6',
    TITLE = 'Title',
  }
  class ImageRun {
    constructor(options: IImageOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
  }
  enum ShadingType {
    CLEAR = 'clear',
    DIAGONAL_CROSS = 'diagCross',
    DIAGONAL_STRIPE = 'diagStripe',
    HORIZONTAL_CROSS = 'horzCross',
    HORIZONTAL_STRIPE = 'horzStripe',
    NIL = 'nil',
    PERCENT_5 = 'pct5',
    PERCENT_10 = 'pct10',
    PERCENT_12 = 'pct12',
    PERCENT_15 = 'pct15',
    PERCENT_20 = 'pct20',
    PERCENT_25 = 'pct25',
    PERCENT_30 = 'pct30',
    PERCENT_35 = 'pct35',
    PERCENT_37 = 'pct37',
    PERCENT_40 = 'pct40',
    PERCENT_45 = 'pct45',
    PERCENT_50 = 'pct50',
    PERCENT_55 = 'pct55',
    PERCENT_60 = 'pct60',
    PERCENT_62 = 'pct62',
    PERCENT_65 = 'pct65',
    PERCENT_70 = 'pct70',
    PERCENT_75 = 'pct75',
    PERCENT_80 = 'pct80',
    PERCENT_85 = 'pct85',
    PERCENT_87 = 'pct87',
    PERCENT_90 = 'pct90',
    PERCENT_95 = 'pct95',
    REVERSE_DIAGONAL_STRIPE = 'reverseDiagStripe',
    SOLID = 'solid',
    THIN_DIAGONAL_CROSS = 'thinDiagCross',
    THIN_DIAGONAL_STRIPE = 'thinDiagStripe',
    THIN_HORIZONTAL_CROSS = 'thinHorzCross',
    THIN_REVERSE_DIAGONAL_STRIPE = 'thinReverseDiagStripe',
    THIN_VERTICAL_STRIPE = 'thinVertStripe',
    VERTICAL_STRIPE = 'vertStripe',
  }
  class Math {
    constructor(options: IMathOptions);
  }
  class MathRun {
    constructor(text: string);
  }
  class TableRow {
    constructor(options: ITableRowOptions);
  }
  class Table {
    constructor(options: ITableOptions);
  }
  interface ITableCellOptions {
    shading?: IShadingAttributesProperties;
    margins?: ITableCellMarginOptions;
    verticalAlign?: string;
    textDirection?: string;
    verticalMerge?: string;
    width?: ITableWidthProperties;
    columnSpan?: number;
    rowSpan?: number;
    borders?: ITableCellBorders;
    children: (Paragraph | Table)[];
  }
  class TableCell {
    constructor(options: ITableCellOptions);
  }
  interface IParagraphOptions {
    alignment?: string;
    thematicBreak?: boolean;
    contextualSpacing?: boolean;
    rightTabStop?: number;
    leftTabStop?: number;
    indent?: IIndentAttributesProperties;
    spacing?: ISpacingProperties;
    keepNext?: boolean;
    keepLines?: boolean;
    outlineLevel?: number;
    numbering?: {
      reference: string;
      level: number;
      instance?: number;
      custom?: boolean;
    };
    border?: IBordersOptions;
    heading?: string;
    bidirectional?: boolean;
    pageBreakBefore?: boolean;
    tabStops?: TabStopDefinition[];
    style?: string;
    bullet?: {
      level: number;
    };
    shading?: IShadingAttributesProperties;
    widowControl?: boolean;
    frame?: IFrameOptions;
    suppressLineNumbers?: boolean;
    wordWrap?: boolean;
    overflowPunctuation?: boolean;
    scale?: number;
    autoSpaceEastAsianText?: boolean;
    run?: IRunOptions;
    text?: string;
    children?: ParagraphChild[];
  }
  class Paragraph {
    constructor(options: string | IParagraphOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
    addRunToFront(run: Run): Paragraph;
    addChildElement(child: XmlComponent | string): XmlComponent;
  }
  type IRunOptions = any;
  type ILevelsOptions = any;
  const LevelFormat;
}
