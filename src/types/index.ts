import { Point2D, GeoPoint, GeoLine, GeoCircle, GeoAngle, GeoConic, GeoPolygon, LineStyle } from '../geometry/engine';

export type { LineStyle };

export type SelectedItemType = 'point' | 'line' | 'circle' | 'conic' | 'angle' | 'polygon' | 'stroke' | 'latex' | 'locus' | null;

export type ToolMode =
  // Note-taking / Scrble
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'hide'
  | 'unhide'
  | 'latex'
  // Geometry primitives
  | 'point'
  | 'circle-center'
  | 'line'
  | 'segment'
  | 'ray'
  | 'circle-center-point'
  | 'circle-3points'
  | 'circular-arc'
  | 'circumcircular-arc'
  | 'polygon'
  | 'angle-shading'
  | 'angle'
  | 'perpendicular-bisector'
  | 'perpendicular-line'
  | 'parallel-line'
  | 'midpoint'
  | 'tangent'
  | 'angle-bisector-in'
  | 'angle-bisector-out'
  | 'intersect'
  | 'locus'
  // Circles & Lines (Image 1)
  | 'circumcircle'
  | 'incircle'
  | 'excircle'
  | 'euler-line'
  | 'euler-circle'
  | 'mixtilinear-incircle'
  | 'mixtilinear-excircle'
  | 'thebault-circle'
  | 'radical-axis'
  // Transformations (Image 2)
  | 'translate-vector'
  | 'rotation'
  | 'reflection'
  | 'inversion-circle'
  | 'inversion-circle-to-circle'
  | 'inversion-line-to-circle'
  | 'inversion-circle-thru-center-to-line'
  | 'polar-line'
  | 'pole-line'
  | 'isogonal-line'
  | 'isogonal-conjugate'
  | 'isotomic-conjugate'
  | 'dilation'
  // Triangle Centers (Image 3)
  | 'center-centroid'
  | 'center-circumcenter'
  | 'center-orthocenter'
  | 'center-incenter'
  | 'center-excenter'
  | 'center-lemoine'
  | 'center-gergonne'
  | 'center-nagel'
  | 'center-euler'
  | 'center-feuerbach'
  | 'center-humpty'
  | 'center-dumpty'
  // Conic Sections
  | 'conic-ellipse-5pt'
  | 'conic-5pt'
  | 'conic-ellipse-2foci-1pt'
  | 'conic-parabola-focus-directrix'
  | 'conic-parabola-5pt'
  | 'conic-hyperbola-2foci-1pt'
  | 'conic-hyperbola-5pt';

export interface FreehandStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number; // Down to 1
  isHighlighter?: boolean;
  pageIndex: number;
}

export interface LatexItem {
  id: string;
  x: number;
  y: number;
  latex: string;
  fontSize: number;
  color: string;
  pageIndex: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface GeoLocus {
  id: string;
  name?: string;
  dependentPointId: string;
  driverPointId: string;
  pathParentId?: string; // id of circle, line, or segment on which driver point moves
  samples: Point2D[];
  color: string;
  thickness: number;
  style: LineStyle;
  pageIndex: number;
}

export interface PageData {
  id: string;
  pageNumber: number;
  points: GeoPoint[];
  lines: GeoLine[];
  circles: GeoCircle[];
  conics: GeoConic[];
  angles: GeoAngle[];
  polygons: GeoPolygon[];
  strokes: FreehandStroke[];
  latexItems: LatexItem[];
  loci?: GeoLocus[];
  backgroundColor?: string;
  gridType?: 'blank' | 'ruled' | 'grid' | 'dots';
}

export interface DocumentFile {
  id: string;
  name: string;
  pages: PageData[];
  activePageIndex: number;
  history: PageData[][];
  historyIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentState {
  pages: PageData[];
  activePageIndex: number;
  zoom: number; // 0.5, 0.75, 1.0, 1.25, 1.5, etc.
  tool: ToolMode;
  // Drawing styles
  pointSize: number; // 0.5 to 10 px in 0.5 px steps
  pointStyle: 'solid' | 'hollow' | 'cross' | 'plus';
  pointColor: string;
  lineThickness: number; // 1 to 16
  lineStyle: LineStyle;
  lineColor: string;
  fillColor: string;
  eraserSize: number;
  // History for Undo / Redo
  history: PageData[][];
  historyIndex: number;
}
