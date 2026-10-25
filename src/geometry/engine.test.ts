import test from 'node:test';
import assert from 'node:assert/strict';
import type { DynamicGeometryScene, Point2D } from './engine.ts';
import {
  dist,
  midpoint,
  getCentroid,
  getCircumcenter,
  getIncenter,
  getOrthocenter,
  getNinePointCircle,
  getExcenter,
  getLemoinePoint,
  getGergonnePoint,
  getNagelPoint,
  getHumptyPoint,
  getDumptyPoint,
  getMixtilinearIncircle,
  getMixtilinearExcircle,
  getThebaultCircle,
  getIsogonalLine,
  invertPoint,
  getEllipse2Foci,
  getParabolaFocusDirectrix,
  getHyperbola2Foci,
  getCircleTangents,
  getLineLineIntersection,
  getLineCircleIntersections,
  getAngleBisector,
  getPerpendicularLine,
  translatePoint,
  rotatePoint,
  dilatePoint,
  projectPointToSegment,
  projectPointToPolygon,
  projectPointToConic,
  calculateLocusSamples,
  POSITION_STEP_PIXELS,
  quantizePositionCoordinate,
  updateGeometryOnPointMove,
  translateSelectedObjects,
  distToSegment,
  distToLine,
  distToCircle,
  distToConic,
  fitConic5Points,
  deleteGeometryObjects,
} from './engine.ts';

test('vector calculations: distance and midpoint', () => {
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 3, y: 4 };
  assert.equal(dist(p1, p2), 5);
  const mid = midpoint(p1, p2);
  assert.equal(mid[0], 1.5);
  assert.equal(mid[1], 2);
});

test('triangle centers on a 3-4-5 right triangle', () => {
  // Triangle at A(0,0), B(4,0), C(0,3)
  const A = { x: 0, y: 0 };
  const B = { x: 4, y: 0 };
  const C = { x: 0, y: 3 };

  // Centroid should be (4/3, 1)
  const G = getCentroid(A, B, C);
  assert.ok(Math.abs(G.x - 4 / 3) < 1e-4);
  assert.equal(G.y, 1);

  // Circumcenter of right triangle is midpoint of hypotenuse BC: (2, 1.5), radius 2.5
  const circum = getCircumcenter(A, B, C);
  assert.ok(circum !== null);
  assert.ok(Math.abs(circum!.center.x - 2) < 1e-4);
  assert.ok(Math.abs(circum!.center.y - 1.5) < 1e-4);
  assert.ok(Math.abs(circum!.radius - 2.5) < 1e-4);

  // Incenter for 3-4-5 triangle: radius r = (a+b-c)/2 = (3+4-5)/2 = 1, center (1, 1)
  const incenter = getIncenter(A, B, C);
  assert.ok(Math.abs(incenter.center.x - 1) < 1e-4);
  assert.ok(Math.abs(incenter.center.y - 1) < 1e-4);
  assert.ok(Math.abs(incenter.radius - 1) < 1e-4);

  // Orthocenter for right triangle at A is A(0, 0)
  const H = getOrthocenter(A, B, C);
  assert.ok(H !== null);
  assert.ok(Math.abs(H!.x - 0) < 1e-4);
  assert.ok(Math.abs(H!.y - 0) < 1e-4);

  // Nine-point circle center is midpoint of O and H: (1, 0.75), radius R/2 = 1.25
  const ninePoint = getNinePointCircle(A, B, C);
  assert.ok(ninePoint !== null);
  assert.ok(Math.abs(ninePoint!.center.x - 1) < 1e-4);
  assert.ok(Math.abs(ninePoint!.center.y - 0.75) < 1e-4);
  assert.ok(Math.abs(ninePoint!.radius - 1.25) < 1e-4);
});

test('Thébault construction circle remains tangent to the triangle circumcircle', () => {
  const makePoint = (id: string, name: string, position: Point2D, dependsOn?: DynamicGeometryScene['points'][number]['dependsOn']) => ({
    id,
    name,
    ...position,
    size: 2,
    color: '#2563eb',
    style: 'solid' as const,
    pageIndex: 0,
    dependsOn,
  });
  const A = { x: 0, y: 0 };
  const B = { x: 6, y: 0 };
  const C = { x: 2, y: 4 };
  const D = { x: 4.4, y: 1.6 };
  const I = getIncenter(A, B, C).center;
  const angleBisector = getAngleBisector(A, D, B);
  const perpendicularThroughI = getPerpendicularLine(I, angleBisector.p1, angleBisector.p2);
  const AD = { p1: A, p2: D };
  const BD = { p1: B, p2: D };
  const E = getLineLineIntersection(perpendicularThroughI.p1, perpendicularThroughI.p2, AD.p1, AD.p2)!;
  const F = getLineLineIntersection(perpendicularThroughI.p1, perpendicularThroughI.p2, BD.p1, BD.p2)!;
  const perpendicularAtE = getPerpendicularLine(E, AD.p1, AD.p2);
  const perpendicularAtF = getPerpendicularLine(F, BD.p1, BD.p2);
  const G = getLineLineIntersection(perpendicularAtE.p1, perpendicularAtE.p2, perpendicularAtF.p1, perpendicularAtF.p2)!;

  const scene: DynamicGeometryScene = {
    points: [
      makePoint('A', 'A', A),
      makePoint('B', 'B', B),
      makePoint('C', 'C', C),
      makePoint('D', 'D', D),
      makePoint('I', 'I', I, { type: 'incenter', parentPointIds: ['A', 'B', 'C'] }),
      makePoint('E', 'E', E, { type: 'intersection', parentLineIds: ['perpendicular-through-I', 'AD'], initialPos: E }),
      makePoint('F', 'F', F, { type: 'intersection', parentLineIds: ['perpendicular-through-I', 'BD'], initialPos: F }),
      makePoint('G', 'G', G, { type: 'intersection', parentLineIds: ['perpendicular-at-E', 'perpendicular-at-F'], initialPos: G }),
    ],
    lines: [
      {
        id: 'AD',
        p1: A,
        p2: D,
        p1PointId: 'A',
        p2PointId: 'D',
        thickness: 1,
        color: '#000',
        style: 'solid',
        isInfinite: false,
        pageIndex: 0,
      },
      {
        id: 'BD',
        p1: B,
        p2: D,
        p1PointId: 'B',
        p2PointId: 'D',
        thickness: 1,
        color: '#000',
        style: 'solid',
        isInfinite: false,
        pageIndex: 0,
      },
      {
        id: 'in-bisector',
        p1: angleBisector.p1,
        p2: angleBisector.p2,
        thickness: 1,
        color: '#000',
        style: 'solid',
        isInfinite: true,
        pageIndex: 0,
        dependsOn: { type: 'angle-bisector-in', parentPointIds: ['A', 'D', 'B'] },
      },
      {
        id: 'perpendicular-through-I',
        ...perpendicularThroughI,
        thickness: 1,
        color: '#000',
        style: 'solid',
        isInfinite: true,
        pageIndex: 0,
        dependsOn: { type: 'perpendicular-line', parentPointIds: ['I'], parentLineIds: ['in-bisector'] },
      },
      {
        id: 'perpendicular-at-E',
        ...perpendicularAtE,
        thickness: 1,
        color: '#000',
        style: 'solid',
        isInfinite: true,
        pageIndex: 0,
        dependsOn: { type: 'perpendicular-line', parentPointIds: ['E'], parentLineIds: ['AD'] },
      },
      {
        id: 'perpendicular-at-F',
        ...perpendicularAtF,
        thickness: 1,
        color: '#000',
        style: 'solid',
        isInfinite: true,
        pageIndex: 0,
        dependsOn: { type: 'perpendicular-line', parentPointIds: ['F'], parentLineIds: ['BD'] },
      },
    ],
    circles: [
      {
        id: 'circumcircle',
        center: getCircumcenter(A, B, C)!.center,
        radius: getCircumcenter(A, B, C)!.radius,
        thickness: 1,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'circumcircle', parentPointIds: ['A', 'B', 'C'] },
      },
      {
        id: 'thebault-circle',
        center: G,
        radius: dist(G, E),
        centerPointId: 'G',
        radiusPointId: 'E',
        thickness: 1,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'center-point', parentPointIds: ['G', 'E'] },
      },
    ],
    polygons: [],
    angles: [],
  };

  const assertInternalTangency = (currentScene: DynamicGeometryScene) => {
    const th = currentScene.circles.find((circle) => circle.id === 'thebault-circle')!;
    const circum = currentScene.circles.find((circle) => circle.id === 'circumcircle')!;
    const error = Math.abs(dist(th.center, circum.center) - (circum.radius - th.radius));
    assert.ok(error < 1e-6, `Tangency error: ${error}`);
  };

  assertInternalTangency(scene);
  assertInternalTangency(updateGeometryOnPointMove(scene, 'A', { x: -0.3, y: 0.5 }));
});

