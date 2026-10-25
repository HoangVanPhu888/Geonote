import React, { useRef, useEffect, useLayoutEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import katex from 'katex';
import {
  PageData,
  ToolMode,
  LineStyle,
  FreehandStroke,
  LatexItem,
  GeoLocus,
} from '../types';
import {
  GeoPoint,
  GeoLine,
  GeoCircle,
  GeoAngle,
  GeoConic,
  GeoPolygon,
  Point2D,
  quantizePositionCoordinate,
  dist,
  distToSegment,
  distToLine,
  distToCircle,
  distToConic,
  distToAngle,
  projectPointToLine,
  projectPointToSegment,
  projectPointToCircle,
  projectPointToPolygon,
  projectPointToConic,
  reflectPointAcrossLine,
  getPerpendicularLine,
  getParallelLine,
  getCircleTangents,
  getFeuerbachPoint,
  getLineLineIntersection,
  getLineCircleIntersections,
  getCircleCircleIntersections,
  calculateLocusSamples,
  translateSelectedObjects,
  getCentroid,
  getCircumcenter,
  getIncenter,
  getOrthocenter,
  getNinePointCircle,
  getExcenter,
  getLemoinePoint,
  getHumptyPoint,
  getDumptyPoint,
  getGergonnePoint,
  getNagelPoint,
  getMixtilinearIncircle,
  getMixtilinearExcircle,
  getThebaultCircle,
  getRadicalAxis,
  perpendicularBisector,
  getAngleBisector,
  translatePoint,
  rotatePoint,
  dilatePoint,
  invertPoint,
  invertCircle,
  invertLine,
  getPolarLine,
  getPoleOfLine,
  getIsogonalLine,
  getIsogonalConjugate,
  getIsotomicConjugate,
  fitConic5Points,
  updateGeometryOnPointMove,
  deleteGeometryObjects,
  translateGeometryPoints,
  pointInPolygon,
} from '../geometry/engine';
import { renderCompletePage, drawGhostPreview, isUserDefinedLabel } from '../geometry/canvasRenderer';
import { Trash2, Edit3, Move, Copy, Plus, Minus, Check, CornerDownRight, RotateCw, Type, Crosshair, Orbit, Sliders, Eye, EyeOff } from 'lucide-react';

export const PAGE_WIDTH = 794; // A4 standard width in px at 96 DPI
export const PAGE_HEIGHT = 1123; // A4 standard height in px at 96 DPI

export interface A4PageCanvasRef {
  getCanvas: (scale?: number) => Promise<HTMLCanvasElement | null> | HTMLCanvasElement | null;
}

export type SelectedItemType = 'point' | 'line' | 'circle' | 'conic' | 'angle' | 'polygon' | 'stroke' | 'latex' | 'locus' | null;
type TransformTarget = { type: 'point' | 'line' | 'circle' | 'polygon' | 'conic' | 'angle'; id: string };

interface A4PageCanvasProps {
  page: PageData;
  pageIndex: number;
  zoom: number;
  tool: ToolMode;
  pointSize: number;
  pointStyle: 'solid' | 'hollow' | 'cross' | 'plus';
  pointColor: string;
  lineThickness: number;
  lineStyle: LineStyle;
  lineColor: string;
  fillColor: string;
  rotationAngleDeg?: number;
  onRotationAngleChange?: (deg: number) => void;
  onUpdatePage: (updater: (prevPage: PageData) => PageData, commitHistory?: boolean) => void;
  onEditLatex: (item: LatexItem) => void;
  onEditAngle?: (angle: GeoAngle) => void;
  onOpenPropertiesPanel?: () => void;
  onSelectObject?: (id: string | null, type: SelectedItemType) => void;
}

// Rule 12: Text option - only text enclosed in $, $$, or \[ \] is rendered as LaTeX
function renderMath(math: string, displayMode: boolean): string {
  return katex.renderToString(math, { displayMode, throwOnError: false });
}

function renderMixedText(raw: string): string {
  if (!raw) return '';
  const hasLatex = /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$/.test(raw);
  if (!hasLatex) {
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>');
  }

  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$)/g;
  let lastIndex = 0;
  let html = '';
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const textPiece = raw.substring(lastIndex, match.index);
      html += textPiece
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br/>');
    }
    const token = match[0];
    try {
      if (token.startsWith('$$') && token.endsWith('$$')) {
        const math = token.slice(2, -2);
        html += renderMath(math, true);
      } else if (token.startsWith('\\[') && token.endsWith('\\]')) {
        const math = token.slice(2, -2);
        html += renderMath(math, true);
      } else if (token.startsWith('$') && token.endsWith('$')) {
        const math = token.slice(1, -1);
        html += renderMath(math, false);
      }
    } catch {
      html += token;
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < raw.length) {
    const textPiece = raw.substring(lastIndex);
    html += textPiece
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>');
  }

  return html;
}

function removeUnreferencedTemporaryPoints(page: PageData, temporaryPointIds: string[]): PageData {
  const referencedPointIds = new Set<string>();
  const remember = (ids?: string[]) => ids?.forEach((id) => referencedPointIds.add(id));

  page.points.forEach((point) => remember(point.dependsOn?.parentPointIds));
  page.lines.forEach((line) => {
    remember([line.p1PointId, line.p2PointId].filter((id): id is string => !!id));
    remember(line.dependsOn?.parentPointIds);
  });
  page.circles.forEach((circle) => {
    remember([circle.centerPointId, circle.radiusPointId].filter((id): id is string => !!id));
    remember(circle.dependsOn?.parentPointIds);
  });
  page.polygons.forEach((polygon) => {
    remember(polygon.pointIds);
    remember(polygon.dependsOn?.parentPointIds);
  });
  page.conics.forEach((conic) => {
    remember(conic.fociPointIds);
    remember(conic.directrixPointIds);
    remember(conic.points5Ids);
    remember([conic.focusPointId, conic.pointId].filter((id): id is string => !!id));
    remember(conic.dependsOn?.parentPointIds);
  });
  page.angles.forEach((angle) => {
    remember([angle.centerPointId, angle.p1PointId, angle.p2PointId, angle.throughPointId]
      .filter((id): id is string => !!id));
    remember(angle.dependsOn?.parentPointIds);
  });
  page.loci?.forEach((locus) => remember([locus.dependentPointId, locus.driverPointId]));

  const removableIds = new Set(temporaryPointIds.filter((id) => !referencedPointIds.has(id)));
  if (removableIds.size === 0) return page;
  return { ...page, points: page.points.filter((point) => !removableIds.has(point.id)) };
}

