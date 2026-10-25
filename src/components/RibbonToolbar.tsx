import React from 'react';
import {
  MousePointer,
  Pen,
  Highlighter,
  Eraser,
  EyeOff,
  Eye,
  Circle as CircleIcon,
  Minus,
  Sparkles,
  Type,
  Maximize,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Sliders,
  Shapes,
  Triangle,
  Move,
  ChevronDown,
} from 'lucide-react';
import { ToolMode, LineStyle } from '../types';

interface RibbonToolbarProps {
  tool: ToolMode;
  setTool: (tool: ToolMode) => void;
  pointSize: number;
  setPointSize: (size: number) => void;
  pointStyle: 'solid' | 'hollow' | 'cross' | 'plus';
  setPointStyle: (style: 'solid' | 'hollow' | 'cross' | 'plus') => void;
  lineThickness: number;
  setLineThickness: (th: number) => void;
  lineStyle: LineStyle;
  setLineStyle: (style: LineStyle) => void;
  pointColor: string;
  setPointColor: (color: string) => void;
  lineColor: string;
  setLineColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenLatexModal: () => void;
  onOpenAngleModal: () => void;
  rotationAngleDeg?: number;
  setRotationAngleDeg?: (deg: number) => void;
}

export const RibbonToolbar: React.FC<RibbonToolbarProps> = ({
  tool,
  setTool,
  pointSize,
  setPointSize,
  pointStyle,
  setPointStyle,
  lineThickness,
  setLineThickness,
  lineStyle,
  setLineStyle,
  pointColor,
  setPointColor,
  lineColor,
  setLineColor,
  fillColor,
  setFillColor,
  zoom,
  setZoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenLatexModal,
  onOpenAngleModal,
  rotationAngleDeg = 45,
  setRotationAngleDeg,
}) => {
  return (
    <div className="bg-slate-100 border-b border-slate-300 text-slate-800 shadow-2xs select-none">
      {/* Top action row */}
      <div className="ribbon-scrollbar-hidden flex flex-nowrap items-center gap-1.5 px-3 py-1.5 overflow-x-auto overscroll-x-contain touch-pan-x whitespace-nowrap text-xs [&>*]:shrink-0">
        {/* Section 1: Note (Rules 7 & 8: Changed from Scrble Note to Note, plus Hide options) */}
        <div className="flex items-center gap-1 pr-2 border-r border-slate-300">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Note
          </span>

          <button
            title="Move & Reshape (V) - Drag points to move and update connected figures"
            onClick={() => setTool('select')}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all cursor-pointer ${
              tool === 'select'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <MousePointer size={14} />
            <span className="hidden sm:inline font-semibold">Move / Select</span>
          </button>

          <button
            title="Pen (Freehand Ink)"
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all cursor-pointer ${
              tool === 'pen'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Pen size={14} />
            <span className="hidden sm:inline">Pen</span>
          </button>

          <button
            title="Highlighter (Semi-transparent)"
            onClick={() => setTool('highlighter')}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all cursor-pointer ${
              tool === 'highlighter'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Highlighter size={14} />
            <span className="hidden sm:inline">Highlighter</span>
          </button>

          <button
            title="Eraser"
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all cursor-pointer ${
              tool === 'eraser'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Eraser size={14} />
            <span className="hidden sm:inline">Eraser</span>
          </button>

          {/* Rule 7: Hide Option in Note section */}
          <button
            title="Hide Tool - Any objects that you click on shall disappear"
            onClick={() => setTool('hide')}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all cursor-pointer ${
              tool === 'hide'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <EyeOff size={14} />
            <span className="hidden sm:inline font-semibold">Hide</span>
          </button>

          <button
            title="Show Tool - Select hidden objects to show them again"
            onClick={() => setTool('unhide')}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all cursor-pointer ${
              tool === 'unhide'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Eye size={14} />
            <span className="hidden sm:inline font-semibold">Show</span>
          </button>

          {/* Rule 12: LaTeX option changed to Text option */}
          <button
            title="Text Tool - Add text labels or LaTeX formulas inside $...$, $$...$$, or \[...\]"
            onClick={() => {
              setTool('latex');
              onOpenLatexModal();
            }}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all cursor-pointer ${
              tool === 'latex'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Type size={14} />
            <span>Text</span>
          </button>
        </div>

        {/* Section 2: Tools (Rule 8: Changed from GSP Tools to Tools) */}
        <div className="flex items-center gap-1 pr-2 border-r border-slate-300">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Tools
          </span>

          <button
            title="Point Tool"
            onClick={() => setTool('point')}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all ${
              tool === 'point'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
            <span>Point</span>
          </button>

          <button
            title="Segment Tool"
            onClick={() => setTool('segment')}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all ${
              tool === 'segment'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Minus size={14} />
            <span>Segment</span>
          </button>

          <button
            title="Line Tool (Infinite Line)"
            onClick={() => setTool('line')}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all ${
              tool === 'line'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span className="font-mono text-xs">↔</span>
            <span>Line</span>
          </button>

          <button
            title="Circle with Center & Point"
            onClick={() => setTool('circle-center-point')}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all ${
              tool === 'circle-center-point'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <CircleIcon size={14} />
            <span>Circle</span>
          </button>

          <button
            title="Polygon Tool"
            onClick={() => setTool('polygon')}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all ${
              tool === 'polygon'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Shapes size={14} />
            <span>Polygon</span>
          </button>

          <button
            title="Angle"
            onClick={() => {
              setTool('angle');
              onOpenAngleModal();
            }}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all ${
              tool === 'angle' || tool === 'angle-shading'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span className="font-serif font-bold text-xs">∠</span>
            <span>Angle</span>
          </button>

          <button
            title="Intersect Tool: Construct intersection of lines, segments, and circles"
            onClick={() => setTool('intersect')}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all ${
              tool === 'intersect'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span className="font-bold text-xs">✕</span>
            <span>Intersect</span>
          </button>

          <button
            title="Locus Tool: Trace the path of a dependent point as a driver point moves"
            onClick={() => setTool('locus')}
            className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all ${
              tool === 'locus'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span className="font-mono text-xs">∿</span>
            <span>Locus</span>
          </button>
        </div>

        {/* Section 3: History actions */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            onClick={onUndo}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors"
          >
            <RotateCcw size={14} />
          </button>

          <button
            title="Redo (Ctrl+Y)"
            disabled={!canRedo}
            onClick={onRedo}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors"
          >
            <RotateCw size={14} />
          </button>

        </div>
      </div>
    </div>
  );
};
