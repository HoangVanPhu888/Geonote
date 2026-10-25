/**
 * Decoupled Pure Geometry & Math Engine
 * Supports 2D vector operations, Triangle Centers, Special Lines & Circles,
 * Geometric Inversions, Transformations, Conic Sections, and Angle shading.
 */

export interface Point2D {
  x: number;
  y: number;
}

export const PAGE_WIDTH_PIXELS = 794;
export const PAGE_WIDTH_CENTIMETERS = 21;
export const POSITION_STEP_PIXELS = 1e-3;
export const POSITION_STEP_CENTIMETERS =
  (POSITION_STEP_PIXELS * PAGE_WIDTH_CENTIMETERS) / PAGE_WIDTH_PIXELS;

export function quantizePositionCoordinate(value: number): number {
  return Math.round(value / POSITION_STEP_PIXELS) * POSITION_STEP_PIXELS;
}

export interface GeoPoint extends Point2D {
  id: string;
  name: string;
  size: number; // 0.5-10 px in 0.5 px steps
  color: string;
  style: 'solid' | 'hollow' | 'cross' | 'plus';
  pageIndex: number;
  labelOffset?: Point2D;
  showLabel?: boolean;
  hidden?: boolean;
  // Reactive definition for dependent points (centers, projections, midpoints, etc.)
  dependsOn?: {
    type:
      | 'centroid'
      | 'circumcenter'
      | 'orthocenter'
      | 'incenter'
      | 'excenter'
      | 'euler'
      | 'lemoine'
      | 'gergonne'
      | 'nagel'
      | 'feuerbach'
      | 'humpty'
      | 'dumpty'
      | 'midpoint'
      | 'circle-center'
      | 'reflection'
      | 'dilation'
      | 'isogonal-conjugate'
      | 'isotomic-conjugate'
      | 'mixtilinear-incircle-touchpoint'
      | 'mixtilinear-excircle-touchpoint'
      | 'thebault-touchpoint'
      | 'pole-line'
      | 'rotation'
      | 'inversion'
      | 'intersection'
      | 'point-on-path'
      | 'point-on-segment'
      | 'translation';
    parentPointIds?: string[];
    parentCircleIds?: string[];
    parentLineIds?: string[];
    parentPolygonIds?: string[];
    parentConicIds?: string[];
    angleDeg?: number;
    dilationRatio?: number;
    ratio?: number;
    translation?: Point2D;
    vertex?: 'A' | 'B' | 'C';
    intersectionIndex?: number;
    initialPos?: Point2D;
    pathT?: number;
  };
}

export type LineStyle = 'solid' | 'dash' | 'dash-dot' | 'dash-2dot' | 'dotted';

export interface GeoLine {
  id: string;
  p1: Point2D;
  p2: Point2D;
  p1PointId?: string;
  p2PointId?: string;
  name?: string;
  thickness: number; // 0.5-10 px in 0.5 px steps
  color: string;
  style: LineStyle;
  isInfinite?: boolean;
  pageIndex: number;
  labelOffset?: Point2D;
  showLabel?: boolean;
  hidden?: boolean;
  dependsOn?: {
    type:
      | 'euler-line'
      | 'angle-bisector-in'
      | 'angle-bisector-out'
      | 'perpendicular-bisector'
      | 'perpendicular-line'
      | 'parallel-line'
      | 'tangent'
      | 'reflection'
      | 'rotation'
      | 'dilation'
      | 'translation'
      | 'radical-axis'
      | 'polar-line'
      | 'isogonal-line'
      | 'inversion';
    parentPointIds?: string[];
    parentCircleIds?: string[];
    parentLineIds?: string[];
    parentPolygonIds?: string[];
    tangentIndex?: number;
    dilationRatio?: number;
    ratio?: number;
    angleDeg?: number;
  };
}

export interface GeoCircle {
  id: string;
  center: Point2D;
  radius: number;
  centerPointId?: string;
  radiusPointId?: string;
  name?: string;
  thickness: number;
  color: string;
  style: LineStyle;
  fillColor?: string;
  pageIndex: number;
  labelOffset?: Point2D;
  showLabel?: boolean;
  hidden?: boolean;
  dependsOn?: {
    type:
      | 'circumcircle'
      | 'incircle'
      | 'excircle'
      | 'euler-circle'
      | 'mixtilinear-incircle'
      | 'mixtilinear-excircle'
      | 'thebault-circle'
      | 'circle-3points'
      | 'center-point'
      | 'reflection'
      | 'rotation'
      | 'dilation'
      | 'translation'
      | 'inversion';
    parentPointIds?: string[];
    parentCircleIds?: string[];
    parentLineIds?: string[];
    parentPolygonIds?: string[];
    vertex?: 'A' | 'B' | 'C';
    dilationRatio?: number;
    ratio?: number;
    angleDeg?: number;
  };
}

export interface GeoAngle {
  id: string;
  center: Point2D; // B in angle ABC
  p1: Point2D;     // A
  p2: Point2D;     // C
  centerPointId?: string;
  p1PointId?: string;
  p2PointId?: string;
  radius: number;
  angleDeg: number;
  thickness?: number;
  label?: string;
  fillColor?: string;
  style: 'arc' | 'sector' | 'hatch' | 'right-angle' | 'double-arc';
  color: string;
  pageIndex: number;
  labelOffset?: Point2D;
  showLabel?: boolean;
  hidden?: boolean;
  dependsOn?: {
    type: 'translation' | 'dilation' | 'circumcircular-arc' | 'centered-arc';
    parentPointIds?: string[];
    parentAngleIds?: string[];
    dilationRatio?: number;
    ratio?: number;
  };
  arcSweep?: 'counterclockwise' | 'through-point';
  throughPointId?: string;
  throughPoint?: Point2D;
}

export interface GeoConic {
  id: string;
  name?: string;
  type: 'ellipse' | 'parabola' | 'hyperbola';
  subType: '5-point' | 'ellipse-2foci-1pt' | 'parabola-focus-directrix' | 'hyperbola-2foci-1pt';
  foci?: [Point2D, Point2D];
  fociPointIds?: [string, string];
  focus?: Point2D;
  focusPointId?: string;
  directrix?: { p1: Point2D; p2: Point2D };
  directrixPointIds?: [string, string];
  point?: Point2D;
  pointId?: string;
  points5?: Point2D[];
  points5Ids?: string[];
  coefficients?: [number, number, number, number, number, number]; // Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0
  thickness: number;
  color: string;
  style: LineStyle;
  pageIndex: number;
  labelOffset?: Point2D;
  showLabel?: boolean;
  hidden?: boolean;
  dependsOn?: {
    type: 'translation' | 'dilation';
    parentPointIds: string[];
    parentConicIds?: string[];
    ratio?: number;
    dilationRatio?: number;
  };
}

export interface GeoPolygon {
  id: string;
  name?: string;
  points: Point2D[];
  pointIds?: string[];
  thickness: number;
  color: string;
  style: LineStyle;
  fillColor?: string;
  pageIndex: number;
  labelOffset?: Point2D;
  showLabel?: boolean;
  hidden?: boolean;
  dependsOn?: {
    type: 'reflection' | 'dilation' | 'translation';
    parentPointIds?: string[];
    parentLineIds?: string[];
    parentPolygonIds?: string[];
    parentCircleIds?: string[];
    parentConicIds?: string[];
    dilationRatio?: number;
    ratio?: number;
  };
}

export interface GeoLocus {
  id: string;
  name?: string;
  dependentPointId: string;
  driverPointId: string;
  pathParentId?: string;
  samples: Point2D[];
  color: string;
  thickness: number;
  style: LineStyle;
  pageIndex: number;
}

export interface DynamicGeometryScene {
  points: GeoPoint[];
  lines: GeoLine[];
  circles: GeoCircle[];
  polygons: GeoPolygon[];
  angles: GeoAngle[];
  conics?: GeoConic[];
  loci?: GeoLocus[];
}

export function deleteGeometryObjects<T extends DynamicGeometryScene>(
  scene: T,
  initialIds: Iterable<string>
): T {
  const deletedIds = new Set(initialIds);
  let changed = true;

  const hasDeletedReference = (...references: (string | undefined)[]): boolean =>
    references.some((reference) => reference !== undefined && deletedIds.has(reference));
  const hasDeletedReferences = (...referenceGroups: (string[] | undefined)[]): boolean =>
    referenceGroups.some((references) => references?.some((reference) => deletedIds.has(reference)));

  while (changed) {
    changed = false;
    const addIfDependent = (id: string, isDependent: boolean) => {
      if (isDependent && !deletedIds.has(id)) {
        deletedIds.add(id);
        changed = true;
      }
    };

    for (const point of scene.points) {
      addIfDependent(point.id, hasDeletedReferences(
        point.dependsOn?.parentPointIds,
        point.dependsOn?.parentCircleIds,
        point.dependsOn?.parentLineIds,
        point.dependsOn?.parentPolygonIds,
        point.dependsOn?.parentConicIds
      ));
    }
    for (const line of scene.lines) {
      addIfDependent(
        line.id,
        hasDeletedReference(line.p1PointId, line.p2PointId) ||
          hasDeletedReferences(
            line.dependsOn?.parentPointIds,
            line.dependsOn?.parentCircleIds,
            line.dependsOn?.parentLineIds,
            line.dependsOn?.parentPolygonIds
          )
      );
    }
    for (const circle of scene.circles) {
      addIfDependent(
        circle.id,
        hasDeletedReference(circle.centerPointId, circle.radiusPointId) ||
          hasDeletedReferences(
            circle.dependsOn?.parentPointIds,
            circle.dependsOn?.parentCircleIds,
            circle.dependsOn?.parentLineIds,
            circle.dependsOn?.parentPolygonIds
          )
      );
    }
    for (const polygon of scene.polygons) {
      addIfDependent(
        polygon.id,
        hasDeletedReferences(
          polygon.pointIds,
          polygon.dependsOn?.parentPointIds,
          polygon.dependsOn?.parentLineIds,
          polygon.dependsOn?.parentPolygonIds,
          polygon.dependsOn?.parentCircleIds,
          polygon.dependsOn?.parentConicIds
        )
      );
    }
    for (const conic of scene.conics || []) {
      addIfDependent(
        conic.id,
        hasDeletedReference(conic.focusPointId, conic.pointId) ||
          hasDeletedReferences(
            conic.fociPointIds,
            conic.directrixPointIds,
            conic.points5Ids,
            conic.dependsOn?.parentPointIds,
            conic.dependsOn?.parentConicIds
          )
      );
    }
    for (const angle of scene.angles) {
      addIfDependent(
        angle.id,
        hasDeletedReference(angle.centerPointId, angle.p1PointId, angle.p2PointId, angle.throughPointId) ||
          hasDeletedReferences(angle.dependsOn?.parentPointIds, angle.dependsOn?.parentAngleIds)
      );
    }
    for (const locus of scene.loci || []) {
      addIfDependent(
        locus.id,
        hasDeletedReference(locus.dependentPointId, locus.driverPointId, locus.pathParentId)
      );
    }
  }

  return {
    ...scene,
    points: scene.points.filter((point) => !deletedIds.has(point.id)),
    lines: scene.lines.filter((line) => !deletedIds.has(line.id)),
    circles: scene.circles.filter((circle) => !deletedIds.has(circle.id)),
    polygons: scene.polygons.filter((polygon) => !deletedIds.has(polygon.id)),
    angles: scene.angles.filter((angle) => !deletedIds.has(angle.id)),
    ...(scene.conics ? { conics: scene.conics.filter((conic) => !deletedIds.has(conic.id)) } : {}),
    ...(scene.loci ? { loci: scene.loci.filter((locus) => !deletedIds.has(locus.id)) } : {}),
  };
}

// ----------------- Basic Vector Math -----------------

export function dist(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function midpoint(p1: Point2D, p2: Point2D): number[] {
  return [(p1.x + p2.x) / 2, (p1.y + p2.y) / 2];
}

export function dot(u: Point2D, v: Point2D): number {
  return u.x * v.x + u.y * v.y;
}

export function cross(u: Point2D, v: Point2D): number {
  return u.x * v.y - u.y * v.x;
}

export function normalize(v: Point2D): Point2D {
  const len = Math.hypot(v.x, v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

// Distance from point P to segment AB
export function distToSegment(P: Point2D, A: Point2D, B: Point2D): number {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) return dist(P, A);
  let t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return dist(P, { x: A.x + t * dx, y: A.y + t * dy });
}

// Distance from point P to infinite line passing through A and B
export function distToLine(P: Point2D, A: Point2D, B: Point2D): number {
  const foot = projectPointToLine(P, A, B);
  return dist(P, foot);
}

// Perpendicular bisector of segment AB
export function perpendicularBisector(A: Point2D, B: Point2D, length = 1000): { p1: Point2D; p2: Point2D } {
  const midX = (A.x + B.x) / 2;
  const midY = (A.y + B.y) / 2;
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const perpX = -dy;
  const perpY = dx;
  const len = Math.hypot(perpX, perpY) || 1;
  const ux = (perpX / len) * length;
  const uy = (perpY / len) * length;
  return {
    p1: { x: midX - ux, y: midY - uy },
    p2: { x: midX + ux, y: midY + uy },
  };
}

// Intersection of line (p1, p2) and line (p3, p4)
export function lineIntersection(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): Point2D | null {
  const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(d) < 1e-9) return null; // Parallel
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  };
}

export function getLineLineIntersection(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D,
  firstIsSegment = false,
  secondIsSegment = false
): Point2D | null {
  const intersection = lineIntersection(p1, p2, p3, p4);
  if (!intersection) return null;
  if (firstIsSegment && !isPointOnSegment(intersection, p1, p2)) return null;
  if (secondIsSegment && !isPointOnSegment(intersection, p3, p4)) return null;
  return intersection;
}

// Intersections of infinite line passing through p1, p2 with circle (center, radius)
export function getLineCircleIntersections(
  p1: Point2D,
  p2: Point2D,
  center: Point2D,
  radius: number,
  isSegment = false
): Point2D[] {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return [];
  const ux = dx / len;
  const uy = dy / len;
  // Projection of circle center onto line
  const tProj = (center.x - p1.x) * ux + (center.y - p1.y) * uy;
  const projX = p1.x + tProj * ux;
  const projY = p1.y + tProj * uy;
  const dSq = (center.x - projX) * (center.x - projX) + (center.y - projY) * (center.y - projY);
  const rSq = radius * radius;
  if (dSq > rSq + 1e-5) return []; // No intersection
  if (Math.abs(dSq - rSq) <= 1e-5) {
    const tangent = { x: projX, y: projY };
    return !isSegment || isPointOnSegment(tangent, p1, p2) ? [tangent] : [];
  }
  const offset = Math.sqrt(Math.max(0, rSq - dSq));
  const intersections = [
    { x: projX - offset * ux, y: projY - offset * uy },
    { x: projX + offset * ux, y: projY + offset * uy },
  ];
  return isSegment
    ? intersections.filter((point) => isPointOnSegment(point, p1, p2))
    : intersections;
}