test('Thébault circle construction is accurate for points along BC and stays dynamic', () => {
  const A = { x: 0, y: 0 };
  const B = { x: 6, y: 0 };
  const C = { x: 2, y: 4 };

  for (const ratio of [0.1, 0.25, 0.5, 0.75, 0.9]) {
    const D = {
      x: B.x + (C.x - B.x) * ratio,
      y: B.y + (C.y - B.y) * ratio,
    };
    const circle = getThebaultCircle(A, B, C, D);
    const circumcircle = getCircumcenter(A, B, C)!;
    assert.ok(circle, `Expected construction for D at ${ratio}`);
    assert.ok(
      Math.abs(dist(circle!.center, circumcircle.center) + circle!.radius - circumcircle.radius) < 1e-7
    );
    assert.ok(Math.abs(dist(circle!.touchpoint, circle!.center) - circle!.radius) < 1e-7);
    assert.ok(Math.abs(dist(circle!.touchpoint, circumcircle.center) - circumcircle.radius) < 1e-7);
  }

  const point = (id: string, position: Point2D, dependsOn?: DynamicGeometryScene['points'][number]['dependsOn']) => ({
    id,
    name: id,
    ...position,
    size: 2,
    color: '#2563eb',
    style: 'solid' as const,
    pageIndex: 0,
    dependsOn,
  });
  const D = { x: 4.4, y: 1.6 };
  const scene: DynamicGeometryScene = {
    points: [
      point('A', A),
      point('B', B),
      point('C', C),
      point('D', D, { type: 'point-on-segment', parentPointIds: ['B', 'C'] }),
      point('T', getThebaultCircle(A, B, C, D)!.touchpoint, {
        type: 'thebault-touchpoint',
        parentPointIds: ['A', 'B', 'C', 'D'],
      }),
    ],
    lines: [],
    circles: [
      {
        id: 'circumcircle',
        ...getCircumcenter(A, B, C)!,
        thickness: 1,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'circumcircle', parentPointIds: ['A', 'B', 'C'] },
      },
      {
        id: 'thebault-circle',
        ...getThebaultCircle(A, B, C, D)!,
        thickness: 1,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'thebault-circle', parentPointIds: ['A', 'B', 'C', 'D'] },
      },
    ],
    polygons: [],
    angles: [],
  };

  for (const [movedId, position] of [
    ['D', { x: 4.1, y: 1.7 }],
    ['A', { x: -0.3, y: 0.5 }],
    ['C', { x: 3.1, y: 5 }],
  ] as const) {
    const updated = updateGeometryOnPointMove(scene, movedId, position);
    const updatedA = updated.points.find((item) => item.id === 'A')!;
    const updatedB = updated.points.find((item) => item.id === 'B')!;
    const updatedC = updated.points.find((item) => item.id === 'C')!;
    const updatedD = updated.points.find((item) => item.id === 'D')!;
    const outer = updated.circles.find((item) => item.id === 'circumcircle')!;
    const inner = updated.circles.find((item) => item.id === 'thebault-circle')!;
    const expected = getThebaultCircle(updatedA, updatedB, updatedC, updatedD)!;

    assert.ok(distToSegment(updatedD, updatedB, updatedC) < 1e-7);
    assert.ok(Math.abs(dist(inner.center, outer.center) + inner.radius - outer.radius) < 1e-7);
    assert.ok(dist(inner.center, expected.center) < 1e-7);
    assert.ok(Math.abs(inner.radius - expected.radius) < 1e-7);
  }
});

test('points constrained to polygons and conics remain on their paths', () => {
  const ellipse = {
    id: 'ellipse',
    type: 'ellipse' as const,
    subType: 'ellipse-2foci-1pt' as const,
    foci: [{ x: -3, y: 0 }, { x: 3, y: 0 }] as [Point2D, Point2D],
    point: { x: 0, y: 4 },
    thickness: 1,
    color: '#000',
    style: 'solid' as const,
    pageIndex: 0,
  };
  const projectedEllipsePoint = projectPointToConic({ x: 0, y: 5 }, ellipse);
  assert.ok(distToConic(projectedEllipsePoint, ellipse) < 1e-4);

  const polygon = {
    id: 'polygon',
    points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
    thickness: 1,
    color: '#000',
    style: 'solid' as const,
    pageIndex: 0,
  };
  assert.deepEqual(projectPointToPolygon({ x: 6, y: -2 }, polygon), { x: 6, y: 0 });

  const scene: DynamicGeometryScene = {
    points: [
      {
        id: 'on-polygon',
        name: 'P',
        x: 6,
        y: -2,
        size: 2,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'point-on-path', parentPolygonIds: ['polygon'] },
      },
      {
        id: 'on-conic',
        name: 'Q',
        x: 0,
        y: 5,
        size: 2,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'point-on-path', parentConicIds: ['ellipse'] },
      },
    ],
    lines: [],
    circles: [],
    polygons: [polygon],
    conics: [ellipse],
    angles: [],
  };
  const updated = updateGeometryOnPointMove(scene, 'on-polygon', { x: 6, y: -2 });
  assert.deepEqual(
    { x: updated.points[0].x, y: updated.points[0].y },
    { x: 6, y: 0 }
  );
  const updatedConicPoint = updateGeometryOnPointMove(scene, 'on-conic', { x: 0, y: 5 }).points[1];
  assert.ok(distToConic(updatedConicPoint, ellipse) < 1e-4);
});

test('Humpty and Dumpty points are projections onto the A-median and A-symmedian', () => {
  const A = { x: 0, y: 0 };
  const B = { x: 4, y: 0 };
  const C = { x: 0, y: 3 };
  const medianMidpoint = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
  const orthocenter = getOrthocenter(A, B, C)!;
  const circumcenter = getCircumcenter(A, B, C)!.center;

  const humpty = getHumptyPoint(A, B, C)!;
  assert.ok(Math.abs(distToLine(humpty, A, medianMidpoint)) < 1e-9);
  const medianDirection = { x: medianMidpoint.x - A.x, y: medianMidpoint.y - A.y };
  assert.ok(Math.abs((humpty.x - orthocenter.x) * medianDirection.x + (humpty.y - orthocenter.y) * medianDirection.y) < 1e-9);

  const sideABSquared = dist(A, B) ** 2;
  const sideACSquared = dist(A, C) ** 2;
  const symmedianPoint = {
    x: (sideACSquared * B.x + sideABSquared * C.x) / (sideABSquared + sideACSquared),
    y: (sideACSquared * B.y + sideABSquared * C.y) / (sideABSquared + sideACSquared),
  };
  const dumpty = getDumptyPoint(A, B, C)!;
  assert.ok(Math.abs(distToLine(dumpty, A, symmedianPoint)) < 1e-9);
  const symmedianDirection = { x: symmedianPoint.x - A.x, y: symmedianPoint.y - A.y };
  assert.ok(Math.abs((dumpty.x - circumcenter.x) * symmedianDirection.x + (dumpty.y - circumcenter.y) * symmedianDirection.y) < 1e-9);
});

