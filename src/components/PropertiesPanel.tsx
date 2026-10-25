import React from 'react';
import { X, Eye, EyeOff, Trash2, Sliders, Hash, Move, Sparkles } from 'lucide-react';
import { PageData, SelectedItemType, LineStyle } from '../types';
import {
  GeoPoint,
  GeoLine,
  GeoCircle,
  GeoPolygon,
  GeoAngle,
  GeoConic,
  GeoLocus,
  dist,
  polygonArea,
  PAGE_WIDTH_CENTIMETERS,
  PAGE_WIDTH_PIXELS,
  POSITION_STEP_PIXELS,
  POSITION_STEP_CENTIMETERS,
  quantizePositionCoordinate,
  updateGeometryOnPointMove,
} from '../geometry/engine';

interface PropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId: string | null;
  selectedType: SelectedItemType;
  page: PageData;
  onUpdatePage: (updater: (prev: PageData) => PageData, commitHistory?: boolean) => void;
  onDeleteSelected: (id: string, type: SelectedItemType) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  isOpen,
  onClose,
  selectedId,
  selectedType,
  page,
  onUpdatePage,
  onDeleteSelected,
}) => {
  if (!isOpen || !selectedId || !selectedType) return null;

  // Resolve object
  const pt = selectedType === 'point' ? page.points.find((p) => p.id === selectedId) : null;
  const line = selectedType === 'line' ? page.lines.find((l) => l.id === selectedId) : null;
  const circ = selectedType === 'circle' ? page.circles.find((c) => c.id === selectedId) : null;
  const poly = selectedType === 'polygon' ? page.polygons.find((pl) => pl.id === selectedId) : null;
  const angle = selectedType === 'angle' ? page.angles.find((a) => a.id === selectedId) : null;
  const conic = selectedType === 'conic' ? page.conics.find((cn) => cn.id === selectedId) : null;
  const locus = selectedType === 'locus' ? (page.loci || []).find((loc) => loc.id === selectedId) : null;

  if (!pt && !line && !circ && !poly && !angle && !conic && !locus) {
    return null;
  }

  const isHidden =
    pt?.hidden ||
    line?.hidden ||
    circ?.hidden ||
    poly?.hidden ||
    angle?.hidden ||
    conic?.hidden;

  const toggleHidden = () => {
    onUpdatePage((p) => {
      const id = selectedId;
      if (selectedType === 'point') return { ...p, points: p.points.map((i) => i.id === id ? { ...i, hidden: !i.hidden } : i) };
      if (selectedType === 'line') return { ...p, lines: p.lines.map((i) => i.id === id ? { ...i, hidden: !i.hidden } : i) };
      if (selectedType === 'circle') return { ...p, circles: p.circles.map((i) => i.id === id ? { ...i, hidden: !i.hidden } : i) };
      if (selectedType === 'polygon') return { ...p, polygons: p.polygons.map((i) => i.id === id ? { ...i, hidden: !i.hidden } : i) };
      if (selectedType === 'angle') return { ...p, angles: p.angles.map((i) => i.id === id ? { ...i, hidden: !i.hidden } : i) };
      if (selectedType === 'conic') return { ...p, conics: p.conics.map((i) => i.id === id ? { ...i, hidden: !i.hidden } : i) };
      return p;
    }, true);
  };

  const updatePointCoordinate = (axis: 'x' | 'y', value: string) => {
    if (!value.trim()) return;
    const coordinate = Number(value);
    if (!Number.isFinite(coordinate)) return;
    const quantized = quantizePositionCoordinate(coordinate);
    onUpdatePage((p) => {
      const currentPoint = p.points.find((item) => item.id === pt?.id);
      if (!currentPoint) return p;
      const newPosition = {
        x: axis === 'x' ? quantized : currentPoint.x,
        y: axis === 'y' ? quantized : currentPoint.y,
      };
      return updateGeometryOnPointMove(p, currentPoint.id, newPosition);
    }, false);
  };

  const handleCoordinateKeyDown = (axis: 'x' | 'y', event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const currentCoordinate = Number(event.currentTarget.value);
    if (!Number.isFinite(currentCoordinate)) return;
    const direction = event.key === 'ArrowUp' ? 1 : -1;
    updatePointCoordinate(axis, String(currentCoordinate + direction * POSITION_STEP_PIXELS));
  };

  const commitPointCoordinate = () => onUpdatePage((p) => p, true);

  return (
    <div className="fixed top-0 right-0 h-full w-84 bg-slate-900/98 text-slate-100 shadow-2xl border-l border-slate-700/80 backdrop-blur-md flex flex-col z-50 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-amber-400" />
          <span className="font-semibold text-sm capitalize">
            {selectedType} Properties
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleHidden}
            title={isHidden ? 'Show (Ctrl+H)' : 'Hide (Ctrl+H)'}
            className={`p-1.5 rounded hover:bg-slate-800 text-xs transition-colors ${
              isHidden ? 'text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button
            onClick={() => onDeleteSelected(selectedId, selectedType)}
            title="Delete Object"
            className="p-1.5 rounded hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 text-xs transition-colors"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={onClose}
            title="Close Panel"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
        {/* 1. Point Properties (Works like Preferences menu + GeoGebra right panel) */}
        {pt && (
          <>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Label / Name</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={pt.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdatePage((p) => ({
                      ...p,
                      points: p.points.map((i) => i.id === pt.id ? { ...i, name: val } : i),
                    }));
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
                  placeholder="e.g. A, B, P_1"
                />
                <button
                  type="button"
                  onClick={() => {
                    onUpdatePage((p) => ({
                      ...p,
                      points: p.points.map((i) =>
                        i.id === pt.id ? { ...i, showLabel: i.showLabel === false ? true : false } : i
                      ),
                    }));
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                    pt.showLabel === false
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : 'bg-indigo-900/60 text-indigo-300 border-indigo-700'
                  }`}
                >
                  {pt.showLabel === false ? 'Hidden' : 'Visible'}
                </button>
              </div>
            </div>

            {/* Point size is the displayed point radius, in half-pixel increments. */}
            <div className="space-y-1">
              <label className="flex justify-between text-slate-400 font-medium">
                <span>Point Size</span>
                <span className="font-mono text-indigo-400 font-bold">{pt.size.toFixed(1)} px</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={pt.size}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdatePage((p) => ({
                    ...p,
                    points: p.points.map((i) => i.id === pt.id ? { ...i, size: val } : i),
                  }));
                }}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5</span>
                <span>3</span>
                <span>5.5</span>
                <span>8</span>
                <span>10</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Point Style</label>
              <select
                value={pt.style || 'solid'}
                onChange={(e) => {
                  const st = e.target.value as any;
                  onUpdatePage((p) => ({
                    ...p,
                    points: p.points.map((i) => i.id === pt.id ? { ...i, style: st } : i),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="solid">● Solid Dot</option>
                <option value="hollow">○ Hollow Dot</option>
                <option value="cross">✕ Cross</option>
                <option value="plus">+ Plus</option>
              </select>
            </div>

            {/* Color Palette */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-400 font-medium">
                <span>Color Palette</span>
                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                  <span className="w-3 h-3 rounded-full border border-slate-600" style={{ backgroundColor: pt.color || '#2563eb' }} />
                  <span>{pt.color || '#2563eb'}</span>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[
                  '#2563eb', '#3b82f6', '#0284c7', '#06b6d4', '#0d9488', '#10b981',
                  '#16a34a', '#84cc16', '#eab308', '#d97706', '#ea580c', '#dc2626',
                  '#e11d48', '#db2777', '#c026d3', '#9333ea', '#6366f1', '#0f172a',
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      onUpdatePage((p) => ({
                        ...p,
                        points: p.points.map((i) => i.id === pt.id ? { ...i, color: c } : i),
                      }));
                    }}
                    className={`w-7 h-7 rounded-md border transition-transform hover:scale-110 cursor-pointer ${
                      (pt.color || '').toLowerCase() === c.toLowerCase()
                        ? 'border-white ring-2 ring-indigo-400 scale-105'
                        : 'border-slate-700 hover:border-slate-500'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400 text-[11px]">Custom Color:</span>
                <input
                  type="color"
                  value={pt.color || '#2563eb'}
                  onChange={(e) => {
                    const col = e.target.value;
                    onUpdatePage((p) => ({
                      ...p,
                      points: p.points.map((i) => i.id === pt.id ? { ...i, color: col } : i),
                    }));
                  }}
                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-400 mb-1.5 font-medium">
                Position Coordinates
                <span className="ml-1 text-[10px] font-normal text-slate-500">
                  step {POSITION_STEP_PIXELS} px ({POSITION_STEP_CENTIMETERS.toFixed(6)} cm)
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400 text-[10px]">X:</span>
                  <input
                    aria-label="X position in pixels"
                    type="number"
                    step={POSITION_STEP_PIXELS}
                    value={pt.x.toFixed(6)}
                    onChange={(e) => updatePointCoordinate('x', e.target.value)}
                    onKeyDown={(e) => handleCoordinateKeyDown('x', e)}
                    onBlur={commitPointCoordinate}
                    title={`Position step: ${POSITION_STEP_PIXELS} px (${POSITION_STEP_CENTIMETERS.toFixed(6)} cm)`}
                    className="w-full bg-transparent text-sm font-bold text-slate-200 outline-none"
                  />
                  <div className="text-[10px] text-indigo-400">{(pt.x * PAGE_WIDTH_CENTIMETERS / PAGE_WIDTH_PIXELS).toFixed(6)} cm</div>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400 text-[10px]">Y:</span>
                  <input
                    aria-label="Y position in pixels"
                    type="number"
                    step={POSITION_STEP_PIXELS}
                    value={pt.y.toFixed(6)}
                    onChange={(e) => updatePointCoordinate('y', e.target.value)}
                    onKeyDown={(e) => handleCoordinateKeyDown('y', e)}
                    onBlur={commitPointCoordinate}
                    title={`Position step: ${POSITION_STEP_PIXELS} px (${POSITION_STEP_CENTIMETERS.toFixed(6)} cm)`}
                    className="w-full bg-transparent text-sm font-bold text-slate-200 outline-none"
                  />
                  <div className="text-[10px] text-indigo-400">{(pt.y * PAGE_WIDTH_CENTIMETERS / PAGE_WIDTH_PIXELS).toFixed(6)} cm</div>
                </div>
              </div>
            </div>

            {pt.dependsOn && (
              <div className="p-2.5 rounded bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-200">
                <div className="font-semibold text-indigo-300 mb-0.5">Dependency</div>
                <div>Type: <span className="font-mono capitalize">{pt.dependsOn.type.replace(/-/g, ' ')}</span></div>
              </div>
            )}
          </>
        )}

        {/* 2. Line Properties */}
        {line && (
          <>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Label / Name</label>
              <input
                type="text"
                value={line.name || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdatePage((p) => ({
                    ...p,
                    lines: p.lines.map((i) => i.id === line.id ? { ...i, name: val } : i),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sky-300 font-mono font-bold focus:outline-none"
                placeholder="e.g. AB, l_1"
              />
            </div>

            <div>
              <label className="flex justify-between text-slate-400 mb-1 font-medium">
                <span>Thickness</span>
                <span className="font-mono text-indigo-400">{line.thickness}px</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={line.thickness}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdatePage((p) => ({
                    ...p,
                    lines: p.lines.map((i) => i.id === line.id ? { ...i, thickness: val } : i),
                  }));
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Style</label>
              <select
                value={line.style}
                onChange={(e) => {
                  const st = e.target.value as LineStyle;
                  onUpdatePage((p) => ({
                    ...p,
                    lines: p.lines.map((i) => i.id === line.id ? { ...i, style: st } : i),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="solid">Solid ───</option>
                <option value="dash">Dashed ─ ─ ─</option>
                <option value="dash-dot">Dash-Dot ─ · ─</option>
                <option value="dotted">Dotted · · · ·</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={line.color || '#2563eb'}
                  onChange={(e) => {
                    const col = e.target.value;
                    onUpdatePage((p) => ({
                      ...p,
                      lines: p.lines.map((i) => i.id === line.id ? { ...i, color: col } : i),
                    }));
                  }}
                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                />
                <span className="font-mono text-slate-300">{line.color}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-400 mb-1 font-medium">Measurements</label>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60 font-mono text-xs flex justify-between items-center">
                <span className="text-slate-400">Length:</span>
                <span className="font-bold text-amber-300">
                  {line.isInfinite ? '∞ (Infinite Line)' : `${dist(line.p1, line.p2).toFixed(2)} px`}
                </span>
              </div>
            </div>
          </>
        )}

        {/* 3. Circle Properties */}
        {circ && (
          <>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Label / Name</label>
              <input
                type="text"
                value={circ.name || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdatePage((p) => ({
                    ...p,
                    circles: p.circles.map((i) => i.id === circ.id ? { ...i, name: val } : i),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-emerald-300 font-mono font-bold focus:outline-none"
                placeholder="e.g. (O), c_1"
              />
            </div>

            <div>
              <label className="flex justify-between text-slate-400 mb-1 font-medium">
                <span>Thickness</span>
                <span className="font-mono text-indigo-400">{circ.thickness}px</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={circ.thickness}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdatePage((p) => ({
                    ...p,
                    circles: p.circles.map((i) => i.id === circ.id ? { ...i, thickness: val } : i),
                  }));
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Style</label>
              <select
                value={circ.style}
                onChange={(e) => {
                  const st = e.target.value as LineStyle;
                  onUpdatePage((p) => ({
                    ...p,
                    circles: p.circles.map((i) => i.id === circ.id ? { ...i, style: st } : i),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="solid">Solid ───</option>
                <option value="dash">Dashed ─ ─ ─</option>
                <option value="dash-dot">Dash-Dot ─ · ─</option>
                <option value="dotted">Dotted · · · ·</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={circ.color || '#2563eb'}
                  onChange={(e) => {
                    const col = e.target.value;
                    onUpdatePage((p) => ({
                      ...p,
                      circles: p.circles.map((i) => i.id === circ.id ? { ...i, color: col } : i),
                    }));
                  }}
                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                />
                <span className="font-mono text-slate-300">{circ.color}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <label className="block text-slate-400 font-medium">Measurements</label>
              <div className="bg-slate-800/80 p-2 rounded border border-slate-700/60 font-mono text-xs flex justify-between">
                <span className="text-slate-400">Radius:</span>
                <span className="font-bold text-slate-200">{circ.radius.toFixed(2)} px</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded border border-slate-700/60 font-mono text-xs flex justify-between">
                <span className="text-slate-400">Circumference (2πR):</span>
                <span className="font-bold text-slate-200">{(2 * Math.PI * circ.radius).toFixed(2)} px</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded border border-slate-700/60 font-mono text-xs flex justify-between">
                <span className="text-slate-400">Area (πR²):</span>
                <span className="font-bold text-amber-300">{(Math.PI * circ.radius * circ.radius).toFixed(2)} px²</span>
              </div>
            </div>
          </>
        )}

        {/* 4. Polygon Properties */}
        {poly && (
          <>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Label / Name</label>
              <input
                type="text"
                value={poly.name || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdatePage((p) => ({
                    ...p,
                    polygons: p.polygons.map((i) => i.id === poly.id ? { ...i, name: val } : i),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-indigo-300 font-mono font-bold focus:outline-none"
                placeholder="e.g. Triangle ABC"
              />
            </div>

            <div>
              <label className="flex justify-between text-slate-400 mb-1 font-medium">
                <span>Thickness</span>
                <span className="font-mono text-indigo-400">{poly.thickness}px</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={poly.thickness}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdatePage((p) => ({
                    ...p,
                    polygons: p.polygons.map((i) => i.id === poly.id ? { ...i, thickness: val } : i),
                  }));
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Stroke Color</label>
              <input
                type="color"
                value={poly.color || '#2563eb'}
                onChange={(e) => {
                  const col = e.target.value;
                  onUpdatePage((p) => ({
                    ...p,
                    polygons: p.polygons.map((i) => i.id === poly.id ? { ...i, color: col } : i),
                  }));
                }}
                className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <label className="block text-slate-400 font-medium">Metrics</label>
              <div className="bg-slate-800/80 p-2 rounded border border-slate-700/60 font-mono text-xs flex justify-between">
                <span className="text-slate-400">Vertices:</span>
                <span className="font-bold text-slate-200">{poly.points.length}</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded border border-slate-700/60 font-mono text-xs flex justify-between">
                <span className="text-slate-400">Area:</span>
                <span className="font-bold text-amber-300">{polygonArea(poly.points).toFixed(2)} px²</span>
              </div>
            </div>
          </>
        )}

        {/* 5. Locus Properties (Item 8) */}
        {locus && (
          <>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Locus Name</label>
              <input
                type="text"
                value={locus.name || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdatePage((p) => ({
                    ...p,
                    loci: (p.loci || []).map((i) => i.id === locus.id ? { ...i, name: val } : i),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-purple-300 font-mono font-bold focus:outline-none"
                placeholder="e.g. Locus of H"
              />
            </div>

            <div>
              <label className="flex justify-between text-slate-400 mb-1 font-medium">
                <span>Thickness</span>
                <span className="font-mono text-indigo-400">{locus.thickness}px</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={locus.thickness}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdatePage((p) => ({
                    ...p,
                    loci: (p.loci || []).map((i) => i.id === locus.id ? { ...i, thickness: val } : i),
                  }));
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Curve Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={locus.color || '#7c3aed'}
                  onChange={(e) => {
                    const col = e.target.value;
                    onUpdatePage((p) => ({
                      ...p,
                      loci: (p.loci || []).map((i) => i.id === locus.id ? { ...i, color: col } : i),
                    }));
                  }}
                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                />
                <span className="font-mono text-slate-300">{locus.color || '#7c3aed'}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Style</label>
              <select
                value={locus.style || 'solid'}
                onChange={(e) => {
                  const st = e.target.value as LineStyle;
                  onUpdatePage((p) => ({
                    ...p,
                    loci: (p.loci || []).map((i) => i.id === locus.id ? { ...i, style: st } : i),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="solid">Solid ───</option>
                <option value="dash">Dashed ─ ─ ─</option>
                <option value="dash-dot">Dash-Dot ─ · ─</option>
                <option value="dotted">Dotted · · · ·</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1">
              <span className="text-slate-400 font-medium">Path Points:</span>
              <div className="font-mono text-slate-300 text-xs">{locus.samples?.length || 0} sampled points</div>
            </div>
          </>
        )}

        {/* 6. Conic Properties */}
        {conic && (
          <>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Conic Label</label>
              <input
                type="text"
                value={conic.name || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdatePage((p) => ({
                    ...p,
                    conics: p.conics.map((i) => i.id === conic.id ? { ...i, name: val } : i),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-mono font-bold focus:outline-none"
                placeholder="e.g. Ellipse E"
              />
            </div>

            <div>
              <label className="flex justify-between text-slate-400 mb-1 font-medium">
                <span>Thickness</span>
                <span className="font-mono text-indigo-400">{conic.thickness}px</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={conic.thickness}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdatePage((p) => ({
                    ...p,
                    conics: p.conics.map((i) => i.id === conic.id ? { ...i, thickness: val } : i),
                  }));
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Color</label>
              <input
                type="color"
                value={conic.color || '#d97706'}
                onChange={(e) => {
                  const col = e.target.value;
                  onUpdatePage((p) => ({
                    ...p,
                    conics: p.conics.map((i) => i.id === conic.id ? { ...i, color: col } : i),
                  }));
                }}
                className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-slate-400 font-medium">Type:</span>
              <span className="font-mono text-amber-300 ml-2 capitalize">{conic.type}</span>
            </div>
          </>
        )}

        {/* 7. Angle Properties */}
        {angle && (
          <>
            <div>
              <label className="flex justify-between text-slate-400 mb-1 font-medium">
                <span>Thickness</span>
                <span className="font-mono text-indigo-400">{(angle.thickness ?? 2).toFixed(1)}px</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={angle.thickness ?? 2}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdatePage((p) => ({
                    ...p,
                    angles: p.angles.map((i) => i.id === angle.id ? { ...i, thickness: val } : i),
                  }));
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Angle Label</label>
              <input
                type="text"
                value={angle.label || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdatePage((p) => ({
                    ...p,
                    angles: p.angles.map((i) => i.id === angle.id ? { ...i, label: val } : i),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-blue-300 font-mono font-bold focus:outline-none"
                placeholder="e.g. 45°, α"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Angle Value</label>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60 font-mono text-sm font-bold text-amber-300">
                {angle.angleDeg?.toFixed(1) || 0}° ({((angle.angleDeg || 0) * Math.PI / 180).toFixed(3)} rad)
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Style</label>
              <select
                value={angle.style || 'arc'}
                onChange={(e) => {
                  const st = e.target.value as any;
                  onUpdatePage((p) => ({
                    ...p,
                    angles: p.angles.map((i) => i.id === angle.id ? { ...i, style: st } : i),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="arc">Single Arc</option>
                <option value="double-arc">Double Arc</option>
                <option value="sector">Filled Sector</option>
                <option value="hatch">Hatched</option>
                <option value="right-angle">Right Angle (90°)</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