function isPointOnSegment(point: Point2D, p1: Point2D, p2: Point2D): boolean {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lengthSquared;
  return t >= -1e-9 && t <= 1 + 1e-9;
}

// Intersections of two circles (c1, r1) and (c2, r2)
export function getCircleCircleIntersections(
  c1: Point2D,
  r1: number,
  c2: Point2D,
  r2: number
): Point2D[] {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-9) return []; // Concentric
  if (d > r1 + r2 + 1e-5 || d < Math.abs(r1 - r2) - 1e-5) return []; // Disjoint or nested
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const hSq = r1 * r1 - a * a;
  const h = Math.sqrt(Math.max(0, hSq));
  const p2x = c1.x + (a * dx) / d;
  const p2y = c1.y + (a * dy) / d;
  if (h < 1e-5) {
    return [{ x: p2x, y: p2y }];
  }
  const rx = (-dy * h) / d;
  const ry = (dx * h) / d;
  return [
    { x: p2x + rx, y: p2y + ry },
    { x: p2x - rx, y: p2y - ry },
  ];
}

// Project point P onto line passing through A and B
export function projectPointToLine(P: Point2D, A: Point2D, B: Point2D): Point2D {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: A.x, y: A.y };
  const t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / lenSq;
  return {
    x: A.x + t * dx,
    y: A.y + t * dy,
  };
}

export function projectPointToSegment(P: Point2D, A: Point2D, B: Point2D): Point2D {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: A.x, y: A.y };
  const t = Math.max(0, Math.min(1, ((P.x - A.x) * dx + (P.y - A.y) * dy) / lenSq));
  return { x: A.x + t * dx, y: A.y + t * dy };
}

export function projectPointToPolygon(P: Point2D, polygon: GeoPolygon): Point2D {
  if (polygon.points.length < 2) return P;
  let closest = projectPointToSegment(P, polygon.points[0], polygon.points[1]);
  let closestDistance = dist(P, closest);
  for (let index = 1; index < polygon.points.length; index++) {
    const projected = projectPointToSegment(
      P,
      polygon.points[index],
      polygon.points[(index + 1) % polygon.points.length]
    );
    const distance = dist(P, projected);
    if (distance < closestDistance) {
      closest = projected;
      closestDistance = distance;
    }
  }
  return closest;
}

// Project point P onto circle boundary
export function projectPointToCircle(P: Point2D, center: Point2D, radius: number): Point2D {
  const dx = P.x - center.x;
  const dy = P.y - center.y;
  const d = Math.hypot(dx, dy);
  if (d === 0) return { x: center.x + radius, y: center.y };
  return {
    x: center.x + (dx / d) * radius,
    y: center.y + (dy / d) * radius,
  };
}

// Reflection of point P across line passing through A and B
export function reflectPointAcrossLine(P: Point2D, A: Point2D, B: Point2D): Point2D {
  const foot = projectPointToLine(P, A, B);
  return {
    x: 2 * foot.x - P.x,
    y: 2 * foot.y - P.y,
  };
}

// Perpendicular line passing through point P to line passing through A and B
export function getPerpendicularLine(P: Point2D, A: Point2D, B: Point2D, length = 2000): { p1: Point2D; p2: Point2D } {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const perpX = -dy;
  const perpY = dx;
  const len = Math.hypot(perpX, perpY) || 1;
  const ux = (perpX / len) * length;
  const uy = (perpY / len) * length;
  return {
    p1: { x: P.x - ux, y: P.y - uy },
    p2: { x: P.x + ux, y: P.y + uy },
  };
}

// Parallel line passing through point P to line passing through A and B
export function getParallelLine(P: Point2D, A: Point2D, B: Point2D, length = 2000): { p1: Point2D; p2: Point2D } {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = (dx / len) * length;
  const uy = (dy / len) * length;
  return {
    p1: { x: P.x - ux, y: P.y - uy },
    p2: { x: P.x + ux, y: P.y + uy },
  };
}

// Tangent line(s) from point P to circle (center, radius).
// Returns 0 lines if inside, 1 line if on circle, 2 lines if outside.
export function getCircleTangents(
  P: Point2D,
  circle: { center: Point2D; radius: number },
  length = 2000
): { p1: Point2D; p2: Point2D; touchPoint: Point2D }[] {
  const d = dist(P, circle.center);
  const r = circle.radius;
  const tolerance = Math.max(POSITION_STEP_PIXELS, Number.EPSILON * Math.max(1, d, r) * 16);
  if (d < r - tolerance) return [];

  if (Math.abs(d - r) <= tolerance) {
    const len = d || 1;
    const touchPoint = {
      x: circle.center.x + ((P.x - circle.center.x) / len) * r,
      y: circle.center.y + ((P.y - circle.center.y) / len) * r,
    };
    const dx = touchPoint.x - circle.center.x;
    const dy = touchPoint.y - circle.center.y;
    const radialLength = Math.hypot(dx, dy) || 1;
    const ux = (-dy / radialLength) * length;
    const uy = (dx / radialLength) * length;
    return [{
      p1: { x: touchPoint.x - ux, y: touchPoint.y - uy },
      p2: { x: touchPoint.x + ux, y: touchPoint.y + uy },
      touchPoint,
    }];
  }

  // Point is outside circle: 2 tangents
  const theta = Math.atan2(P.y - circle.center.y, P.x - circle.center.x);
  const beta = Math.acos(Math.max(-1, Math.min(1, r / d)));

  const t1: Point2D = {
    x: circle.center.x + r * Math.cos(theta - beta),
    y: circle.center.y + r * Math.sin(theta - beta),
  };
  const t2: Point2D = {
    x: circle.center.x + r * Math.cos(theta + beta),
    y: circle.center.y + r * Math.sin(theta + beta),
  };

  const line1Dir = normalize({ x: t1.x - P.x, y: t1.y - P.y });
  const line2Dir = normalize({ x: t2.x - P.x, y: t2.y - P.y });

  return [
    {
      p1: { x: P.x - line1Dir.x * length, y: P.y - line1Dir.y * length },
      p2: { x: P.x + line1Dir.x * length, y: P.y + line1Dir.y * length },
      touchPoint: t1,
    },
    {
      p1: { x: P.x - line2Dir.x * length, y: P.y - line2Dir.y * length },
      p2: { x: P.x + line2Dir.x * length, y: P.y + line2Dir.y * length },
      touchPoint: t2,
    },
  ];
}

// ----------------- Triangle Centers -----------------

// Medicenter (Centroid G)
export function getCentroid(A: Point2D, B: Point2D, C: Point2D): Point2D {
  return {
    x: (A.x + B.x + C.x) / 3,
    y: (A.y + B.y + C.y) / 3,
  };
}

// Circumcenter (O) and circumradius R
export function getCircumcenter(A: Point2D, B: Point2D, C: Point2D): { center: Point2D; radius: number } | null {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  if (Math.abs(d) < 1e-7) return null; // Collinear
  const aSq = A.x * A.x + A.y * A.y;
  const bSq = B.x * B.x + B.y * B.y;
  const cSq = C.x * C.x + C.y * C.y;

  const ux = (aSq * (B.y - C.y) + bSq * (C.y - A.y) + cSq * (A.y - B.y)) / d;
  const uy = (aSq * (C.x - B.x) + bSq * (A.x - C.x) + cSq * (B.x - A.x)) / d;
  const center = { x: ux, y: uy };
  return { center, radius: dist(center, A) };
}

// Incenter (I) and inradius r
export function getIncenter(A: Point2D, B: Point2D, C: Point2D): { center: Point2D; radius: number } {
  const a = dist(B, C);
  const b = dist(C, A);
  const c = dist(A, B);
  const p = a + b + c;
  if (p === 0) return { center: { x: A.x, y: A.y }, radius: 0 };

  const center = {
    x: (a * A.x + b * B.x + c * C.x) / p,
    y: (a * A.y + b * B.y + c * C.y) / p,
  };
  // Semi-perimeter
  const s = p / 2;
  const area = Math.abs((A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) / 2);
  const radius = s > 0 ? area / s : 0;
  return { center, radius };
}

// Orthocenter (H)
export function getOrthocenter(A: Point2D, B: Point2D, C: Point2D): Point2D | null {
  const O = getCircumcenter(A, B, C);
  if (!O) return null;
  const G = getCentroid(A, B, C);
  // Euler relation: H = 3G - 2O
  return {
    x: 3 * G.x - 2 * O.center.x,
    y: 3 * G.y - 2 * O.center.y,
  };
}

// Euler's Center (Nine-point center N) and Nine-point circle
export function getNinePointCircle(A: Point2D, B: Point2D, C: Point2D): { center: Point2D; radius: number } | null {
  const circum = getCircumcenter(A, B, C);
  const ortho = getOrthocenter(A, B, C);
  if (!circum || !ortho) return null;
  const center = {
    x: (circum.center.x + ortho.x) / 2,
    y: (circum.center.y + ortho.y) / 2,
  };
  return { center, radius: circum.radius / 2 };
}

// Excenters (IA, IB, IC)
export function getExcenter(A: Point2D, B: Point2D, C: Point2D, vertex: 'A' | 'B' | 'C'): { center: Point2D; radius: number } {
  const a = dist(B, C);
  const b = dist(C, A);
  const c = dist(A, B);
  const area = Math.abs((A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) / 2);
  const s = (a + b + c) / 2;

  let center: Point2D;
  let radius = 0;
  if (vertex === 'A') {
    const denom = -a + b + c;
    center = {
      x: (-a * A.x + b * B.x + c * C.x) / denom,
      y: (-a * A.y + b * B.y + c * C.y) / denom,
    };
    radius = area / Math.max(1e-5, s - a);
  } else if (vertex === 'B') {
    const denom = a - b + c;
    center = {
      x: (a * A.x - b * B.x + c * C.x) / denom,
      y: (a * A.y - b * B.y + c * C.y) / denom,
    };
    radius = area / Math.max(1e-5, s - b);
  } else {
    const denom = a + b - c;
    center = {
      x: (a * A.x + b * B.x - c * C.x) / denom,
      y: (a * A.y + b * B.y - c * C.y) / denom,
    };
    radius = area / Math.max(1e-5, s - c);
  }
  return { center, radius };
}

// Lemoine Point (Symmedian Point K)
export function getLemoinePoint(A: Point2D, B: Point2D, C: Point2D): Point2D {
  const a = dist(B, C);
  const b = dist(C, A);
  const c = dist(A, B);
  const a2 = a * a;
  const b2 = b * b;
  const c2 = c * c;
  const total = a2 + b2 + c2;
  return {
    x: (a2 * A.x + b2 * B.x + c2 * C.x) / total,
    y: (a2 * A.y + b2 * B.y + c2 * C.y) / total,
  };
}

export function getHumptyPoint(A: Point2D, B: Point2D, C: Point2D): Point2D | null {
  const orthocenter = getOrthocenter(A, B, C);
  if (!orthocenter) return null;
  const medianMidpoint = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
  return projectPointToLine(orthocenter, A, medianMidpoint);
}

export function getDumptyPoint(A: Point2D, B: Point2D, C: Point2D): Point2D | null {
  const circumcenter = getCircumcenter(A, B, C);
  if (!circumcenter) return null;

  const sideAB = dist(A, B);
  const sideAC = dist(A, C);
  const sideABSquared = sideAB * sideAB;
  const sideACSquared = sideAC * sideAC;
  const denominator = sideABSquared + sideACSquared;
  if (denominator === 0) return null;

  const symmedianPoint = {
    x: (sideACSquared * B.x + sideABSquared * C.x) / denominator,
    y: (sideACSquared * B.y + sideABSquared * C.y) / denominator,
  };
  return projectPointToLine(circumcenter.center, A, symmedianPoint);
}

// Gergonne Point (Ge)
export function getGergonnePoint(A: Point2D, B: Point2D, C: Point2D): Point2D {
  const a = dist(B, C);
  const b = dist(C, A);
  const c = dist(A, B);
  const s = (a + b + c) / 2;
  const wA = 1 / Math.max(1e-5, s - a);
  const wB = 1 / Math.max(1e-5, s - b);
  const wC = 1 / Math.max(1e-5, s - c);
  const total = wA + wB + wC;
  return {
    x: (wA * A.x + wB * B.x + wC * C.x) / total,
    y: (wA * A.y + wB * B.y + wC * C.y) / total,
  };
}

// Nagel Point (Na)
export function getNagelPoint(A: Point2D, B: Point2D, C: Point2D): Point2D {
  const a = dist(B, C);
  const b = dist(C, A);
  const c = dist(A, B);
  const s = (a + b + c) / 2;
  const wA = s - a;
  const wB = s - b;
  const wC = s - c;
  const total = wA + wB + wC;
  return {
    x: (wA * A.x + wB * B.x + wC * C.x) / total,
    y: (wA * A.y + wB * B.y + wC * C.y) / total,
  };
}

// Feuerbach Point (Fe) - Point of tangency between incircle and nine-point circle
export function getFeuerbachPoint(A: Point2D, B: Point2D, C: Point2D): Point2D {
  const a = dist(B, C);
  const b = dist(C, A);
  const c = dist(A, B);
  // Exact barycentric coordinates for the Feuerbach point:
  // wA = (b - c)^2 * (b + c - a)
  // wB = (c - a)^2 * (c + a - b)
  // wC = (a - b)^2 * (a + b - c)
  const wA = (b - c) * (b - c) * (b + c - a);
  const wB = (c - a) * (c - a) * (c + a - b);
  const wC = (a - b) * (a - b) * (a + b - c);
  const total = wA + wB + wC;
  if (Math.abs(total) < 1e-7) {
    // Equilateral triangle where incircle and 9-point circle coincide
    return getIncenter(A, B, C).center;
  }
  return {
    x: (wA * A.x + wB * B.x + wC * C.x) / total,
    y: (wA * A.y + wB * B.y + wC * C.y) / total,
  };
}

// ----------------- Circles and Lines (Image 1) -----------------

type MixtilinearCircle = { center: Point2D; radius: number; touchpoint: Point2D };