test('Humpty and Dumpty dependencies update when triangle vertices move', () => {
  const scene: DynamicGeometryScene = {
    points: [
      { id: 'A', name: 'A', x: 0, y: 0, size: 2, color: '#000', style: 'solid', pageIndex: 0 },
      { id: 'B', name: 'B', x: 4, y: 0, size: 2, color: '#000', style: 'solid', pageIndex: 0 },
      { id: 'C', name: 'C', x: 0, y: 3, size: 2, color: '#000', style: 'solid', pageIndex: 0 },
      { id: 'humpty', name: 'H_A', x: 0, y: 0, size: 2, color: '#000', style: 'solid', pageIndex: 0, dependsOn: { type: 'humpty', parentPointIds: ['A', 'B', 'C'] } },
      { id: 'dumpty', name: 'D_A', x: 0, y: 0, size: 2, color: '#000', style: 'solid', pageIndex: 0, dependsOn: { type: 'dumpty', parentPointIds: ['A', 'B', 'C'] } },
    ],
    lines: [],
    circles: [],
    polygons: [],
    angles: [],
  };
  const moved = updateGeometryOnPointMove(scene, 'B', { x: 5, y: 1 });
  const A = moved.points.find((point) => point.id === 'A')!;
  const B = moved.points.find((point) => point.id === 'B')!;
  const C = moved.points.find((point) => point.id === 'C')!;
  assert.deepEqual(moved.points.find((point) => point.id === 'humpty'), {
    ...scene.points[3],
    ...getHumptyPoint(A, B, C),
  });
  assert.deepEqual(moved.points.find((point) => point.id === 'dumpty'), {
    ...scene.points[4],
    ...getDumptyPoint(A, B, C),
  });
});

test('excenter calculation', () => {
  const A = { x: 0, y: 0 };
  const B = { x: 4, y: 0 };
  const C = { x: 0, y: 3 };
  const exA = getExcenter(A, B, C, 'A');
  // Excenter opposite right angle A has coordinates (-rA, -rA) with rA = 6
  assert.ok(exA.radius > 0);
  assert.ok(Math.abs(exA.radius - 6) < 1e-3);
});

test('lemoine, gergonne, and nagel points exist and are valid', () => {
  const A = { x: 0, y: 0 };
  const B = { x: 4, y: 0 };
  const C = { x: 0, y: 3 };

  const K = getLemoinePoint(A, B, C);
  assert.ok(Number.isFinite(K.x) && Number.isFinite(K.y));

  const Ge = getGergonnePoint(A, B, C);
  assert.ok(Number.isFinite(Ge.x) && Number.isFinite(Ge.y));

  const Na = getNagelPoint(A, B, C);
  assert.ok(Number.isFinite(Na.x) && Number.isFinite(Na.y));
});

test('mixtilinear incircle calculation', () => {
  const A = { x: 0, y: 0 };
  const B = { x: 4, y: 0 };
  const C = { x: 0, y: 3 };
  const mix = getMixtilinearIncircle(A, B, C);
  assert.ok(mix.radius > 0);
  assert.ok(Number.isFinite(mix.center.x));
  assert.ok(Number.isFinite(mix.center.y));
});

test('geometric inversion', () => {
  const circle = { center: { x: 0, y: 0 }, radius: 10 };
  const P = { x: 5, y: 0 };
  // OP * OP' = R^2 => 5 * P' = 100 => P' = 20
  const inv = invertPoint(P, circle);
  assert.ok(inv !== null);
  assert.equal(inv!.x, 20);
  assert.equal(inv!.y, 0);
});

test('transformations: translate, rotate, dilate', () => {
  const P = { x: 2, y: 3 };
  const trans = translatePoint(P, { x: 0, y: 0 }, { x: 5, y: 5 });
  assert.equal(trans.x, 7);
  assert.equal(trans.y, 8);

  const rot = rotatePoint({ x: 1, y: 0 }, { x: 0, y: 0 }, Math.PI / 2);
  assert.ok(Math.abs(rot.x - 0) < 1e-5);
  assert.ok(Math.abs(rot.y - 1) < 1e-5);

  const dil = dilatePoint({ x: 2, y: 4 }, { x: 0, y: 0 }, 2);
  assert.equal(dil.x, 4);
  assert.equal(dil.y, 8);
});

test('dependent objects are fixed and update only when their parents move', () => {
  const scene = {
    points: [
      { id: 'a', name: 'A', x: 0, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'b', name: 'B', x: 8, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'c', name: 'C', x: 0, y: 6, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'i', name: 'I', x: 1.5, y: 1.5, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0, dependsOn: { type: 'incenter' as const, parentPointIds: ['a', 'b', 'c'] } },
    ],
    lines: [],
    circles: [
      { id: 'inc', center: { x: 1.5, y: 1.5 }, radius: 1.5, thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0, dependsOn: { type: 'incircle' as const, parentPointIds: ['a', 'b', 'c'] } },
    ],
    polygons: [],
    angles: [],
  };

  const attemptedPointMove = updateGeometryOnPointMove(scene, 'i', { x: 90, y: 70 });
  assert.equal(attemptedPointMove.points.find((point) => point.id === 'i')?.x, 1.5);

  const attemptedCircleMove = translateSelectedObjects(scene, ['inc'], { x: 20, y: 30 });
  assert.deepEqual(attemptedCircleMove.circles[0].center, { x: 1.5, y: 1.5 });

  const movedParent = updateGeometryOnPointMove(scene, 'a', { x: 2, y: 1 });
  const movedIncenter = movedParent.points.find((point) => point.id === 'i');
  const movedIncircle = movedParent.circles.find((circle) => circle.id === 'inc');
  assert.ok(movedIncenter && movedIncircle);
  assert.notDeepEqual(movedIncircle.center, { x: 1.5, y: 1.5 });
  assert.deepEqual(movedIncircle.center, { x: movedIncenter.x, y: movedIncenter.y });
});

test('deleting a line cascades to its inverted circle but preserves the inversion circle', () => {
  const scene: DynamicGeometryScene = {
    points: [],
    lines: [
      { id: 'source-line', p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 }, thickness: 1, color: '#000', style: 'solid', pageIndex: 0 },
    ],
    circles: [
      { id: 'inversion-circle', center: { x: 0, y: 0 }, radius: 5, thickness: 1, color: '#000', style: 'solid', pageIndex: 0 },
      {
        id: 'inverse-circle',
        center: { x: 4, y: 0 },
        radius: 2,
        thickness: 1,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: {
          type: 'inversion',
          parentLineIds: ['source-line'],
          parentCircleIds: ['inversion-circle'],
        },
      },
      {
        id: 'dependent-circle',
        center: { x: 8, y: 0 },
        radius: 1,
        thickness: 1,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'inversion', parentCircleIds: ['inverse-circle', 'inversion-circle'] },
      },
    ],
    polygons: [],
    angles: [],
  };

  const afterDelete = deleteGeometryObjects(scene, ['source-line']);
  assert.equal(afterDelete.lines.length, 0);
  assert.deepEqual(afterDelete.circles.map((circle) => circle.id), ['inversion-circle']);
});