export const A4PageCanvas = forwardRef<A4PageCanvasRef, A4PageCanvasProps>(({
  page,
  pageIndex,
  zoom,
  tool,
  pointSize,
  pointStyle,
  pointColor,
  lineThickness,
  lineStyle,
  lineColor,
  fillColor,
  rotationAngleDeg = 45,
  onRotationAngleChange,
  onUpdatePage,
  onEditLatex,
  onEditAngle,
  onOpenPropertiesPanel,
  onSelectObject,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interaction temp state (for multi-click constructions)
  const [clickPoints, setClickPoints] = useState<GeoPoint[]>([]);
  const [clickCircleIds, setClickCircleIds] = useState<string[]>([]);
  const [clickLineIds, setClickLineIds] = useState<string[]>([]);
  const [transformTarget, setTransformTarget] = useState<TransformTarget | null>(null);
  const [hoverPos, setHoverPos] = useState<Point2D | null>(null);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[] | null>(null);

  // Right-click Context Menu state (Rules 5 & 13)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    id: string;
    type: SelectedItemType;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const menu = contextMenuRef.current;
    if (!contextMenu || !menu) return;

    const bounds = menu.getBoundingClientRect();
    const margin = 8;
    menu.style.left = `${Math.max(
      margin,
      Math.min(contextMenu.x + margin, window.innerWidth - bounds.width - margin)
    )}px`;
    menu.style.top = `${Math.max(
      margin,
      Math.min(contextMenu.y + margin, window.innerHeight - bounds.height - margin)
    )}px`;
  }, [contextMenu]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Selection states for ANY object (multi-selection support)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<SelectedItemType>(null);
  const [selectedLatexId, setSelectedLatexId] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Dragging & Marquee Box states
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const dragStartPosRef = useRef<Point2D | null>(null);
  const clickSelectionRef = useRef<{ id: string; wasSelected: boolean } | null>(null);
  const dragPointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const objectDragMovedRef = useRef(false);
  const objectDragCandidateRef = useRef(false);
  const [marqueeBox, setMarqueeBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const marqueeStartRef = useRef<Point2D | null>(null);
  const pageRef = useRef(page);
  const zoomRef = useRef(zoom);
  const selectedIdsRef = useRef(selectedIds);
  const marqueeBoxRef = useRef(marqueeBox);
  pageRef.current = page;
  zoomRef.current = zoom;
  selectedIdsRef.current = selectedIds;
  marqueeBoxRef.current = marqueeBox;

  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);
  const [draggedLabelPointId, setDraggedLabelPointId] = useState<string | null>(null);
  const [draggedLabelItem, setDraggedLabelItem] = useState<{ id: string; type: SelectedItemType } | null>(null);
  const [tempCreatedPointIds, setTempCreatedPointIds] = useState<string[]>([]);
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [draggedPolyId, setDraggedPolyId] = useState<string | null>(null);
  const polyDragStartRef = useRef<Point2D | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Cleanup temporary points if tool changes without completing construction (Item 20)
  const prevToolRef = useRef<ToolMode>(tool);
  useEffect(() => {
    if (prevToolRef.current !== tool) {
      if (tempCreatedPointIds.length > 0) {
        onUpdatePage((p) => removeUnreferencedTemporaryPoints(p, tempCreatedPointIds), false);
        setTempCreatedPointIds([]);
      }
      setClickPoints([]);
      setClickCircleIds([]);
      setClickLineIds([]);
      setTransformTarget(null);
      setSelectedIds(new Set());
      setSelectedId(null);
      setSelectedType(null);
      setSelectedPointId(null);
      setSelectedLatexId(null);
      setContextMenu(null);
      clickSelectionRef.current = null;
      prevToolRef.current = tool;
    }
  }, [tool, tempCreatedPointIds, onUpdatePage]);

  // Global keyboard shortcuts for Delete, Hide (Ctrl+H), and Esc (Item 4, 8)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLatexId) {
          e.preventDefault();
          cascadeDelete(selectedLatexId, 'latex');
        } else if (selectedId || selectedIds.size > 0) {
          e.preventDefault();
          deleteSelected();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        const idsToToggle = new Set(selectedIds);
        if (selectedId) idsToToggle.add(selectedId);
        if (idsToToggle.size > 0) {
          onUpdatePage((p) => ({
            ...p,
            points: p.points.map((pt) => idsToToggle.has(pt.id) ? { ...pt, hidden: !pt.hidden } : pt),
            lines: p.lines.map((l) => idsToToggle.has(l.id) ? { ...l, hidden: !l.hidden } : l),
            circles: p.circles.map((c) => idsToToggle.has(c.id) ? { ...c, hidden: !c.hidden } : c),
            angles: p.angles.map((a) => idsToToggle.has(a.id) ? { ...a, hidden: !a.hidden } : a),
            conics: p.conics.map((cn) => idsToToggle.has(cn.id) ? { ...cn, hidden: !cn.hidden } : cn),
            polygons: p.polygons.map((poly) => idsToToggle.has(poly.id) ? { ...poly, hidden: !poly.hidden } : poly),
          }), true);
        }
      } else if (e.key === 'Escape') {
        if (tempCreatedPointIds.length > 0) {
          onUpdatePage((p) => removeUnreferencedTemporaryPoints(p, tempCreatedPointIds), false);
          setTempCreatedPointIds([]);
        }
        setClickPoints([]);
        setClickCircleIds([]);
        setClickLineIds([]);
        setSelectedLatexId(null);
        setSelectedPointId(null);
        setSelectedId(null);
        setSelectedType(null);
        setSelectedIds(new Set());
        setHoverPos(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedIds, selectedLatexId, tempCreatedPointIds, onUpdatePage]);


  // Centralized cascade delete for ANY object
  const cascadeDelete = (targetId: string, type?: SelectedItemType) => {
    onUpdatePage((p) => {
      const geometry = deleteGeometryObjects(p, [targetId]);
      return {
        ...geometry,
        strokes: type === 'stroke' || p.strokes.some((stroke) => stroke.id === targetId)
          ? p.strokes.filter((stroke) => stroke.id !== targetId)
          : p.strokes,
        latexItems: type === 'latex' || p.latexItems.some((item) => item.id === targetId)
          ? p.latexItems.filter((item) => item.id !== targetId)
          : p.latexItems,
      };
    }, true);

    setSelectedIds(new Set());
    setSelectedId(null);
    setSelectedType(null);
    setSelectedPointId(null);
    setSelectedLatexId(null);
  };

  // Batch delete selected objects
  const deleteSelected = () => {
    onUpdatePage((p) => {
      const idsToDelete = new Set(selectedIds);
      if (selectedId) idsToDelete.add(selectedId);
      if (idsToDelete.size === 0) return p;
      const geometry = deleteGeometryObjects(p, idsToDelete);
      return {
        ...geometry,
        strokes: p.strokes.filter((s) => !idsToDelete.has(s.id)),
        latexItems: p.latexItems.filter((it) => !idsToDelete.has(it.id)),
      };
    }, true);

    setSelectedIds(new Set());
    setSelectedId(null);
    setSelectedType(null);
    setSelectedPointId(null);
    setSelectedLatexId(null);
  };

  // Window-level pointer listeners keep touch and mouse drags active outside the canvas.
  useEffect(() => {
    if (!draggedPointId && !draggedPolyId && !draggedLabelPointId && !draggedLabelItem && !isDraggingSelection && !marqueeStartRef.current) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const currentZoom = zoomRef.current;
      const pos: Point2D = {
        x: quantizePositionCoordinate((e.clientX - rect.left) / currentZoom),
        y: quantizePositionCoordinate((e.clientY - rect.top) / currentZoom),
      };

      if (draggedLabelItem) {
        // Freely drag ANY object's label with smooth floating precision and max 0.67 cm clamp (Rule 15)
        const MAX_LABEL_DISTANCE_PX = 0.67 * (794 / 21.0); // 25.33 px
        const clampLabel = (rawDx: number, rawDy: number): Point2D => {
          const d = Math.hypot(rawDx, rawDy);
          if (d <= MAX_LABEL_DISTANCE_PX || d === 0) return { x: rawDx, y: rawDy };
          const factor = MAX_LABEL_DISTANCE_PX / d;
          return { x: rawDx * factor, y: rawDy * factor };
        };

        onUpdatePage((p) => {
          const { id, type } = draggedLabelItem;
          if (type === 'point') {
            return {
              ...p,
              points: p.points.map((pt) =>
                pt.id === id ? { ...pt, labelOffset: clampLabel(pos.x - pt.x, pos.y - pt.y) } : pt
              ),
            };
          }
          if (type === 'line') {
            return {
              ...p,
              lines: p.lines.map((l) => {
                if (l.id !== id) return l;
                const mx = (l.p1.x + l.p2.x) / 2;
                const my = (l.p1.y + l.p2.y) / 2;
                return { ...l, labelOffset: clampLabel(pos.x - mx, pos.y - my) };
              }),
            };
          }
          if (type === 'circle') {
            return {
              ...p,
              circles: p.circles.map((c) => {
                if (c.id !== id) return c;
                return { ...c, labelOffset: clampLabel(pos.x - c.center.x, pos.y - (c.center.y - c.radius)) };
              }),
            };
          }
          if (type === 'angle') {
            return {
              ...p,
              angles: p.angles.map((a) => {
                if (a.id !== id) return a;
                return { ...a, labelOffset: clampLabel(pos.x - a.center.x, pos.y - a.center.y) };
              }),
            };
          }
          if (type === 'polygon') {
            return {
              ...p,
              polygons: p.polygons.map((poly) => {
                if (poly.id !== id) return poly;
                const cx = poly.points.reduce((s, pt) => s + pt.x, 0) / (poly.points.length || 1);
                const cy = poly.points.reduce((s, pt) => s + pt.y, 0) / (poly.points.length || 1);
                return { ...poly, labelOffset: clampLabel(pos.x - cx, pos.y - cy) };
              }),
            };
          }
          return p;
        }, false);
      } else if (draggedLabelPointId) {
        const MAX_LABEL_DISTANCE_PX = 0.67 * (794 / 21.0);
        const clampLabel = (rawDx: number, rawDy: number): Point2D => {
          const d = Math.hypot(rawDx, rawDy);
          if (d <= MAX_LABEL_DISTANCE_PX || d === 0) return { x: rawDx, y: rawDy };
          const factor = MAX_LABEL_DISTANCE_PX / d;
          return { x: rawDx * factor, y: rawDy * factor };
        };

        onUpdatePage((p) => ({
          ...p,
          points: p.points.map((pt) =>
            pt.id === draggedLabelPointId
              ? { ...pt, labelOffset: clampLabel(pos.x - pt.x, pos.y - pt.y) }
              : pt
          ),
        }), false);
      } else if (isDraggingSelection && dragStartPosRef.current && selectedIdsRef.current.size > 0) {
        const delta = {
          x: pos.x - dragStartPosRef.current.x,
          y: pos.y - dragStartPosRef.current.y,
        };
        dragStartPosRef.current = pos;
        onUpdatePage((p) => translateSelectedObjects(p, selectedIdsRef.current, delta), false);
      } else if (draggedPointId) {
        onUpdatePage((p) => updateGeometryOnPointMove(p, draggedPointId, pos), false);
      } else if (draggedPolyId && polyDragStartRef.current) {
        const delta = {
          x: pos.x - polyDragStartRef.current.x,
          y: pos.y - polyDragStartRef.current.y,
        };
        polyDragStartRef.current = pos;
        onUpdatePage((p) => {
          const poly = p.polygons.find((item) => item.id === draggedPolyId);
          if (poly && poly.pointIds && poly.pointIds.length > 0) {
            return translateGeometryPoints(p, poly.pointIds, delta);
          }
          return {
            ...p,
            polygons: p.polygons.map((pl) =>
              pl.id === draggedPolyId
                ? { ...pl, points: pl.points.map((pt) => ({ x: pt.x + delta.x, y: pt.y + delta.y })) }
                : pl
            ),
          };
        }, false);
      } else if (marqueeStartRef.current) {
        setMarqueeBox({
          x1: marqueeStartRef.current.x,
          y1: marqueeStartRef.current.y,
          x2: pos.x,
          y2: pos.y,
        });
      }
    };

    const handleWindowPointerUp = () => {
      if (isDraggingSelection || draggedPointId || draggedPolyId || draggedLabelPointId) {
        onUpdatePage((p) => p, true);
      }

      const currentMarqueeBox = marqueeBoxRef.current;
      if (marqueeStartRef.current && currentMarqueeBox) {
        const minX = Math.min(currentMarqueeBox.x1, currentMarqueeBox.x2);
        const maxX = Math.max(currentMarqueeBox.x1, currentMarqueeBox.x2);
        const minY = Math.min(currentMarqueeBox.y1, currentMarqueeBox.y2);
        const maxY = Math.max(currentMarqueeBox.y1, currentMarqueeBox.y2);

        if (maxX - minX > 5 || maxY - minY > 5) {
          const currentPage = pageRef.current;
          const newSelected = new Set(selectedIdsRef.current);
          for (const pt of currentPage.points) {
            if (pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY) {
              newSelected.add(pt.id);
            }
          }
          for (const l of currentPage.lines) {
            if ((l.p1.x >= minX && l.p1.x <= maxX && l.p1.y >= minY && l.p1.y <= maxY) ||
                (l.p2.x >= minX && l.p2.x <= maxX && l.p2.y >= minY && l.p2.y <= maxY)) {
              newSelected.add(l.id);
            }
          }
          for (const c of currentPage.circles) {
            if (c.center.x >= minX && c.center.x <= maxX && c.center.y >= minY && c.center.y <= maxY) {
              newSelected.add(c.id);
            }
          }
          for (const cn of currentPage.conics) {
            const pX = cn.point?.x || cn.focus?.x || cn.foci?.[0]?.x || 0;
            const pY = cn.point?.y || cn.focus?.y || cn.foci?.[0]?.y || 0;
            if (pX >= minX && pX <= maxX && pY >= minY && pY <= maxY) {
              newSelected.add(cn.id);
            }
          }
          for (const poly of currentPage.polygons) {
            if (poly.points.some((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY)) {
              newSelected.add(poly.id);
            }
          }
          for (const loc of currentPage.loci || []) {
            if (loc.samples.some((s) => s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY)) {
              newSelected.add(loc.id);
            }
          }

          if (newSelected.size > 0) {
            setSelectedIds(newSelected);
            const firstId = Array.from(newSelected)[0];
            setSelectedId(firstId);
            if (currentPage.points.some((p) => p.id === firstId)) setSelectedType('point');
            else if (currentPage.lines.some((l) => l.id === firstId)) setSelectedType('line');
            else if (currentPage.circles.some((c) => c.id === firstId)) setSelectedType('circle');
            else if (currentPage.conics.some((c) => c.id === firstId)) setSelectedType('conic');
            else if (currentPage.polygons.some((pl) => pl.id === firstId)) setSelectedType('polygon');
            else if (currentPage.loci?.some((loc) => loc.id === firstId)) setSelectedType('locus');
          }
        }
        setMarqueeBox(null);
        marqueeStartRef.current = null;
      }

      setIsDraggingSelection(false);
      dragStartPosRef.current = null;
      setDraggedPointId(null);
      setDraggedLabelPointId(null);
      setDraggedLabelItem(null);
      setDraggedPolyId(null);
      polyDragStartRef.current = null;
      setIsMouseDown(false);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [draggedPointId, draggedLabelPointId, draggedLabelItem, draggedPolyId, isDraggingSelection, onUpdatePage]);

  // Expose method to render high-res canvas for PDF generation with full KaTeX formulas
  useImperativeHandle(ref, () => ({
    getCanvas: async (scale = 2) => {
      const offscreen = document.createElement('canvas');
      offscreen.width = Math.round(PAGE_WIDTH * scale);
      offscreen.height = Math.round(PAGE_HEIGHT * scale);
      const ctx = offscreen.getContext('2d');
      if (!ctx) return null;

      renderCompletePage(ctx, page, offscreen.width, offscreen.height, scale, null, null);

      for (const item of page.latexItems) {
        try {
          const html = renderMixedText(item.latex);
          const approxW = Math.max(320, item.latex.length * item.fontSize * 1.5) * scale;
          const approxH = Math.max(60, item.fontSize * 3.5) * scale;

          const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${approxW}" height="${approxH}">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml" style="font-size: ${item.fontSize * scale}px; color: ${item.color}; font-family: Euclid, 'Euclid Math One', Cambria, serif; font-weight: ${item.bold ? 700 : 400}; font-style: ${item.italic ? 'italic' : 'normal'}; text-decoration: ${item.underline ? 'underline' : 'none'}; display: inline-block;">
                ${html}
              </div>
            </foreignObject>
          </svg>`;

          const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const img = new Image();

          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, item.x * scale, item.y * scale);
              URL.revokeObjectURL(url);
              resolve();
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              ctx.font = `${item.italic ? 'italic ' : ''}${item.bold ? 'bold ' : ''}${item.fontSize * scale}px Euclid, "Euclid Math One", Cambria, serif`;
              ctx.fillStyle = item.color;
              const clean = item.latex.replace(/\\(text|mathbf|mathcal)/g, '').replace(/[{}\\]/g, ' ');
              ctx.fillText(clean, item.x * scale, (item.y + item.fontSize) * scale);
              resolve();
            };
            img.src = url;
          });
        } catch {
          ctx.font = `${item.italic ? 'italic ' : ''}${item.bold ? 'bold ' : ''}${item.fontSize * scale}px Euclid, "Euclid Math One", Cambria, serif`;
          ctx.fillStyle = item.color;
          ctx.fillText(item.latex.replace(/[{}\\]/g, ' '), item.x * scale, (item.y + item.fontSize) * scale);
        }
      }

      return offscreen;
    },
  }));

  // Render on canvas whenever page data or zoom changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = PAGE_WIDTH * zoom;
    const height = PAGE_HEIGHT * zoom;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    renderCompletePage(ctx, page, width, height, zoom, selectedId, hoveredPointId, selectedIds, tool === 'unhide');

    // Draw marquee selection box if active
    if (marqueeBox) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
      const bx = Math.min(marqueeBox.x1, marqueeBox.x2) * zoom;
      const by = Math.min(marqueeBox.y1, marqueeBox.y2) * zoom;
      const bw = Math.abs(marqueeBox.x2 - marqueeBox.x1) * zoom;
      const bh = Math.abs(marqueeBox.y2 - marqueeBox.y1) * zoom;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.restore();
    }

    // Render ghost preview (rubber-banding) for current construction tool
    if (clickPoints.length > 0 && hoverPos) {
      drawGhostPreview(ctx, tool, clickPoints, hoverPos, zoom, lineColor);
    }

    // Render active in-progress stroke if drawing
    if (currentStroke && currentStroke.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = Math.max(8, lineThickness * zoom * 2.5);
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = Math.max(1, lineThickness * zoom);
      }
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x * zoom, currentStroke[0].y * zoom);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x * zoom, currentStroke[i].y * zoom);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Render active construction temporary points preview
    if (clickPoints.length > 0) {
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < clickPoints.length; i++) {
        const cp = clickPoints[i];
        ctx.beginPath();
        ctx.arc(cp.x * zoom, cp.y * zoom, 5 * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#b45309';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${i + 1}`, (cp.x + 7) * zoom, (cp.y - 4) * zoom);
      }
      ctx.restore();
    }

    // Highlight selected circle if radical axis or inversion is active
    if (clickCircleIds.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      for (const cId of clickCircleIds) {
        const c = page.circles.find((it) => it.id === cId);
        if (c) {
          ctx.beginPath();
          ctx.arc(c.center.x * zoom, c.center.y * zoom, (c.radius + 4) * zoom, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    ctx.restore();
  }, [page, zoom, currentStroke, clickPoints, clickCircleIds, hoverPos, selectedId, selectedIds, hoveredPointId, tool, lineColor, lineThickness]);

  const getCanvasCoords = (
    clientXOrEvent: number | { clientX: number; clientY: number },
    clientY?: number
  ): Point2D => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = typeof clientXOrEvent === 'number' ? clientXOrEvent : clientXOrEvent.clientX;
    const cy = typeof clientXOrEvent === 'number' ? (clientY ?? 0) : clientXOrEvent.clientY;
    return {
      x: quantizePositionCoordinate((cx - rect.left) / zoom),
      y: quantizePositionCoordinate((cy - rect.top) / zoom),
    };
  };

  const findNearestPoint = (pos: Point2D, threshold = 14): GeoPoint | null => {
    let nearest: GeoPoint | null = null;
    let minDist = threshold;
    for (const pt of page.points) {
      if (pt.hidden) continue;
      const d = dist(pos, pt);
      if (d < minDist) {
        minDist = d;
        nearest = pt;
      }
    }
    return nearest;
  };

  const selectRestoredObject = (id: string, type: Exclude<SelectedItemType, null>) => {
    setSelectedId(id);
    setSelectedType(type);
    setSelectedIds(new Set([id]));
    setSelectedPointId(type === 'point' ? id : null);
    onSelectObject?.(id, type);
  };

  const restoreHiddenObjectAt = (pos: Point2D): boolean => {
    const point = page.points.find((item) => item.hidden && dist(pos, item) <= 16);
    if (point) {
      onUpdatePage((p) => ({
        ...p,
        points: p.points.map((item) => item.id === point.id ? { ...item, hidden: false } : item),
      }), true);
      selectRestoredObject(point.id, 'point');
      return true;
    }

    const line = page.lines.find((item) => item.hidden && (
      item.isInfinite ? distToLine(pos, item.p1, item.p2) <= 14 : distToSegment(pos, item.p1, item.p2) <= 14
    ));
    if (line) {
      onUpdatePage((p) => ({
        ...p,
        lines: p.lines.map((item) => item.id === line.id ? { ...item, hidden: false } : item),
      }), true);
      selectRestoredObject(line.id, 'line');
      return true;
    }

    const circle = page.circles.find((item) => item.hidden && (
      Math.abs(dist(pos, item.center) - item.radius) <= 14 ||
      (!!item.fillColor && dist(pos, item.center) <= item.radius)
    ));
    if (circle) {
      onUpdatePage((p) => ({
        ...p,
        circles: p.circles.map((item) => item.id === circle.id ? { ...item, hidden: false } : item),
      }), true);
      selectRestoredObject(circle.id, 'circle');
      return true;
    }

    const polygon = page.polygons.find((item) => item.hidden && (
      pointInPolygon(pos, item.points) ||
      item.points.some((point, index) => distToSegment(pos, point, item.points[(index + 1) % item.points.length]) <= 14)
    ));
    if (polygon) {
      onUpdatePage((p) => ({
        ...p,
        polygons: p.polygons.map((item) => item.id === polygon.id ? { ...item, hidden: false } : item),
      }), true);
      selectRestoredObject(polygon.id, 'polygon');
      return true;
    }

    const conic = page.conics.find((item) => item.hidden && distToConic(pos, item) <= 14);
    if (conic) {
      onUpdatePage((p) => ({
        ...p,
        conics: p.conics.map((item) => item.id === conic.id ? { ...item, hidden: false } : item),
      }), true);
      selectRestoredObject(conic.id, 'conic');
      return true;
    }

    const angle = page.angles.find((item) => item.hidden && distToAngle(pos, item) <= 14);
    if (angle) {
      onUpdatePage((p) => ({
        ...p,
        angles: p.angles.map((item) => item.id === angle.id ? { ...item, hidden: false } : item),
      }), true);
      selectRestoredObject(angle.id, 'angle');
      return true;
    }

    return false;
  };

  const findPointLabel = (pos: Point2D): GeoPoint | null => page.points.find((pt) => {
    if (pt.hidden || !pt.name || pt.showLabel === false) return false;
    const lx = pt.x + (pt.labelOffset ? pt.labelOffset.x : pt.size + 4);
    const ly = pt.y + (pt.labelOffset ? pt.labelOffset.y : -4);
    const width = Math.max(20, pt.name.length * 12);
    return pos.x >= lx - 6 && pos.x <= lx + width + 6 && pos.y >= ly - 18 && pos.y <= ly + 8;
  }) || null;

  const findTransformTarget = (pos: Point2D): TransformTarget | null => {
    const point = findNearestPoint(pos, 12);
    if (point) return { type: 'point', id: point.id };
    const line = page.lines.find((item) => !item.hidden && (item.isInfinite
      ? distToLine(pos, item.p1, item.p2) <= 10
      : distToSegment(pos, item.p1, item.p2) <= 10));
    if (line) return { type: 'line', id: line.id };
    const circle = page.circles.find((item) => !item.hidden && Math.abs(dist(pos, item.center) - item.radius) <= 10);
    if (circle) return { type: 'circle', id: circle.id };
    const polygon = page.polygons.find((item) => !item.hidden && (
      pointInPolygon(pos, item.points) ||
      item.points.some((point, index) => distToSegment(pos, point, item.points[(index + 1) % item.points.length]) <= 10)
    ));
    if (polygon) return { type: 'polygon', id: polygon.id };
    const conic = page.conics.find((item) => !item.hidden && distToConic(pos, item) <= 10);
    if (conic) return { type: 'conic', id: conic.id };
    const angle = page.angles.find((item) => !item.hidden && distToAngle(pos, item) <= 10);
    return angle ? { type: 'angle', id: angle.id } : null;
  };

  const getNextPointLetter = () => {
    const count = page.points.length;
    return String.fromCharCode(65 + (count % 26)) + (count >= 26 ? Math.floor(count / 26) : '');
  };

  const resolveOrCreatePoint = (
    pos: Point2D
  ): { point: GeoPoint; isNew: boolean } => {
    const existing = findNearestPoint(pos, 14);
    if (existing) {
      if (existing.hidden || existing.showLabel === false) {
        onUpdatePage((p) => ({
          ...p,
          points: p.points.map((point) =>
            point.id === existing.id ? { ...point, hidden: false, showLabel: true } : point
          ),
        }), false);
      }
      return { point: existing, isNew: false };
    }

    const clickedLine = page.lines.find((line) => !line.hidden && (
      (line.isInfinite ? distToLine(pos, line.p1, line.p2) : distToSegment(pos, line.p1, line.p2)) <= 12
    ));
    if (clickedLine) {
      const projected = clickedLine.isInfinite
        ? projectPointToLine(pos, clickedLine.p1, clickedLine.p2)
        : projectPointToSegment(pos, clickedLine.p1, clickedLine.p2);
      return createDependentPoint(projected, { type: 'point-on-path', parentLineIds: [clickedLine.id] });
    }

    const clickedCircle = page.circles.find((circle) =>
      !circle.hidden && Math.abs(dist(pos, circle.center) - circle.radius) <= 12
    );
    if (clickedCircle) {
      const center = clickedCircle.centerPointId
        ? page.points.find((point) => point.id === clickedCircle.centerPointId) ?? clickedCircle.center
        : clickedCircle.center;
      const radius = clickedCircle.radiusPointId
        ? dist(center, page.points.find((point) => point.id === clickedCircle.radiusPointId) ?? center)
        : clickedCircle.radius;
      return createDependentPoint(
        projectPointToCircle(pos, center, radius),
        { type: 'point-on-path', parentCircleIds: [clickedCircle.id] }
      );
    }

    const clickedPolygon = page.polygons.find((polygon) => !polygon.hidden && polygon.points.some(
      (point, index) => distToSegment(pos, point, polygon.points[(index + 1) % polygon.points.length]) <= 12
    ));
    if (clickedPolygon) {
      return createDependentPoint(
        projectPointToPolygon(pos, clickedPolygon),
        { type: 'point-on-path', parentPolygonIds: [clickedPolygon.id] }
      );
    }

    const clickedConic = page.conics.find((conic) => !conic.hidden && distToConic(pos, conic) <= 12);
    if (clickedConic) {
      return createDependentPoint(
        projectPointToConic(pos, clickedConic),
        { type: 'point-on-path', parentConicIds: [clickedConic.id] }
      );
    }

    return createDependentPoint(pos);
  };

  const createDependentPoint = (
    position: Point2D,
    dependsOn?: NonNullable<GeoPoint['dependsOn']>
  ): { point: GeoPoint; isNew: boolean } => {
    const newPt: GeoPoint = {
      id: `pt_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      name: getNextPointLetter(),
      x: position.x,
      y: position.y,
      size: pointSize,
      color: pointColor,
      style: pointStyle,
      pageIndex,
      showLabel: true,
      ...(dependsOn ? { dependsOn } : {}),
    };
    setTempCreatedPointIds((prev) => [...prev, newPt.id]);
    return { point: newPt, isNew: true };
  };

  // Right-click context menu (Rule 5 & Rule 13)
  const handleContextMenu = (e: React.MouseEvent) => {
    if (e.button !== 2) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = getCanvasCoords(e);

    // 1. Point
    const pt = findNearestPoint(pos, 16);
    if (pt) {
      setSelectedIds(new Set([pt.id]));
      setSelectedId(pt.id);
      setSelectedType('point');
      setSelectedPointId(pt.id);
      onSelectObject?.(pt.id, 'point');
      setContextMenu({ x: e.clientX, y: e.clientY, id: pt.id, type: 'point' });
      return;
    }
    // 2. Line
    const clickedLine = page.lines.find((l) => {
      const d = l.isInfinite ? distToLine(pos, l.p1, l.p2) : distToSegment(pos, l.p1, l.p2);
      return d <= 14;
    });
    if (clickedLine) {
      setSelectedIds(new Set([clickedLine.id]));
      setSelectedId(clickedLine.id);
      setSelectedType('line');
      onSelectObject?.(clickedLine.id, 'line');
      setContextMenu({ x: e.clientX, y: e.clientY, id: clickedLine.id, type: 'line' });
      return;
    }
    // 3. Circle
    const clickedCircle = page.circles.find((c) => {
      const dPerim = Math.abs(dist(pos, c.center) - c.radius);
      return dPerim <= 14 || (c.fillColor && dist(pos, c.center) <= c.radius);
    });
    if (clickedCircle) {
      setSelectedIds(new Set([clickedCircle.id]));
      setSelectedId(clickedCircle.id);
      setSelectedType('circle');
      onSelectObject?.(clickedCircle.id, 'circle');
      setContextMenu({ x: e.clientX, y: e.clientY, id: clickedCircle.id, type: 'circle' });
      return;
    }
    // 4. Conic
    const clickedConic = page.conics.find((cn) => distToConic(pos, cn) <= 14);
    if (clickedConic) {
      setSelectedIds(new Set([clickedConic.id]));
      setSelectedId(clickedConic.id);
      setSelectedType('conic');
      onSelectObject?.(clickedConic.id, 'conic');
      setContextMenu({ x: e.clientX, y: e.clientY, id: clickedConic.id, type: 'conic' });
      return;
    }
    // 5. Angle
    const clickedAngle = page.angles.find((ang) => distToAngle(pos, ang) <= 14);
    if (clickedAngle) {
      setSelectedIds(new Set([clickedAngle.id]));
      setSelectedId(clickedAngle.id);
      setSelectedType('angle');
      onSelectObject?.(clickedAngle.id, 'angle');
      setContextMenu({ x: e.clientX, y: e.clientY, id: clickedAngle.id, type: 'angle' });
      return;
    }
    // 6. Polygon
    const clickedPoly = page.polygons.find((p) => pointInPolygon(pos, p.points) || p.points.some((p1, i) => distToSegment(pos, p1, p.points[(i + 1) % p.points.length]) <= 12));
    if (clickedPoly) {
      setSelectedIds(new Set([clickedPoly.id]));
      setSelectedId(clickedPoly.id);
      setSelectedType('polygon');
      onSelectObject?.(clickedPoly.id, 'polygon');
      setContextMenu({ x: e.clientX, y: e.clientY, id: clickedPoly.id, type: 'polygon' });
      return;
    }
    // 7. Text
    const clickedLatex = page.latexItems.find((item) => {
      const approxW = Math.max(60, item.latex.length * item.fontSize * 0.5);
      const approxH = item.fontSize * 2;
      return pos.x >= item.x - 5 && pos.x <= item.x + approxW && pos.y >= item.y - 5 && pos.y <= item.y + approxH;
    });
    if (clickedLatex) {
      setSelectedIds(new Set([clickedLatex.id]));
      setSelectedId(clickedLatex.id);
      setSelectedType('latex');
      onSelectObject?.(clickedLatex.id, 'latex');
      setContextMenu({ x: e.clientX, y: e.clientY, id: clickedLatex.id, type: 'latex' });
      return;
    }

    setContextMenu(null);
  };

  // Handle Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    clickSelectionRef.current = null;
    setIsMouseDown(true);
    const pos = getCanvasCoords(e);

    // 1. Inking Tools
    if (tool === 'pen' || tool === 'highlighter') {
      setCurrentStroke([pos]);
      return;
    }

    // 2. Eraser Tool
    if (tool === 'eraser') {
      eraseNear(pos);
      return;
    }

    if (tool === 'unhide') {
      restoreHiddenObjectAt(pos);
      return;
    }

    // Hide Tool (Rule 7: any objects that I click on shall disappear)
    if (tool === 'hide') {
      const pt = findNearestPoint(pos, 16);
      if (pt) {
        onUpdatePage((p) => ({
          ...p,
          points: p.points.map((it) => it.id === pt.id ? { ...it, hidden: true } : it),
        }), true);
        return;
      }
      const clickedLine = page.lines.find((l) => {
        const d = l.isInfinite ? distToLine(pos, l.p1, l.p2) : distToSegment(pos, l.p1, l.p2);
        return d <= 14;
      });
      if (clickedLine) {
        onUpdatePage((p) => ({
          ...p,
          lines: p.lines.map((it) => it.id === clickedLine.id ? { ...it, hidden: true } : it),
        }), true);
        return;
      }
      const clickedCircle = page.circles.find((c) => {
        const dPerim = Math.abs(dist(pos, c.center) - c.radius);
        return dPerim <= 14 || (c.fillColor && dist(pos, c.center) <= c.radius);
      });
      if (clickedCircle) {
        onUpdatePage((p) => ({
          ...p,
          circles: p.circles.map((it) => it.id === clickedCircle.id ? { ...it, hidden: true } : it),
        }), true);
        return;
      }
      const clickedConic = page.conics.find((cn) => distToConic(pos, cn) <= 14);
      if (clickedConic) {
        onUpdatePage((p) => ({
          ...p,
          conics: p.conics.map((it) => it.id === clickedConic.id ? { ...it, hidden: true } : it),
        }), true);
        return;
      }
      const clickedAngle = page.angles.find((ang) => distToAngle(pos, ang) <= 14);
      if (clickedAngle) {
        onUpdatePage((p) => ({
          ...p,
          angles: p.angles.map((it) => it.id === clickedAngle.id ? { ...it, hidden: true } : it),
        }), true);
        return;
      }
      const clickedPoly = page.polygons.find((p) => pointInPolygon(pos, p.points) || p.points.some((p1, i) => distToSegment(pos, p1, p.points[(i + 1) % p.points.length]) <= 12));
      if (clickedPoly) {
        onUpdatePage((p) => ({
          ...p,
          polygons: p.polygons.map((it) => it.id === clickedPoly.id ? { ...it, hidden: true } : it),
        }), true);
        return;
      }
      return;
    }

    // Circle Center Tool (Rule 10: choose option, choose circle -> outputs center)
    if (tool === 'circle-center') {
      const clickedCircle = page.circles.find((c) => {
        const dPerim = Math.abs(dist(pos, c.center) - c.radius);
        return dPerim <= 18 || (c.fillColor && dist(pos, c.center) <= c.radius);
      });
      if (clickedCircle) {
        const newPt: GeoPoint = {
          id: `pt_center_${Date.now()}`,
          name: getNextPointLetter(),
          x: clickedCircle.center.x,
          y: clickedCircle.center.y,
          size: pointSize,
          color: pointColor,
          style: pointStyle,
          pageIndex,
          dependsOn: {
            type: 'circle-center',
            parentPointIds: [],
            parentCircleIds: [clickedCircle.id],
          },
        };
        onUpdatePage((p) => ({
          ...p,
          points: [...p.points, newPt],
        }), true);
      }
      return;
    }

    // 3. Select / Move Tool: Hit test points, lines, circles, conics, angles, polygons, strokes, loci, then labels!
    if (tool === 'select') {
      const isShift = e.shiftKey;

      const clickedPointLabel = findPointLabel(pos);
      if (clickedPointLabel) {
        objectDragCandidateRef.current = true;
        clickSelectionRef.current = {
          id: clickedPointLabel.id,
          wasSelected: !isShift && selectedIds.has(clickedPointLabel.id),
        };
        setDraggedLabelItem({ id: clickedPointLabel.id, type: 'point' });
        setSelectedPointId(clickedPointLabel.id);
        setSelectedId(clickedPointLabel.id);
        setSelectedType('point');
        setSelectedIds(new Set([clickedPointLabel.id]));
        return;
      }

      let clickedTargetId: string | null = null;
      let clickedItemType: SelectedItemType = null;

      // 3a. Check if clicking directly on a Point (object first!)
      const pt = findNearestPoint(pos, 8);
      if (pt) {
        clickedTargetId = pt.id;
        clickedItemType = 'point';
      }

      // 3b. Check if clicking on a Line
      if (!clickedTargetId) {
        const clickedLine = page.lines.find((l) => {
          const d = l.isInfinite ? distToLine(pos, l.p1, l.p2) : distToSegment(pos, l.p1, l.p2);
          return d <= 6;
        });
        if (clickedLine) {
          clickedTargetId = clickedLine.id;
          clickedItemType = 'line';
        }
      }

      // 3c. Check if clicking on a Circle
      if (!clickedTargetId) {
        const clickedCircle = page.circles.find((c) => {
          const dPerim = Math.abs(dist(pos, c.center) - c.radius);
          if (dPerim <= 12) return true;
          if (c.fillColor && dist(pos, c.center) <= c.radius) return true;
          return false;
        });
        if (clickedCircle) {
          clickedTargetId = clickedCircle.id;
          clickedItemType = 'circle';
        }
      }

      // 3d. Check if clicking on a Conic
      if (!clickedTargetId) {
        const clickedConic = page.conics.find((cn) => distToConic(pos, cn) <= 14);
        if (clickedConic) {
          clickedTargetId = clickedConic.id;
          clickedItemType = 'conic';
        }
      }

      // 3e. Check if clicking on a Locus
      if (!clickedTargetId && page.loci) {
        const clickedLocus = page.loci.find((loc) => loc.samples?.some((s) => dist(pos, s) <= 12));
        if (clickedLocus) {
          clickedTargetId = clickedLocus.id;
          clickedItemType = 'locus';
        }
      }

      // 3f. Check if clicking on an Angle
      if (!clickedTargetId) {
        const clickedAngle = page.angles.find((ang) => distToAngle(pos, ang) <= 14);
        if (clickedAngle) {
          clickedTargetId = clickedAngle.id;
          clickedItemType = 'angle';
        }
      }

      // 3g. Check if clicking inside or on edge of Polygon
      if (!clickedTargetId) {
        const clickedPoly = page.polygons.find((p) => {
          if (pointInPolygon(pos, p.points)) return true;
          for (let i = 0; i < p.points.length; i++) {
            const p1 = p.points[i];
            const p2 = p.points[(i + 1) % p.points.length];
            if (distToSegment(pos, p1, p2) <= 12) return true;
          }
          return false;
        });
        if (clickedPoly) {
          clickedTargetId = clickedPoly.id;
          clickedItemType = 'polygon';
        }
      }

      // 3h. Check if clicking on a Freehand Stroke
      if (!clickedTargetId) {
        const clickedStroke = page.strokes.find((s) => s.points.some((p) => dist(p, pos) <= 14));
        if (clickedStroke) {
          clickedTargetId = clickedStroke.id;
          clickedItemType = 'stroke';
        }
      }

      if (clickedTargetId && clickedItemType) {
        objectDragCandidateRef.current = true;
        clickSelectionRef.current = {
          id: clickedTargetId,
          wasSelected: !isShift && selectedIds.has(clickedTargetId),
        };

        dragStartPosRef.current = pos;
        setIsDraggingSelection(true);

        if (isShift) {
          const next = new Set(selectedIds);
          if (next.has(clickedTargetId)) next.delete(clickedTargetId);
          else next.add(clickedTargetId);
          setSelectedIds(next);
          setSelectedId(clickedTargetId);
          setSelectedType(clickedItemType);
        } else {
          if (!selectedIds.has(clickedTargetId)) {
            setSelectedIds(new Set([clickedTargetId]));
            setSelectedId(clickedTargetId);
            setSelectedType(clickedItemType);
            setSelectedPointId(clickedItemType === 'point' ? clickedTargetId : null);
          }
          if (clickedItemType === 'point') {
            const selectedPoint = page.points.find((point) => point.id === clickedTargetId);
            if (
              !selectedPoint?.dependsOn ||
              selectedPoint.dependsOn.type === 'point-on-path' ||
              selectedPoint.dependsOn.type === 'point-on-segment'
            ) {
              setDraggedPointId(clickedTargetId);
            }
          }
        }
        return;
      }

      // 3i. ONLY if no object was hit, check if clicking on ANY object's label (Item 10 & 6)
      for (const pt of page.points) {
        if (!pt.name || pt.showLabel === false) continue;
        const lx = pt.x + (pt.labelOffset ? pt.labelOffset.x : (pt.size + 4));
        const ly = pt.y + (pt.labelOffset ? pt.labelOffset.y : -4);
        const textLen = pt.name.length;
        const boxW = Math.max(20, textLen * 12);
        const boxH = 18;
        if (pos.x >= lx - 6 && pos.x <= lx + boxW + 6 && pos.y >= ly - boxH && pos.y <= ly + 8) {
          objectDragCandidateRef.current = true;
          setDraggedLabelItem({ id: pt.id, type: 'point' });
          setSelectedPointId(pt.id);
          setSelectedId(pt.id);
          setSelectedType('point');
          setSelectedIds(new Set([pt.id]));
          return;
        }
      }
      for (const l of page.lines) {
        if (!l.name || l.showLabel === false) continue;
        const mx = (l.p1.x + l.p2.x) / 2 + (l.labelOffset?.x || 0);
        const my = (l.p1.y + l.p2.y) / 2 + (l.labelOffset?.y || -10);
        const boxW = Math.max(24, l.name.length * 12);
        if (pos.x >= mx - 10 && pos.x <= mx + boxW && pos.y >= my - 16 && pos.y <= my + 10) {
          objectDragCandidateRef.current = true;
          setDraggedLabelItem({ id: l.id, type: 'line' });
          setSelectedId(l.id);
          setSelectedType('line');
          setSelectedIds(new Set([l.id]));
          return;
        }
      }
      for (const c of page.circles) {
        if (!c.name || c.showLabel === false) continue;
        const cx = c.center.x + (c.labelOffset?.x || 0);
        const cy = c.center.y - c.radius + (c.labelOffset?.y || -10);
        const boxW = Math.max(24, c.name.length * 12);
        if (pos.x >= cx - 10 && pos.x <= cx + boxW && pos.y >= cy - 16 && pos.y <= cy + 10) {
          objectDragCandidateRef.current = true;
          setDraggedLabelItem({ id: c.id, type: 'circle' });
          setSelectedId(c.id);
          setSelectedType('circle');
          setSelectedIds(new Set([c.id]));
          return;
        }
      }
      for (const a of page.angles) {
        const text = a.label || `${a.angleDeg}°`;
        if (a.showLabel === false) continue;
        const ax = a.center.x + (a.labelOffset?.x || 16);
        const ay = a.center.y + (a.labelOffset?.y || -16);
        const boxW = Math.max(24, text.length * 12);
        if (pos.x >= ax - 10 && pos.x <= ax + boxW && pos.y >= ay - 16 && pos.y <= ay + 10) {
          objectDragCandidateRef.current = true;
          setDraggedLabelItem({ id: a.id, type: 'angle' });
          setSelectedId(a.id);
          setSelectedType('angle');
          setSelectedIds(new Set([a.id]));
          return;
        }
      }
      for (const cn of page.conics) {
        if (!cn.name || cn.showLabel === false) continue;
        const bx = (cn.point?.x || cn.focus?.x || cn.foci?.[0]?.x || 400) + (cn.labelOffset?.x || 0);
        const by = (cn.point?.y || cn.focus?.y || cn.foci?.[0]?.y || 400) + (cn.labelOffset?.y || -12);
        const boxW = Math.max(24, cn.name.length * 12);
        if (pos.x >= bx - 10 && pos.x <= bx + boxW && pos.y >= by - 16 && pos.y <= by + 10) {
          objectDragCandidateRef.current = true;
          setDraggedLabelItem({ id: cn.id, type: 'conic' });
          setSelectedId(cn.id);
          setSelectedType('conic');
          setSelectedIds(new Set([cn.id]));
          return;
        }
      }

      // Nothing clicked on empty canvas: deselect to close inspector (Item 5)
      if (!isShift) {
        setSelectedIds(new Set());
        setSelectedId(null);
        setSelectedType(null);
        setSelectedPointId(null);
      }
      // Start rubber-band marquee selection
      marqueeStartRef.current = pos;
      setMarqueeBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
      return;
    }

    // 4. Point Tool: supports point-on-path when clicking an object, and smooth points (Item 1, 3)
    if (tool === 'point') {
      // 4a. Point on line / segment
      const clickedLine = page.lines.find((l) => {
        const d = l.isInfinite ? distToLine(pos, l.p1, l.p2) : distToSegment(pos, l.p1, l.p2);
        return d <= 12;
      });
      if (clickedLine) {
        const proj = clickedLine.isInfinite
          ? projectPointToLine(pos, clickedLine.p1, clickedLine.p2)
          : projectPointToSegment(pos, clickedLine.p1, clickedLine.p2);
        const newPt: GeoPoint = {
          id: `pt_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          name: getNextPointLetter(),
          x: proj.x,
          y: proj.y,
          size: pointSize,
          color: pointColor,
          style: pointStyle,
          pageIndex,
          dependsOn: {
            type: 'point-on-path',
            parentPointIds: [],
            parentLineIds: [clickedLine.id],
          },
        };
        onUpdatePage((p) => ({ ...p, points: [...p.points, newPt] }));
        return;
      }

      // 4b. Point on circle
      const clickedCircle = page.circles.find((c) => Math.abs(dist(pos, c.center) - c.radius) <= 12);
      if (clickedCircle) {
        const proj = projectPointToCircle(pos, clickedCircle.center, clickedCircle.radius);
        const newPt: GeoPoint = {
          id: `pt_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          name: getNextPointLetter(),
          x: proj.x,
          y: proj.y,
          size: pointSize,
          color: pointColor,
          style: pointStyle,
          pageIndex,
          dependsOn: {
            type: 'point-on-path',
            parentPointIds: [],
            parentCircleIds: [clickedCircle.id],
          },
        };
        onUpdatePage((p) => ({ ...p, points: [...p.points, newPt] }));
        return;
      }

      // 4c. Point on polygon edge
      const clickedPoly = page.polygons.find((poly) => {
        for (let i = 0; i < poly.points.length; i++) {
          const p1 = poly.points[i];
          const p2 = poly.points[(i + 1) % poly.points.length];
          if (distToSegment(pos, p1, p2) <= 12) return true;
        }
        return false;
      });
      if (clickedPoly) {
        const bestProj = projectPointToPolygon(pos, clickedPoly);
        const newPt: GeoPoint = {
          id: `pt_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          name: getNextPointLetter(),
          x: bestProj.x,
          y: bestProj.y,
          size: pointSize,
          color: pointColor,
          style: pointStyle,
          pageIndex,
          dependsOn: {
            type: 'point-on-path',
            parentPointIds: [],
            parentPolygonIds: [clickedPoly.id],
          },
        };
        onUpdatePage((p) => ({ ...p, points: [...p.points, newPt] }));
        return;
      }

      // 4d. Point on conic
      const clickedConic = page.conics.find((conic) =>
        !conic.hidden && distToConic(pos, conic) <= 12
      );
      if (clickedConic) {
        const projected = projectPointToConic(pos, clickedConic);
        const newPt: GeoPoint = {
          id: `pt_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          name: getNextPointLetter(),
          x: projected.x,
          y: projected.y,
          size: pointSize,
          color: pointColor,
          style: pointStyle,
          pageIndex,
          dependsOn: {
            type: 'point-on-path',
            parentPointIds: [],
            parentConicIds: [clickedConic.id],
          },
        };
        onUpdatePage((p) => ({ ...p, points: [...p.points, newPt] }));
        return;
      }

      // 4d. Smooth point in space (smooth floats, no grid snapping)
      const newPt: GeoPoint = {
        id: `pt_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        name: getNextPointLetter(),
        x: pos.x,
        y: pos.y,
        size: pointSize,
        color: pointColor,
        style: pointStyle,
        pageIndex,
      };
      onUpdatePage((p) => ({ ...p, points: [...p.points, newPt] }));
      return;
    }

    // 4b. Intersection Tool: Construct intersection between objects
    if (tool === 'intersect') {
      // Direct intersection detection near click
      type IntersectionCandidate = {
        pos: Point2D;
        parentLineIds?: string[];
        parentCircleIds?: string[];
        intersectionIndex?: number;
      };
      const intersectionSearch: { closestDistance: number; candidate: IntersectionCandidate | null } = {
        closestDistance: 18,
        candidate: null,
      };

      const considerIntersection = (candidate: IntersectionCandidate) => {
        const candidateDistance = dist(pos, candidate.pos);
        if (candidateDistance <= intersectionSearch.closestDistance) {
          intersectionSearch.closestDistance = candidateDistance;
          intersectionSearch.candidate = candidate;
        }
      };

      // Find the nearest valid intersection so overlapping constructions resolve to the click.
      for (let i = 0; i < page.lines.length; i++) {
        for (let j = i + 1; j < page.lines.length; j++) {
          const l1 = page.lines[i];
          const l2 = page.lines[j];
          if (l1.hidden || l2.hidden) continue;
          const ipt = getLineLineIntersection(
            l1.p1, l1.p2, l2.p1, l2.p2, !l1.isInfinite, !l2.isInfinite
          );
          if (ipt) considerIntersection({ pos: ipt, parentLineIds: [l1.id, l2.id] });
        }
      }

      for (const l of page.lines) {
        if (l.hidden) continue;
        for (const c of page.circles) {
          if (c.hidden) continue;
          const isSegment = !l.isInfinite && c.dependsOn?.type !== 'excircle';
          const ipts = getLineCircleIntersections(l.p1, l.p2, c.center, c.radius, isSegment);
          for (let idx = 0; idx < ipts.length; idx++) {
            considerIntersection({
              pos: ipts[idx],
              parentLineIds: [l.id],
              parentCircleIds: [c.id],
              intersectionIndex: idx,
            });
          }
        }
      }

      for (let i = 0; i < page.circles.length; i++) {
        for (let j = i + 1; j < page.circles.length; j++) {
          const c1 = page.circles[i];
          const c2 = page.circles[j];
          if (c1.hidden || c2.hidden) continue;
          const ipts = getCircleCircleIntersections(c1.center, c1.radius, c2.center, c2.radius);
          for (let idx = 0; idx < ipts.length; idx++) {
            considerIntersection({
              pos: ipts[idx],
              parentCircleIds: [c1.id, c2.id],
              intersectionIndex: idx,
            });
          }
        }
      }

      // If clicked close to an intersection, construct the intersection point directly
      const foundIntersection = intersectionSearch.candidate;
      if (foundIntersection) {
        const newPt: GeoPoint = {
          id: `pt_int_${Date.now()}`,
          name: getNextPointLetter(),
          x: foundIntersection.pos.x,
          y: foundIntersection.pos.y,
          size: pointSize,
          color: pointColor,
          style: pointStyle,
          pageIndex,
          dependsOn: {
            type: 'intersection',
            parentPointIds: [],
            parentLineIds: foundIntersection.parentLineIds,
            parentCircleIds: foundIntersection.parentCircleIds,
            intersectionIndex: foundIntersection.intersectionIndex,
            initialPos: foundIntersection.pos,
          },
        };
        onUpdatePage((p) => ({ ...p, points: [...p.points, newPt] }));
        setClickLineIds([]);
        setClickCircleIds([]);
        return;
      }

      // Step-by-step: Click 2 objects (Line or Circle)
      const clickedLine = page.lines.find((l) =>
        (l.isInfinite ? distToLine(pos, l.p1, l.p2) : distToSegment(pos, l.p1, l.p2)) <= 14
      );
      const clickedCirc = page.circles.find((c) => Math.abs(dist(pos, c.center) - c.radius) <= 16);

      if (clickLineIds.length === 0 && clickCircleIds.length === 0) {
        if (clickedLine) setClickLineIds([clickedLine.id]);
        else if (clickedCirc) setClickCircleIds([clickedCirc.id]);
        return;
      }

      const line1Id = clickLineIds[0];
      const circ1Id = clickCircleIds[0];

      // Second object is line
      if (line1Id && clickedLine && clickedLine.id !== line1Id) {
        const l1 = page.lines.find((l) => l.id === line1Id)!;
        const ipt = getLineLineIntersection(
          l1.p1, l1.p2, clickedLine.p1, clickedLine.p2, !l1.isInfinite, !clickedLine.isInfinite
        );
        if (ipt) {
          const newPt: GeoPoint = {
            id: `pt_int_${Date.now()}`,
            name: getNextPointLetter(),
            x: ipt.x,
            y: ipt.y,
            size: pointSize,
            color: pointColor,
            style: pointStyle,
            pageIndex,
            dependsOn: {
              type: 'intersection',
              parentPointIds: [],
              parentLineIds: [line1Id, clickedLine.id],
              initialPos: ipt,
            },
          };
          onUpdatePage((p) => ({ ...p, points: [...p.points, newPt] }));
        }
        setClickLineIds([]);
        setClickCircleIds([]);
        return;
      }

      // One is line, one is circle (Rule 9: if no intersection, no point appears)
      if ((line1Id && clickedCirc) || (circ1Id && clickedLine)) {
        const l = page.lines.find((it) => it.id === (line1Id || clickedLine!.id))!;
        const c = page.circles.find((it) => it.id === (circ1Id || clickedCirc!.id))!;
        const isSegment = !l.isInfinite && c.dependsOn?.type !== 'excircle';
        const ipts = getLineCircleIntersections(l.p1, l.p2, c.center, c.radius, isSegment);
        if (ipts && ipts.length > 0) {
          const newPts: GeoPoint[] = ipts.map((p, idx) => ({
            id: `pt_int_${Date.now()}_${idx}`,
            name: getNextPointLetter(),
            x: p.x,
            y: p.y,
            size: pointSize,
            color: pointColor,
            style: pointStyle,
            pageIndex,
            dependsOn: {
              type: 'intersection',
              parentPointIds: [],
              parentLineIds: [l.id],
              parentCircleIds: [c.id],
              intersectionIndex: idx,
              initialPos: p,
            },
          }));
          onUpdatePage((p) => ({ ...p, points: [...p.points, ...newPts] }));
        }
        setClickLineIds([]);
        setClickCircleIds([]);
        return;
      }

      // Both are circles (Rule 9: if no intersection, no point appears)
      if (circ1Id && clickedCirc && clickedCirc.id !== circ1Id) {
        const c1 = page.circles.find((it) => it.id === circ1Id)!;
        const ipts = getCircleCircleIntersections(c1.center, c1.radius, clickedCirc.center, clickedCirc.radius);
        if (ipts && ipts.length > 0) {
          const newPts: GeoPoint[] = ipts.map((p, idx) => ({
            id: `pt_int_${Date.now()}_${idx}`,
            name: getNextPointLetter(),
            x: p.x,
            y: p.y,
            size: pointSize,
            color: pointColor,
            style: pointStyle,
            pageIndex,
            dependsOn: {
              type: 'intersection',
              parentPointIds: [],
              parentCircleIds: [c1.id, clickedCirc.id],
              intersectionIndex: idx,
              initialPos: p,
            },
          }));
          onUpdatePage((p) => ({ ...p, points: [...p.points, ...newPts] }));
        }
        setClickLineIds([]);
        setClickCircleIds([]);
        return;
      }
      return;
    }

    // 4c. Locus Tool: Construct locus curve of dependent point as driver point moves
    if (tool === 'locus') {
      const nearestPt = findNearestPoint(pos, 16);
      if (!nearestPt) return;
      const pts = [...clickPoints, nearestPt];
      if (pts.length === 2) {
        const [depPt, driverPt] = pts;
        const pathParentId = driverPt.dependsOn?.type === 'point-on-path'
          ? driverPt.dependsOn.parentLineIds?.[0] || driverPt.dependsOn.parentCircleIds?.[0]
          : undefined;
        const samples = calculateLocusSamples(page, depPt.id, driverPt.id, pathParentId);
        const newLocus: GeoLocus = {
          id: `locus_${Date.now()}`,
          name: '',
          dependentPointId: depPt.id,
          driverPointId: driverPt.id,
          samples,
          color: lineColor,
          thickness: lineThickness,
          style: lineStyle,
          pageIndex,
        };
        onUpdatePage((p) => ({
          ...p,
          loci: [...(p.loci || []), newLocus],
        }));
        setClickPoints([]);
      } else {
        setClickPoints(pts);
      }
      return;
    }

    // 5. Segment & Line Tools (requires 2 points)
    if (tool === 'segment' || tool === 'line') {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];

      if (pts.length === 2) {
        const [p1, p2] = pts;
        const newLine: GeoLine = {
          id: `line_${Date.now()}`,
          p1: { x: p1.x, y: p1.y },
          p2: { x: p2.x, y: p2.y },
          p1PointId: p1.id,
          p2PointId: p2.id,
          thickness: lineThickness,
          color: lineColor,
          style: lineStyle,
          isInfinite: tool === 'line',
          pageIndex,
        };
        onUpdatePage((p) => ({
          ...p,
          points: isNew ? [...p.points, currentPt] : p.points,
          lines: [...p.lines, newLine],
        }));
        setClickPoints([]);
      } else {
        if (isNew) {
          onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        }
        setClickPoints(pts);
      }
      return;
    }

    // 6. Circle with Center and Point
    if (tool === 'circle-center-point') {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];
      if (pts.length === 2) {
        const [p1, p2] = pts;
        const radius = dist(p1, p2);
        const newCircle: GeoCircle = {
          id: `circ_${Date.now()}`,
          center: { x: p1.x, y: p1.y },
          radius,
          centerPointId: p1.id,
          radiusPointId: p2.id,
          dependsOn: { type: 'center-point', parentPointIds: [p1.id, p2.id] },
          thickness: lineThickness,
          color: lineColor,
          style: lineStyle,
          pageIndex,
        };
        onUpdatePage((p) => ({
          ...p,
          points: isNew ? [...p.points, currentPt] : p.points,
          circles: [...p.circles, newCircle],
        }));
        setClickPoints([]);
      } else {
        if (isNew) {
          onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        }
        setClickPoints(pts);
      }
      return;
    }

    if (tool === 'circular-arc' || tool === 'circumcircular-arc') {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];
      if (pts.length < 3) {
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints(pts);
        return;
      }

      if (tool === 'circular-arc') {
        const [center, radiusPoint] = pts;
        const radius = dist(center, radiusPoint);
        if (radius <= 1e-7) {
          setClickPoints([]);
          return;
        }
        const projected = projectPointToCircle(currentPt, center, radius);
        const isOnCircle = dist(currentPt, projected) <= 1e-7;
        const endpoint = isOnCircle && !currentPt.dependsOn
          ? { ...currentPt, dependsOn: { type: 'point-on-path' as const, parentPointIds: [center.id, radiusPoint.id] } }
          : {
              ...currentPt,
              id: `arc_point_${Date.now()}`,
              name: isNew ? currentPt.name : getNextPointLetter(),
              ...projected,
              hidden: false,
              showLabel: true,
              dependsOn: { type: 'point-on-path' as const, parentPointIds: [center.id, radiusPoint.id] },
            };
        const newAngle: GeoAngle = {
          id: `arc_${Date.now()}`,
          center: { x: center.x, y: center.y },
          p1: { x: radiusPoint.x, y: radiusPoint.y },
          p2: { x: endpoint.x, y: endpoint.y },
          centerPointId: center.id,
          p1PointId: radiusPoint.id,
          p2PointId: endpoint.id,
          radius,
          angleDeg: 0,
          thickness: lineThickness,
          style: 'arc',
          color: lineColor,
          pageIndex,
          arcSweep: 'counterclockwise',
          dependsOn: { type: 'centered-arc', parentPointIds: [center.id, radiusPoint.id, endpoint.id] },
        };
        onUpdatePage((p) => ({
          ...p,
          points: endpoint.id === currentPt.id
            ? isNew
              ? [...p.points, { ...endpoint, hidden: false, showLabel: true }]
              : p.points.map((point) => point.id === endpoint.id ? { ...endpoint, hidden: false, showLabel: true } : point)
            : [...p.points, endpoint],
          angles: [...p.angles, newAngle],
        }));
      } else {
        const [start, through, end] = pts;
        const circle = getCircumcenter(start, through, end);
        if (circle) {
          const newAngle: GeoAngle = {
            id: `circum_arc_${Date.now()}`,
            center: circle.center,
            p1: { x: start.x, y: start.y },
            p2: { x: end.x, y: end.y },
            radius: circle.radius,
            angleDeg: 0,
            thickness: lineThickness,
            style: 'arc',
            color: lineColor,
            pageIndex,
            arcSweep: 'through-point',
            throughPointId: through.id,
            throughPoint: { x: through.x, y: through.y },
            dependsOn: { type: 'circumcircular-arc', parentPointIds: [start.id, through.id, end.id] },
          };
          onUpdatePage((p) => ({
            ...p,
            points: p.points.map((point) => [start.id, through.id, end.id].includes(point.id)
              ? { ...point, hidden: false, showLabel: true }
              : point).concat(isNew ? [{ ...currentPt, hidden: false, showLabel: true }] : []),
            angles: [...p.angles, newAngle],
          }));
        } else if (isNew) {
          onUpdatePage((p) => ({
            ...p,
            points: p.points.map((point) => point.id === start.id || point.id === through.id
              ? { ...point, hidden: false, showLabel: true }
              : point).concat({ ...currentPt, hidden: false, showLabel: true }),
          }));
        }
      }
      setClickPoints([]);
      setTempCreatedPointIds([]);
      return;
    }

    // 8. Polygon Tool
    if (tool === 'polygon') {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const isClosing = clickPoints.length >= 3 && (
        e.detail === 2 ||
        dist(currentPt, clickPoints[0]) < 18
      );

      if (isClosing) {
        const polyPts = clickPoints;
        const ptIds = polyPts.map((p) => p.id);
        const newPoly: GeoPolygon = {
          id: `poly_${Date.now()}`,
          points: polyPts.map((p) => ({ x: p.x, y: p.y })),
          pointIds: ptIds,
          thickness: lineThickness,
          color: lineColor,
          style: lineStyle,
          fillColor: fillColor || 'rgba(99, 102, 241, 0.15)',
          pageIndex,
        };

        const boundaryLines: GeoLine[] = [];
        for (let i = 0; i < polyPts.length; i++) {
          const pA = polyPts[i];
          const pB = polyPts[(i + 1) % polyPts.length];
          boundaryLines.push({
            id: `line_poly_${Date.now()}_${i}`,
            p1: { x: pA.x, y: pA.y },
            p2: { x: pB.x, y: pB.y },
            p1PointId: pA.id,
            p2PointId: pB.id,
            thickness: lineThickness,
            color: lineColor,
            style: lineStyle,
            pageIndex,
          });
        }

        onUpdatePage((p) => ({
          ...p,
          polygons: [...p.polygons, newPoly],
          lines: [...p.lines, ...boundaryLines],
        }));
        setClickPoints([]);
      } else {
        if (isNew) {
          onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        }
        setClickPoints([...clickPoints, currentPt]);
      }
      return;
    }

    // 9. Angle (A, Vertex B, C)
    if (tool === 'angle-shading' || tool === 'angle') {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];
      if (pts.length === 3) {
        const [A, B, C] = pts;
        const dBA = dist(B, A);
        const dBC = dist(B, C);
        const dAC = dist(A, C);
        const cosB = Math.max(-1, Math.min(1, (dBA * dBA + dBC * dBC - dAC * dAC) / (2 * dBA * dBC)));
        const deg = Math.round((Math.acos(cosB) * 180) / Math.PI);

        const newAngle: GeoAngle = {
          id: `angle_${Date.now()}`,
          center: { x: B.x, y: B.y },
          p1: { x: A.x, y: A.y },
          p2: { x: C.x, y: C.y },
          centerPointId: B.id,
          p1PointId: A.id,
          p2PointId: C.id,
          radius: 35,
          angleDeg: deg,
          thickness: lineThickness,
          label: `${deg}°`,
          style: 'sector',
          color: lineColor,
          fillColor: fillColor || 'rgba(37, 99, 235, 0.2)',
          pageIndex,
        };
        onUpdatePage((p) => ({
          ...p,
          points: isNew ? [...p.points, currentPt] : p.points,
          angles: [...p.angles, newAngle],
        }));
        setClickPoints([]);
        setTempCreatedPointIds([]);
      } else {
        if (isNew) {
          onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        }
        setClickPoints(pts);
      }
      return;
    }

    // Midpoint: Midpoint of a segment or between two points (Item 2)
    if (tool === 'midpoint') {
      const clickedLine = page.lines.find((l) => distToSegment(pos, l.p1, l.p2) <= 12);
      if (clickedLine) {
        const mx = (clickedLine.p1.x + clickedLine.p2.x) / 2;
        const my = (clickedLine.p1.y + clickedLine.p2.y) / 2;
        const newPt: GeoPoint = {
          id: `mid_${Date.now()}`,
          name: getNextPointLetter(),
          x: mx,
          y: my,
          size: pointSize,
          color: pointColor,
          style: pointStyle,
          pageIndex,
          dependsOn: {
            type: 'midpoint',
            parentPointIds: [clickedLine.p1PointId, clickedLine.p2PointId].filter(Boolean) as string[],
            parentLineIds: [clickedLine.id],
          },
        };
        onUpdatePage((p) => ({ ...p, points: [...p.points, newPt] }));
        setClickPoints([]);
        setTempCreatedPointIds([]);
        return;
      }

      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];
      if (pts.length === 2) {
        const [p1, p2] = pts;
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const newPt: GeoPoint = {
          id: `mid_${Date.now()}`,
          name: getNextPointLetter(),
          x: mx,
          y: my,
          size: pointSize,
          color: pointColor,
          style: pointStyle,
          pageIndex,
          dependsOn: {
            type: 'midpoint',
            parentPointIds: [p1.id, p2.id],
          },
        };
        onUpdatePage((p) => ({
          ...p,
          points: isNew ? [...p.points, currentPt, newPt] : [...p.points, newPt],
        }));
        setClickPoints([]);
        setTempCreatedPointIds([]);
      } else {
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints(pts);
      }
      return;
    }

    // Perpendicular Line & Parallel Line (Item 2)
    if (tool === 'perpendicular-line' || tool === 'parallel-line') {
      const clickedLine = page.lines.find((l) => distToLine(pos, l.p1, l.p2) <= 14);
      const clickedPt = findNearestPoint(pos, 16);

      // If we already have a point and clicked a line
      if (clickPoints.length === 1 && clickedLine) {
        const pt = clickPoints[0];
        const res = tool === 'perpendicular-line'
          ? getPerpendicularLine(pt, clickedLine.p1, clickedLine.p2)
          : getParallelLine(pt, clickedLine.p1, clickedLine.p2);
        const newLine: GeoLine = {
          id: `${tool}_${Date.now()}`,
          p1: res.p1,
          p2: res.p2,
          p1PointId: pt.id,
          name: '',
          thickness: lineThickness,
          color: lineColor,
          style: lineStyle,
          isInfinite: true,
          pageIndex,
          dependsOn: {
            type: tool,
            parentPointIds: [pt.id],
            parentLineIds: [clickedLine.id],
          },
        };
        onUpdatePage((p) => ({ ...p, lines: [...p.lines, newLine] }));
        setClickPoints([]);
        setClickLineIds([]);
        setTempCreatedPointIds([]);
        return;
      }

      // If we already have a line and clicked a point
      if (clickLineIds.length === 1) {
        const { point: pt, isNew } = resolveOrCreatePoint(pos);
        const line = page.lines.find((l) => l.id === clickLineIds[0]);
        if (line) {
          const res = tool === 'perpendicular-line'
            ? getPerpendicularLine(pt, line.p1, line.p2)
            : getParallelLine(pt, line.p1, line.p2);
          const newLine: GeoLine = {
            id: `${tool}_${Date.now()}`,
            p1: res.p1,
            p2: res.p2,
            p1PointId: pt.id,
            name: '',
            thickness: lineThickness,
            color: lineColor,
            style: lineStyle,
            isInfinite: true,
            pageIndex,
            dependsOn: {
              type: tool,
              parentPointIds: [pt.id],
              parentLineIds: [line.id],
            },
          };
          onUpdatePage((p) => ({
            ...p,
            points: isNew ? [...p.points, pt] : p.points,
            lines: [...p.lines, newLine],
          }));
        }
        setClickPoints([]);
        setClickLineIds([]);
        setTempCreatedPointIds([]);
        return;
      }

      // First click: was it a line or a point?
      if (clickedLine && !clickedPt) {
        setClickLineIds([clickedLine.id]);
        return;
      } else {
        const { point: pt, isNew } = resolveOrCreatePoint(pos);
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, pt] }));
        setClickPoints([pt]);
        return;
      }
    }

    // Tangent: lines from a point to a circle (Item 2)
    if (tool === 'tangent') {
      const clickedCirc = page.circles.find(
        (c) => !c.hidden && (Math.abs(dist(pos, c.center) - c.radius) <= 16 || dist(pos, c.center) <= c.radius + 10)
      );
      const clickedPt = findNearestPoint(pos, 16);

      // If we already have a point and clicked a circle
      if (clickPoints.length === 1 && clickedCirc) {
        const pt = clickPoints[0];
        const tangents = getCircleTangents(pt, clickedCirc);
        if (tangents.length > 0) {
          const newLines: GeoLine[] = tangents.map((tan, idx) => ({
            id: `tangent_${Date.now()}_${idx}`,
            p1: tan.p1,
            p2: tan.p2,
            p1PointId: pt.id,
            name: '',
            thickness: lineThickness,
            color: lineColor,
            style: lineStyle,
            isInfinite: true,
            pageIndex,
            dependsOn: {
              type: 'tangent',
              parentPointIds: [pt.id],
              parentCircleIds: [clickedCirc.id],
              tangentIndex: idx,
            },
          }));
          onUpdatePage((p) => ({
            ...p,
            circles: p.circles.map((circle) => circle.id === clickedCirc.id ? { ...circle, hidden: false } : circle),
            lines: [...p.lines, ...newLines],
          }));
        }
        setClickPoints([]);
        setClickCircleIds([]);
        setTempCreatedPointIds([]);
        return;
      }

      // If we already have a circle and clicked a point
      if (clickCircleIds.length === 1) {
        const circ = page.circles.find((c) => c.id === clickCircleIds[0]);
        const { point: pt, isNew } = clickedPt
          ? { point: clickedPt, isNew: false }
          : resolveOrCreatePoint(pos);
        if (circ) {
          const tangents = getCircleTangents(pt, circ);
          if (tangents.length > 0) {
            const newLines: GeoLine[] = tangents.map((tan, idx) => ({
              id: `tangent_${Date.now()}_${idx}`,
              p1: tan.p1,
              p2: tan.p2,
              p1PointId: pt.id,
              name: '',
              thickness: lineThickness,
              color: lineColor,
              style: lineStyle,
              isInfinite: true,
              pageIndex,
              dependsOn: {
                type: 'tangent',
                parentPointIds: [pt.id],
                parentCircleIds: [circ.id],
                tangentIndex: idx,
              },
            }));
            onUpdatePage((p) => ({
              ...p,
              points: isNew ? [...p.points, pt] : p.points,
              circles: p.circles.map((circle) => circle.id === circ.id ? { ...circle, hidden: false } : circle),
              lines: [...p.lines, ...newLines],
            }));
          } else if (isNew) {
            onUpdatePage((p) => ({ ...p, points: [...p.points, pt] }));
          }
        }
        setClickPoints([]);
        setClickCircleIds([]);
        setTempCreatedPointIds([]);
        return;
      }

      // First click: was it a circle or a point?
      if (clickedCirc && !clickedPt) {
        setClickCircleIds([clickedCirc.id]);
        return;
      } else {
        const { point: pt, isNew } = resolveOrCreatePoint(pos);
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, pt] }));
        setClickPoints([pt]);
        return;
      }
    }

    // Reflection across a line (Item 2)
    if (tool === 'reflection') {
      const clickedLine = page.lines.find((l) => distToLine(pos, l.p1, l.p2) <= 14);
      const clickedPt = findNearestPoint(pos, 16);
      const clickedCirc = page.circles.find((c) => Math.abs(dist(pos, c.center) - c.radius) <= 16);

      // If we already chose a line and clicked another line to act as mirror
      if (clickLineIds.length === 1 && clickedLine && clickedLine.id !== clickLineIds[0]) {
        const srcLine = page.lines.find((l) => l.id === clickLineIds[0]);
        if (srcLine) {
          const r1 = reflectPointAcrossLine(srcLine.p1, clickedLine.p1, clickedLine.p2);
          const r2 = reflectPointAcrossLine(srcLine.p2, clickedLine.p1, clickedLine.p2);
          const newLine: GeoLine = {
            id: `refl_line_${Date.now()}`,
            p1: r1,
            p2: r2,
            name: `${srcLine.name || 'l'}'`,
            thickness: srcLine.thickness,
            color: srcLine.color,
            style: srcLine.style,
            isInfinite: srcLine.isInfinite,
            pageIndex,
            dependsOn: { type: 'reflection', parentLineIds: [srcLine.id, clickedLine.id] },
          };
          onUpdatePage((p) => ({ ...p, lines: [...p.lines, newLine] }));
        }
        setClickLineIds([]);
        return;
      }

      // If we already chose a point and clicked a line
      if (clickPoints.length === 1 && clickedLine) {
        const srcPt = clickPoints[0];
        const r = reflectPointAcrossLine(srcPt, clickedLine.p1, clickedLine.p2);
        const newPt: GeoPoint = {
          id: `refl_pt_${Date.now()}`,
          name: `${srcPt.name || 'P'}'`,
          x: r.x,
          y: r.y,
          size: srcPt.size,
          color: srcPt.color,
          style: srcPt.style,
          pageIndex,
          dependsOn: { type: 'reflection', parentPointIds: [srcPt.id], parentLineIds: [clickedLine.id] },
        };
        onUpdatePage((p) => ({ ...p, points: [...p.points, newPt] }));
        setClickPoints([]);
        setTempCreatedPointIds([]);
        return;
      }

      // If we already chose a circle and clicked a line
      if (clickCircleIds.length === 1 && clickedLine) {
        const srcC = page.circles.find((c) => c.id === clickCircleIds[0]);
        if (srcC) {
          const rCenter = reflectPointAcrossLine(srcC.center, clickedLine.p1, clickedLine.p2);
          const newCirc: GeoCircle = {
            id: `refl_circ_${Date.now()}`,
            center: rCenter,
            radius: srcC.radius,
            name: `${srcC.name || 'c'}'`,
            thickness: srcC.thickness,
            color: srcC.color,
            style: srcC.style,
            pageIndex,
            dependsOn: { type: 'reflection', parentCircleIds: [srcC.id], parentLineIds: [clickedLine.id] },
          };
          onUpdatePage((p) => ({ ...p, circles: [...p.circles, newCirc] }));
        }
        setClickCircleIds([]);
        return;
      }

      // First click: select object to reflect
      if (clickedPt) {
        setClickPoints([clickedPt]);
      } else if (clickedCirc) {
        setClickCircleIds([clickedCirc.id]);
      } else if (clickedLine) {
        setClickLineIds([clickedLine.id]);
      }
      return;
    }

    // 10. Perpendicular Bisector
    if (tool === 'perpendicular-bisector') {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];
      if (pts.length === 2) {
        const bis = perpendicularBisector(pts[0], pts[1], 800);
        const line: GeoLine = {
          id: `pbis_${Date.now()}`,
          p1: bis.p1,
          p2: bis.p2,
          name: '',
          dependsOn: { type: 'perpendicular-bisector', parentPointIds: [pts[0].id, pts[1].id] },
          thickness: lineThickness,
          color: lineColor,
          style: 'dash',
          pageIndex,
        };
        onUpdatePage((p) => ({
          ...p,
          points: isNew ? [...p.points, currentPt] : p.points,
          lines: [...p.lines, line],
        }));
        setClickPoints([]);
      } else {
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints(pts);
      }
      return;
    }

    // 11. Angle Bisector (In / Out) of 3 points (A, B, C)
    if (tool === 'angle-bisector-in' || tool === 'angle-bisector-out') {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];
      if (pts.length === 3) {
        const isExterior = tool === 'angle-bisector-out';
        const bis = getAngleBisector(pts[0], pts[1], pts[2], isExterior, 800);
        const line: GeoLine = {
          id: `abis_${Date.now()}`,
          p1: bis.p1,
          p2: bis.p2,
          name: '',
          dependsOn: {
            type: isExterior ? 'angle-bisector-out' : 'angle-bisector-in',
            parentPointIds: [pts[0].id, pts[1].id, pts[2].id],
          },
          thickness: lineThickness,
          color: lineColor,
          style: isExterior ? 'dash-dot' : 'dash',
          pageIndex,
        };
        onUpdatePage((p) => ({
          ...p,
          points: isNew ? [...p.points, currentPt] : p.points,
          lines: [...p.lines, line],
        }));
        setClickPoints([]);
      } else {
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints(pts);
      }
      return;
    }

    if (tool === 'thebault-circle') {
      if (clickPoints.length < 3) {
        const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
        const pts = [...clickPoints, currentPt];
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints(pts);
        return;
      }

      const [A, B, C] = clickPoints;
      const projectedD = projectPointToSegment(pos, B, C);
      const bcLengthSquared = (C.x - B.x) ** 2 + (C.y - B.y) ** 2;
      const positionOnBC = bcLengthSquared === 0
        ? 0
        : ((projectedD.x - B.x) * (C.x - B.x) + (projectedD.y - B.y) * (C.y - B.y)) / bcLengthSquared;
      if (
        distToSegment(pos, B, C) > 20 ||
        positionOnBC <= 1e-6 ||
        positionOnBC >= 1 - 1e-6
      ) {
        return;
      }

      const existingD = findNearestPoint(pos, 14);
      const D: GeoPoint = existingD && ![A.id, B.id, C.id].includes(existingD.id)
        ? {
            ...existingD,
            hidden: false,
            showLabel: true,
            dependsOn: { type: 'point-on-segment', parentPointIds: [B.id, C.id] },
          }
        : {
            id: `thebault_D_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            name: getNextPointLetter(),
            x: projectedD.x,
            y: projectedD.y,
            size: pointSize,
            color: pointColor,
            style: pointStyle,
            pageIndex,
            showLabel: true,
            dependsOn: { type: 'point-on-segment', parentPointIds: [B.id, C.id] },
          };
      const construction = getThebaultCircle(A, B, C, D);
      if (!construction) return;

      const parentPointIds = [A.id, B.id, C.id, D.id];
      const id = `thebault_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const thebaultCircle: GeoCircle = {
        id: `${id}_circle`,
        center: construction.center,
        radius: construction.radius,
        name: 'Thebault Circle',
        showLabel: false,
        thickness: lineThickness,
        color: '#dc2626',
        style: lineStyle,
        pageIndex,
        dependsOn: { type: 'thebault-circle', parentPointIds },
      };

      onUpdatePage((p) => ({
        ...p,
        points: [
          ...p.points.filter((point) => point.id !== D.id),
          D,
        ],
        circles: [...p.circles, thebaultCircle],
      }));
      setClickPoints([]);
      return;
    }

    // 12. Special Circles & Lines
    if (
      [
        'circumcircle',
        'incircle',
        'excircle',
        'euler-line',
        'euler-circle',
        'mixtilinear-incircle',
        'mixtilinear-excircle',
        'radical-axis',
      ].includes(tool)
    ) {
      if (tool === 'radical-axis') {
        let clickedCircle: GeoCircle | null = null;
        for (const c of page.circles) {
          const d = dist(pos, c.center);
          if (Math.abs(d - c.radius) <= 24 || d <= 30) {
            clickedCircle = c;
            break;
          }
        }
        if (clickedCircle) {
          if (clickCircleIds.length === 0) {
            setClickCircleIds([clickedCircle.id]);
          } else if (clickCircleIds.length === 1 && clickCircleIds[0] !== clickedCircle.id) {
            const c1 = page.circles.find((it) => it.id === clickCircleIds[0]);
            const c2 = clickedCircle;
            if (c1 && c2) {
              const rad = getRadicalAxis(c1, c2, 1200);
              if (rad) {
                const rLine: GeoLine = {
                  id: `rad_${Date.now()}`,
                  p1: rad.p1,
                  p2: rad.p2,
                  name: '',
                  thickness: lineThickness,
                  color: '#dc2626',
                  style: 'dash-dot',
                  isInfinite: true,
                  pageIndex,
                  dependsOn: { type: 'radical-axis', parentCircleIds: [c1.id, c2.id] },
                };
                onUpdatePage((p) => ({ ...p, lines: [...p.lines, rLine] }));
              }
            }
            setClickCircleIds([]);
          }
        }
        return;
      }

      // 3 points triangle constructions
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];
      if (pts.length === 3) {
        const [A, B, C] = pts;
        const parentPointIds = [A.id, B.id, C.id];

        if (tool === 'circumcircle') {
          const cc = getCircumcenter(A, B, C);
          if (cc) {
            const circ: GeoCircle = {
              id: `circum_${Date.now()}`,
              center: cc.center,
              radius: cc.radius,
              name: '',
              dependsOn: { type: 'circumcircle', parentPointIds },
              thickness: lineThickness,
              color: lineColor,
              style: lineStyle,
              pageIndex,
            };
            onUpdatePage((p) => ({
              ...p,
              points: isNew ? [...p.points, currentPt] : p.points,
              circles: [...p.circles, circ],
            }));
          }
        } else if (tool === 'incircle') {
          const inc = getIncenter(A, B, C);
          const circ: GeoCircle = {
            id: `inc_${Date.now()}`,
            center: inc.center,
            radius: inc.radius,
            name: '',
            dependsOn: { type: 'incircle', parentPointIds },
            thickness: lineThickness,
            color: lineColor,
            style: lineStyle,
            pageIndex,
          };
          onUpdatePage((p) => ({
            ...p,
            points: isNew ? [...p.points, currentPt] : p.points,
            circles: [...p.circles, circ],
          }));
        } else if (tool === 'excircle') {
          const exc = getExcenter(A, B, C, 'A');
          const circ: GeoCircle = {
            id: `exc_${Date.now()}`,
            center: exc.center,
            radius: exc.radius,
            name: '',
            dependsOn: { type: 'excircle', parentPointIds, vertex: 'A' },
            thickness: lineThickness,
            color: lineColor,
            style: 'dash',
            pageIndex,
          };
          onUpdatePage((p) => ({
            ...p,
            points: isNew ? [...p.points, currentPt] : p.points,
            circles: [...p.circles, circ],
          }));
        } else if (tool === 'euler-line') {
          const O = getCircumcenter(A, B, C);
          const H = getOrthocenter(A, B, C);
          if (O && H) {
            const el: GeoLine = {
              id: `euler_line_${Date.now()}`,
              p1: O.center,
              p2: H,
              name: '',
              dependsOn: { type: 'euler-line', parentPointIds },
              thickness: lineThickness,
              color: '#dc2626',
              style: 'solid',
              isInfinite: true,
              pageIndex,
            };
            onUpdatePage((p) => ({
              ...p,
              points: isNew ? [...p.points, currentPt] : p.points,
              lines: [...p.lines, el],
            }));
          }
        } else if (tool === 'euler-circle') {
          const eCirc = getNinePointCircle(A, B, C);
          if (eCirc) {
            const circ: GeoCircle = {
              id: `euler_circ_${Date.now()}`,
              center: eCirc.center,
              radius: eCirc.radius,
              name: '',
              dependsOn: { type: 'euler-circle', parentPointIds },
              thickness: lineThickness,
              color: '#9333ea',
              style: 'dash-dot',
              pageIndex,
            };
            onUpdatePage((p) => ({
              ...p,
              points: isNew ? [...p.points, currentPt] : p.points,
              circles: [...p.circles, circ],
            }));
          }
        } else if (tool === 'mixtilinear-incircle') {
          const mix = getMixtilinearIncircle(A, B, C);
          const circleId = `mix_in_${Date.now()}`;
          const pointCount = page.points.length + Number(isNew);
          const touchpoint: GeoPoint = {
            id: `${circleId}_touch`,
            name: String.fromCharCode(65 + (pointCount % 26)) + (pointCount >= 26 ? Math.floor(pointCount / 26) : ''),
            x: mix.touchpoint.x,
            y: mix.touchpoint.y,
            size: pointSize,
            color: '#2563eb',
            style: 'solid',
            pageIndex,
            showLabel: true,
            dependsOn: {
              type: 'mixtilinear-incircle-touchpoint',
              parentPointIds,
            },
          };
          const circ: GeoCircle = {
            id: circleId,
            center: mix.center,
            radius: mix.radius,
            name: '',
            dependsOn: { type: 'mixtilinear-incircle', parentPointIds, vertex: 'A' },
            thickness: lineThickness,
            color: '#2563eb',
            style: lineStyle,
            pageIndex,
          };
          onUpdatePage((p) => ({
            ...p,
            points: [...(isNew ? [...p.points, currentPt] : p.points), touchpoint],
            circles: [...p.circles, circ],
          }));
        } else if (tool === 'mixtilinear-excircle') {
          const mixEx = getMixtilinearExcircle(A, B, C);
          const circleId = `mix_ex_${Date.now()}`;
          const pointCount = page.points.length + Number(isNew);
          const touchpoint: GeoPoint = {
            id: `${circleId}_touch`,
            name: String.fromCharCode(65 + (pointCount % 26)) + (pointCount >= 26 ? Math.floor(pointCount / 26) : ''),
            x: mixEx.touchpoint.x,
            y: mixEx.touchpoint.y,
            size: pointSize,
            color: '#ea580c',
            style: 'solid',
            pageIndex,
            showLabel: true,
            dependsOn: {
              type: 'mixtilinear-excircle-touchpoint',
              parentPointIds,
            },
          };
          const circ: GeoCircle = {
            id: circleId,
            center: mixEx.center,
            radius: mixEx.radius,
            name: '',
            dependsOn: { type: 'mixtilinear-excircle', parentPointIds, vertex: 'A' },
            thickness: lineThickness,
            color: '#ea580c',
            style: 'dash',
            pageIndex,
          };
          onUpdatePage((p) => ({
            ...p,
            points: [...(isNew ? [...p.points, currentPt] : p.points), touchpoint],
            circles: [...p.circles, circ],
          }));
        }

        setClickPoints([]);
      } else {
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints(pts);
      }
      return;
    }

    // 13. Triangle Centers
    if (tool.startsWith('center-')) {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];
      if (pts.length === 3) {
        const [A, B, C] = pts;
        const parentPointIds = [A.id, B.id, C.id];
        let targetPt: Point2D | null = null;
        let ptName = 'P';
        const centerType = tool.replace('center-', '') as NonNullable<GeoPoint['dependsOn']>['type'];

        if (tool === 'center-centroid') {
          targetPt = getCentroid(A, B, C);
          ptName = 'G';
        } else if (tool === 'center-circumcenter') {
          const cc = getCircumcenter(A, B, C);
          targetPt = cc ? cc.center : null;
          ptName = 'O';
        } else if (tool === 'center-orthocenter') {
          targetPt = getOrthocenter(A, B, C);
          ptName = 'H';
        } else if (tool === 'center-humpty') {
          targetPt = getHumptyPoint(A, B, C);
          ptName = 'H_A';
        } else if (tool === 'center-dumpty') {
          targetPt = getDumptyPoint(A, B, C);
          ptName = 'D_A';
        } else if (tool === 'center-incenter') {
          const inc = getIncenter(A, B, C);
          targetPt = inc.center;
          ptName = 'I';
        } else if (tool === 'center-excenter') {
          const exc = getExcenter(A, B, C, 'A');
          targetPt = exc.center;
          ptName = 'I_A';
        } else if (tool === 'center-lemoine') {
          targetPt = getLemoinePoint(A, B, C);
          ptName = 'K';
        } else if (tool === 'center-gergonne') {
          targetPt = getGergonnePoint(A, B, C);
          ptName = 'Ge';
        } else if (tool === 'center-nagel') {
          targetPt = getNagelPoint(A, B, C);
          ptName = 'Na';
        } else if (tool === 'center-feuerbach') {
          targetPt = getFeuerbachPoint(A, B, C);
          ptName = 'Fe';
        } else if (tool === 'center-euler') {
          const eC = getNinePointCircle(A, B, C);
          targetPt = eC ? eC.center : null;
          ptName = 'N';
        }

        if (targetPt) {
          const newPt: GeoPoint = {
            id: `center_${Date.now()}`,
            name: ptName,
            x: targetPt.x,
            y: targetPt.y,
            size: pointSize,
            color: tool === 'center-humpty' || tool === 'center-dumpty' ? pointColor : '#dc2626',
            style: 'solid',
            pageIndex,
            dependsOn: { type: centerType, parentPointIds },
          };
          onUpdatePage((p) => ({
            ...p,
            points: isNew ? [...p.points, currentPt, newPt] : [...p.points, newPt],
          }));
        }
        setClickPoints([]);
        setTempCreatedPointIds([]);
      } else {
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints(pts);
      }
      return;
    }

    // 14. Conic Sections: Reactive construction with genuine point dependencies!
    // Ellipse: 2 Foci + 1 Point
    if (tool === 'conic-ellipse-2foci-1pt') {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];
      if (pts.length === 3) {
        const [p1, p2, p3] = pts;
        const newConic: GeoConic = {
          id: `conic_${Date.now()}`,
          name: '',
          type: 'ellipse',
          subType: 'ellipse-2foci-1pt',
          foci: [{ x: p1.x, y: p1.y }, { x: p2.x, y: p2.y }],
          fociPointIds: [p1.id, p2.id],
          point: { x: p3.x, y: p3.y },
          pointId: p3.id,
          thickness: lineThickness,
          color: lineColor,
          style: lineStyle,
          pageIndex,
        };
        onUpdatePage((p) => ({
          ...p,
          points: isNew ? [...p.points, currentPt] : p.points,
          conics: [...p.conics, newConic],
        }));
        setClickPoints([]);
        setTempCreatedPointIds([]);
      } else {
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints(pts);
      }
      return;
    }

    // Parabola: Focus + Directrix (3 points: Focus, Directrix P1, Directrix P2)
    if (tool === 'conic-parabola-focus-directrix') {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];
      if (pts.length === 3) {
        const [fPt, dP1, dP2] = pts;
        const newConic: GeoConic = {
          id: `conic_${Date.now()}`,
          name: '',
          type: 'parabola',
          subType: 'parabola-focus-directrix',
          focus: { x: fPt.x, y: fPt.y },
          focusPointId: fPt.id,
          directrix: { p1: { x: dP1.x, y: dP1.y }, p2: { x: dP2.x, y: dP2.y } },
          directrixPointIds: [dP1.id, dP2.id],
          thickness: lineThickness,
          color: lineColor,
          style: lineStyle,
          pageIndex,
        };
        const dLine: GeoLine = {
          id: `dir_${Date.now()}`,
          p1: { x: dP1.x, y: dP1.y },
          p2: { x: dP2.x, y: dP2.y },
          p1PointId: dP1.id,
          p2PointId: dP2.id,
          name: '',
          thickness: lineThickness,
          color: '#64748b',
          style: 'dash',
          isInfinite: true,
          pageIndex,
        };
        onUpdatePage((p) => ({
          ...p,
          points: isNew ? [...p.points, currentPt] : p.points,
          conics: [...p.conics, newConic],
          lines: [...p.lines, dLine],
        }));
        setClickPoints([]);
        setTempCreatedPointIds([]);
      } else {
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints(pts);
      }
      return;
    }

    // Hyperbola: 2 Foci + 1 Point
    if (tool === 'conic-hyperbola-2foci-1pt') {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];
      if (pts.length === 3) {
        const [p1, p2, p3] = pts;
        const newConic: GeoConic = {
          id: `conic_${Date.now()}`,
          name: '',
          type: 'hyperbola',
          subType: 'hyperbola-2foci-1pt',
          foci: [{ x: p1.x, y: p1.y }, { x: p2.x, y: p2.y }],
          fociPointIds: [p1.id, p2.id],
          point: { x: p3.x, y: p3.y },
          pointId: p3.id,
          thickness: lineThickness,
          color: lineColor,
          style: lineStyle,
          pageIndex,
        };
        onUpdatePage((p) => ({
          ...p,
          points: isNew ? [...p.points, currentPt] : p.points,
          conics: [...p.conics, newConic],
        }));
        setClickPoints([]);
        setTempCreatedPointIds([]);
      } else {
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints(pts);
      }
      return;
    }

    // 5-Point Conics
    if (tool === 'conic-5pt' || tool === 'conic-ellipse-5pt' || tool === 'conic-parabola-5pt' || tool === 'conic-hyperbola-5pt') {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];
      if (pts.length === 5) {
        const rawPts = pts.map((p) => ({ x: p.x, y: p.y }));
        const coeffs = fitConic5Points(rawPts);
        const discriminant = coeffs ? coeffs[1] * coeffs[1] - 4 * coeffs[0] * coeffs[2] : 0;
        const conicType = tool === 'conic-5pt'
          ? discriminant < -1e-7 ? 'ellipse' : discriminant > 1e-7 ? 'hyperbola' : 'parabola'
          : tool.includes('ellipse') ? 'ellipse' : tool.includes('parabola') ? 'parabola' : 'hyperbola';
        const newConic: GeoConic = {
          id: `conic_${Date.now()}`,
          name: '',
          type: conicType,
          subType: '5-point',
          points5: rawPts,
          points5Ids: pts.map((p) => p.id),
          coefficients: coeffs || undefined,
          thickness: lineThickness,
          color: lineColor,
          style: lineStyle,
          pageIndex,
        };
        onUpdatePage((p) => ({
          ...p,
          points: p.points.map((point) => pts.some((definingPoint) => definingPoint.id === point.id)
            ? { ...point, hidden: false, showLabel: true }
            : point).concat(isNew ? [{ ...currentPt, hidden: false, showLabel: true }] : []),
          conics: [...p.conics, newConic],
        }));
        setClickPoints([]);
        setTempCreatedPointIds([]);
      } else {
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints(pts);
      }
      return;
    }

    // 15. Transformations
    // 15a. Rotation: Specify center of rotation first, specify target, type angle (Items 11 & 20)
    if (tool === 'rotation') {
      if (clickPoints.length === 0) {
        // Step 1: Click center of rotation
        const { point: centerPt, isNew } = resolveOrCreatePoint(pos);
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, centerPt] }));
        setClickPoints([centerPt]);
        setTempCreatedPointIds([]);
        return;
      }

      // Step 2: Target object clicked
      const centerPt = clickPoints[0];

      // Prompt user to type the angle (Item 11 & 20)
      const angleInput = window.prompt("Enter angle of rotation in degrees (°):", String(rotationAngleDeg || 45));
      if (angleInput === null) {
        setClickPoints([]);
        return;
      }
      const deg = parseFloat(angleInput) || rotationAngleDeg || 45;
      const rad = (deg * Math.PI) / 180;

      const targetPt = findNearestPoint(pos, 16);
      const targetLine = page.lines.find((l) => distToSegment(pos, l.p1, l.p2) <= 14 || distToLine(pos, l.p1, l.p2) <= 14);
      const targetCirc = page.circles.find((c) => Math.abs(dist(pos, c.center) - c.radius) <= 16);
      const targetPoly = page.polygons.find((pl) => pointInPolygon(pos, pl.points));

      if (targetLine && !targetPt) {
        const p1 = rotatePoint(targetLine.p1, centerPt, rad);
        const p2 = rotatePoint(targetLine.p2, centerPt, rad);
        const newLine: GeoLine = {
          id: `rot_line_${Date.now()}`,
          p1,
          p2,
          name: `${targetLine.name || 'l'}'`,
          thickness: targetLine.thickness,
          color: targetLine.color,
          style: targetLine.style,
          isInfinite: targetLine.isInfinite,
          pageIndex,
          dependsOn: { type: 'rotation', parentLineIds: [targetLine.id], parentPointIds: [centerPt.id], angleDeg: deg },
        };
        onUpdatePage((p) => ({ ...p, lines: [...p.lines, newLine] }));
      } else if (targetCirc && !targetPt) {
        const newCenter = rotatePoint(targetCirc.center, centerPt, rad);
        const newCirc: GeoCircle = {
          id: `rot_circ_${Date.now()}`,
          center: newCenter,
          radius: targetCirc.radius,
          name: `${targetCirc.name || 'c'}'`,
          thickness: targetCirc.thickness,
          color: targetCirc.color,
          style: targetCirc.style,
          pageIndex,
          dependsOn: { type: 'rotation', parentCircleIds: [targetCirc.id], parentPointIds: [centerPt.id], angleDeg: deg },
        };
        onUpdatePage((p) => ({ ...p, circles: [...p.circles, newCirc] }));
      } else if (targetPoly && !targetPt) {
        const newPoints = targetPoly.points.map((p) => rotatePoint(p, centerPt, rad));
        const newPoly: GeoPolygon = {
          id: `rot_poly_${Date.now()}`,
          points: newPoints,
          pointIds: [],
          name: `${targetPoly.name || 'P'}'`,
          thickness: targetPoly.thickness,
          color: targetPoly.color,
          style: targetPoly.style,
          fillColor: targetPoly.fillColor,
          pageIndex,
        };
        onUpdatePage((p) => ({ ...p, polygons: [...p.polygons, newPoly] }));
      } else {
        // Target is point (existing or newly placed)
        const { point: P, isNew } = resolveOrCreatePoint(pos);
        const rot = rotatePoint(P, centerPt, rad);
        const newPt: GeoPoint = {
          id: `rot_${Date.now()}`,
          name: `${P.name || 'P'}'`,
          x: rot.x,
          y: rot.y,
          size: pointSize,
          color: '#9333ea',
          style: 'solid',
          pageIndex,
          dependsOn: {
            type: 'rotation',
            parentPointIds: [P.id, centerPt.id],
            angleDeg: deg,
          },
        };
        onUpdatePage((p) => ({
          ...p,
          points: isNew ? [...p.points, P, newPt] : [...p.points, newPt],
        }));
      }

      setClickPoints([]);
      setTempCreatedPointIds([]);
      return;
    }

    // 15b. Isogonal Line: 4 points (Vertex A, Point B, Point C, and Point P on ray AP)
    if (tool === 'isogonal-line') {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const pts = [...clickPoints, currentPt];
      if (pts.length === 4) {
        const [A, B, C, P] = pts;
        const iso = getIsogonalLine(A, B, C, P, 1500);
        const newLine: GeoLine = {
          id: `isoline_${Date.now()}`,
          p1: iso.p1,
          p2: iso.p2,
          p1PointId: A.id,
          name: '',
          thickness: lineThickness,
          color: '#8b5cf6',
          style: 'dash-dot',
          isInfinite: true,
          pageIndex,
          dependsOn: {
            type: 'isogonal-line',
            parentPointIds: [A.id, B.id, C.id, P.id],
          },
        };
        onUpdatePage((p) => ({
          ...p,
          points: isNew ? [...p.points, currentPt] : p.points,
          lines: [...p.lines, newLine],
        }));
        setClickPoints([]);
        setTempCreatedPointIds([]);
      } else {
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints(pts);
      }
      return;
    }

    if (tool === 'translate-vector' || tool === 'dilation') {
      if (!transformTarget) {
        const target = findTransformTarget(pos);
        if (target) {
          if (target.type === 'point') {
            const { point } = resolveOrCreatePoint(pos);
            setTransformTarget({ type: 'point', id: point.id });
          } else {
            setTransformTarget(target);
          }
        } else {
          const { point, isNew } = resolveOrCreatePoint(pos);
          if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, point] }));
          setTransformTarget({ type: 'point', id: point.id });
        }
        return;
      }

      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);

      if (tool === 'dilation') {
        const ratioInput = window.prompt('Enter dilation ratio (e.g. 2, 0.5, -1):', '2');
        if (ratioInput === null) {
          setTransformTarget(null);
          setClickPoints([]);
          return;
        }
        const ratio = Number(ratioInput);
        if (!Number.isFinite(ratio)) {
          window.alert('Enter a valid finite dilation ratio.');
          return;
        }

        const targetPoint = transformTarget.type === 'point'
          ? page.points.find((point) => point.id === transformTarget.id)
          : undefined;
        const targetLine = transformTarget.type === 'line'
          ? page.lines.find((line) => line.id === transformTarget.id)
          : undefined;
        const targetCircle = transformTarget.type === 'circle'
          ? page.circles.find((circle) => circle.id === transformTarget.id)
          : undefined;
        const targetPolygon = transformTarget.type === 'polygon'
          ? page.polygons.find((polygon) => polygon.id === transformTarget.id)
          : undefined;
        const targetConic = transformTarget.type === 'conic'
          ? page.conics.find((conic) => conic.id === transformTarget.id)
          : undefined;
        const targetAngle = transformTarget.type === 'angle'
          ? page.angles.find((angle) => angle.id === transformTarget.id)
          : undefined;
        const id = `dil_${Date.now()}`;
        const revealTarget = (scene: PageData): PageData => ({
          ...scene,
          points: scene.points.map((point) => point.id === transformTarget.id
            ? { ...point, hidden: false, showLabel: true }
            : point),
          lines: scene.lines.map((line) => line.id === transformTarget.id ? { ...line, hidden: false } : line),
          circles: scene.circles.map((circle) => circle.id === transformTarget.id ? { ...circle, hidden: false } : circle),
          polygons: scene.polygons.map((polygon) => polygon.id === transformTarget.id ? { ...polygon, hidden: false } : polygon),
          conics: scene.conics.map((conic) => conic.id === transformTarget.id ? { ...conic, hidden: false } : conic),
          angles: scene.angles.map((angle) => angle.id === transformTarget.id ? { ...angle, hidden: false } : angle),
        });
        const parentPointIds = [currentPt.id];
        const pointToDilate = (point: Point2D) => dilatePoint(point, currentPt, ratio);
        const additions = revealTarget;

        if (targetPoint) {
          const result = pointToDilate(targetPoint);
          const newPoint: GeoPoint = {
            id,
            name: `${targetPoint.name || 'P'}'`,
            ...result,
            size: pointSize,
            color: '#16a34a',
            style: 'solid',
            pageIndex,
            dependsOn: { type: 'dilation', parentPointIds: [targetPoint.id, currentPt.id], ratio },
          };
          onUpdatePage((scene) => {
            const prepared = additions(scene);
            return {
              ...prepared,
              points: isNew ? [...prepared.points, currentPt, newPoint] : [...prepared.points, newPoint],
            };
          });
        } else if (targetLine) {
          const newLine: GeoLine = {
            ...targetLine,
            id,
            name: `${targetLine.name || 'l'}'`,
            p1: pointToDilate(targetLine.p1),
            p2: pointToDilate(targetLine.p2),
            p1PointId: undefined,
            p2PointId: undefined,
            hidden: false,
            dependsOn: { type: 'dilation', parentLineIds: [targetLine.id], parentPointIds, ratio },
          };
          onUpdatePage((scene) => {
            const prepared = additions(scene);
            return { ...prepared, points: isNew ? [...prepared.points, currentPt] : prepared.points, lines: [...prepared.lines, newLine] };
          });
        } else if (targetCircle) {
          const newCircle: GeoCircle = {
            ...targetCircle,
            id,
            name: `${targetCircle.name || 'c'}'`,
            center: pointToDilate(targetCircle.center),
            radius: Math.abs(ratio) * targetCircle.radius,
            centerPointId: undefined,
            radiusPointId: undefined,
            hidden: false,
            dependsOn: { type: 'dilation', parentCircleIds: [targetCircle.id], parentPointIds, ratio },
          };
          onUpdatePage((scene) => {
            const prepared = additions(scene);
            return { ...prepared, points: isNew ? [...prepared.points, currentPt] : prepared.points, circles: [...prepared.circles, newCircle] };
          });
        } else if (targetPolygon) {
          const newPolygon: GeoPolygon = {
            ...targetPolygon,
            id,
            name: `${targetPolygon.name || 'P'}'`,
            points: targetPolygon.points.map(pointToDilate),
            pointIds: undefined,
            hidden: false,
            dependsOn: { type: 'dilation', parentPolygonIds: [targetPolygon.id], parentPointIds, ratio },
          };
          onUpdatePage((scene) => {
            const prepared = additions(scene);
            return { ...prepared, points: isNew ? [...prepared.points, currentPt] : prepared.points, polygons: [...prepared.polygons, newPolygon] };
          });
        } else if (targetConic) {
          const newConic: GeoConic = {
            ...targetConic,
            id,
            name: `${targetConic.name || 'c'}'`,
            foci: targetConic.foci ? [pointToDilate(targetConic.foci[0]), pointToDilate(targetConic.foci[1])] : undefined,
            focus: targetConic.focus ? pointToDilate(targetConic.focus) : undefined,
            directrix: targetConic.directrix ? {
              p1: pointToDilate(targetConic.directrix.p1),
              p2: pointToDilate(targetConic.directrix.p2),
            } : undefined,
            point: targetConic.point ? pointToDilate(targetConic.point) : undefined,
            points5: targetConic.points5?.map(pointToDilate),
            coefficients: targetConic.points5 ? fitConic5Points(targetConic.points5.map(pointToDilate)) || undefined : targetConic.coefficients,
            hidden: false,
            dependsOn: { type: 'dilation', parentConicIds: [targetConic.id], parentPointIds, ratio },
          };
          onUpdatePage((scene) => {
            const prepared = additions(scene);
            return { ...prepared, points: isNew ? [...prepared.points, currentPt] : prepared.points, conics: [...prepared.conics, newConic] };
          });
        } else if (targetAngle) {
          const newAngle: GeoAngle = {
            ...targetAngle,
            id,
            center: pointToDilate(targetAngle.center),
            p1: pointToDilate(targetAngle.p1),
            p2: pointToDilate(targetAngle.p2),
            radius: Math.abs(ratio) * targetAngle.radius,
            hidden: false,
            dependsOn: { type: 'dilation', parentAngleIds: [targetAngle.id], parentPointIds, ratio },
          };
          onUpdatePage((scene) => {
            const prepared = additions(scene);
            return { ...prepared, points: isNew ? [...prepared.points, currentPt] : prepared.points, angles: [...prepared.angles, newAngle] };
          });
        }
        setTransformTarget(null);
        setClickPoints([]);
        setTempCreatedPointIds([]);
        return;
      }

      if (clickPoints.length === 0) {
        if (isNew) onUpdatePage((scene) => ({ ...scene, points: [...scene.points, currentPt] }));
        setClickPoints([currentPt]);
        return;
      }

      const from = clickPoints[0];
      const to = currentPt;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const id = `trans_${Date.now()}`;
      const moved = (point: Point2D) => ({ x: point.x + dx, y: point.y + dy });
      const targetPoint = transformTarget.type === 'point' ? page.points.find((point) => point.id === transformTarget.id) : undefined;
      const targetLine = transformTarget.type === 'line' ? page.lines.find((line) => line.id === transformTarget.id) : undefined;
      const targetCircle = transformTarget.type === 'circle' ? page.circles.find((circle) => circle.id === transformTarget.id) : undefined;
      const targetPolygon = transformTarget.type === 'polygon' ? page.polygons.find((polygon) => polygon.id === transformTarget.id) : undefined;
      const targetConic = transformTarget.type === 'conic' ? page.conics.find((conic) => conic.id === transformTarget.id) : undefined;
      const targetAngle = transformTarget.type === 'angle' ? page.angles.find((angle) => angle.id === transformTarget.id) : undefined;
      const parentPointIds = [from.id, to.id];
      const revealTarget = (scene: PageData): PageData => ({
        ...scene,
        points: scene.points.map((point) => point.id === transformTarget.id ? { ...point, hidden: false, showLabel: true } : point),
        lines: scene.lines.map((line) => line.id === transformTarget.id ? { ...line, hidden: false } : line),
        circles: scene.circles.map((circle) => circle.id === transformTarget.id ? { ...circle, hidden: false } : circle),
        polygons: scene.polygons.map((polygon) => polygon.id === transformTarget.id ? { ...polygon, hidden: false } : polygon),
        conics: scene.conics.map((conic) => conic.id === transformTarget.id ? { ...conic, hidden: false } : conic),
        angles: scene.angles.map((angle) => angle.id === transformTarget.id ? { ...angle, hidden: false } : angle),
      });

      if (targetPoint) {
        const newPoint: GeoPoint = {
          id,
          name: `${targetPoint.name || 'P'}''`,
          ...moved(targetPoint),
          size: pointSize,
          color: '#2563eb',
          style: 'solid',
          pageIndex,
          dependsOn: { type: 'translation', parentPointIds: [targetPoint.id, from.id, to.id] },
        };
        onUpdatePage((scene) => {
          const prepared = revealTarget(scene);
          return { ...prepared, points: isNew ? [...prepared.points, to, newPoint] : [...prepared.points, newPoint] };
        });
      } else if (targetLine) {
        const newLine: GeoLine = {
          ...targetLine,
          id,
          name: `${targetLine.name || 'l'}''`,
          p1: moved(targetLine.p1),
          p2: moved(targetLine.p2),
          p1PointId: undefined,
          p2PointId: undefined,
          hidden: false,
          dependsOn: { type: 'translation', parentLineIds: [targetLine.id], parentPointIds },
        };
        onUpdatePage((scene) => {
          const prepared = revealTarget(scene);
          return { ...prepared, points: isNew ? [...prepared.points, to] : prepared.points, lines: [...prepared.lines, newLine] };
        });
      } else if (targetCircle) {
        const newCircle: GeoCircle = {
          ...targetCircle,
          id,
          name: `${targetCircle.name || 'c'}''`,
          center: moved(targetCircle.center),
          centerPointId: undefined,
          radiusPointId: undefined,
          hidden: false,
          dependsOn: { type: 'translation', parentCircleIds: [targetCircle.id], parentPointIds },
        };
        onUpdatePage((scene) => {
          const prepared = revealTarget(scene);
          return { ...prepared, points: isNew ? [...prepared.points, to] : prepared.points, circles: [...prepared.circles, newCircle] };
        });
      } else if (targetPolygon) {
        const newPolygon: GeoPolygon = {
          ...targetPolygon,
          id,
          name: `${targetPolygon.name || 'P'}''`,
          points: targetPolygon.points.map(moved),
          pointIds: undefined,
          hidden: false,
          dependsOn: { type: 'translation', parentPolygonIds: [targetPolygon.id], parentPointIds },
        };
        onUpdatePage((scene) => {
          const prepared = revealTarget(scene);
          return { ...prepared, points: isNew ? [...prepared.points, to] : prepared.points, polygons: [...prepared.polygons, newPolygon] };
        });
      } else if (targetConic) {
        const newConic: GeoConic = {
          ...targetConic,
          id,
          name: `${targetConic.name || 'c'}''`,
          foci: targetConic.foci ? [moved(targetConic.foci[0]), moved(targetConic.foci[1])] : undefined,
          focus: targetConic.focus ? moved(targetConic.focus) : undefined,
          directrix: targetConic.directrix ? { p1: moved(targetConic.directrix.p1), p2: moved(targetConic.directrix.p2) } : undefined,
          point: targetConic.point ? moved(targetConic.point) : undefined,
          points5: targetConic.points5?.map(moved),
          coefficients: targetConic.points5 ? fitConic5Points(targetConic.points5.map(moved)) || undefined : targetConic.coefficients,
          hidden: false,
          dependsOn: { type: 'translation', parentConicIds: [targetConic.id], parentPointIds },
        };
        onUpdatePage((scene) => {
          const prepared = revealTarget(scene);
          return { ...prepared, points: isNew ? [...prepared.points, to] : prepared.points, conics: [...prepared.conics, newConic] };
        });
      } else if (targetAngle) {
        const newAngle: GeoAngle = {
          ...targetAngle,
          id,
          center: moved(targetAngle.center),
          p1: moved(targetAngle.p1),
          p2: moved(targetAngle.p2),
          hidden: false,
          dependsOn: { type: 'translation', parentAngleIds: [targetAngle.id], parentPointIds },
        };
        onUpdatePage((scene) => {
          const prepared = revealTarget(scene);
          return { ...prepared, points: isNew ? [...prepared.points, to] : prepared.points, angles: [...prepared.angles, newAngle] };
        });
      }
      setTransformTarget(null);
      setClickPoints([]);
      setTempCreatedPointIds([]);
      return;
    }

    // 15e. Unified and Robust Inversion with Circle (Point, Line, or Circle)
    if (
      tool === 'inversion-circle' ||
      tool === 'inversion-line-to-circle' ||
      tool === 'inversion-circle-to-circle' ||
      tool === 'inversion-circle-thru-center-to-line'
    ) {
      const clickedCirc = page.circles.find(
        (c) => Math.abs(dist(pos, c.center) - c.radius) <= 18 || dist(pos, c.center) <= 22
      );
      const clickedLine = page.lines.find(
        (l) => distToSegment(pos, l.p1, l.p2) <= 14 || distToLine(pos, l.p1, l.p2) <= 14
      );
      const clickedPt = findNearestPoint(pos, 16);

      // Case 1: Inversion Circle is already selected (in clickCircleIds)
      if (clickCircleIds.length > 0) {
        const invCircle = page.circles.find((c) => c.id === clickCircleIds[0]);
        if (!invCircle) {
          setClickCircleIds([]);
          return;
        }

        // Give existing points priority over lines or circles they overlap.
        if (clickedPt) {
          const inv = invertPoint(clickedPt, invCircle);
          if (inv) {
            const newPt: GeoPoint = {
              id: `inv_${Date.now()}`,
              name: `${clickedPt.name || 'P'}'`,
              x: inv.x,
              y: inv.y,
              size: pointSize,
              color: '#dc2626',
              style: 'solid',
              pageIndex,
              dependsOn: {
                type: 'inversion',
                parentPointIds: [clickedPt.id],
                parentCircleIds: [invCircle.id],
              },
            };
            onUpdatePage((p) => ({ ...p, points: [...p.points, newPt] }));
          }
          setClickCircleIds([]);
          return;
        }

        // If clicking another circle (inversion of circle)
        if (clickedCirc && clickedCirc.id !== invCircle.id) {
          const res = invertCircle(clickedCirc, invCircle);
          if (res) {
            if (res.type === 'circle') {
              const c: GeoCircle = {
                id: `inv_circ_${Date.now()}`,
                center: res.center,
                radius: res.radius,
                name: '',
                dependsOn: { type: 'inversion', parentCircleIds: [clickedCirc.id, invCircle.id] },
                thickness: lineThickness,
                color: '#7c3aed',
                style: 'dash',
                pageIndex,
              };
              onUpdatePage((p) => ({ ...p, circles: [...p.circles, c] }));
            } else {
              const ln: GeoLine = {
                id: `inv_line_${Date.now()}`,
                p1: res.p1,
                p2: res.p2,
                name: '',
                dependsOn: { type: 'inversion', parentCircleIds: [clickedCirc.id, invCircle.id] },
                thickness: lineThickness,
                color: '#7c3aed',
                style: 'dash',
                pageIndex,
              };
              onUpdatePage((p) => ({ ...p, lines: [...p.lines, ln] }));
            }
          }
          setClickCircleIds([]);
          return;
        }

        // If clicking a line (inversion of line)
        if (clickedLine) {
          const res = invertLine(clickedLine, invCircle);
          if (res) {
            if (res.type === 'circle') {
              const c: GeoCircle = {
                id: `inv_circ_${Date.now()}`,
                center: res.center,
                radius: res.radius,
                name: '',
                dependsOn: { type: 'inversion', parentCircleIds: [invCircle.id], parentLineIds: [clickedLine.id] },
                thickness: lineThickness,
                color: '#7c3aed',
                style: 'dash',
                pageIndex,
              };
              onUpdatePage((p) => ({ ...p, circles: [...p.circles, c] }));
            } else {
              const ln: GeoLine = {
                id: `inv_line_${Date.now()}`,
                p1: res.p1,
                p2: res.p2,
                name: '',
                dependsOn: { type: 'inversion', parentCircleIds: [invCircle.id], parentLineIds: [clickedLine.id] },
                thickness: lineThickness,
                color: '#7c3aed',
                style: 'dash',
                pageIndex,
              };
              onUpdatePage((p) => ({ ...p, lines: [...p.lines, ln] }));
            }
          }
          setClickCircleIds([]);
          return;
        }

        // Else: Invert a point (either clicked existing point or new point)
        const { point: targetPt, isNew } = resolveOrCreatePoint(pos);
        const inv = invertPoint(targetPt, invCircle);
        if (inv) {
          const newPt: GeoPoint = {
            id: `inv_${Date.now()}`,
            name: `${targetPt.name || 'P'}'`,
            x: inv.x,
            y: inv.y,
            size: pointSize,
            color: '#dc2626',
            style: 'solid',
            pageIndex,
            dependsOn: {
              type: 'inversion',
              parentPointIds: [targetPt.id],
              parentCircleIds: [invCircle.id],
            },
          };
          onUpdatePage((p) => ({
            ...p,
            points: isNew ? [...p.points, targetPt, newPt] : [...p.points, newPt],
          }));
        }
        setClickCircleIds([]);
        return;
      }

      // Case 2: A Point was clicked first (waiting for Inversion Circle)
      if (clickPoints.length > 0) {
        if (clickedCirc) {
          const P = clickPoints[0];
          const inv = invertPoint(P, clickedCirc);
          if (inv) {
            const newPt: GeoPoint = {
              id: `inv_${Date.now()}`,
              name: `${P.name || 'P'}'`,
              x: inv.x,
              y: inv.y,
              size: pointSize,
              color: '#dc2626',
              style: 'solid',
              pageIndex,
              dependsOn: {
                type: 'inversion',
                parentPointIds: [P.id],
                parentCircleIds: [clickedCirc.id],
              },
            };
            onUpdatePage((p) => ({ ...p, points: [...p.points, newPt] }));
          }
          setClickPoints([]);
        }
        return;
      }

      // Case 3: A Line was clicked first (waiting for Inversion Circle)
      if (clickLineIds.length > 0) {
        if (clickedCirc) {
          const line = page.lines.find((l) => l.id === clickLineIds[0]);
          if (line) {
            const res = invertLine(line, clickedCirc);
            if (res) {
              if (res.type === 'circle') {
                const c: GeoCircle = {
                  id: `inv_circ_${Date.now()}`,
                  center: res.center,
                  radius: res.radius,
                  name: '',
                  dependsOn: { type: 'inversion', parentCircleIds: [clickedCirc.id], parentLineIds: [line.id] },
                  thickness: lineThickness,
                  color: '#7c3aed',
                  style: 'dash',
                  pageIndex,
                };
                onUpdatePage((p) => ({ ...p, circles: [...p.circles, c] }));
              } else {
                const ln: GeoLine = {
                  id: `inv_line_${Date.now()}`,
                  p1: res.p1,
                  p2: res.p2,
                  name: '',
                  dependsOn: { type: 'inversion', parentCircleIds: [clickedCirc.id], parentLineIds: [line.id] },
                  thickness: lineThickness,
                  color: '#7c3aed',
                  style: 'dash',
                  pageIndex,
                };
                onUpdatePage((p) => ({ ...p, lines: [...p.lines, ln] }));
              }
            }
          }
          setClickLineIds([]);
        }
        return;
      }

      // Case 4: First click with no selections yet
      // A point lying on a line or circle is still an explicit point selection.
      if (clickedPt) {
        setClickPoints([clickedPt]);
        return;
      }
      if (clickedCirc) {
        setClickCircleIds([clickedCirc.id]);
        return;
      }
      if (clickedLine) {
        setClickLineIds([clickedLine.id]);
        return;
      }
      // Or if empty space clicked, create a point and wait for circle
      const { point: newP } = resolveOrCreatePoint(pos);
      onUpdatePage((p) => ({ ...p, points: [...p.points, newP] }));
      setClickPoints([newP]);
      return;
    }

    // 15g. Pole of a Line
    if (tool === 'pole-line') {
      const clickedLine = page.lines.find((l) => distToSegment(pos, l.p1, l.p2) <= 18 || distToLine(pos, l.p1, l.p2) <= 18);
      const clickedCirc = page.circles.find(
        (c) => Math.abs(dist(pos, c.center) - c.radius) <= 24 || dist(pos, c.center) <= 30
      );
      if (clickLineIds.length === 0 && clickedLine) {
        setClickLineIds([clickedLine.id]);
      } else if (clickLineIds.length > 0 && clickedCirc) {
        const l = page.lines.find((it) => it.id === clickLineIds[0]);
        if (l) {
          const pole = getPoleOfLine(l, clickedCirc);
          if (pole) {
            const newPt: GeoPoint = {
              id: `pole_${Date.now()}`,
              name: "Pole",
              x: pole.x,
              y: pole.y,
              size: pointSize + 1,
              color: '#dc2626',
              style: 'solid',
              pageIndex,
              dependsOn: { type: 'pole-line', parentPointIds: [], parentLineIds: [l.id], parentCircleIds: [clickedCirc.id] },
            };
            onUpdatePage((p) => ({ ...p, points: [...p.points, newPt] }));
          }
        }
        setClickLineIds([]);
      }
      return;
    }

    // 15h. Polar Line
    if (tool === 'polar-line') {
      if (clickPoints.length === 0) {
        const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints([currentPt]);
      } else {
        const P = clickPoints[0];
        const clickedCirc = page.circles.find(
          (c) => Math.abs(dist(pos, c.center) - c.radius) < 25 || dist(pos, c.center) < 30
        );
        const circ = clickedCirc || { center: pos, radius: 80 };
        const pol = getPolarLine(P, circ, 1200);
        if (pol) {
          const pLine: GeoLine = {
            id: `polar_${Date.now()}`,
            p1: pol.p1,
            p2: pol.p2,
            name: '',
            thickness: lineThickness,
            color: '#7c3aed',
            style: 'dash',
            isInfinite: true,
            pageIndex,
            dependsOn: {
              type: 'polar-line',
              parentPointIds: [P.id],
              parentCircleIds: clickedCirc ? [clickedCirc.id] : undefined,
            },
          };
          onUpdatePage((p) => ({ ...p, lines: [...p.lines, pLine] }));
        }
        setClickPoints([]);
      }
      return;
    }

    // 15i. Conjugates (Isogonal & Isotomic)
    if (tool === 'isogonal-conjugate' || tool === 'isotomic-conjugate') {
      const { point: currentPt, isNew } = resolveOrCreatePoint(pos);
      const polyPts = [...clickPoints, currentPt];
      if (polyPts.length === 4) {
        const [A, B, C, P] = polyPts;
        const conj =
          tool === 'isogonal-conjugate'
            ? getIsogonalConjugate(A, B, C, P)
            : getIsotomicConjugate(A, B, C, P);
        if (conj) {
          const newPt: GeoPoint = {
            id: `conj_${Date.now()}`,
            name: tool === 'isogonal-conjugate' ? `${P.name || 'P'}*` : `${P.name || 'P'}'`,
            x: conj.x,
            y: conj.y,
            size: pointSize,
            color: tool === 'isogonal-conjugate' ? '#8b5cf6' : '#ec4899',
            style: 'solid',
            pageIndex,
            dependsOn: {
              type: tool as any,
              parentPointIds: [A.id, B.id, C.id, P.id],
            },
          };
          onUpdatePage((p) => ({
            ...p,
            points: isNew ? [...p.points, currentPt, newPt] : [...p.points, newPt],
          }));
        }
        setClickPoints([]);
      } else {
        if (isNew) onUpdatePage((p) => ({ ...p, points: [...p.points, currentPt] }));
        setClickPoints(polyPts);
      }
      return;
    }
  };

  // Handle Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e.clientX, e.clientY);
    setHoverPos(pos);

    const nearest = findNearestPoint(pos, 15);
    setHoveredPointId(nearest ? nearest.id : null);

    if (isMouseDown && (tool === 'pen' || tool === 'highlighter') && currentStroke) {
      setCurrentStroke((prev) => (prev ? [...prev, pos] : [pos]));
      return;
    }

    if (isMouseDown && tool === 'eraser') {
      eraseNear(pos);
      return;
    }

  };

  // Handle Mouse Up
  const handleMouseUp = () => {
    const wasDragging = draggedPointId || draggedPolyId || draggedLabelPointId;
    setIsMouseDown(false);
    marqueeStartRef.current = null;
    setMarqueeBox(null);
    if ((tool === 'pen' || tool === 'highlighter') && currentStroke && currentStroke.length > 1) {
      const newStroke: FreehandStroke = {
        id: `stroke_${Date.now()}_${Math.random()}`,
        points: currentStroke,
        color: lineColor,
        width: lineThickness,
        isHighlighter: tool === 'highlighter',
        pageIndex,
      };
      onUpdatePage((p) => ({ ...p, strokes: [...p.strokes, newStroke] }), true);
    } else if (wasDragging) {
      onUpdatePage((p) => p, true);
    }
    setCurrentStroke(null);
    setDraggedPointId(null);
    setDraggedLabelPointId(null);
    setDraggedPolyId(null);
    polyDragStartRef.current = null;
  };

  // Double click canvas to edit angle or rename point
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'unhide') return;
    const pos = getCanvasCoords(e.clientX, e.clientY);
    const clickedAngle = page.angles.find((ang) => distToAngle(pos, ang) <= 18);
    if (clickedAngle && onEditAngle) {
      onEditAngle(clickedAngle);
    }
  };


  // Window-level smooth dragging for LaTeX items
  const handleLatexPointerDown = (e: React.PointerEvent<HTMLDivElement>, item: LatexItem) => {
    e.stopPropagation();
    setSelectedLatexId(item.id);
    setSelectedPointId(null);
    setSelectedId(item.id);
    setSelectedType('latex');

    if (tool === 'eraser') {
      cascadeDelete(item.id, 'latex');
      return;
    }

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startItemX = item.x;
    const startItemY = item.y;

    const onPointerMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startClientX) / zoom;
      const dy = (ev.clientY - startClientY) / zoom;
      const newX = Math.max(10, Math.min(PAGE_WIDTH - 60, startItemX + dx));
      const newY = Math.max(10, Math.min(PAGE_HEIGHT - 30, startItemY + dy));

      onUpdatePage(
        (p) => ({
          ...p,
          latexItems: p.latexItems.map((it) =>
            it.id === item.id ? { ...it, x: newX, y: newY } : it
          ),
        }),
        false
      );
    };

    const onPointerUp = () => {
      onUpdatePage((p) => p, true);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Erase items near position with precise geometry hit testing and cascade delete
  const eraseNear = (pos: Point2D) => {
    const threshold = 18;
    onUpdatePage((p) => {
      const remainingStrokes = p.strokes.filter((s) => !s.points.some((pt) => dist(pt, pos) < threshold));

      const erasedPointIds = new Set(
        p.points.filter((pt) => dist(pt, pos) < threshold).map((pt) => pt.id)
      );
      // Transitively collect erased points
      let added = true;
      while (added) {
        added = false;
        for (const pt of p.points) {
          if (!erasedPointIds.has(pt.id) && pt.dependsOn?.parentPointIds?.some((id) => erasedPointIds.has(id))) {
            erasedPointIds.add(pt.id);
            added = true;
          }
        }
      }

      const remainingPoints = p.points.filter((pt) => !erasedPointIds.has(pt.id));

      const remainingLines = p.lines.filter((l) => {
        if (l.p1PointId && erasedPointIds.has(l.p1PointId)) return false;
        if (l.p2PointId && erasedPointIds.has(l.p2PointId)) return false;
        if (l.dependsOn?.parentPointIds?.some((id) => erasedPointIds.has(id))) return false;
        const d = l.isInfinite ? distToLine(pos, l.p1, l.p2) : distToSegment(pos, l.p1, l.p2);
        return d >= threshold;
      });

      const remainingCircles = p.circles.filter((c) => {
        if (c.centerPointId && erasedPointIds.has(c.centerPointId)) return false;
        if (c.radiusPointId && erasedPointIds.has(c.radiusPointId)) return false;
        if (c.dependsOn?.parentPointIds?.some((id) => erasedPointIds.has(id))) return false;
        const d = Math.abs(dist(c.center, pos) - c.radius);
        return d >= threshold;
      });

      const remainingPolygons = p.polygons.filter((poly) => {
        if (poly.pointIds?.some((id) => erasedPointIds.has(id))) return false;
        if (pointInPolygon(pos, poly.points)) return false;
        for (let i = 0; i < poly.points.length; i++) {
          const p1 = poly.points[i];
          const p2 = poly.points[(i + 1) % poly.points.length];
          if (distToSegment(pos, p1, p2) < threshold) return false;
        }
        return true;
      });

      const remainingConics = p.conics.filter((conic) => {
        if (conic.fociPointIds?.some((id) => erasedPointIds.has(id))) return false;
        if (conic.focusPointId && erasedPointIds.has(conic.focusPointId)) return false;
        if (conic.pointId && erasedPointIds.has(conic.pointId)) return false;
        if (conic.directrixPointIds?.some((id) => erasedPointIds.has(id))) return false;
        if (conic.points5Ids?.some((id) => erasedPointIds.has(id))) return false;
        return distToConic(pos, conic) >= threshold;
      });

      const remainingAngles = p.angles.filter((ang) => {
        if (ang.centerPointId && erasedPointIds.has(ang.centerPointId)) return false;
        if (ang.p1PointId && erasedPointIds.has(ang.p1PointId)) return false;
        if (ang.p2PointId && erasedPointIds.has(ang.p2PointId)) return false;
        return distToAngle(pos, ang) >= threshold;
      });

      const remainingLatex = p.latexItems.filter((item) => {
        const approxW = Math.max(50, item.latex.length * item.fontSize * 0.45);
        const approxH = item.fontSize * 1.5;
        const inX = pos.x >= item.x - 10 && pos.x <= item.x + approxW + 10;
        const inY = pos.y >= item.y - 10 && pos.y <= item.y + approxH + 10;
        return !(inX && inY);
      });

      return {
        ...p,
        strokes: remainingStrokes,
        points: remainingPoints,
        lines: remainingLines,
        circles: remainingCircles,
        polygons: remainingPolygons,
        conics: remainingConics,
        angles: remainingAngles,
        latexItems: remainingLatex,
      };
    });
  };

  // Pointer event wrappers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragPointerStartRef.current = { x: e.clientX, y: e.clientY };
    objectDragMovedRef.current = false;
    objectDragCandidateRef.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    handleMouseDown(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const dragStart = dragPointerStartRef.current;
    if (
      objectDragCandidateRef.current &&
      dragStart &&
      Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) > 3
    ) {
      objectDragMovedRef.current = true;
    }
    handleMouseMove(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    handleMouseUp();
    if (objectDragMovedRef.current) {
      setSelectedIds(new Set());
      setSelectedId(null);
      setSelectedType(null);
      setSelectedPointId(null);
      setSelectedLatexId(null);
      clickSelectionRef.current = null;
    }
    dragPointerStartRef.current = null;
    objectDragMovedRef.current = false;
    objectDragCandidateRef.current = false;
  };

  // Position helper for floating action toolbar
  const getSelectedActionBoxPosition = () => {
    if (!selectedId || !selectedType) return null;

    if (selectedType === 'point') {
      const pt = page.points.find((p) => p.id === selectedId);
      if (!pt) return null;
      return { x: pt.x * zoom, y: (pt.y - 38) * zoom };
    }
    if (selectedType === 'line') {
      const l = page.lines.find((it) => it.id === selectedId);
      if (!l) return null;
      const midX = (l.p1.x + l.p2.x) / 2;
      const midY = (l.p1.y + l.p2.y) / 2;
      return { x: midX * zoom, y: (midY - 38) * zoom };
    }
    if (selectedType === 'circle') {
      const c = page.circles.find((it) => it.id === selectedId);
      if (!c) return null;
      return { x: c.center.x * zoom, y: (c.center.y - c.radius - 38) * zoom };
    }
    if (selectedType === 'conic') {
      const cn = page.conics.find((it) => it.id === selectedId);
      if (!cn) return null;
      const posX = cn.point?.x || cn.focus?.x || cn.foci?.[0]?.x || 300;
      const posY = cn.point?.y || cn.focus?.y || cn.foci?.[0]?.y || 300;
      return { x: posX * zoom, y: (posY - 38) * zoom };
    }
    if (selectedType === 'angle') {
      const ang = page.angles.find((it) => it.id === selectedId);
      if (!ang) return null;
      return { x: ang.center.x * zoom, y: (ang.center.y - 38) * zoom };
    }
    if (selectedType === 'polygon') {
      const poly = page.polygons.find((it) => it.id === selectedId);
      if (!poly || poly.points.length === 0) return null;
      return { x: poly.points[0].x * zoom, y: (poly.points[0].y - 38) * zoom };
    }
    if (selectedType === 'stroke') {
      const strk = page.strokes.find((it) => it.id === selectedId);
      if (!strk || strk.points.length === 0) return null;
      return { x: strk.points[0].x * zoom, y: (strk.points[0].y - 38) * zoom };
    }
    return null;
  };

  const actionBoxPos = getSelectedActionBoxPosition();

  return (
    <div
      className="relative bg-white shadow-md border border-slate-300 rounded-sm overflow-visible select-none"
      style={{
        width: `${PAGE_WIDTH * zoom}px`,
        height: `${PAGE_HEIGHT * zoom}px`,
      }}
      onClick={() => {
        setSelectedLatexId(null);
        setSelectedPointId(null);
        setSelectedId(null);
        setSelectedType(null);
        setSelectedIds(new Set());
      }}
    >
      {/* Interactive 2D Canvas with Pointer Events */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
          onClick={(e) => {
            e.stopPropagation();
            setContextMenu(null);
            const clickedSelection = clickSelectionRef.current;
            clickSelectionRef.current = null;
            if (!clickedSelection?.wasSelected || e.shiftKey) return;

            const next = new Set(selectedIdsRef.current);
            next.delete(clickedSelection.id);
            setSelectedIds(next);
            if (selectedId === clickedSelection.id) {
              const remainingId = next.values().next().value as string | undefined;
              const remainingPoint = remainingId ? page.points.find((item) => item.id === remainingId) : undefined;
              const remainingLine = remainingId ? page.lines.find((item) => item.id === remainingId) : undefined;
              const remainingCircle = remainingId ? page.circles.find((item) => item.id === remainingId) : undefined;
              const remainingConic = remainingId ? page.conics.find((item) => item.id === remainingId) : undefined;
              const remainingAngle = remainingId ? page.angles.find((item) => item.id === remainingId) : undefined;
              const remainingPolygon = remainingId ? page.polygons.find((item) => item.id === remainingId) : undefined;
              const remainingLocus = remainingId ? page.loci?.find((item) => item.id === remainingId) : undefined;
              const remainingStroke = remainingId ? page.strokes.find((item) => item.id === remainingId) : undefined;
              setSelectedId(remainingId || null);
              setSelectedType(
                remainingPoint ? 'point' :
                remainingLine ? 'line' :
                remainingCircle ? 'circle' :
                remainingConic ? 'conic' :
                remainingAngle ? 'angle' :
                remainingPolygon ? 'polygon' :
                remainingLocus ? 'locus' :
                remainingStroke ? 'stroke' : null
              );
              setSelectedPointId(remainingPoint ? remainingId || null : null);
            }
          }}
        onDoubleClick={handleCanvasDoubleClick}
        onContextMenu={handleContextMenu}
        className={`absolute inset-0 block touch-none ${
          draggedPointId || draggedPolyId || draggedLabelPointId
            ? 'cursor-grabbing'
            : hoveredPointId && tool === 'select'
            ? 'cursor-grab'
            : tool === 'pen' || tool === 'highlighter'
            ? 'cursor-crosshair'
            : tool === 'eraser'
            ? 'cursor-cell'
            : tool === 'select'
            ? 'cursor-default'
            : 'cursor-crosshair'
        }`}
      />

      {/* Active Construction Step Guide Banner */}
      {tool !== 'select' && tool !== 'pen' && tool !== 'highlighter' && tool !== 'eraser' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-slate-900/95 text-white rounded-full px-3.5 py-1 text-[11px] font-medium shadow-xl border border-indigo-500/40 backdrop-blur-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {tool === 'rotation' && (
              clickPoints.length === 0
                ? `Rotation (${rotationAngleDeg}°): Click point to rotate (Step 1/2)`
                : `Rotation (${rotationAngleDeg}°): Click center point (Step 2/2)`
            )}
            {tool === 'isogonal-line' && (
              clickPoints.length === 0
                ? 'Isogonal Line: Click Vertex A (Step 1/4)'
                : clickPoints.length === 1
                ? 'Isogonal Line: Click Point B on side AB (Step 2/4)'
                : clickPoints.length === 2
                ? 'Isogonal Line: Click Point C on side AC (Step 3/4)'
                : 'Isogonal Line: Click Point P on ray AP to reflect (Step 4/4)'
            )}
            {tool.startsWith('inversion') && (
              clickCircleIds.length > 0
                ? 'Inversion Circle selected! Click a point, line, or circle to invert'
                : clickPoints.length > 0
                ? 'Point selected! Click the Inversion Circle'
                : clickLineIds.length > 0
                ? 'Line selected! Click the Inversion Circle'
                : 'Inversion: Click the Inversion Circle (or select point/line/circle first)'
            )}
            {tool === 'mixtilinear-incircle' && `Mixtilinear Incircle: Click Vertex A, then B, then C (${clickPoints.length}/3)`}
            {tool === 'mixtilinear-excircle' && `Mixtilinear Excircle: Click Vertex A, then B, then C (${clickPoints.length}/3)`}
            {tool === 'thebault-circle' && (
              clickPoints.length < 3
                ? `Thebault Circle: Click triangle vertices A, B, C (${clickPoints.length}/3)`
                : 'Thebault Circle: Click point D on side BC (4/4)'
            )}
            {tool === 'conic-ellipse-2foci-1pt' && (
              clickPoints.length === 0
                ? 'Ellipse: Click Focus 1 (1/3)'
                : clickPoints.length === 1
                ? 'Ellipse: Click Focus 2 (2/3)'
                : 'Ellipse: Click Point on Ellipse (3/3)'
            )}
            {tool === 'conic-hyperbola-2foci-1pt' && (
              clickPoints.length === 0
                ? 'Hyperbola: Click Focus 1 (1/3)'
                : clickPoints.length === 1
                ? 'Hyperbola: Click Focus 2 (2/3)'
                : 'Hyperbola: Click Point on Hyperbola (3/3)'
            )}
            {tool === 'conic-parabola-focus-directrix' && (
              clickPoints.length === 0
                ? 'Parabola: Click Focus (1/3)'
                : clickPoints.length === 1
                ? 'Parabola: Click Point 1 of Directrix (2/3)'
                : 'Parabola: Click Point 2 of Directrix (3/3)'
            )}
            {tool.startsWith('center-') && `Triangle Center: Select vertices A, B, C (${clickPoints.length}/3)`}
            {!['rotation', 'isogonal-line', 'mixtilinear-incircle', 'mixtilinear-excircle', 'thebault-circle', 'conic-ellipse-2foci-1pt', 'conic-hyperbola-2foci-1pt', 'conic-parabola-focus-directrix'].includes(tool) && !tool.startsWith('inversion') && !tool.startsWith('center-') && `Active tool: ${tool}`}
          </span>
          {(clickPoints.length > 0 || clickCircleIds.length > 0 || clickLineIds.length > 0) && (
            <span className="text-slate-400 text-[10px] font-normal">(Esc to reset)</span>
          )}
        </div>
      )}

      {/* Context Menu on Right Click (Rule 5 & Rule 13) */}
      {contextMenu && createPortal(
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            left: `${contextMenu.x + 8}px`,
            top: `${contextMenu.y + 8}px`,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 bg-slate-900/95 text-white rounded-lg px-2.5 py-1.5 text-[11px] shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Button 1: Properties */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenPropertiesPanel?.();
              setContextMenu(null);
            }}
            title="Open Properties Panel"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Sliders size={12} className="text-amber-300" />
            <span>Properties</span>
          </button>

          {/* Button 2: Hide / Show Toggle */}
          {contextMenu.type !== 'latex' && (() => {
            let isHidden = false;
            const { id, type } = contextMenu;
            if (type === 'point') isHidden = !!page.points.find((p) => p.id === id)?.hidden;
            else if (type === 'line') isHidden = !!page.lines.find((l) => l.id === id)?.hidden;
            else if (type === 'circle') isHidden = !!page.circles.find((c) => c.id === id)?.hidden;
            else if (type === 'conic') isHidden = !!page.conics.find((cn) => cn.id === id)?.hidden;
            else if (type === 'angle') isHidden = !!page.angles.find((a) => a.id === id)?.hidden;
            else if (type === 'polygon') isHidden = !!page.polygons.find((pl) => pl.id === id)?.hidden;

            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdatePage((p) => {
                    if (type === 'point') return { ...p, points: p.points.map((pt) => pt.id === id ? { ...pt, hidden: !pt.hidden } : pt) };
                    if (type === 'line') return { ...p, lines: p.lines.map((l) => l.id === id ? { ...l, hidden: !l.hidden } : l) };
                    if (type === 'circle') return { ...p, circles: p.circles.map((c) => c.id === id ? { ...c, hidden: !c.hidden } : c) };
                    if (type === 'conic') return { ...p, conics: p.conics.map((cn) => cn.id === id ? { ...cn, hidden: !cn.hidden } : cn) };
                    if (type === 'angle') return { ...p, angles: p.angles.map((a) => a.id === id ? { ...a, hidden: !a.hidden } : a) };
                    if (type === 'polygon') return { ...p, polygons: p.polygons.map((poly) => poly.id === id ? { ...poly, hidden: !poly.hidden } : poly) };
                    return p;
                  }, true);
                  setContextMenu(null);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  isHidden
                    ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                }`}
              >
                {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{isHidden ? 'Show' : 'Hide'}</span>
              </button>
            );
          })()}

          {/* Button 3: Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              cascadeDelete(contextMenu.id, contextMenu.type);
              setContextMenu(null);
            }}
            title="Delete this object"
            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        </div>,
        document.body
      )}

      {/* LaTeX / Text items KaTeX rendered overlays (Rule 12) */}
      {page.latexItems.map((item) => {
        const isSelected = selectedLatexId === item.id;
        const isEraser = tool === 'eraser';
        const isNearTop = item.y * zoom < 36;

        return (
          <div
            key={item.id}
            style={{
              left: `${item.x * zoom}px`,
              top: `${item.y * zoom}px`,
              fontSize: `${item.fontSize * zoom}px`,
              color: item.color,
              fontFamily: item.fontFamily || 'Euclid, "Euclid Math One", Cambria, serif',
              fontWeight: item.bold ? 700 : 400,
              fontStyle: item.italic ? 'italic' : 'normal',
              textDecoration: item.underline ? 'underline' : 'none',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isEraser) {
                cascadeDelete(item.id, 'latex');
              } else {
                setSelectedLatexId(item.id);
                setSelectedPointId(null);
                setSelectedId(item.id);
                setSelectedType('latex');
                onSelectObject?.(item.id, 'latex');
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedId(item.id);
              setSelectedType('latex');
              setSelectedLatexId(item.id);
              onSelectObject?.(item.id, 'latex');
              setContextMenu({ x: e.clientX, y: e.clientY, id: item.id, type: 'latex' });
            }}
            onPointerDown={(e) => {
              if (isEraser) return;
              handleLatexPointerDown(e, item);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onEditLatex(item);
            }}
            className={`absolute z-20 group transition-all rounded p-1.5 ${
              isEraser
                ? 'ring-2 ring-rose-500 bg-rose-50/85 hover:bg-rose-100 cursor-pointer shadow-md'
                : isSelected
                ? 'ring-2 ring-indigo-600 bg-white/95 shadow-xl border border-indigo-200 cursor-move'
                : 'hover:ring-2 hover:ring-indigo-400 hover:bg-white/90 bg-white/60 hover:shadow-md cursor-pointer'
            } touch-none`}
          >
            {isSelected && (
              <>
                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white shadow-xs" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white shadow-xs" />
                <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white shadow-xs" />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white shadow-xs" />
              </>
            )}

            <div
              className={`absolute z-30 items-center gap-1 bg-slate-900 text-white rounded-md px-2 py-1 text-[11px] shadow-2xl pointer-events-auto border border-slate-700/80 transition-all ${
                isNearTop ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
              } right-0 ${
                isSelected ? 'flex opacity-100' : 'hidden group-hover:flex opacity-95 group-hover:opacity-100'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  cascadeDelete(item.id, 'latex');
                }}
                title="Delete this text / formula (or press Del / Backspace)"
                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white px-2 py-0.5 rounded text-[10px] font-semibold transition-colors shadow-xs"
              >
                <Trash2 size={11} />
                <span>Delete</span>
              </button>

              <span className="w-px h-3.5 bg-slate-700 mx-0.5" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditLatex(item);
                }}
                title="Edit Text / LaTeX Formula"
                className="flex items-center gap-1 hover:text-indigo-300 text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-800 text-[10px] font-medium transition-colors"
              >
                <Edit3 size={11} />
                <span>Edit</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard?.writeText(item.latex);
                  setCopiedItemId(item.id);
                  setTimeout(() => setCopiedItemId(null), 1500);
                }}
                title="Copy text / LaTeX code to clipboard"
                className="flex items-center gap-1 hover:text-emerald-300 text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-800 text-[10px] font-medium transition-colors"
              >
                {copiedItemId === item.id ? (
                  <Check size={11} className="text-emerald-400" />
                ) : (
                  <Copy size={11} />
                )}
                <span>{copiedItemId === item.id ? 'Copied' : 'Copy'}</span>
              </button>

              <span className="w-px h-3.5 bg-slate-700 mx-0.5" />

              <div className="flex items-center gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePage((p) => ({
                      ...p,
                      latexItems: p.latexItems.map((it) =>
                        it.id === item.id ? { ...it, fontSize: Math.max(10, it.fontSize - 2) } : it
                      ),
                    }));
                  }}
                  title="Smaller font size"
                  className="hover:text-white text-slate-300 p-0.5 rounded hover:bg-slate-800 text-[10px]"
                >
                  <Minus size={10} />
                </button>
                <span className="text-[10px] text-slate-300 font-mono px-0.5">{item.fontSize}pt</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePage((p) => ({
                      ...p,
                      latexItems: p.latexItems.map((it) =>
                        it.id === item.id ? { ...it, fontSize: Math.min(48, it.fontSize + 2) } : it
                      ),
                    }));
                  }}
                  title="Larger font size"
                  className="hover:text-white text-slate-300 p-0.5 rounded hover:bg-slate-800 text-[10px]"
                >
                  <Plus size={10} />
                </button>
              </div>
            </div>

            <div
              data-no-translate
              className="select-text cursor-text"
              dangerouslySetInnerHTML={{
                __html: renderMixedText(item.latex || ''),
              }}
            />
          </div>
        );
      })}
    </div>
  );
});