function getMixtilinearCircle(
  A: Point2D,
  B: Point2D,
  C: Point2D,
  external: boolean
): MixtilinearCircle {
  const circumcircle = getCircumcenter(A, B, C);
  const ab = { x: B.x - A.x, y: B.y - A.y };
  const ac = { x: C.x - A.x, y: C.y - A.y };
  const abLength = Math.hypot(ab.x, ab.y);
  const acLength = Math.hypot(ac.x, ac.y);
  if (!circumcircle || abLength < 1e-9 || acLength < 1e-9) {
    return { center: { ...A }, radius: 0, touchpoint: { ...A } };
  }

  const uAB = { x: ab.x / abLength, y: ab.y / abLength };
  const uAC = { x: ac.x / acLength, y: ac.y / acLength };
  const bisector = external
    ? getExcenter(A, B, C, 'A').center
    : getIncenter(A, B, C).center;
  const bisectorVector = { x: bisector.x - A.x, y: bisector.y - A.y };
  const bisectorLength = Math.hypot(bisectorVector.x, bisectorVector.y);
  if (bisectorLength < 1e-9) {
    return { center: { ...A }, radius: 0, touchpoint: { ...A } };
  }

  const direction = { x: bisectorVector.x / bisectorLength, y: bisectorVector.y / bisectorLength };
  const cosAngle = uAB.x * uAC.x + uAB.y * uAC.y;
  const sinHalfAngle = Math.sqrt(Math.max(0, (1 - cosAngle) / 2));
  const denominator = 1 - sinHalfAngle * sinHalfAngle;
  if (denominator < 1e-12 || sinHalfAngle < 1e-12) {
    return { center: { ...A }, radius: 0, touchpoint: { ...A } };
  }

  const fromVertexToCircumcenter = {
    x: circumcircle.center.x - A.x,
    y: circumcircle.center.y - A.y,
  };
  const projection =
    fromVertexToCircumcenter.x * direction.x +
    fromVertexToCircumcenter.y * direction.y;
  const distanceAlongBisector =
    (2 * (projection + (external ? 1 : -1) * circumcircle.radius * sinHalfAngle)) /
    denominator;
  if (!Number.isFinite(distanceAlongBisector) || distanceAlongBisector <= 0) {
    return { center: { ...A }, radius: 0, touchpoint: { ...A } };
  }

  const center = {
    x: A.x + direction.x * distanceAlongBisector,
    y: A.y + direction.y * distanceAlongBisector,
  };
  const radius = distanceAlongBisector * sinHalfAngle;
  const centerDistance = dist(center, circumcircle.center);
  if (centerDistance < 1e-9) {
    return { center, radius, touchpoint: { ...A } };
  }

  const touchpoint = {
    x: circumcircle.center.x + ((center.x - circumcircle.center.x) * circumcircle.radius) / centerDistance,
    y: circumcircle.center.y + ((center.y - circumcircle.center.y) * circumcircle.radius) / centerDistance,
  };
  return { center, radius, touchpoint };
}

// Circle tangent to the two sides at A and internally tangent to the circumcircle.
export function getMixtilinearIncircle(A: Point2D, B: Point2D, C: Point2D): MixtilinearCircle {
  return getMixtilinearCircle(A, B, C, false);
}

// Circle tangent to the side lines at A and externally tangent to the circumcircle.
export function getMixtilinearExcircle(A: Point2D, B: Point2D, C: Point2D): MixtilinearCircle {
  return getMixtilinearCircle(A, B, C, true);
}

export interface ThebaultCircleGeometry {
  center: Point2D;
  radius: number;
  touchpoint: Point2D;
}

export function getThebaultCircle(
  A: Point2D,
  B: Point2D,
  C: Point2D,
  D: Point2D
): ThebaultCircleGeometry | null {
  const sideLength = Math.max(dist(A, B), dist(B, C), dist(C, A));
  if (sideLength === 0 || Math.abs(cross(
    { x: B.x - A.x, y: B.y - A.y },
    { x: C.x - A.x, y: C.y - A.y }
  )) <= sideLength * sideLength * 1e-12) {
    return null;
  }

  const pointD = projectPointToSegment(D, B, C);
  const angleBisector = getAngleBisector(A, pointD, B);
  const incenter = getIncenter(A, B, C).center;
  const perpendicularThroughIncenter = getPerpendicularLine(
    incenter,
    angleBisector.p1,
    angleBisector.p2
  );
  const pointE = getLineLineIntersection(
    perpendicularThroughIncenter.p1,
    perpendicularThroughIncenter.p2,
    A,
    pointD
  );
  const pointF = getLineLineIntersection(
    perpendicularThroughIncenter.p1,
    perpendicularThroughIncenter.p2,
    pointD,
    B
  );
  if (!pointE || !pointF) return null;

  const perpendicularAtE = getPerpendicularLine(pointE, A, pointD);
  const perpendicularAtF = getPerpendicularLine(pointF, pointD, B);
  const center = getLineLineIntersection(
    perpendicularAtE.p1,
    perpendicularAtE.p2,
    perpendicularAtF.p1,
    perpendicularAtF.p2
  );
  const circumcircle = getCircumcenter(A, B, C);
  if (!center || !circumcircle) return null;

  const constructionRadius = dist(center, pointE);
  const centerDistance = dist(center, circumcircle.center);
  const radius = circumcircle.radius - centerDistance;
  const tolerance = Math.max(1e-7, circumcircle.radius * 1e-7);
  if (
    !Number.isFinite(radius) ||
    radius <= 0 ||
    Math.abs(constructionRadius - radius) > tolerance ||
    centerDistance < 1e-12
  ) {
    return null;
  }

  return {
    center,
    radius,
    touchpoint: {
      x: circumcircle.center.x + ((center.x - circumcircle.center.x) * circumcircle.radius) / centerDistance,
      y: circumcircle.center.y + ((center.y - circumcircle.center.y) * circumcircle.radius) / centerDistance,
    },
  };
}

// Radical axis of two circles C1(O1, r1) and C2(O2, r2)
export function getRadicalAxis(c1: { center: Point2D; radius: number }, c2: { center: Point2D; radius: number }, length = 1500): { p1: Point2D; p2: Point2D } | null {
  const d = dist(c1.center, c2.center);
  if (d < 1e-5) return null; // Concentric
  // Distance from center 1 along the line of centers:
  // x = (d^2 + r1^2 - r2^2) / (2d)
  const x = (d * d + c1.radius * c1.radius - c2.radius * c2.radius) / (2 * d);
  const uCenter = {
    x: (c2.center.x - c1.center.x) / d,
    y: (c2.center.y - c1.center.y) / d,
  };
  const foot = {
    x: c1.center.x + uCenter.x * x,
    y: c1.center.y + uCenter.y * x,
  };
  const perp = { x: -uCenter.y, y: uCenter.x };
  return {
    p1: { x: foot.x - perp.x * length, y: foot.y - perp.y * length },
    p2: { x: foot.x + perp.x * length, y: foot.y + perp.y * length },
  };
}

// ----------------- Transformations (Image 2) -----------------

// Translation of point by vector (B - A)
export function translatePoint(P: Point2D, from: Point2D, to: Point2D): Point2D {
  return {
    x: P.x + (to.x - from.x),
    y: P.y + (to.y - from.y),
  };
}

// Rotation of point P around center C by angle in radians
export function rotatePoint(P: Point2D, center: Point2D, angleRad: number): Point2D {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = P.x - center.x;
  const dy = P.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

// Dilation (Homothety) with center C and factor k
export function dilatePoint(P: Point2D, center: Point2D, k: number): Point2D {
  return {
    x: center.x + k * (P.x - center.x),
    y: center.y + k * (P.y - center.y),
  };
}

// Inversion of point with respect to circle (O, R)
// OP * OP' = R^2 => P' = O + R^2 / |P - O|^2 * (P - O)
export function invertPoint(P: Point2D, circle: { center: Point2D; radius: number }): Point2D | null {
  const dx = P.x - circle.center.x;
  const dy = P.y - circle.center.y;
  const dSq = dx * dx + dy * dy;
  if (dSq < 1e-9) return null; // Point at center inverts to infinity
  const factor = (circle.radius * circle.radius) / dSq;
  return {
    x: circle.center.x + dx * factor,
    y: circle.center.y + dy * factor,
  };
}

// Inversion of circle with respect to circle (O, R)
// If circle passes through O, it inverts to a line.
// Otherwise, it inverts to another circle.
export function invertCircle(
  c: { center: Point2D; radius: number },
  invCircle: { center: Point2D; radius: number }
): { type: 'circle'; center: Point2D; radius: number } | { type: 'line'; p1: Point2D; p2: Point2D } | null {
  const d = dist(c.center, invCircle.center);
  // Does circle c pass through invCircle.center?
  if (Math.abs(d - c.radius) < 1e-4) {
    // Inverts to line perpendicular to line of centers
    // Diameter opposite point:
    const farPoint = {
      x: invCircle.center.x + ((c.center.x - invCircle.center.x) / d) * (2 * c.radius),
      y: invCircle.center.y + ((c.center.y - invCircle.center.y) / d) * (2 * c.radius),
    };
    const invFar = invertPoint(farPoint, invCircle);
    if (!invFar) return null;
    const perp = {
      x: -(c.center.y - invCircle.center.y) / d,
      y: (c.center.x - invCircle.center.x) / d,
    };
    return {
      type: 'line',
      p1: { x: invFar.x - perp.x * 1000, y: invFar.y - perp.y * 1000 },
      p2: { x: invFar.x + perp.x * 1000, y: invFar.y + perp.y * 1000 },
    };
  }

  // Two diametrically opposite points on line of centers
  const dir = d > 1e-5 ? { x: (c.center.x - invCircle.center.x) / d, y: (c.center.y - invCircle.center.y) / d } : { x: 1, y: 0 };
  const pClose = { x: c.center.x - dir.x * c.radius, y: c.center.y - dir.y * c.radius };
  const pFar = { x: c.center.x + dir.x * c.radius, y: c.center.y + dir.y * c.radius };

  const invClose = invertPoint(pClose, invCircle);
  const invFar = invertPoint(pFar, invCircle);
  if (!invClose || !invFar) return null;

  const newCenter = {
    x: (invClose.x + invFar.x) / 2,
    y: (invClose.y + invFar.y) / 2,
  };
  const newRadius = dist(invClose, invFar) / 2;
  return { type: 'circle', center: newCenter, radius: newRadius };
}

// Inversion of line with respect to circle (O, R)
// If line passes through O, it inverts to itself.
// If not, it inverts to a circle passing through O.
export function invertLine(
  line: { p1: Point2D; p2: Point2D },
  invCircle: { center: Point2D; radius: number }
): { type: 'line'; p1: Point2D; p2: Point2D } | { type: 'circle'; center: Point2D; radius: number } | null {
  const foot = projectPointToLine(invCircle.center, line.p1, line.p2);
  const d = dist(invCircle.center, foot);
  if (d < 1e-5) {
    // Passes through center, inverts to itself
    return { type: 'line', p1: line.p1, p2: line.p2 };
  }
  const invFoot = invertPoint(foot, invCircle);
  if (!invFoot) return null;
  // Circle has diameter from O to invFoot
  const newCenter = {
    x: (invCircle.center.x + invFoot.x) / 2,
    y: (invCircle.center.y + invFoot.y) / 2,
  };
  return { type: 'circle', center: newCenter, radius: d / 2 <= 0 ? 10 : dist(invCircle.center, invFoot) / 2 };
}

// Polar line of a point P wrt circle (O, R)
export function getPolarLine(P: Point2D, circle: { center: Point2D; radius: number }, length = 1500): { p1: Point2D; p2: Point2D } | null {
  const inv = invertPoint(P, circle);
  if (!inv) return null;
  const dx = P.x - circle.center.x;
  const dy = P.y - circle.center.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-5) return null;
  const perp = { x: -dy / len, y: dx / len };
  return {
    p1: { x: inv.x - perp.x * length, y: inv.y - perp.y * length },
    p2: { x: inv.x + perp.x * length, y: inv.y + perp.y * length },
  };
}

// Pole of a line wrt circle (O, R)
export function getPoleOfLine(line: { p1: Point2D; p2: Point2D }, circle: { center: Point2D; radius: number }): Point2D | null {
  const foot = projectPointToLine(circle.center, line.p1, line.p2);
  return invertPoint(foot, circle);
}

// Isogonal line of ray AP with respect to angle BAC
export function getIsogonalLine(A: Point2D, B: Point2D, C: Point2D, P: Point2D, length = 1000): { p1: Point2D; p2: Point2D } {
  const angleAB = Math.atan2(B.y - A.y, B.x - A.x);
  const angleAC = Math.atan2(C.y - A.y, C.x - A.x);
  const angleAP = Math.atan2(P.y - A.y, P.x - A.x);

  // Bisector angle
  let diff = angleAC - angleAB;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  const bisectorAngle = angleAB + diff / 2;

  // Reflection of angleAP across bisectorAngle
  const reflectedAngle = 2 * bisectorAngle - angleAP;
  return {
    p1: { x: A.x, y: A.y },
    p2: { x: A.x + Math.cos(reflectedAngle) * length, y: A.y + Math.sin(reflectedAngle) * length },
  };
}

// Isogonal conjugate of point P wrt triangle ABC
export function getIsogonalConjugate(A: Point2D, B: Point2D, C: Point2D, P: Point2D): Point2D | null {
  const lA = getIsogonalLine(A, B, C, P);
  const lB = getIsogonalLine(B, C, A, P);
  return lineIntersection(lA.p1, lA.p2, lB.p1, lB.p2);
}

// Isotomic conjugate of point P wrt triangle ABC
export function getIsotomicConjugate(A: Point2D, B: Point2D, C: Point2D, P: Point2D): Point2D | null {
  // Cevian feet:
  const footA = lineIntersection(A, P, B, C);
  const footB = lineIntersection(B, P, C, A);
  if (!footA || !footB) return null;

  // Symmetric points wrt midpoints of sides
  const midBC = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
  const symA = { x: 2 * midBC.x - footA.x, y: 2 * midBC.y - footA.y };

  const midCA = { x: (C.x + A.x) / 2, y: (C.y + A.y) / 2 };
  const symB = { x: 2 * midCA.x - footB.x, y: 2 * midCA.y - footB.y };

  return lineIntersection(A, symA, B, symB);
}