test('deleting a circle cascades to its inverted line or circle', () => {
  const scene: DynamicGeometryScene = {
    points: [],
    lines: [
      {
        id: 'inverse-line',
        p1: { x: 0, y: 1 },
        p2: { x: 10, y: 1 },
        thickness: 1,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'inversion', parentCircleIds: ['source-circle', 'inversion-circle'] },
      },
    ],
    circles: [
      { id: 'source-circle', center: { x: 0, y: 0 }, radius: 10, thickness: 1, color: '#000', style: 'solid', pageIndex: 0 },
      { id: 'inversion-circle', center: { x: 5, y: 0 }, radius: 4, thickness: 1, color: '#000', style: 'solid', pageIndex: 0 },
      {
        id: 'inverse-circle',
        center: { x: 10, y: 0 },
        radius: 1,
        thickness: 1,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'inversion', parentCircleIds: ['source-circle', 'inversion-circle'] },
      },
    ],
    polygons: [],
    angles: [],
  };

  const afterDelete = deleteGeometryObjects(scene, ['source-circle']);
  assert.equal(afterDelete.lines.length, 0);
  assert.deepEqual(afterDelete.circles.map((circle) => circle.id), ['inversion-circle']);
});

test('dilated points keep their stored ratio when parents move', () => {
  const scene = {
    points: [
      { id: 'p', name: 'P', x: 10, y: 5, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'o', name: 'O', x: 0, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'p-prime', name: "P'", x: 30, y: 15, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0, dependsOn: { type: 'dilation' as const, parentPointIds: ['p', 'o'], ratio: 3 } },
    ],
    lines: [],
    circles: [
      { id: 'source-circle', center: { x: 100, y: 0 }, radius: 2, thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'dilated-circle', center: { x: 300, y: 0 }, radius: 6, thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0, dependsOn: { type: 'dilation' as const, parentCircleIds: ['source-circle'], parentPointIds: ['o'], ratio: 3 } },
    ],
    polygons: [],
    angles: [],
  };

  const moved = updateGeometryOnPointMove(scene, 'p', { x: 12, y: 7 });
  const image = moved.points.find((point) => point.id === 'p-prime');
  assert.deepEqual(image && { x: image.x, y: image.y }, { x: 36, y: 21 });

  const movedCenter = updateGeometryOnPointMove(scene, 'o', { x: 1, y: 0 });
  const dilatedCircle = movedCenter.circles.find((circle) => circle.id === 'dilated-circle');
  assert.deepEqual(dilatedCircle && { center: dilatedCircle.center, radius: dilatedCircle.radius }, {
    center: { x: 298, y: 0 },
    radius: 6,
  });
});

test('translated points follow source and vector endpoints', () => {
  const scene = {
    points: [
      { id: 'p', name: 'P', x: 10, y: 5, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'd', name: 'D', x: 0, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'e', name: 'E', x: 4, y: 3, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'p-double-prime', name: "P''", x: 14, y: 8, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0, dependsOn: { type: 'translation' as const, parentPointIds: ['p', 'd', 'e'] } },
    ],
    lines: [],
    circles: [],
    polygons: [],
    angles: [],
  };
  const moved = updateGeometryOnPointMove(scene, 'e', { x: 7.25, y: 2.5 });
  const image = moved.points.find((point) => point.id === 'p-double-prime');
  assert.deepEqual(image && { x: image.x, y: image.y }, { x: 17.25, y: 7.5 });
});