// ----------------- Angle Bisector (In / Out) -----------------
export function getAngleBisector(A: Point2D, B: Point2D, C: Point2D, isExterior = false, length = 1000): { p1: Point2D; p2: Point2D } {
  // Angle at B between BA and BC
  const dBA = dist(B, A);
  const dBC = dist(B, C);
  if (dBA === 0 || dBC === 0) return { p1: B, p2: { x: B.x + 100, y: B.y } };

  const uBA = { x: (A.x - B.x) / dBA, y: (A.y - B.y) / dBA };
  const uBC = { x: (C.x - B.x) / dBC, y: (C.y - B.y) / dBC };

  let bisectorDir: Point2D;
  if (!isExterior) {
    bisectorDir = normalize({ x: uBA.x + uBC.x, y: uBA.y + uBC.y });
  } else {
    // Exterior bisector is perpendicular to interior bisector
    const intDir = normalize({ x: uBA.x + uBC.x, y: uBA.y + uBC.y });
    bisectorDir = { x: -intDir.y, y: intDir.x };
  }

  return {
    p1: { x: B.x - bisectorDir.x * (isExterior ? length : 0), y: B.y - bisectorDir.y * (isExterior ? length : 0) },
    p2: { x: B.x + bisectorDir.x * length, y: B.y + bisectorDir.y * length },
  };
}

// ----------------- Conic Sections -----------------

// Fit 5 points to general conic: Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0
// Uses Hartley isotropic normalization (center translation + sqrt(2) scaling)
// to prevent numerical cancellation, overflow, and singularity when F = 0
export function fitConic5Points(points: Point2D[]): [number, number, number, number, number, number] | null {
  if (points.length < 5) return null;

  // 1. Compute centroid
  let meanX = 0;
  let meanY = 0;
  for (let i = 0; i < 5; i++) {
    meanX += points[i].x;
    meanY += points[i].y;
  }
  meanX /= 5;
  meanY /= 5;

  // 2. Average distance to centroid
  let meanDist = 0;
  for (let i = 0; i < 5; i++) {
    meanDist += Math.hypot(points[i].x - meanX, points[i].y - meanY);
  }
  meanDist /= 5;
  if (meanDist < 1e-4) return null; // Collinear or coincident points

  const s = Math.SQRT2 / meanDist;

  // 3. Form 5x6 normalized matrix M
  // Row i: [u^2, u*v, v^2, u, v, 1]
  const M: number[][] = [];
  for (let i = 0; i < 5; i++) {
    const u = (points[i].x - meanX) * s;
    const v = (points[i].y - meanY) * s;
    M.push([u * u, u * v, v * v, u, v, 1]);
  }

  // Solve M * c = 0 using Gaussian elimination with full pivoting across 5 equations and 6 variables
  // Find which column to pick as free variable (the column without a pivot or with smallest pivot)
  const rows = 5;
  const cols = 6;
  const pivotCols: number[] = [];
  let pivotRow = 0;

  for (let col = 0; col < cols && pivotRow < rows; col++) {
    // Find best row in this col
    let maxR = pivotRow;
    for (let r = pivotRow + 1; r < rows; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[maxR][col])) {
        maxR = r;
      }
    }
    if (Math.abs(M[maxR][col]) < 1e-8) {
      continue;
    }
    // Swap rows
    [M[pivotRow], M[maxR]] = [M[maxR], M[pivotRow]];
    pivotCols.push(col);

    // Normalize pivot row
    const pVal = M[pivotRow][col];
    for (let c = col; c < cols; c++) {
      M[pivotRow][c] /= pVal;
    }

    // Eliminate other rows
    for (let r = 0; r < rows; r++) {
      if (r !== pivotRow && Math.abs(M[r][col]) > 1e-12) {
        const factor = M[r][col];
        for (let c = col; c < cols; c++) {
          M[r][c] -= factor * M[pivotRow][c];
        }
      }
    }
    pivotRow++;
  }

  // Find a free column not in pivotCols (prefer 5 (F), then 0, 1, 2)
  let freeCol = -1;
  for (let c = cols - 1; c >= 0; c--) {
    if (!pivotCols.includes(c)) {
      freeCol = c;
      break;
    }
  }
  if (freeCol === -1) return null;

  // Normalized coefficients sol: sol[freeCol] = 1, sol[pivot] = -M[row][freeCol]
  const sol = new Array(cols).fill(0);
  sol[freeCol] = 1;
  for (let r = 0; r < pivotCols.length; r++) {
    const pCol = pivotCols[r];
    sol[pCol] = -M[r][freeCol];
  }

  const [tA, tB, tC, tD, tE, tF] = sol;

  // 4. Denormalize back to original coordinates (x, y)
  // u = s*(x - meanX), v = s*(y - meanY)
  // tA*u^2 + tB*u*v + tC*v^2 + tD*u + tE*v + tF = 0
  const s2 = s * s;
  const A = tA * s2;
  const B = tB * s2;
  const C = tC * s2;
  const D = s * tD - 2 * s2 * meanX * tA - s2 * meanY * tB;
  const E = s * tE - 2 * s2 * meanY * tC - s2 * meanX * tB;
  const F =
    tF -
    s * meanX * tD -
    s * meanY * tE +
    s2 * meanX * meanX * tA +
    s2 * meanX * meanY * tB +
    s2 * meanY * meanY * tC;

  // Normalize by maximum coefficient magnitude for clean numerical scale
  const maxCoeff = Math.max(
    Math.abs(A),
    Math.abs(B),
    Math.abs(C),
    Math.abs(D),
    Math.abs(E),
    Math.abs(F)
  );
  if (maxCoeff < 1e-12) return null;

  return [A / maxCoeff, B / maxCoeff, C / maxCoeff, D / maxCoeff, E / maxCoeff, F / maxCoeff];
}

// Ellipse parameters from 2 Foci (F1, F2) and 1 Point P on ellipse
export function getEllipse2Foci(F1: Point2D, F2: Point2D, P: Point2D) {
  const d1 = dist(P, F1);
  const d2 = dist(P, F2);
  const major2a = d1 + d2;
  let a = major2a / 2;
  const center = { x: (F1.x + F2.x) / 2, y: (F1.y + F2.y) / 2 };
  const c2 = dist(F1, F2);
  const c = c2 / 2;
  if (c < 1e-4) {
    // Foci coincide: circle of radius a
    return { center, a: Math.max(1, a), b: Math.max(1, a), angle: 0 };
  }
  // When a <= c (e.g. point P is on segment F1-F2 or focus moved outward), ensure b > 0 so ellipse does not disappear
  if (a <= c) {
    a = c + 1;
  }
  const b = Math.max(1, Math.sqrt(a * a - c * c));
  const angle = Math.atan2(F2.y - F1.y, F2.x - F1.x);
  return { center, a, b, angle };
}

// Parabola from Focus F and Directrix line (p1, p2)
export function getParabolaFocusDirectrix(F: Point2D, dP1: Point2D, dP2: Point2D) {
  const foot = projectPointToLine(F, dP1, dP2);
  const vertex = { x: (F.x + foot.x) / 2, y: (F.y + foot.y) / 2 };
  const p = Math.max(1, dist(F, foot)); // Distance from focus to directrix
  // Axis unit vector pointing from directrix to focus
  const axisDir = { x: (F.x - foot.x) / p, y: (F.y - foot.y) / p };
  const perpDir = { x: -axisDir.y, y: axisDir.x };
  return { vertex, p, axisDir, perpDir };
}

// Hyperbola parameters from 2 Foci and 1 Point P
export function getHyperbola2Foci(F1: Point2D, F2: Point2D, P: Point2D) {
  const d1 = dist(P, F1);
  const d2 = dist(P, F2);
  const major2a = Math.abs(d1 - d2);
  let a = major2a / 2;
  const c2 = dist(F1, F2);
  const c = c2 / 2;
  if (c < 1e-4) return null;
  // Hyperbola requires a < c
  if (a >= c) {
    a = Math.max(1, c - 1);
  }
  if (a < 1e-4) a = 1;
  const b = Math.max(1, Math.sqrt(c * c - a * a));
  const center = { x: (F1.x + F2.x) / 2, y: (F1.y + F2.y) / 2 };
  const angle = Math.atan2(F2.y - F1.y, F2.x - F1.x);
  return { center, a, b, angle };
}

// ----------------- Dynamic Geometry Reactive Solver -----------------

// Point in Polygon test (Ray casting algorithm)
export function pointInPolygon(p: Point2D, polygon: Point2D[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect = yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Auto-bind unlinked lines, polygons, circles, angles to existing points if coordinates match
export function autoBindSceneElements<T extends DynamicGeometryScene>(scene: T): T {
  const points = scene.points;
  const matchThreshold = 6;

  const findMatchingPointId = (pos: Point2D): string | undefined => {
    for (const pt of points) {
      if (dist(pos, pt) <= matchThreshold) return pt.id;
    }
    return undefined;
  };

  const lines = scene.lines.map((l) => {
    const p1Id = l.p1PointId || (l.dependsOn ? undefined : findMatchingPointId(l.p1));
    const p2Id = l.p2PointId || (l.dependsOn ? undefined : findMatchingPointId(l.p2));
    if (p1Id !== l.p1PointId || p2Id !== l.p2PointId) {
      return { ...l, p1PointId: p1Id, p2PointId: p2Id };
    }
    return l;
  });

  const polygons = scene.polygons.map((poly) => {
    if (!poly.pointIds || poly.pointIds.length !== poly.points.length) {
      const pointIds = poly.points.map((p) => findMatchingPointId(p));
      const allFound = pointIds.filter(Boolean).length === poly.points.length;
      return { ...poly, pointIds: allFound ? (pointIds as string[]) : poly.pointIds };
    }
    return poly;
  });

  const circles = scene.circles.map((c) => {
    if (c.dependsOn) return c; // Never auto-bind centers of dependent circles
    const cId = c.centerPointId || findMatchingPointId(c.center);
    if (cId !== c.centerPointId) {
      return { ...c, centerPointId: cId };
    }
    return c;
  });

  const angles = scene.angles.map((ang) => {
    const centerId = ang.centerPointId || findMatchingPointId(ang.center);
    const p1Id = ang.p1PointId || findMatchingPointId(ang.p1);
    const p2Id = ang.p2PointId || findMatchingPointId(ang.p2);
    if (centerId !== ang.centerPointId || p1Id !== ang.p1PointId || p2Id !== ang.p2PointId) {
      return { ...ang, centerPointId: centerId, p1PointId: p1Id, p2PointId: p2Id };
    }
    return ang;
  });

  const conics = (scene.conics || []).map((cn) => {
    let c = { ...cn };
    if (c.subType === 'ellipse-2foci-1pt' || c.subType === 'hyperbola-2foci-1pt') {
      if (!c.fociPointIds && c.foci) {
        const id1 = findMatchingPointId(c.foci[0]);
        const id2 = findMatchingPointId(c.foci[1]);
        if (id1 && id2) c.fociPointIds = [id1, id2];
      }
      if (!c.pointId && c.point) {
        const ptId = findMatchingPointId(c.point);
        if (ptId) c.pointId = ptId;
      }
    } else if (c.subType === 'parabola-focus-directrix') {
      if (!c.focusPointId && c.focus) {
        const fId = findMatchingPointId(c.focus);
        if (fId) c.focusPointId = fId;
      }
      if (!c.directrixPointIds && c.directrix) {
        const d1 = findMatchingPointId(c.directrix.p1);
        const d2 = findMatchingPointId(c.directrix.p2);
        if (d1 && d2) c.directrixPointIds = [d1, d2];
      }
    } else if (c.subType === '5-point' && (!c.points5Ids || c.points5Ids.length !== 5) && c.points5) {
      const ids = c.points5.map((p) => findMatchingPointId(p));
      if (ids.filter(Boolean).length === 5) {
        c.points5Ids = ids as string[];
      }
    }
    return c;
  });

  return {
    ...scene,
    lines,
    polygons,
    circles,
    angles,
    conics,
  };
}

// Update all dependent figures and points when a point moves
export function updateGeometryOnPointMove<T extends DynamicGeometryScene>(
  scene: T,
  movedPointId: string,
  newPos: Point2D
): T {
  // First ensure bindings
  const boundScene = autoBindSceneElements(scene);

  const pointMap = new Map<string, GeoPoint>();
  for (const pt of boundScene.points) {
    pointMap.set(pt.id, { ...pt });
  }

  const movedPt = pointMap.get(movedPointId);
  if (
    movedPt?.dependsOn &&
    movedPt.dependsOn.type !== 'point-on-path' &&
    movedPt.dependsOn.type !== 'point-on-segment'
  ) {
    return scene;
  }
  if (movedPt) {
    movedPt.x = newPos.x;
    movedPt.y = newPos.y;
  }

  const getCurrentCircleGeometry = (circle: GeoCircle): { center: Point2D; radius: number } => {
    const center = circle.centerPointId ? pointMap.get(circle.centerPointId) : undefined;
    const radiusPoint = circle.radiusPointId ? pointMap.get(circle.radiusPointId) : undefined;
    const parents = (circle.dependsOn?.parentPointIds || [])
      .map((id) => pointMap.get(id))
      .filter(Boolean) as GeoPoint[];

    if (parents.length >= 3) {
      const { type, vertex } = circle.dependsOn!;
      if (type === 'incircle') return getIncenter(parents[0], parents[1], parents[2]);
      if (type === 'excircle') return getExcenter(parents[0], parents[1], parents[2], vertex || 'A');
    }

    const currentCenter = center ? { x: center.x, y: center.y } : circle.center;
    return {
      center: currentCenter,
      radius: radiusPoint ? dist(currentCenter, radiusPoint) : circle.radius,
    };
  };

  // Recalculate dependent points with topological relaxation up to 10 passes
  for (let pass = 0; pass < 10; pass++) {
    let maxDelta = 0;
    for (const pt of pointMap.values()) {
      if (!pt.dependsOn) continue;
      const parents = (pt.dependsOn.parentPointIds || [])
        .map((pId) => pointMap.get(pId))
        .filter(Boolean) as GeoPoint[];

      let updatedPos: Point2D | null = null;
      const { type, vertex, angleDeg } = pt.dependsOn;

      if (type === 'centroid' && parents.length >= 3) {
        updatedPos = getCentroid(parents[0], parents[1], parents[2]);
      } else if (type === 'circumcenter' && parents.length >= 3) {
        const cc = getCircumcenter(parents[0], parents[1], parents[2]);
        if (cc) updatedPos = cc.center;
      } else if (type === 'orthocenter' && parents.length >= 3) {
        updatedPos = getOrthocenter(parents[0], parents[1], parents[2]);
      } else if (type === 'humpty' && parents.length >= 3) {
        updatedPos = getHumptyPoint(parents[0], parents[1], parents[2]);
      } else if (type === 'dumpty' && parents.length >= 3) {
        updatedPos = getDumptyPoint(parents[0], parents[1], parents[2]);
      } else if (type === 'incenter' && parents.length >= 3) {
        updatedPos = getIncenter(parents[0], parents[1], parents[2]).center;
      } else if (type === 'excenter' && parents.length >= 3) {
        updatedPos = getExcenter(parents[0], parents[1], parents[2], vertex || 'A').center;
      } else if (type === 'euler' && parents.length >= 3) {
        const ec = getNinePointCircle(parents[0], parents[1], parents[2]);
        if (ec) updatedPos = ec.center;
      } else if (type === 'feuerbach' && parents.length >= 3) {
        updatedPos = getFeuerbachPoint(parents[0], parents[1], parents[2]);
      } else if (type === 'lemoine' && parents.length >= 3) {
        updatedPos = getLemoinePoint(parents[0], parents[1], parents[2]);
      } else if (type === 'gergonne' && parents.length >= 3) {
        updatedPos = getGergonnePoint(parents[0], parents[1], parents[2]);
      } else if (type === 'nagel' && parents.length >= 3) {
        updatedPos = getNagelPoint(parents[0], parents[1], parents[2]);
      } else if (type === 'mixtilinear-incircle-touchpoint' && parents.length >= 3) {
        updatedPos = getMixtilinearIncircle(parents[0], parents[1], parents[2]).touchpoint;
      } else if (type === 'mixtilinear-excircle-touchpoint' && parents.length >= 3) {
        updatedPos = getMixtilinearExcircle(parents[0], parents[1], parents[2]).touchpoint;
      } else if (type === 'thebault-touchpoint' && parents.length >= 4) {
        updatedPos = getThebaultCircle(parents[0], parents[1], parents[2], parents[3])?.touchpoint || null;
      } else if (type === 'midpoint' && parents.length >= 2) {
        updatedPos = { x: (parents[0].x + parents[1].x) / 2, y: (parents[0].y + parents[1].y) / 2 };
      } else if (type === 'point-on-segment' && parents.length >= 2) {
        updatedPos = projectPointToSegment(pt, parents[0], parents[1]);
      } else if (type === 'circle-center' && pt.dependsOn.parentCircleIds?.length) {
        const c = boundScene.circles.find((it) => it.id === pt.dependsOn!.parentCircleIds![0]);
        if (c) {
          updatedPos = { x: c.center.x, y: c.center.y };
        }
      } else if (type === 'reflection') {
        if (parents.length >= 1 && pt.dependsOn.parentLineIds?.length) {
          const l = boundScene.lines.find((it) => it.id === pt.dependsOn!.parentLineIds![0]);
          if (l) {
            const lP1 = l.p1PointId && pointMap.has(l.p1PointId) ? pointMap.get(l.p1PointId)! : l.p1;
            const lP2 = l.p2PointId && pointMap.has(l.p2PointId) ? pointMap.get(l.p2PointId)! : l.p2;
            updatedPos = reflectPointAcrossLine(parents[0], lP1, lP2);
          }
        }
      } else if (type === 'dilation' && parents.length >= 2) {
        const k = pt.dependsOn.ratio ?? pt.dependsOn.dilationRatio ?? 2;
        updatedPos = dilatePoint(parents[0], parents[1], k);
      } else if (type === 'translation' && parents.length >= 3) {
        updatedPos = translatePoint(parents[0], parents[1], parents[2]);
      } else if (type === 'point-on-path') {
        if (pt.dependsOn.parentPointIds && pt.dependsOn.parentPointIds.length >= 2) {
          const center = pointMap.get(pt.dependsOn.parentPointIds[0]);
          const radiusPoint = pointMap.get(pt.dependsOn.parentPointIds[1]);
          if (center && radiusPoint) {
            updatedPos = projectPointToCircle(pt, center, dist(center, radiusPoint));
          }
        } else if (pt.dependsOn.parentLineIds?.length) {
          const l = boundScene.lines.find((it) => it.id === pt.dependsOn!.parentLineIds![0]);
          if (l) {
            const lP1 = l.p1PointId && pointMap.has(l.p1PointId) ? pointMap.get(l.p1PointId)! : l.p1;
            const lP2 = l.p2PointId && pointMap.has(l.p2PointId) ? pointMap.get(l.p2PointId)! : l.p2;
            updatedPos = l.isInfinite
              ? projectPointToLine(pt, lP1, lP2)
              : projectPointToSegment(pt, lP1, lP2);
          }
        } else if (pt.dependsOn.parentCircleIds?.length) {
          const c = boundScene.circles.find((it) => it.id === pt.dependsOn!.parentCircleIds![0]);
          if (c) {
            const cCenter = c.centerPointId && pointMap.has(c.centerPointId) ? pointMap.get(c.centerPointId)! : c.center;
            const cRadius = c.radiusPointId && pointMap.has(c.radiusPointId) ? dist(cCenter, pointMap.get(c.radiusPointId)!) : c.radius;
            updatedPos = projectPointToCircle(pt, cCenter, cRadius);
          }
        } else if (pt.dependsOn.parentPolygonIds?.length) {
          const polygon = boundScene.polygons.find((item) => item.id === pt.dependsOn!.parentPolygonIds![0]);
          if (polygon) {
            const currentPolygon = polygon.pointIds?.length === polygon.points.length
              ? {
                  ...polygon,
                  points: polygon.pointIds.map((id) => pointMap.get(id) ?? polygon.points[polygon.pointIds!.indexOf(id)]),
                }
              : polygon;
            updatedPos = projectPointToPolygon(pt, currentPolygon);
          }
        } else if (pt.dependsOn.parentConicIds?.length) {
          const conic = boundScene.conics?.find((item) => item.id === pt.dependsOn!.parentConicIds![0]);
          if (conic) updatedPos = projectPointToConic(pt, conic);
        }
      } else if (type === 'isogonal-conjugate' && parents.length >= 4) {
        updatedPos = getIsogonalConjugate(parents[0], parents[1], parents[2], parents[3]);
      } else if (type === 'isotomic-conjugate' && parents.length >= 4) {
        updatedPos = getIsotomicConjugate(parents[0], parents[1], parents[2], parents[3]);
      } else if (type === 'rotation' && parents.length >= 2) {
        const rad = ((angleDeg ?? 45) * Math.PI) / 180;
        updatedPos = rotatePoint(parents[0], parents[1], rad);
      } else if (type === 'inversion' && parents.length >= 1) {
        // Find inversion circle if available
        let invCircle: { center: Point2D; radius: number } | null = null;
        if (pt.dependsOn.parentCircleIds?.[0]) {
          const c = boundScene.circles.find((it) => it.id === pt.dependsOn!.parentCircleIds![0]);
          if (c) {
            const cCenter = c.centerPointId && pointMap.has(c.centerPointId) ? pointMap.get(c.centerPointId)! : c.center;
            const cRadius = c.radiusPointId && pointMap.has(c.radiusPointId) ? dist(cCenter, pointMap.get(c.radiusPointId)!) : c.radius;
            invCircle = { center: cCenter, radius: cRadius };
          }
        }
        if (!invCircle && parents.length >= 2) {
          invCircle = { center: parents[1], radius: 60 };
        }
        if (invCircle) {
          updatedPos = invertPoint(parents[0], invCircle);
        }
      } else if (type === 'pole-line') {
        if (pt.dependsOn.parentLineIds?.length && pt.dependsOn.parentCircleIds?.length) {
          const l = boundScene.lines.find((it) => it.id === pt.dependsOn!.parentLineIds![0]);
          const c = boundScene.circles.find((it) => it.id === pt.dependsOn!.parentCircleIds![0]);
          if (l && c) {
            const p1 = l.p1PointId && pointMap.has(l.p1PointId) ? pointMap.get(l.p1PointId)! : l.p1;
            const p2 = l.p2PointId && pointMap.has(l.p2PointId) ? pointMap.get(l.p2PointId)! : l.p2;
            const cCenter = c.centerPointId && pointMap.has(c.centerPointId) ? pointMap.get(c.centerPointId)! : c.center;
            const cRadius = c.radiusPointId && pointMap.has(c.radiusPointId) ? dist(cCenter, pointMap.get(c.radiusPointId)!) : c.radius;
            updatedPos = getPoleOfLine({ p1, p2 }, { center: cCenter, radius: cRadius });
          }
        }
      } else if (type === 'intersection') {
        if (pt.dependsOn.parentLineIds && pt.dependsOn.parentLineIds.length >= 2) {
          const l1 = boundScene.lines.find((l) => l.id === pt.dependsOn!.parentLineIds![0]);
          const l2 = boundScene.lines.find((l) => l.id === pt.dependsOn!.parentLineIds![1]);
          if (l1 && l2) {
            const p1 = l1.p1PointId && pointMap.has(l1.p1PointId) ? pointMap.get(l1.p1PointId)! : l1.p1;
            const p2 = l1.p2PointId && pointMap.has(l1.p2PointId) ? pointMap.get(l1.p2PointId)! : l1.p2;
            const q1 = l2.p1PointId && pointMap.has(l2.p1PointId) ? pointMap.get(l2.p1PointId)! : l2.p1;
            const q2 = l2.p2PointId && pointMap.has(l2.p2PointId) ? pointMap.get(l2.p2PointId)! : l2.p2;
            updatedPos = getLineLineIntersection(p1, p2, q1, q2, !l1.isInfinite, !l2.isInfinite);
          }
        } else if (pt.dependsOn.parentLineIds?.length && pt.dependsOn.parentCircleIds?.length) {
          const l = boundScene.lines.find((it) => it.id === pt.dependsOn!.parentLineIds![0]);
          const c = boundScene.circles.find((it) => it.id === pt.dependsOn!.parentCircleIds![0]);
          if (l && c) {
            const p1 = l.p1PointId && pointMap.has(l.p1PointId) ? pointMap.get(l.p1PointId)! : l.p1;
            const p2 = l.p2PointId && pointMap.has(l.p2PointId) ? pointMap.get(l.p2PointId)! : l.p2;
            const { center, radius } = getCurrentCircleGeometry(c);
            const isSegment = !l.isInfinite && c.dependsOn?.type !== 'excircle';
            const pts = getLineCircleIntersections(p1, p2, center, radius, isSegment);
            if (pts.length > 0) {
              const target = pt.dependsOn.initialPos || pt;
              updatedPos = pts.reduce((best, cur) => (dist(cur, target) < dist(best, target) ? cur : best), pts[0]);
              pt.dependsOn.initialPos = updatedPos;
            }
          }
        } else if (pt.dependsOn.parentCircleIds && pt.dependsOn.parentCircleIds.length >= 2) {
          const c1 = boundScene.circles.find((it) => it.id === pt.dependsOn!.parentCircleIds![0]);
          const c2 = boundScene.circles.find((it) => it.id === pt.dependsOn!.parentCircleIds![1]);
          if (c1 && c2) {
            const c1Center = c1.centerPointId && pointMap.has(c1.centerPointId) ? pointMap.get(c1.centerPointId)! : c1.center;
            const c1Radius = c1.radiusPointId && pointMap.has(c1.radiusPointId) ? dist(c1Center, pointMap.get(c1.radiusPointId)!) : c1.radius;
            const c2Center = c2.centerPointId && pointMap.has(c2.centerPointId) ? pointMap.get(c2.centerPointId)! : c2.center;
            const c2Radius = c2.radiusPointId && pointMap.has(c2.radiusPointId) ? dist(c2Center, pointMap.get(c2.radiusPointId)!) : c2.radius;
            const pts = getCircleCircleIntersections(c1Center, c1Radius, c2Center, c2Radius);
            if (pts.length > 0) {
              const target = pt.dependsOn.initialPos || pt;
              updatedPos = pts.reduce((best, cur) => (dist(cur, target) < dist(best, target) ? cur : best), pts[0]);
              pt.dependsOn.initialPos = updatedPos;
            }
          }
        }
      }

      if (updatedPos) {
        const dx = Math.abs(pt.x - updatedPos.x);
        const dy = Math.abs(pt.y - updatedPos.y);
        if (dx > maxDelta) maxDelta = dx;
        if (dy > maxDelta) maxDelta = dy;
        pt.x = updatedPos.x;
        pt.y = updatedPos.y;
      }
    }
    if (maxDelta < 1e-14) break;
  }

  // Update lines and circles with multi-pass resolution (for inversion, radical axis, polar lines)
  let updatedLines = [...boundScene.lines];
  let updatedCircles = [...boundScene.circles];

  for (let cycle = 0; cycle < 4; cycle++) {
    // 1. Update lines
    updatedLines = updatedLines.map((line) => {
      const newLine = { ...line };

      if (newLine.dependsOn) {
        const parents = (newLine.dependsOn.parentPointIds || [])
          .map((pId) => pointMap.get(pId))
          .filter(Boolean) as GeoPoint[];

        if (newLine.dependsOn.type === 'euler-line' && parents.length >= 3) {
          const O = getCircumcenter(parents[0], parents[1], parents[2]);
          const H = getOrthocenter(parents[0], parents[1], parents[2]);
          if (O && H) {
            newLine.p1 = O.center;
            newLine.p2 = H;
          }
        } else if (newLine.dependsOn.type === 'perpendicular-bisector' && parents.length >= 2) {
          const pb = perpendicularBisector(parents[0], parents[1], 1000);
          newLine.p1 = pb.p1;
          newLine.p2 = pb.p2;
        } else if (
          (newLine.dependsOn.type === 'angle-bisector-in' || newLine.dependsOn.type === 'angle-bisector-out') &&
          parents.length >= 3
        ) {
          const isExt = newLine.dependsOn.type === 'angle-bisector-out';
          const bis = getAngleBisector(parents[0], parents[1], parents[2], isExt, 800);
          newLine.p1 = bis.p1;
          newLine.p2 = bis.p2;
        } else if (newLine.dependsOn.type === 'isogonal-line' && parents.length >= 4) {
          const iso = getIsogonalLine(parents[0], parents[1], parents[2], parents[3], 1500);
          newLine.p1 = iso.p1;
          newLine.p2 = iso.p2;
        } else if (newLine.dependsOn.type === 'polar-line' && parents.length >= 1) {
          let cCenter = parents.length >= 2 ? parents[1] : { x: parents[0].x + 50, y: parents[0].y + 50 };
          let cRadius = 80;
          if (newLine.dependsOn.parentCircleIds?.[0]) {
            const c = updatedCircles.find((it) => it.id === newLine.dependsOn!.parentCircleIds![0]) || boundScene.circles.find((it) => it.id === newLine.dependsOn!.parentCircleIds![0]);
            if (c) {
              cCenter = c.center;
              cRadius = c.radius;
            }
          }
          const polar = getPolarLine(parents[0], { center: cCenter, radius: cRadius });
          if (polar) {
            newLine.p1 = polar.p1;
            newLine.p2 = polar.p2;
          }
        } else if (newLine.dependsOn.type === 'radical-axis' && newLine.dependsOn.parentCircleIds?.length && newLine.dependsOn.parentCircleIds.length >= 2) {
          const c1 = updatedCircles.find((it) => it.id === newLine.dependsOn!.parentCircleIds![0]) || boundScene.circles.find((it) => it.id === newLine.dependsOn!.parentCircleIds![0]);
          const c2 = updatedCircles.find((it) => it.id === newLine.dependsOn!.parentCircleIds![1]) || boundScene.circles.find((it) => it.id === newLine.dependsOn!.parentCircleIds![1]);
          if (c1 && c2) {
            const ra = getRadicalAxis(c1, c2);
            if (ra) {
              newLine.p1 = ra.p1;
              newLine.p2 = ra.p2;
            }
          }
        } else if (newLine.dependsOn.type === 'perpendicular-line' && parents.length >= 1 && newLine.dependsOn.parentLineIds?.length) {
          const refLine = updatedLines.find((l) => l.id === newLine.dependsOn!.parentLineIds![0]) || boundScene.lines.find((l) => l.id === newLine.dependsOn!.parentLineIds![0]);
          if (refLine) {
            const perp = getPerpendicularLine(parents[0], refLine.p1, refLine.p2);
            newLine.p1 = perp.p1;
            newLine.p2 = perp.p2;
          }
        } else if (newLine.dependsOn.type === 'parallel-line' && parents.length >= 1 && newLine.dependsOn.parentLineIds?.length) {
          const refLine = updatedLines.find((l) => l.id === newLine.dependsOn!.parentLineIds![0]) || boundScene.lines.find((l) => l.id === newLine.dependsOn!.parentLineIds![0]);
          if (refLine) {
            const par = getParallelLine(parents[0], refLine.p1, refLine.p2);
            newLine.p1 = par.p1;
            newLine.p2 = par.p2;
          }
        } else if (newLine.dependsOn.type === 'tangent' && parents.length >= 1 && newLine.dependsOn.parentCircleIds?.length) {
          const refCirc = updatedCircles.find((c) => c.id === newLine.dependsOn!.parentCircleIds![0]) || boundScene.circles.find((c) => c.id === newLine.dependsOn!.parentCircleIds![0]);
          if (refCirc) {
            const tangents = getCircleTangents(parents[0], refCirc);
            const idx = newLine.dependsOn.tangentIndex || 0;
            if (tangents[idx]) {
              newLine.p1 = tangents[idx].p1;
              newLine.p2 = tangents[idx].p2;
              newLine.hidden = false;
            } else {
              newLine.hidden = true;
            }
          }
        } else if (newLine.dependsOn.type === 'reflection' && newLine.dependsOn.parentLineIds && newLine.dependsOn.parentLineIds.length >= 2) {
          const targetL = updatedLines.find((l) => l.id === newLine.dependsOn!.parentLineIds![0]);
          const mirrorL = updatedLines.find((l) => l.id === newLine.dependsOn!.parentLineIds![1]);
          if (targetL && mirrorL) {
            newLine.p1 = reflectPointAcrossLine(targetL.p1, mirrorL.p1, mirrorL.p2);
            newLine.p2 = reflectPointAcrossLine(targetL.p2, mirrorL.p1, mirrorL.p2);
          }
        } else if (newLine.dependsOn.type === 'dilation' && parents.length >= 1 && newLine.dependsOn.parentLineIds?.length) {
          const targetL = updatedLines.find((l) => l.id === newLine.dependsOn!.parentLineIds![0]);
          const k = newLine.dependsOn.ratio ?? newLine.dependsOn.dilationRatio ?? 2;
          if (targetL) {
            newLine.p1 = dilatePoint(targetL.p1, parents[0], k);
            newLine.p2 = dilatePoint(targetL.p2, parents[0], k);
          }
        } else if (newLine.dependsOn.type === 'translation' && parents.length >= 2 && newLine.dependsOn.parentLineIds?.length) {
          const targetL = updatedLines.find((l) => l.id === newLine.dependsOn!.parentLineIds![0]);
          if (targetL) {
            const delta = { x: parents[1].x - parents[0].x, y: parents[1].y - parents[0].y };
            newLine.p1 = { x: targetL.p1.x + delta.x, y: targetL.p1.y + delta.y };
            newLine.p2 = { x: targetL.p2.x + delta.x, y: targetL.p2.y + delta.y };
          }
        } else if (newLine.dependsOn.type === 'inversion') {
          if (newLine.dependsOn.parentCircleIds?.length && newLine.dependsOn.parentCircleIds.length >= 2) {
            const cTarget = updatedCircles.find((it) => it.id === newLine.dependsOn!.parentCircleIds![0]) || boundScene.circles.find((it) => it.id === newLine.dependsOn!.parentCircleIds![0]);
            const cInv = updatedCircles.find((it) => it.id === newLine.dependsOn!.parentCircleIds![1]) || boundScene.circles.find((it) => it.id === newLine.dependsOn!.parentCircleIds![1]);
            if (cTarget && cInv) {
              const res = invertCircle(cTarget, cInv);
              if (res && res.type === 'line') {
                newLine.p1 = res.p1;
                newLine.p2 = res.p2;
              }
            }
          } else if (newLine.dependsOn.parentLineIds?.length && newLine.dependsOn.parentCircleIds?.length) {
            const lTarget = boundScene.lines.find((it) => it.id === newLine.dependsOn!.parentLineIds![0]);
            const cInv = updatedCircles.find((it) => it.id === newLine.dependsOn!.parentCircleIds![0]) || boundScene.circles.find((it) => it.id === newLine.dependsOn!.parentCircleIds![0]);
            if (lTarget && cInv) {
              const res = invertLine(lTarget, cInv);
              if (res && res.type === 'line') {
                newLine.p1 = res.p1;
                newLine.p2 = res.p2;
              }
            }
          }
        }
      }

      if (newLine.p1PointId && pointMap.has(newLine.p1PointId)) {
        const p = pointMap.get(newLine.p1PointId)!;
        newLine.p1 = { x: p.x, y: p.y };
      }
      if (newLine.p2PointId && pointMap.has(newLine.p2PointId)) {
        const p = pointMap.get(newLine.p2PointId)!;
        newLine.p2 = { x: p.x, y: p.y };
      }

      return newLine;
    });

    // 2. Update circles
    updatedCircles = updatedCircles.map((circ) => {
      const newCirc = { ...circ };

      if (newCirc.dependsOn) {
        const parents = (newCirc.dependsOn.parentPointIds || [])
          .map((pId) => pointMap.get(pId))
          .filter(Boolean) as GeoPoint[];
        const { type, vertex } = newCirc.dependsOn;

        if (type === 'circumcircle' && parents.length >= 3) {
          const cc = getCircumcenter(parents[0], parents[1], parents[2]);
          if (cc) {
            newCirc.center = cc.center;
            newCirc.radius = cc.radius;
          }
        } else if (type === 'incircle' && parents.length >= 3) {
          const inc = getIncenter(parents[0], parents[1], parents[2]);
          newCirc.center = inc.center;
          newCirc.radius = inc.radius;
        } else if (type === 'excircle' && parents.length >= 3) {
          const exc = getExcenter(parents[0], parents[1], parents[2], vertex || 'A');
          newCirc.center = exc.center;
          newCirc.radius = exc.radius;
        } else if (type === 'euler-circle' && parents.length >= 3) {
          const ec = getNinePointCircle(parents[0], parents[1], parents[2]);
          if (ec) {
            newCirc.center = ec.center;
            newCirc.radius = ec.radius;
          }
        } else if (type === 'mixtilinear-incircle' && parents.length >= 3) {
          const mix = getMixtilinearIncircle(parents[0], parents[1], parents[2]);
          newCirc.center = mix.center;
          newCirc.radius = mix.radius;
        } else if (type === 'mixtilinear-excircle' && parents.length >= 3) {
          const mixEx = getMixtilinearExcircle(parents[0], parents[1], parents[2]);
          newCirc.center = mixEx.center;
          newCirc.radius = mixEx.radius;
        } else if (type === 'thebault-circle' && parents.length >= 4) {
          const thebault = getThebaultCircle(parents[0], parents[1], parents[2], parents[3]);
          if (thebault) {
            newCirc.center = thebault.center;
            newCirc.radius = thebault.radius;
          }
        } else if (type === 'circle-3points' && parents.length >= 3) {
          const cc = getCircumcenter(parents[0], parents[1], parents[2]);
          if (cc) {
            newCirc.center = cc.center;
            newCirc.radius = cc.radius;
          }
        } else if (type === 'center-point' && parents.length >= 2) {
          newCirc.center = { x: parents[0].x, y: parents[0].y };
          newCirc.radius = dist(parents[0], parents[1]);
        } else if (type === 'reflection' && newCirc.dependsOn.parentCircleIds?.length && newCirc.dependsOn.parentLineIds?.length) {
          const targetC = updatedCircles.find((c) => c.id === newCirc.dependsOn!.parentCircleIds![0]);
          const mirrorL = updatedLines.find((l) => l.id === newCirc.dependsOn!.parentLineIds![0]);
          if (targetC && mirrorL) {
            newCirc.center = reflectPointAcrossLine(targetC.center, mirrorL.p1, mirrorL.p2);
            newCirc.radius = targetC.radius;
          }
        } else if (type === 'dilation' && parents.length >= 1 && newCirc.dependsOn.parentCircleIds?.length) {
          const targetC = updatedCircles.find((c) => c.id === newCirc.dependsOn!.parentCircleIds![0]);
          const k = newCirc.dependsOn.ratio ?? newCirc.dependsOn.dilationRatio ?? 2;
          if (targetC) {
            newCirc.center = dilatePoint(targetC.center, parents[0], k);
            newCirc.radius = Math.abs(k) * targetC.radius;
          }
        } else if (type === 'translation' && parents.length >= 2 && newCirc.dependsOn.parentCircleIds?.length) {
          const targetC = updatedCircles.find((c) => c.id === newCirc.dependsOn!.parentCircleIds![0]);
          if (targetC) {
            newCirc.center = {
              x: targetC.center.x + parents[1].x - parents[0].x,
              y: targetC.center.y + parents[1].y - parents[0].y,
            };
            newCirc.radius = targetC.radius;
          }
        } else if (type === 'inversion') {
          if (newCirc.dependsOn.parentCircleIds && newCirc.dependsOn.parentCircleIds.length >= 2) {
            const targetCirc = updatedCircles.find((it) => it.id === newCirc.dependsOn!.parentCircleIds![0]) || boundScene.circles.find((it) => it.id === newCirc.dependsOn!.parentCircleIds![0]);
            const invCirc = updatedCircles.find((it) => it.id === newCirc.dependsOn!.parentCircleIds![1]) || boundScene.circles.find((it) => it.id === newCirc.dependsOn!.parentCircleIds![1]);
            if (targetCirc && invCirc) {
              const res = invertCircle(targetCirc, invCirc);
              if (res && res.type === 'circle') {
                newCirc.center = res.center;
                newCirc.radius = res.radius;
              }
            }
          } else if (newCirc.dependsOn.parentLineIds?.length && newCirc.dependsOn.parentCircleIds?.length) {
            const l = updatedLines.find((it) => it.id === newCirc.dependsOn!.parentLineIds![0]) || boundScene.lines.find((it) => it.id === newCirc.dependsOn!.parentLineIds![0]);
            const invCirc = updatedCircles.find((it) => it.id === newCirc.dependsOn!.parentCircleIds![0]) || boundScene.circles.find((it) => it.id === newCirc.dependsOn!.parentCircleIds![0]);
            if (l && invCirc) {
              const res = invertLine(l, invCirc);
              if (res && res.type === 'circle') {
                newCirc.center = res.center;
                newCirc.radius = res.radius;
              }
            }
          }
        }
      }

      // Only update non-dependent circle center if bound to a point
      if (!newCirc.dependsOn && newCirc.centerPointId && pointMap.has(newCirc.centerPointId)) {
        const p = pointMap.get(newCirc.centerPointId)!;
        newCirc.center = { x: p.x, y: p.y };
      }
      if (newCirc.radiusPointId && pointMap.has(newCirc.radiusPointId)) {
        const p = pointMap.get(newCirc.radiusPointId)!;
        newCirc.radius = dist(newCirc.center, p);
      }

      return newCirc;
    });
    // Resolve intersections before the next pass so dependent lines and circles
    // can consume the refreshed point positions.
    for (const point of pointMap.values()) {
    if (point.dependsOn?.type !== 'intersection') continue;

    const lineIds = point.dependsOn.parentLineIds || [];
    const circleIds = point.dependsOn.parentCircleIds || [];
    let intersections: Point2D[] = [];

    if (lineIds.length >= 2) {
      const firstLine = updatedLines.find((line) => line.id === lineIds[0]);
      const secondLine = updatedLines.find((line) => line.id === lineIds[1]);
      if (firstLine && secondLine) {
        const p1 = firstLine.p1PointId ? pointMap.get(firstLine.p1PointId) || firstLine.p1 : firstLine.p1;
        const p2 = firstLine.p2PointId ? pointMap.get(firstLine.p2PointId) || firstLine.p2 : firstLine.p2;
        const q1 = secondLine.p1PointId ? pointMap.get(secondLine.p1PointId) || secondLine.p1 : secondLine.p1;
        const q2 = secondLine.p2PointId ? pointMap.get(secondLine.p2PointId) || secondLine.p2 : secondLine.p2;
        const intersection = getLineLineIntersection(
          p1,
          p2,
          q1,
          q2,
          !firstLine.isInfinite,
          !secondLine.isInfinite
        );
        if (intersection) intersections = [intersection];
      }
    } else if (lineIds.length && circleIds.length) {
      const line = updatedLines.find((item) => item.id === lineIds[0]);
      const circle = updatedCircles.find((item) => item.id === circleIds[0]);
      if (line && circle) {
        const p1 = line.p1PointId ? pointMap.get(line.p1PointId) || line.p1 : line.p1;
        const p2 = line.p2PointId ? pointMap.get(line.p2PointId) || line.p2 : line.p2;
        const { center, radius } = getCurrentCircleGeometry(circle);
        intersections = getLineCircleIntersections(p1, p2, center, radius, !line.isInfinite);
      }
    } else if (circleIds.length >= 2) {
      const firstCircle = updatedCircles.find((circle) => circle.id === circleIds[0]);
      const secondCircle = updatedCircles.find((circle) => circle.id === circleIds[1]);
      if (firstCircle && secondCircle) {
        const first = getCurrentCircleGeometry(firstCircle);
        const second = getCurrentCircleGeometry(secondCircle);
        intersections = getCircleCircleIntersections(first.center, first.radius, second.center, second.radius);
      }
    }

    if (intersections.length === 0) {
      point.hidden = true;
      continue;
    }

    const target = point.dependsOn.initialPos || point;
    const nextPosition = intersections.reduce(
      (best, candidate) => dist(candidate, target) < dist(best, target) ? candidate : best,
      intersections[0]
    );
    point.x = nextPosition.x;
    point.y = nextPosition.y;
    point.hidden = false;
    point.dependsOn.initialPos = nextPosition;
    }
  }

  updatedLines = updatedLines.map((line) => {
    if (line.dependsOn?.type !== 'tangent' || !line.dependsOn.parentPointIds?.length || !line.dependsOn.parentCircleIds?.length) {
      return line;
    }
    const sourcePoint = pointMap.get(line.dependsOn.parentPointIds[0]);
    const circle = updatedCircles.find((item) => item.id === line.dependsOn!.parentCircleIds![0]);
    if (!sourcePoint || sourcePoint.hidden || !circle) return { ...line, hidden: true };

    const tangents = getCircleTangents(sourcePoint, circle);
    const tangent = tangents[line.dependsOn.tangentIndex || 0];
    return tangent
      ? { ...line, p1: tangent.p1, p2: tangent.p2, hidden: false }
      : { ...line, hidden: true };
  });

  // Update polygons
  const updatedPolygons = boundScene.polygons.map((poly) => {
    const newPoly = { ...poly };
    if (newPoly.dependsOn?.type === 'reflection' && newPoly.dependsOn.parentPolygonIds?.length && newPoly.dependsOn.parentLineIds?.length) {
      const sourcePoly = boundScene.polygons.find((p) => p.id === newPoly.dependsOn!.parentPolygonIds![0]);
      const mirrorL = updatedLines.find((l) => l.id === newPoly.dependsOn!.parentLineIds![0]);
      if (sourcePoly && mirrorL) {
        newPoly.points = sourcePoly.points.map((pt) => reflectPointAcrossLine(pt, mirrorL.p1, mirrorL.p2));
      }
    } else if (newPoly.dependsOn?.type === 'dilation' && newPoly.dependsOn.parentPolygonIds?.length && newPoly.dependsOn.parentPointIds?.length) {
      const sourcePoly = boundScene.polygons.find((p) => p.id === newPoly.dependsOn!.parentPolygonIds![0]);
      const centerPt = pointMap.get(newPoly.dependsOn.parentPointIds[0]);
      const k = newPoly.dependsOn.ratio ?? newPoly.dependsOn.dilationRatio ?? 2;
      if (sourcePoly && centerPt) {
        const sourcePoints = sourcePoly.pointIds?.length === sourcePoly.points.length
          ? sourcePoly.pointIds.map((id, index) => pointMap.get(id) || sourcePoly.points[index])
          : sourcePoly.points;
        newPoly.points = sourcePoints.map((pt) => dilatePoint(pt, centerPt, k));
      }
    } else if (
      newPoly.dependsOn?.type === 'translation' &&
      newPoly.dependsOn.parentPolygonIds?.length &&
      newPoly.dependsOn.parentPointIds &&
      newPoly.dependsOn.parentPointIds.length >= 2
    ) {
      const sourcePoly = boundScene.polygons.find((p) => p.id === newPoly.dependsOn!.parentPolygonIds![0]);
      const from = pointMap.get(newPoly.dependsOn.parentPointIds[0]);
      const to = pointMap.get(newPoly.dependsOn.parentPointIds[1]);
      if (sourcePoly && from && to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const sourcePoints = sourcePoly.pointIds?.length === sourcePoly.points.length
          ? sourcePoly.pointIds.map((id, index) => pointMap.get(id) || sourcePoly.points[index])
          : sourcePoly.points;
        newPoly.points = sourcePoints.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
      }
    } else if (newPoly.pointIds && newPoly.pointIds.length === newPoly.points.length) {
      newPoly.points = newPoly.pointIds.map((ptId, idx) => {
        const pt = pointMap.get(ptId);
        return pt ? { x: pt.x, y: pt.y } : newPoly.points[idx];
      });
    }
    return newPoly;
  });

  // Update angles
  const updatedAngles = boundScene.angles.map((ang) => {
    const newAng = { ...ang };
    const transform = newAng.dependsOn;
    if (transform?.type === 'circumcircular-arc' && transform.parentPointIds?.length === 3) {
      const [a, b, c] = transform.parentPointIds.map((id) => pointMap.get(id));
      if (a && b && c) {
        const circle = getCircumcenter(a, b, c);
        if (circle) {
          newAng.center = circle.center;
          newAng.radius = circle.radius;
          newAng.p1 = { x: a.x, y: a.y };
          newAng.p2 = { x: c.x, y: c.y };
          newAng.throughPoint = { x: b.x, y: b.y };
        }
      }
    } else if (transform?.type === 'centered-arc' && transform.parentPointIds?.length === 3) {
      const [center, radiusPoint, endPoint] = transform.parentPointIds.map((id) => pointMap.get(id));
      if (center && radiusPoint && endPoint) {
        const radius = dist(center, radiusPoint);
        newAng.center = { x: center.x, y: center.y };
        newAng.p1 = { x: radiusPoint.x, y: radiusPoint.y };
        newAng.p2 = projectPointToCircle(endPoint, center, radius);
        newAng.radius = radius;
      }
    } else if (
      transform?.parentAngleIds?.length &&
      transform.parentPointIds?.length &&
      (transform.type === 'dilation' || transform.parentPointIds.length >= 2)
    ) {
      const source = boundScene.angles.find((candidate) => candidate.id === transform.parentAngleIds![0]);
      const from = pointMap.get(transform.parentPointIds[0]);
      const to = pointMap.get(transform.parentPointIds[1]);
      if (source && from && (transform.type === 'dilation' || to)) {
        const sourceCenterPoint = source.centerPointId ? pointMap.get(source.centerPointId) : undefined;
        const sourceP1Point = source.p1PointId ? pointMap.get(source.p1PointId) : undefined;
        const sourceCenterPos = sourceCenterPoint || source.center;
        const sourceRadius = sourceP1Point ? dist(sourceCenterPos, sourceP1Point) : source.radius;
        if (transform.type === 'translation') {
          if (!to) return newAng;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const sourceP1 = sourceP1Point;
          const sourceP2 = source.p2PointId ? pointMap.get(source.p2PointId) : undefined;
          newAng.center = { x: (sourceCenterPoint?.x ?? source.center.x) + dx, y: (sourceCenterPoint?.y ?? source.center.y) + dy };
          newAng.p1 = { x: (sourceP1?.x ?? source.p1.x) + dx, y: (sourceP1?.y ?? source.p1.y) + dy };
          newAng.p2 = { x: (sourceP2?.x ?? source.p2.x) + dx, y: (sourceP2?.y ?? source.p2.y) + dy };
        } else {
          const k = transform.ratio ?? transform.dilationRatio ?? 2;
          newAng.center = dilatePoint(sourceCenterPos, from, k);
          newAng.p1 = dilatePoint(source.p1PointId && pointMap.get(source.p1PointId) || source.p1, from, k);
          newAng.p2 = dilatePoint(source.p2PointId && pointMap.get(source.p2PointId) || source.p2, from, k);
          newAng.radius = Math.abs(k) * sourceRadius;
        }
        if (source.throughPoint && to) {
          newAng.throughPoint = transform.type === 'translation'
            ? { x: source.throughPoint.x + to.x - from.x, y: source.throughPoint.y + to.y - from.y }
            : dilatePoint(source.throughPoint, from, transform.ratio ?? transform.dilationRatio ?? 2);
        }
      }
    }
    if (newAng.throughPointId && pointMap.has(newAng.throughPointId)) {
      const point = pointMap.get(newAng.throughPointId)!;
      newAng.throughPoint = { x: point.x, y: point.y };
    }
    if (newAng.centerPointId && pointMap.has(newAng.centerPointId)) {
      const p = pointMap.get(newAng.centerPointId)!;
      newAng.center = { x: p.x, y: p.y };
    }
    if (newAng.p1PointId && pointMap.has(newAng.p1PointId)) {
      const p = pointMap.get(newAng.p1PointId)!;
      newAng.p1 = { x: p.x, y: p.y };
    }
    if (newAng.p2PointId && pointMap.has(newAng.p2PointId)) {
      const p = pointMap.get(newAng.p2PointId)!;
      newAng.p2 = { x: p.x, y: p.y };
    }

    const dBA = dist(newAng.center, newAng.p1);
    const dBC = dist(newAng.center, newAng.p2);
    const dAC = dist(newAng.p1, newAng.p2);
    if (dBA > 0 && dBC > 0) {
      const cosB = Math.max(-1, Math.min(1, (dBA * dBA + dBC * dBC - dAC * dAC) / (2 * dBA * dBC)));
      const deg = Math.round((Math.acos(cosB) * 180) / Math.PI);
      newAng.angleDeg = deg;
      if (newAng.label && newAng.label.includes('°')) {
        newAng.label = `${deg}°`;
      }
    }
    return newAng;
  });

  // Update conics
  const updatedConics = (boundScene.conics || []).map((conic) => {
    const newConic = { ...conic };
    const transform = newConic.dependsOn;
    if (
      transform?.parentConicIds?.length &&
      transform.parentPointIds.length &&
      (transform.type === 'dilation' || transform.parentPointIds.length >= 2)
    ) {
      const source = (boundScene.conics || []).find((candidate) => candidate.id === transform.parentConicIds![0]);
      const from = pointMap.get(transform.parentPointIds[0]);
      const to = pointMap.get(transform.parentPointIds[1]);
      if (source && from && (transform.type === 'dilation' || to)) {
        const sourceFoci = source.fociPointIds?.map((id) => pointMap.get(id));
        const sourcePoints5 = source.points5Ids?.map((id) => pointMap.get(id));
        const sourceGeometry: GeoConic = {
          ...source,
          foci: sourceFoci?.length === 2 && sourceFoci[0] && sourceFoci[1]
            ? [sourceFoci[0], sourceFoci[1]]
            : source.foci,
          focus: source.focusPointId ? pointMap.get(source.focusPointId) || source.focus : source.focus,
          directrix: source.directrixPointIds
            ? {
                p1: pointMap.get(source.directrixPointIds[0]) || source.directrix?.p1 || { x: 0, y: 0 },
                p2: pointMap.get(source.directrixPointIds[1]) || source.directrix?.p2 || { x: 0, y: 0 },
              }
            : source.directrix,
          point: source.pointId ? pointMap.get(source.pointId) || source.point : source.point,
          points5: sourcePoints5?.every((point): point is GeoPoint => Boolean(point))
            ? sourcePoints5
            : source.points5,
        };
        const transformPoint = (point: Point2D) => transform.type === 'translation'
          ? { x: point.x + (to?.x ?? from.x) - from.x, y: point.y + (to?.y ?? from.y) - from.y }
          : dilatePoint(point, from, transform.ratio ?? transform.dilationRatio ?? 2);
        if (sourceGeometry.foci) newConic.foci = [transformPoint(sourceGeometry.foci[0]), transformPoint(sourceGeometry.foci[1])];
        if (sourceGeometry.focus) newConic.focus = transformPoint(sourceGeometry.focus);
        if (sourceGeometry.directrix) newConic.directrix = {
          p1: transformPoint(sourceGeometry.directrix.p1),
          p2: transformPoint(sourceGeometry.directrix.p2),
        };
        if (sourceGeometry.point) newConic.point = transformPoint(sourceGeometry.point);
        if (sourceGeometry.points5) newConic.points5 = sourceGeometry.points5.map(transformPoint);
        if (newConic.points5) {
          const coeffs = fitConic5Points(newConic.points5);
          if (coeffs) newConic.coefficients = coeffs;
        }
      }
    } else if (newConic.subType === 'ellipse-2foci-1pt' || newConic.subType === 'hyperbola-2foci-1pt') {
      if (newConic.fociPointIds && newConic.fociPointIds.length >= 2) {
        const f1 = pointMap.get(newConic.fociPointIds[0]);
        const f2 = pointMap.get(newConic.fociPointIds[1]);
        if (f1 && f2) newConic.foci = [{ x: f1.x, y: f1.y }, { x: f2.x, y: f2.y }];
      }
      if (newConic.pointId && pointMap.has(newConic.pointId)) {
        const pt = pointMap.get(newConic.pointId)!;
        newConic.point = { x: pt.x, y: pt.y };
      }
    } else if (newConic.subType === 'parabola-focus-directrix') {
      if (newConic.focusPointId && pointMap.has(newConic.focusPointId)) {
        const f = pointMap.get(newConic.focusPointId)!;
        newConic.focus = { x: f.x, y: f.y };
      }
      if (newConic.directrixPointIds && newConic.directrixPointIds.length >= 2) {
        const d1 = pointMap.get(newConic.directrixPointIds[0]);
        const d2 = pointMap.get(newConic.directrixPointIds[1]);
        if (d1 && d2) newConic.directrix = { p1: { x: d1.x, y: d1.y }, p2: { x: d2.x, y: d2.y } };
      }
    } else if (newConic.subType === '5-point') {
      if (newConic.points5Ids && newConic.points5Ids.length === 5) {
        const pts = newConic.points5Ids.map((id) => pointMap.get(id)).filter(Boolean) as GeoPoint[];
        if (pts.length === 5) {
          newConic.points5 = pts.map((p) => ({ x: p.x, y: p.y }));
          const coeffs = fitConic5Points(newConic.points5);
          if (coeffs) newConic.coefficients = coeffs;
        }
      }
    }
    return newConic;
  });

  // Intermediate scene for locus calculation
  const intermediateScene: DynamicGeometryScene = {
    ...boundScene,
    points: Array.from(pointMap.values()),
    lines: updatedLines,
    polygons: updatedPolygons,
    circles: updatedCircles,
    angles: updatedAngles,
    conics: updatedConics,
  };

  // Update loci curves if any
  const updatedLoci = (boundScene.loci || []).map((loc) => {
    // Only recalculate if driver point or scene changed, and not currently simulating driver point itself
    if (movedPointId !== loc.driverPointId) {
      const samples = calculateLocusSamples(
        intermediateScene,
        loc.dependentPointId,
        loc.driverPointId,
        loc.pathParentId
      );
      return { ...loc, samples };
    }
    return loc;
  });

  return {
    ...intermediateScene,
    loci: updatedLoci,
  } as T;
}

// Calculate samples for dynamic locus curve
export function calculateLocusSamples<T extends DynamicGeometryScene>(
  scene: T,
  dependentPointId: string,
  driverPointId: string,
  pathParentId?: string,
  numSamples = 128
): Point2D[] {
  const driverPt = scene.points.find((p) => p.id === driverPointId);
  const depPt = scene.points.find((p) => p.id === dependentPointId);
  if (!driverPt || !depPt) return [];

  // Prefer the driver's explicit path binding to avoid sampling an overlapping object.
  let pathCircle: GeoCircle | undefined;
  let pathLine: GeoLine | undefined;

  if (pathParentId) {
    pathCircle = scene.circles.find((c) => c.id === pathParentId);
    pathLine = scene.lines.find((l) => l.id === pathParentId);
  }
  if (!pathCircle && !pathLine && driverPt.dependsOn?.type === 'point-on-path') {
    const pointPath = driverPt.dependsOn;
    pathLine = pointPath.parentLineIds?.length
      ? scene.lines.find((line) => line.id === pointPath.parentLineIds![0])
      : undefined;
    pathCircle = pointPath.parentCircleIds?.length
      ? scene.circles.find((circle) => circle.id === pointPath.parentCircleIds![0])
      : undefined;
  }
  if (!pathCircle && !pathLine) {
    pathCircle = scene.circles.find((c) => Math.abs(dist(driverPt, c.center) - c.radius) < 14);
    if (!pathCircle) {
      pathLine = scene.lines.find((l) => distToSegment(driverPt, l.p1, l.p2) < 14);
    }
  }

  const samples: Point2D[] = [];

  if (pathCircle) {
    for (let i = 0; i <= numSamples; i++) {
      const angle = (i / numSamples) * Math.PI * 2;
      const testPos = {
        x: pathCircle.center.x + pathCircle.radius * Math.cos(angle),
        y: pathCircle.center.y + pathCircle.radius * Math.sin(angle),
      };
      const simScene = updateGeometryOnPointMove(scene, driverPointId, testPos);
      const simulatedDep = simScene.points.find((p) => p.id === dependentPointId);
      if (simulatedDep) {
        samples.push({ x: simulatedDep.x, y: simulatedDep.y });
      }
    }
  } else if (pathLine) {
    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      const p1 = pathLine.p1PointId
        ? scene.points.find((point) => point.id === pathLine.p1PointId) || pathLine.p1
        : pathLine.p1;
      const p2 = pathLine.p2PointId
        ? scene.points.find((point) => point.id === pathLine.p2PointId) || pathLine.p2
        : pathLine.p2;
      const testPos = pathLine.isInfinite
        ? {
            x: driverPt.x + (t - 0.5) * 2000 * (p2.x - p1.x) / (dist(p1, p2) || 1),
            y: driverPt.y + (t - 0.5) * 2000 * (p2.y - p1.y) / (dist(p1, p2) || 1),
          }
        : {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y),
          };
      const simScene = updateGeometryOnPointMove(scene, driverPointId, testPos);
      const simulatedDep = simScene.points.find((p) => p.id === dependentPointId);
      if (simulatedDep) {
        samples.push({ x: simulatedDep.x, y: simulatedDep.y });
      }
    }
  } else {
    for (let i = 0; i <= numSamples; i++) {
      const angle = (i / numSamples) * Math.PI * 2;
      const testPos = {
        x: driverPt.x + 60 * Math.cos(angle),
        y: driverPt.y + 60 * Math.sin(angle),
      };
      const simScene = updateGeometryOnPointMove(scene, driverPointId, testPos);
      const simulatedDep = simScene.points.find((p) => p.id === dependentPointId);
      if (simulatedDep) {
        samples.push({ x: simulatedDep.x, y: simulatedDep.y });
      }
    }
  }

  return samples;
}