test('translated lines, circles, polygons, conics, and angles follow their vector', () => {
  const scene = {
    points: [
      { id: 'from', name: 'D', x: 2, y: 3, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'to', name: 'E', x: 4, y: 5, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
    ],
    lines: [
      { id: 'source-line', p1: { x: 10, y: 10 }, p2: { x: 20, y: 10 }, thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'translated-line', p1: { x: 14, y: 8 }, p2: { x: 24, y: 8 }, thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0, dependsOn: { type: 'translation' as const, parentLineIds: ['source-line'], parentPointIds: ['from', 'to'] } },
    ],
    circles: [
      { id: 'source-circle', center: { x: 30, y: 30 }, radius: 5, thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'translated-circle', center: { x: 34, y: 28 }, radius: 5, thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0, dependsOn: { type: 'translation' as const, parentCircleIds: ['source-circle'], parentPointIds: ['from', 'to'] } },
    ],
    polygons: [
      { id: 'source-polygon', points: [{ x: 40, y: 40 }, { x: 50, y: 40 }, { x: 45, y: 50 }], thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'translated-polygon', points: [{ x: 44, y: 38 }, { x: 54, y: 38 }, { x: 49, y: 48 }], thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0, dependsOn: { type: 'translation' as const, parentPolygonIds: ['source-polygon'], parentPointIds: ['from', 'to'] } },
    ],
    conics: [
      { id: 'source-conic', type: 'ellipse' as const, subType: 'ellipse-2foci-1pt' as const, foci: [{ x: 60, y: 60 }, { x: 70, y: 60 }] as [Point2D, Point2D], point: { x: 65, y: 70 }, thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'translated-conic', type: 'ellipse' as const, subType: 'ellipse-2foci-1pt' as const, foci: [{ x: 64, y: 58 }, { x: 74, y: 58 }] as [Point2D, Point2D], point: { x: 69, y: 68 }, thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0, dependsOn: { type: 'translation' as const, parentConicIds: ['source-conic'], parentPointIds: ['from', 'to'] } },
    ],
    angles: [
      { id: 'source-angle', center: { x: 80, y: 80 }, p1: { x: 90, y: 80 }, p2: { x: 80, y: 90 }, radius: 10, angleDeg: 90, style: 'arc' as const, color: '#000', pageIndex: 0 },
      { id: 'translated-angle', center: { x: 84, y: 78 }, p1: { x: 94, y: 78 }, p2: { x: 84, y: 88 }, radius: 10, angleDeg: 90, style: 'arc' as const, color: '#000', pageIndex: 0, dependsOn: { type: 'translation' as const, parentAngleIds: ['source-angle'], parentPointIds: ['from', 'to'] } },
    ],
  };

  const moved = updateGeometryOnPointMove(scene, 'to', { x: 6, y: 1 });
  assert.deepEqual(moved.lines.find((line) => line.id === 'translated-line')?.p1, { x: 14, y: 8 });
  assert.deepEqual(moved.circles.find((circle) => circle.id === 'translated-circle')?.center, { x: 34, y: 28 });
  assert.deepEqual(moved.polygons.find((polygon) => polygon.id === 'translated-polygon')?.points[0], { x: 44, y: 38 });
  assert.deepEqual(moved.conics?.find((conic) => conic.id === 'translated-conic')?.foci?.[0], { x: 64, y: 58 });
  assert.deepEqual(moved.angles.find((angle) => angle.id === 'translated-angle')?.center, { x: 84, y: 78 });
});

test('circle tangents exist only outside or on the circle', () => {
  const circle = { center: { x: 0, y: 0 }, radius: 5 };
  assert.equal(getCircleTangents({ x: 4, y: 0 }, circle).length, 0);
  assert.equal(getCircleTangents({ x: 4.998, y: 0 }, circle).length, 0);
  assert.equal(getCircleTangents({ x: 4.9995, y: 0 }, circle).length, 1);
  assert.equal(getCircleTangents({ x: 4.9995, y: 0 }, circle)[0].touchPoint.x, 5);
  assert.equal(getCircleTangents({ x: 5, y: 0 }, circle).length, 1);
  assert.equal(getCircleTangents({ x: 10, y: 0 }, circle).length, 2);
});

test('intersection-based tangent lines refresh from current line and circle geometry', () => {
  const scene: DynamicGeometryScene = {
    points: [
      { id: 'driver', name: 'A', x: 0, y: -10, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'other-endpoint', name: 'B', x: 0, y: 60, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      {
        id: 'intersection',
        name: 'D',
        x: 0,
        y: 20,
        size: 2,
        color: '#000',
        style: 'solid' as const,
        pageIndex: 0,
        dependsOn: {
          type: 'intersection' as const,
          parentLineIds: ['secant'],
          parentCircleIds: ['circle'],
          initialPos: { x: 0, y: 20 },
        },
      },
      {
        id: 'second-intersection',
        name: 'H',
        x: 0,
        y: -20,
        size: 2,
        color: '#000',
        style: 'solid' as const,
        pageIndex: 0,
        dependsOn: {
          type: 'intersection' as const,
          parentLineIds: ['secant'],
          parentCircleIds: ['circle'],
          intersectionIndex: 0,
          initialPos: { x: 0, y: -20 },
        },
      },
    ],
    lines: [
      {
        id: 'secant',
        p1: { x: 0, y: -30 },
        p2: { x: 0, y: 60 },
        p1PointId: 'driver',
        p2PointId: 'other-endpoint',
        thickness: 1,
        color: '#000',
        style: 'solid' as const,
        isInfinite: true,
        pageIndex: 0,
      },
      {
        id: 'tangent',
        p1: { x: 20, y: -10 },
        p2: { x: 20, y: 10 },
        thickness: 1,
        color: '#000',
        style: 'solid' as const,
        isInfinite: true,
        pageIndex: 0,
        dependsOn: {
          type: 'tangent' as const,
          parentPointIds: ['intersection'],
          parentCircleIds: ['circle'],
          tangentIndex: 0,
        },
      },
    ],
    circles: [
      { id: 'circle', center: { x: 0, y: 0 }, radius: 20, thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0 },
    ],
    polygons: [],
    angles: [],
  };

  const moved = updateGeometryOnPointMove(scene, 'driver', { x: 3, y: -30 });
  const intersection = moved.points.find((point) => point.id === 'intersection')!;
  const tangent = moved.lines.find((line) => line.id === 'tangent')!;
  assert.ok(Math.abs(Math.hypot(intersection.x, intersection.y) - 20) < 1e-6);
  assert.equal(tangent.hidden, false);
  assert.ok(Math.abs(distToLine(intersection, tangent.p1, tangent.p2)) < 1e-6);
  const tangentDirection = { x: tangent.p2.x - tangent.p1.x, y: tangent.p2.y - tangent.p1.y };
  assert.ok(Math.abs(intersection.x * tangentDirection.x + intersection.y * tangentDirection.y) < 1e-6);

  const movedOutside = updateGeometryOnPointMove(moved, 'driver', { x: 80, y: -30 });
  assert.equal(movedOutside.points.find((point) => point.id === 'intersection')?.hidden, true);
  assert.equal(movedOutside.points.find((point) => point.id === 'second-intersection')?.hidden, true);
  assert.equal(movedOutside.lines.find((line) => line.id === 'tangent')?.hidden, true);

  const movedBack = updateGeometryOnPointMove(movedOutside, 'driver', { x: 3, y: -30 });
  assert.equal(movedBack.points.find((point) => point.id === 'intersection')?.hidden, false);
  assert.equal(movedBack.points.find((point) => point.id === 'second-intersection')?.hidden, false);
});

test('tangent construction lines are hidden when their source point moves inside the circle', () => {
  const scene: DynamicGeometryScene = {
    points: [
      { id: 'source', name: 'P', x: 6, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
    ],
    lines: [
      {
        id: 'tangent',
        p1: { x: 0, y: -10 },
        p2: { x: 0, y: 10 },
        thickness: 1,
        color: '#000',
        style: 'solid' as const,
        isInfinite: true,
        pageIndex: 0,
        dependsOn: { type: 'tangent' as const, parentPointIds: ['source'], parentCircleIds: ['circle'], tangentIndex: 0 },
      },
    ],
    circles: [
      { id: 'circle', center: { x: 0, y: 0 }, radius: 5, thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0 },
    ],
    polygons: [],
    angles: [],
  };

  const moved = updateGeometryOnPointMove(scene, 'source', { x: 4, y: 0 });
  assert.equal(moved.lines[0].hidden, true);
});

test('circle intersections distinguish triangle side segments from their extensions', () => {
  const A = { x: 0, y: 3 };
  const B = { x: 0, y: 0 };
  const C = { x: 4, y: 0 };
  const incircle = getIncenter(A, B, C);
  const excircle = getExcenter(A, B, C, 'A');

  for (const [p1, p2] of [[A, B], [B, C], [C, A]]) {
    assert.equal(
      getLineCircleIntersections(p1, p2, incircle.center, incircle.radius, true).length,
      1,
    );
  }

  assert.equal(getLineCircleIntersections(B, C, excircle.center, excircle.radius, true).length, 1);
  assert.equal(getLineCircleIntersections(A, B, excircle.center, excircle.radius, true).length, 0);
  assert.equal(getLineCircleIntersections(C, A, excircle.center, excircle.radius, true).length, 0);
  assert.equal(getLineCircleIntersections(B, C, excircle.center, excircle.radius).length, 1);
  assert.equal(getLineCircleIntersections(A, B, excircle.center, excircle.radius).length, 1);
});

test('line intersections respect segment endpoints when requested', () => {
  const A = { x: 0, y: 0 };
  const B = { x: 10, y: 0 };
  const C = { x: 12, y: -2 };
  const D = { x: 12, y: 2 };
  assert.deepEqual(getLineLineIntersection(A, B, C, D, true, true), null);
  assert.deepEqual(getLineLineIntersection(A, B, C, D), { x: 12, y: 0 });
});

test('incircle and excircle side intersections stay attached while triangle vertices move', () => {
  const makeScene = (circleType: 'incircle' | 'excircle'): DynamicGeometryScene => {
    const A = { id: 'a', name: 'A', x: 0, y: 3, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 };
    const B = { id: 'b', name: 'B', x: 0, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 };
    const C = { id: 'c', name: 'C', x: 4, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 };
    const circleGeometry = circleType === 'incircle'
      ? getIncenter(A, B, C)
      : getExcenter(A, B, C, 'A');
    const lines = [
      { id: 'ab', p1: A, p2: B, p1PointId: 'a', p2PointId: 'b', thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'bc', p1: B, p2: C, p1PointId: 'b', p2PointId: 'c', thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'ca', p1: C, p2: A, p1PointId: 'c', p2PointId: 'a', thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0 },
    ];
    const circle = {
      id: 'circle',
      center: circleGeometry.center,
      radius: circleGeometry.radius,
      thickness: 1,
      color: '#000',
      style: 'solid' as const,
      pageIndex: 0,
      dependsOn: { type: circleType, parentPointIds: ['a', 'b', 'c'], ...(circleType === 'excircle' ? { vertex: 'A' as const } : {}) },
    };
    const points = lines.flatMap((line) =>
      getLineCircleIntersections(
        line.p1,
        line.p2,
        circle.center,
        circle.radius,
        circleType !== 'excircle',
      )
        .map((position, index) => ({
          id: `int-${line.id}-${index}`,
          name: '',
          ...position,
          size: 2,
          color: '#000',
          style: 'solid' as const,
          pageIndex: 0,
          dependsOn: {
            type: 'intersection' as const,
            parentLineIds: [line.id],
            parentCircleIds: [circle.id],
            initialPos: position,
          },
        })),
    );
    return { points: [A, B, C, ...points], lines, circles: [circle], polygons: [], angles: [] };
  };

  for (const circleType of ['incircle', 'excircle'] as const) {
    let scene = makeScene(circleType);
    for (const vertexPosition of [{ x: 1, y: 4 }, { x: 2, y: 6 }, { x: 4, y: 5 }, { x: 1, y: 4 }]) {
      scene = updateGeometryOnPointMove(scene, 'a', vertexPosition);
      const circle = scene.circles[0];
      const intersections = scene.points.filter((point) => point.dependsOn?.type === 'intersection');

      assert.equal(intersections.length, 3);
      for (const point of intersections) {
        assert.ok(Math.abs(dist(point, circle.center) - circle.radius) < 1e-7);
        const line = scene.lines.find((candidate) => candidate.id === point.dependsOn?.parentLineIds?.[0]);
        assert.ok(line);
        const distance = circleType === 'excircle'
          ? distToLine(point, line.p1, line.p2)
          : distToSegment(point, line.p1, line.p2);
        assert.ok(distance < 1e-7);
      }
    }
  }
});

test('point movement keeps subpixel coordinates without integer snapping', () => {
  const scene = {
    points: [{ id: 'p', name: 'P', x: 0, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 }],
    lines: [],
    circles: [],
    polygons: [],
    angles: [],
  };
  const moved = updateGeometryOnPointMove(scene, 'p', { x: 10.1234567, y: 20.7654321 });
  assert.equal(moved.points[0].x, 10.1234567);
  assert.equal(moved.points[0].y, 20.7654321);
});

test('position coordinates are quantized to 1e-3 pixel steps without whole-pixel snapping', () => {
  assert.equal(POSITION_STEP_PIXELS, 1e-3);
  const requested = 10.1234567;
  const quantized = quantizePositionCoordinate(requested);
  assert.ok(Math.abs(quantized / POSITION_STEP_PIXELS - Math.round(quantized / POSITION_STEP_PIXELS)) < 1e-10);
  assert.ok(Math.abs(quantized - requested) <= POSITION_STEP_PIXELS / 2);
  assert.notEqual(quantized, Math.round(quantized));
  assert.ok(
    Math.abs(
      quantizePositionCoordinate(quantized + POSITION_STEP_PIXELS) -
      quantized -
      POSITION_STEP_PIXELS,
    ) < 1e-12,
  );
});

test('points constrained to segments stay between the segment endpoints', () => {
  assert.deepEqual(
    projectPointToSegment({ x: 15, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 }),
    { x: 10, y: 0 }
  );
  assert.deepEqual(
    projectPointToSegment({ x: -5, y: -4 }, { x: 0, y: 0 }, { x: 10, y: 0 }),
    { x: 0, y: 0 }
  );

  const scene = {
    points: [
      { id: 'c', name: 'C', x: 0, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'd', name: 'D', x: 10, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'g', name: 'G', x: 5, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0, dependsOn: { type: 'point-on-path' as const, parentLineIds: ['cd'] } },
    ],
    lines: [
      { id: 'cd', p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 }, p1PointId: 'c', p2PointId: 'd', thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0 },
    ],
    circles: [],
    polygons: [],
    angles: [],
  };
  const moved = updateGeometryOnPointMove(scene, 'g', { x: 15, y: 4 });
  assert.deepEqual(
    { x: moved.points.find((point) => point.id === 'g')?.x, y: moved.points.find((point) => point.id === 'g')?.y },
    { x: 10, y: 0 }
  );
});

test('locus of inverse points follows the full constrained source segment', () => {
  const circle = { center: { x: 5, y: 5 }, radius: 4 };
  const scene = {
    points: [
      { id: 'a', name: 'A', x: 5, y: 5, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'c', name: 'C', x: 0, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'd', name: 'D', x: 10, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'g', name: 'G', x: 5, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0, dependsOn: { type: 'point-on-path' as const, parentLineIds: ['cd'] } },
      { id: 'g-prime', name: "G'", x: 0, y: 0, size: 2, color: '#000', style: 'solid' as const, pageIndex: 0, dependsOn: { type: 'inversion' as const, parentPointIds: ['g'], parentCircleIds: ['inversion-circle'] } },
    ],
    lines: [
      { id: 'cd', p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 }, p1PointId: 'c', p2PointId: 'd', thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0 },
    ],
    circles: [
      { id: 'inversion-circle', ...circle, centerPointId: 'a', thickness: 1, color: '#000', style: 'solid' as const, pageIndex: 0 },
    ],
    polygons: [],
    angles: [],
  };

  const explicitPathSamples = calculateLocusSamples(scene, 'g-prime', 'g', 'cd', 32);
  const inferredPathSamples = calculateLocusSamples(scene, 'g-prime', 'g', undefined, 32);
  const inverseC = invertPoint({ x: 0, y: 0 }, circle);
  const inverseD = invertPoint({ x: 10, y: 0 }, circle);
  assert.equal(explicitPathSamples.length, 33);
  assert.equal(inferredPathSamples.length, 33);
  assert.ok(inverseC && inverseD);
  assert.ok(dist(explicitPathSamples[0], inverseC) < 1e-8);
  assert.ok(dist(explicitPathSamples[explicitPathSamples.length - 1], inverseD) < 1e-8);
  assert.ok(dist(inferredPathSamples[0], inverseC) < 1e-8);
  assert.ok(dist(inferredPathSamples[inferredPathSamples.length - 1], inverseD) < 1e-8);
  for (let i = 0; i < explicitPathSamples.length; i++) {
    const expected = invertPoint({ x: (10 * i) / 32, y: 0 }, circle);
    assert.ok(expected && dist(explicitPathSamples[i], expected) < 1e-8);
  }
});

test('conic constructions: ellipse, parabola, hyperbola', () => {
  // Ellipse with foci (-3, 0) and (3, 0) passing through (0, 4)
  // Distance from (-3,0) to (0,4) is 5, distance from (3,0) to (0,4) is 5 => 2a = 10, a = 5, c = 3 => b = 4
  const ellipse = getEllipse2Foci({ x: -3, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 4 });
  assert.ok(ellipse !== null);
  assert.equal(ellipse!.a, 5);
  assert.equal(ellipse!.b, 4);
  assert.equal(ellipse!.center.x, 0);
  assert.equal(ellipse!.center.y, 0);

  // Parabola with focus (0, 1) and directrix line from (-10, -1) to (10, -1)
  // p = 2, vertex = (0, 0)
  const parabola = getParabolaFocusDirectrix({ x: 0, y: 1 }, { x: -10, y: -1 }, { x: 10, y: -1 });
  assert.ok(parabola !== null);
  assert.ok(Math.abs(parabola!.vertex.x - 0) < 1e-4);
  assert.ok(Math.abs(parabola!.vertex.y - 0) < 1e-4);
  assert.ok(Math.abs(parabola!.p - 2) < 1e-4);

  // Hyperbola with foci (-5, 0) and (5, 0), passing through (3, 0)
  // 2c = 10 => c = 5. Point (3,0): d1 = 8, d2 = 2 => 2a = 6 => a = 3, b = sqrt(25-9) = 4
  const hyperbola = getHyperbola2Foci({ x: -5, y: 0 }, { x: 5, y: 0 }, { x: 3, y: 0 });
  assert.ok(hyperbola !== null);
  assert.equal(hyperbola!.a, 3);
  assert.equal(hyperbola!.b, 4);
});

test('moving a vertex of triangle ABC updates lines, polygon, circumcircle and centroid', () => {
  const ptA = { id: 'p_a', name: 'A', x: 0, y: 0, size: 3, color: '#000', style: 'solid' as const, pageIndex: 0 };
  const ptB = { id: 'p_b', name: 'B', x: 6, y: 0, size: 3, color: '#000', style: 'solid' as const, pageIndex: 0 };
  const ptC = { id: 'p_c', name: 'C', x: 0, y: 8, size: 3, color: '#000', style: 'solid' as const, pageIndex: 0 };

  const ptG = {
    id: 'p_g',
    name: 'G',
    x: 2,
    y: 8 / 3,
    size: 3,
    color: '#f00',
    style: 'solid' as const,
    pageIndex: 0,
    dependsOn: { type: 'centroid' as const, parentPointIds: ['p_a', 'p_b', 'p_c'] },
  };

  const lineAB = {
    id: 'l_ab',
    p1: { x: 0, y: 0 },
    p2: { x: 6, y: 0 },
    p1PointId: 'p_a',
    p2PointId: 'p_b',
    thickness: 2,
    color: '#000',
    style: 'solid' as const,
    pageIndex: 0,
  };

  const lineCA = {
    id: 'l_ca',
    p1: { x: 0, y: 8 },
    p2: { x: 0, y: 0 },
    p1PointId: 'p_c',
    p2PointId: 'p_a',
    thickness: 2,
    color: '#000',
    style: 'solid' as const,
    pageIndex: 0,
  };

  const polyABC = {
    id: 'poly_1',
    points: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 0, y: 8 }],
    pointIds: ['p_a', 'p_b', 'p_c'],
    thickness: 2,
    color: '#000',
    style: 'solid' as const,
    fillColor: 'rgba(0,0,0,0.1)',
    pageIndex: 0,
  };

  const circum = {
    id: 'c_circum',
    center: { x: 3, y: 4 },
    radius: 5,
    thickness: 1,
    color: '#00f',
    style: 'dash' as const,
    pageIndex: 0,
    dependsOn: { type: 'circumcircle' as const, parentPointIds: ['p_a', 'p_b', 'p_c'] },
  };

  const scene = {
    points: [ptA, ptB, ptC, ptG],
    lines: [lineAB, lineCA],
    polygons: [polyABC],
    circles: [circum],
    angles: [],
  };

  // Now move Point A from (0, 0) to (2, 2)
  const updated = updateGeometryOnPointMove(scene, 'p_a', { x: 2, y: 2 });

  // 1. Point A should be moved
  const newA = updated.points.find((p) => p.id === 'p_a')!;
  assert.equal(newA.x, 2);
  assert.equal(newA.y, 2);

  // 2. Line AB should have its p1 updated to (2, 2)
  const newAB = updated.lines.find((l) => l.id === 'l_ab')!;
  assert.equal(newAB.p1.x, 2);
  assert.equal(newAB.p1.y, 2);

  // 3. Line CA should have its p2 updated to (2, 2)
  const newCA = updated.lines.find((l) => l.id === 'l_ca')!;
  assert.equal(newCA.p2.x, 2);
  assert.equal(newCA.p2.y, 2);

  // 4. Polygon vertex A should be updated to (2, 2)
  const newPoly = updated.polygons.find((p) => p.id === 'poly_1')!;
  assert.equal(newPoly.points[0].x, 2);
  assert.equal(newPoly.points[0].y, 2);

  // 5. Centroid G should be recomputed with high floating-point precision: (8/3, 10/3)
  const newG = updated.points.find((p) => p.id === 'p_g')!;
  assert.ok(Math.abs(newG.x - 8 / 3) < 1e-4);
  assert.ok(Math.abs(newG.y - 10 / 3) < 1e-4);

  // 6. Circumcircle should be recomputed
  const newCircum = updated.circles.find((c) => c.id === 'c_circum')!;
  assert.ok(newCircum.radius > 0);
});