// Move multiple selected objects (and all their defining points) simultaneously
export function translateSelectedObjects<T extends DynamicGeometryScene>(
  scene: T,
  selectedIds: string[] | Set<string>,
  delta: Point2D
): T {
  const ids = Array.isArray(selectedIds) ? new Set(selectedIds) : selectedIds;
  if (ids.size === 0 || (delta.x === 0 && delta.y === 0)) return scene;

  // 1. Collect all point IDs that should move.
  // Rule 6: Dependent objects shall not move unless their defining objects move!
  const pointsToMove = new Set<string>();

  for (const pt of scene.points) {
    if (ids.has(pt.id)) {
      // Dependent points (except path-constrained points) cannot be dragged directly!
      if (!pt.dependsOn || pt.dependsOn.type === 'point-on-path' || pt.dependsOn.type === 'point-on-segment') {
        pointsToMove.add(pt.id);
      }
    }
  }

  for (const line of scene.lines) {
    // If the line is dependent, it cannot be dragged to move its defining parents
    if (ids.has(line.id) && !line.dependsOn) {
      if (line.p1PointId) {
        const p = scene.points.find((it) => it.id === line.p1PointId);
        if (!p?.dependsOn || p.dependsOn.type === 'point-on-path' || p.dependsOn.type === 'point-on-segment') pointsToMove.add(line.p1PointId);
      }
      if (line.p2PointId) {
        const p = scene.points.find((it) => it.id === line.p2PointId);
        if (!p?.dependsOn || p.dependsOn.type === 'point-on-path' || p.dependsOn.type === 'point-on-segment') pointsToMove.add(line.p2PointId);
      }
    }
  }

  for (const circ of scene.circles) {
    // If circle is dependent (e.g. circumcircle), it is immovable unless its defining objects move
    if (ids.has(circ.id) && !circ.dependsOn) {
      if (circ.centerPointId) {
        const p = scene.points.find((it) => it.id === circ.centerPointId);
        if (!p?.dependsOn || p.dependsOn.type === 'point-on-path' || p.dependsOn.type === 'point-on-segment') pointsToMove.add(circ.centerPointId);
      }
      if (circ.radiusPointId) {
        const p = scene.points.find((it) => it.id === circ.radiusPointId);
        if (!p?.dependsOn || p.dependsOn.type === 'point-on-path' || p.dependsOn.type === 'point-on-segment') pointsToMove.add(circ.radiusPointId);
      }
    }
  }

  for (const poly of scene.polygons) {
    if (ids.has(poly.id) && !poly.dependsOn && poly.pointIds) {
      poly.pointIds.forEach((pId) => {
        const p = scene.points.find((it) => it.id === pId);
        if (!p?.dependsOn || p.dependsOn.type === 'point-on-path' || p.dependsOn.type === 'point-on-segment') pointsToMove.add(pId);
      });
    }
  }

  for (const conic of scene.conics || []) {
    if (ids.has(conic.id) && !conic.dependsOn) {
      if (conic.fociPointIds) conic.fociPointIds.forEach((id) => pointsToMove.add(id));
      if (conic.focusPointId) pointsToMove.add(conic.focusPointId);
      if (conic.pointId) pointsToMove.add(conic.pointId);
      if (conic.directrixPointIds) conic.directrixPointIds.forEach((id) => pointsToMove.add(id));
      if (conic.points5Ids) conic.points5Ids.forEach((id) => pointsToMove.add(id));
    }
  }

  for (const ang of scene.angles) {
    if (ids.has(ang.id) && !ang.dependsOn) {
      if (ang.centerPointId) pointsToMove.add(ang.centerPointId);
      if (ang.p1PointId) pointsToMove.add(ang.p1PointId);
      if (ang.p2PointId) pointsToMove.add(ang.p2PointId);
    }
  }

  // 2. Clone points and translate all pointsToMove
  const pointMap = new Map<string, GeoPoint>();
  for (const pt of scene.points) {
    if (pointsToMove.has(pt.id)) {
      pointMap.set(pt.id, { ...pt, x: pt.x + delta.x, y: pt.y + delta.y });
    } else {
      pointMap.set(pt.id, { ...pt });
    }
  }

  // Also translate coordinates of unbound lines/circles/polygons if selected
  const updatedLines = scene.lines.map((l) => {
    if (ids.has(l.id) && !l.dependsOn && !l.p1PointId && !l.p2PointId) {
      return {
        ...l,
        p1: { x: l.p1.x + delta.x, y: l.p1.y + delta.y },
        p2: { x: l.p2.x + delta.x, y: l.p2.y + delta.y },
      };
    }
    return l;
  });

  const updatedCircles = scene.circles.map((c) => {
    if (ids.has(c.id) && !c.dependsOn && !c.centerPointId) {
      return {
        ...c,
        center: { x: c.center.x + delta.x, y: c.center.y + delta.y },
      };
    }
    return c;
  });

  const updatedPolygons = scene.polygons.map((pl) => {
    if (ids.has(pl.id) && !pl.dependsOn && (!pl.pointIds || pl.pointIds.length === 0)) {
      return {
        ...pl,
        points: pl.points.map((p) => ({ x: p.x + delta.x, y: p.y + delta.y })),
      };
    }
    return pl;
  });
  const updatedAngles = scene.angles.map((angle) => {
    if (!ids.has(angle.id) || angle.dependsOn) return angle;
    return {
      ...angle,
      center: { x: angle.center.x + delta.x, y: angle.center.y + delta.y },
      p1: { x: angle.p1.x + delta.x, y: angle.p1.y + delta.y },
      p2: { x: angle.p2.x + delta.x, y: angle.p2.y + delta.y },
    };
  });

  let updatedScene: T = {
    ...scene,
    points: Array.from(pointMap.values()),
    lines: updatedLines,
    circles: updatedCircles,
    polygons: updatedPolygons,
    angles: updatedAngles,
  };

  // If any points moved, run updateGeometryOnPointMove on the first one to trigger full reactive cascade
  const movedPtId = Array.from(pointsToMove)[0];
  if (movedPtId) {
    const pt = pointMap.get(movedPtId)!;
    return updateGeometryOnPointMove(updatedScene, movedPtId, { x: pt.x, y: pt.y });
  }

  return updatedScene;
}