test('distToSegment and distToLine calculations', () => {
  const A = { x: 0, y: 0 };
  const B = { x: 10, y: 0 };

  // Point above midpoint
  const P1 = { x: 5, y: 4 };
  assert.equal(distToSegment(P1, A, B), 4);
  assert.equal(distToLine(P1, A, B), 4);

  // Point beyond endpoint B
  const P2 = { x: 13, y: 4 };
  assert.equal(distToSegment(P2, A, B), 5); // Distance to B (10, 0): hypot(3, 4) = 5
  assert.equal(distToLine(P2, A, B), 4);    // Distance to infinite line y = 0
});

test('fitConic5Points with normalized coordinates on a circle', () => {
  // 5 points on a circle centered at (300, 400) with radius 100
  const center = { x: 300, y: 400 };
  const r = 100;
  const angles = [0, Math.PI / 4, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const pts = angles.map((ang) => ({
    x: center.x + r * Math.cos(ang),
    y: center.y + r * Math.sin(ang),
  }));

  const coeffs = fitConic5Points(pts);
  assert.ok(coeffs !== null);
  const [A, B, C, D, E, F] = coeffs!;

  // For a circle, A ≈ C and B ≈ 0
  assert.ok(Math.abs(A - C) < 1e-3);
  assert.ok(Math.abs(B) < 1e-3);

  // Each point should satisfy the equation Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0
  for (const pt of pts) {
    const val = A * pt.x * pt.x + B * pt.x * pt.y + C * pt.y * pt.y + D * pt.x + E * pt.y + F;
    assert.ok(Math.abs(val) < 1e-3);
  }
});

test('mixtilinear excircle calculation', () => {
  const A = { x: 0, y: 0 };
  const B = { x: 4, y: 0 };
  const C = { x: 0, y: 3 };
  const mixEx = getMixtilinearExcircle(A, B, C);
  assert.ok(mixEx.radius > 0);
  assert.ok(Number.isFinite(mixEx.center.x));
  assert.ok(Number.isFinite(mixEx.center.y));
});

test('mixtilinear circles and circumcircle touchpoints satisfy their defining tangencies', () => {
  const A = { x: 80, y: 100 };
  const B = { x: 390, y: 120 };
  const C = { x: 150, y: 360 };
  const circumcircle = getCircumcenter(A, B, C);
  assert.ok(circumcircle);

  const incircle = getMixtilinearIncircle(A, B, C);
  const incircleCenterDistance = dist(incircle.center, circumcircle.center);
  assert.ok(Math.abs(incircleCenterDistance + incircle.radius - circumcircle.radius) < 1e-7);
  assert.ok(Math.abs(dist(incircle.touchpoint, circumcircle.center) - circumcircle.radius) < 1e-7);
  assert.ok(Math.abs(dist(incircle.center, incircle.touchpoint) - incircle.radius) < 1e-7);
  assert.ok(Math.abs(distToLine(incircle.center, A, B) - incircle.radius) < 1e-7);
  assert.ok(Math.abs(distToLine(incircle.center, A, C) - incircle.radius) < 1e-7);

  const excircle = getMixtilinearExcircle(A, B, C);
  const excircleCenterDistance = dist(excircle.center, circumcircle.center);
  assert.ok(Math.abs(excircleCenterDistance - circumcircle.radius - excircle.radius) < 1e-7);
  assert.ok(Math.abs(dist(excircle.touchpoint, circumcircle.center) - circumcircle.radius) < 1e-7);
  assert.ok(Math.abs(dist(excircle.center, excircle.touchpoint) - excircle.radius) < 1e-7);
  assert.ok(Math.abs(distToLine(excircle.center, A, B) - excircle.radius) < 1e-7);
  assert.ok(Math.abs(distToLine(excircle.center, A, C) - excircle.radius) < 1e-7);
});

test('mixtilinear incircle and excircle touchpoint cevians meet at their respective similicenter', () => {
  const A = { x: 80, y: 100 };
  const B = { x: 390, y: 120 };
  const C = { x: 150, y: 360 };
  const circumcircle = getCircumcenter(A, B, C);
  assert.ok(circumcircle);
  const incircle = getIncenter(A, B, C);
  const internalSimilicenter = {
    x: (circumcircle.radius * incircle.center.x + incircle.radius * circumcircle.center.x) /
      (circumcircle.radius + incircle.radius),
    y: (circumcircle.radius * incircle.center.y + incircle.radius * circumcircle.center.y) /
      (circumcircle.radius + incircle.radius),
  };
  const externalSimilicenter = {
    x: (circumcircle.radius * incircle.center.x - incircle.radius * circumcircle.center.x) /
      (circumcircle.radius - incircle.radius),
    y: (circumcircle.radius * incircle.center.y - incircle.radius * circumcircle.center.y) /
      (circumcircle.radius - incircle.radius),
  };
  const assertConcurrent = (touchpoints: [Point2D, Point2D, Point2D], expected: Point2D) => {
    const [D, E, F] = touchpoints;
    const intersection = getLineLineIntersection(A, D, B, E);
    assert.ok(intersection);
    assert.ok(dist(intersection, expected) < 1e-7);
    const lineLength = dist(C, F);
    const cross = (C.x - intersection.x) * (F.y - intersection.y) -
      (C.y - intersection.y) * (F.x - intersection.x);
    assert.ok(Math.abs(cross) / lineLength < 1e-7);
  };

  assertConcurrent(
    [
      getMixtilinearIncircle(A, B, C).touchpoint,
      getMixtilinearIncircle(B, C, A).touchpoint,
      getMixtilinearIncircle(C, A, B).touchpoint,
    ],
    externalSimilicenter
  );
  assertConcurrent(
    [
      getMixtilinearExcircle(A, B, C).touchpoint,
      getMixtilinearExcircle(B, C, A).touchpoint,
      getMixtilinearExcircle(C, A, B).touchpoint,
    ],
    internalSimilicenter
  );
});

test('mixtilinear circumcircle touchpoints update when their defining triangle moves', () => {
  const scene: DynamicGeometryScene = {
    points: [
      { id: 'A', name: 'A', x: 80, y: 100, size: 3, color: '#000', style: 'solid', pageIndex: 0 },
      { id: 'B', name: 'B', x: 390, y: 120, size: 3, color: '#000', style: 'solid', pageIndex: 0 },
      { id: 'C', name: 'C', x: 150, y: 360, size: 3, color: '#000', style: 'solid', pageIndex: 0 },
      {
        id: 'D',
        name: 'D',
        x: 0,
        y: 0,
        size: 3,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'mixtilinear-incircle-touchpoint', parentPointIds: ['A', 'B', 'C'] },
      },
      {
        id: 'E',
        name: 'E',
        x: 0,
        y: 0,
        size: 3,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'mixtilinear-excircle-touchpoint', parentPointIds: ['A', 'B', 'C'] },
      },
    ],
    lines: [],
    circles: [
      {
        id: 'incircle',
        center: { x: 0, y: 0 },
        radius: 0,
        thickness: 2,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'mixtilinear-incircle', parentPointIds: ['A', 'B', 'C'], vertex: 'A' },
      },
      {
        id: 'excircle',
        center: { x: 0, y: 0 },
        radius: 0,
        thickness: 2,
        color: '#000',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'mixtilinear-excircle', parentPointIds: ['A', 'B', 'C'], vertex: 'A' },
      },
    ],
    polygons: [],
    angles: [],
  };

  const updated = updateGeometryOnPointMove(scene, 'B', { x: 420, y: 140 });
  const [A, B, C] = updated.points;
  const expectedIncircleTouchpoint = getMixtilinearIncircle(A, B, C).touchpoint;
  const expectedExcircleTouchpoint = getMixtilinearExcircle(A, B, C).touchpoint;
  const pointD = updated.points.find((point) => point.id === 'D')!;
  const pointE = updated.points.find((point) => point.id === 'E')!;
  assert.ok(dist(pointD, expectedIncircleTouchpoint) < 1e-7);
  assert.ok(dist(pointE, expectedExcircleTouchpoint) < 1e-7);
});