// Translate multiple points (e.g. moving a whole polygon or line)
export function translateGeometryPoints<T extends DynamicGeometryScene>(
  scene: T,
  pointIds: string[],
  delta: Point2D
): T {
  let currentScene = scene;
  for (const pId of pointIds) {
    const pt = currentScene.points.find((p) => p.id === pId);
    if (pt) {
      currentScene = updateGeometryOnPointMove(currentScene, pId, {
        x: pt.x + delta.x,
        y: pt.y + delta.y,
      });
    }
  }
  return currentScene;
}

// Distance from point P to circle boundary
export function distToCircle(pos: Point2D, circle: GeoCircle): number {
  return Math.abs(dist(pos, circle.center) - circle.radius);
}

// Distance from point P to angle arc or ray legs
export function distToAngle(pos: Point2D, angle: GeoAngle): number {
  const dCenter = dist(pos, angle.center);
  if (dCenter < 20) return dCenter;
  const dArc = Math.abs(dCenter - angle.radius);
  // Also check distance to rays
  const dRay1 = distToSegment(pos, angle.center, angle.p1);
  const dRay2 = distToSegment(pos, angle.center, angle.p2);
  return Math.min(dArc, dRay1, dRay2);
}

// Distance from point P to conic section
export function distToConic(pos: Point2D, conic: GeoConic): number {
  if (conic.type === 'ellipse' && conic.foci && conic.point) {
    const d1 = dist(conic.point, conic.foci[0]);
    const d2 = dist(conic.point, conic.foci[1]);
    const major2a = d1 + d2;
    const curSum = dist(pos, conic.foci[0]) + dist(pos, conic.foci[1]);
    return Math.abs(curSum - major2a) / 2;
  }

  if (conic.type === 'parabola' && conic.focus && conic.directrix) {
    const dF = dist(pos, conic.focus);
    const dLine = distToLine(pos, conic.directrix.p1, conic.directrix.p2);
    return Math.abs(dF - dLine);
  }
  if (conic.type === 'hyperbola' && conic.foci && conic.point) {
    const d1 = dist(conic.point, conic.foci[0]);
    const d2 = dist(conic.point, conic.foci[1]);
    const major2a = Math.abs(d1 - d2);
    const curDiff = Math.abs(dist(pos, conic.foci[0]) - dist(pos, conic.foci[1]));
    return Math.abs(curDiff - major2a) / 2;
  }
  if (conic.coefficients) {
    const [A, B, C, D, E, F] = conic.coefficients;
    const val = A * pos.x * pos.x + B * pos.x * pos.y + C * pos.y * pos.y + D * pos.x + E * pos.y + F;
    const gradX = 2 * A * pos.x + B * pos.y + D;
    const gradY = B * pos.x + 2 * C * pos.y + E;
    const gradNorm = Math.hypot(gradX, gradY) || 1;
    return Math.abs(val) / gradNorm;
  }
  return 9999;
}