test('mixtilinear incircle center stays anchored to vertex A when point moves and does NOT jump to B or C', () => {
  const initialScene = {
    points: [
      { id: 'p_a', name: 'A', x: 280, y: 320, size: 3, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'p_b', name: 'B', x: 520, y: 320, size: 3, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'p_c', name: 'C', x: 400, y: 150, size: 3, color: '#000', style: 'solid' as const, pageIndex: 0 },
    ],
    lines: [],
    circles: [
      {
        id: 'mix_circ_a',
        center: { x: 300, y: 310 },
        radius: 40,
        dependsOn: { type: 'mixtilinear-incircle' as const, parentPointIds: ['p_a', 'p_b', 'p_c'], vertex: 'A' as const },
        thickness: 2,
        color: '#2563eb',
        style: 'solid' as const,
        pageIndex: 0,
      },
    ],
    polygons: [],
    conics: [],
    angles: [],
  };

  // Move point A towards B
  const updated = updateGeometryOnPointMove(initialScene, 'p_a', { x: 310, y: 320 });
  const circ = updated.circles.find((c) => c.id === 'mix_circ_a')!;
  
  // Center must NOT jump to point B(520, 320) or point C(400, 150)
  assert.notEqual(circ.center.x, 520);
  assert.notEqual(circ.center.y, 320);
  assert.notEqual(circ.center.x, 400);
  assert.notEqual(circ.center.y, 150);
  assert.ok(circ.radius > 0);
});

test('conic reacts and moves when focus point moves', () => {
  const initialScene = {
    points: [
      { id: 'f1', name: 'F1', x: 100, y: 200, size: 3, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'f2', name: 'F2', x: 300, y: 200, size: 3, color: '#000', style: 'solid' as const, pageIndex: 0 },
      { id: 'p', name: 'P', x: 200, y: 150, size: 3, color: '#000', style: 'solid' as const, pageIndex: 0 },
    ],
    lines: [],
    circles: [],
    polygons: [],
    conics: [
      {
        id: 'ell_1',
        type: 'ellipse' as const,
        subType: 'ellipse-2foci-1pt' as const,
        foci: [{ x: 100, y: 200 }, { x: 300, y: 200 }] as [Point2D, Point2D],
        fociPointIds: ['f1', 'f2'] as [string, string],
        point: { x: 200, y: 150 },
        pointId: 'p',
        thickness: 2,
        color: '#d97706',
        style: 'solid' as const,
        pageIndex: 0,
      },
    ],
    angles: [],
  };

  // Move focus f1 to (120, 210)
  const updated = updateGeometryOnPointMove(initialScene, 'f1', { x: 120, y: 210 });
  const conic = updated.conics!.find((c) => c.id === 'ell_1')!;
  assert.equal(conic.foci![0].x, 120);
  assert.equal(conic.foci![0].y, 210);
});

test('isogonal line calculation reflects ray AP across angle BAC bisector', () => {
  const A = { x: 0, y: 0 };
  const B = { x: 10, y: 0 }; // Along positive x-axis (0 rad)
  const C = { x: 0, y: 10 }; // Along positive y-axis (pi/2 rad)
  // Bisector of angle BAC is at pi/4 (45 degrees)
  // If P is at (10, 0), angle is 0, its isogonal line should be along angle 2*(pi/4) - 0 = pi/2 (along AC!)
  const P = { x: 10, y: 0 };
  const iso = getIsogonalLine(A, B, C, P, 100);
  assert.ok(Math.abs(iso.p2.x - 0) < 1e-4);
  assert.ok(Math.abs(iso.p2.y - 100) < 1e-4);
});

test('distToCircle and distToConic hit testing', () => {
  const circle = {
    id: 'c1',
    center: { x: 100, y: 100 },
    radius: 50,
    thickness: 2,
    color: '#000',
    style: 'solid' as const,
    pageIndex: 0,
  };
  // Point on circle perimeter
  assert.equal(distToCircle({ x: 150, y: 100 }, circle), 0);
  // Point 10px outside
  assert.equal(distToCircle({ x: 160, y: 100 }, circle), 10);

  const conic = {
    id: 'cn1',
    type: 'ellipse' as const,
    subType: 'ellipse-2foci-1pt' as const,
    foci: [{ x: -3, y: 0 }, { x: 3, y: 0 }] as [Point2D, Point2D],
    point: { x: 0, y: 4 },
    thickness: 2,
    color: '#000',
    style: 'solid' as const,
    pageIndex: 0,
  };
  // Point (0, 4) is on the ellipse
  const d = distToConic({ x: 0, y: 4 }, conic);
  assert.ok(d < 1e-3);
});