export function projectPointToConic(pos: Point2D, conic: GeoConic): Point2D {
  const residual = (point: Point2D): number => {
    if (conic.coefficients) {
      const [A, B, C, D, E, F] = conic.coefficients;
      return A * point.x * point.x + B * point.x * point.y + C * point.y * point.y +
        D * point.x + E * point.y + F;
    }
    if (conic.type === 'ellipse' && conic.foci && conic.point) {
      const majorAxis = dist(conic.point, conic.foci[0]) + dist(conic.point, conic.foci[1]);
      return dist(point, conic.foci[0]) + dist(point, conic.foci[1]) - majorAxis;
    }
    if (conic.type === 'hyperbola' && conic.foci && conic.point) {
      const majorAxis = Math.abs(dist(conic.point, conic.foci[0]) - dist(conic.point, conic.foci[1]));
      return Math.abs(dist(point, conic.foci[0]) - dist(point, conic.foci[1])) - majorAxis;
    }
    if (conic.type === 'parabola' && conic.focus && conic.directrix) {
      return dist(point, conic.focus) - distToLine(point, conic.directrix.p1, conic.directrix.p2);
    }
    return Number.NaN;
  };

  let projected = { ...pos };
  const epsilon = 1e-3;
  for (let iteration = 0; iteration < 32; iteration++) {
    const value = residual(projected);
    if (!Number.isFinite(value) || Math.abs(value) < 1e-5) break;
    const gradientX = (residual({ x: projected.x + epsilon, y: projected.y }) -
      residual({ x: projected.x - epsilon, y: projected.y })) / (2 * epsilon);
    const gradientY = (residual({ x: projected.x, y: projected.y + epsilon }) -
      residual({ x: projected.x, y: projected.y - epsilon })) / (2 * epsilon);
    const gradientLengthSquared = gradientX * gradientX + gradientY * gradientY;
    if (!Number.isFinite(gradientLengthSquared) || gradientLengthSquared < 1e-12) break;

    let stepX = (value * gradientX) / gradientLengthSquared;
    let stepY = (value * gradientY) / gradientLengthSquared;
    const stepLength = Math.hypot(stepX, stepY);
    if (stepLength > 50) {
      const scale = 50 / stepLength;
      stepX *= scale;
      stepY *= scale;
    }
    projected = { x: projected.x - stepX, y: projected.y - stepY };
  }
  return Number.isFinite(projected.x) && Number.isFinite(projected.y) ? projected : pos;
}

// Polygon area using surveyor's / shoelace formula
export function polygonArea(points: Point2D[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}
