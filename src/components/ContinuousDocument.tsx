import React, { useRef, useEffect } from 'react';
import { PageData, ToolMode, LineStyle, LatexItem, SelectedItemType } from '../types';
import { A4PageCanvas, A4PageCanvasRef } from './A4PageCanvas';
import { Plus } from 'lucide-react';

interface ContinuousDocumentProps {
  pages: PageData[];
  eyeProtectionWorkspaceColor?: string;
  activePageIndex: number;
  setActivePageIndex: (index: number) => void;
  zoom: number;
  onZoomChange?: (zoom: number) => void;
  tool: ToolMode;
  pointSize: number;
  pointStyle: 'solid' | 'hollow' | 'cross' | 'plus';
  pointColor: string;
  lineThickness: number;
  lineStyle: LineStyle;
  lineColor: string;
  fillColor: string;
  onUpdatePage: (pageIndex: number, updater: (prev: PageData) => PageData, commitHistory?: boolean) => void;
  onAddPage: () => void;
  onEditLatex: (item: LatexItem) => void;
  onEditAngle?: (angle: any) => void;
  onOpenPropertiesPanel?: () => void;
  onSelectObject?: (id: string | null, type: SelectedItemType) => void;
  rotationAngleDeg?: number;
  onRotationAngleChange?: (deg: number) => void;
  pageCanvasRefs: React.MutableRefObject<(A4PageCanvasRef | null)[]>;
}

export const ContinuousDocument: React.FC<ContinuousDocumentProps> = ({
  pages,
  eyeProtectionWorkspaceColor,
  activePageIndex,
  setActivePageIndex,
  zoom,
  onZoomChange,
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
  onAddPage,
  onEditLatex,
  onEditAngle,
  onOpenPropertiesPanel,
  onSelectObject,
  pageCanvasRefs,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageDomRefs = useRef<(HTMLDivElement | null)[]>([]);

  // When activePageIndex changes from sidebar click, scroll smoothly to that page
  useEffect(() => {
    const targetEl = pageDomRefs.current[activePageIndex];
    if (targetEl && containerRef.current) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activePageIndex]);

  // Track which page is in viewport during continuous scrolling
  const handleScroll = () => {
    if (!containerRef.current) return;
    const containerTop = containerRef.current.getBoundingClientRect().top;
    let closestIndex = 0;
    let minDistance = Infinity;

    pageDomRefs.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const distFromTop = Math.abs(rect.top - containerTop - 50);
      if (distFromTop < minDistance) {
        minDistance = distFromTop;
        closestIndex = idx;
      }
    });

    if (closestIndex !== activePageIndex) {
      setActivePageIndex(closestIndex);
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 min-w-0 bg-slate-300/70 overflow-y-auto overflow-x-auto p-3 sm:p-5 lg:p-8 flex flex-col items-center relative scroll-smooth select-none"
      style={eyeProtectionWorkspaceColor && pages[activePageIndex]?.backgroundColor ? { backgroundColor: eyeProtectionWorkspaceColor } : undefined}
    >
      {/* Pages Container with continuous scroll */}
      <div className="flex flex-col items-center gap-10 pb-24">
        {pages.map((page, idx) => (
          <div
            key={page.id}
            ref={(el) => {
              pageDomRefs.current[idx] = el;
            }}
            onClick={() => setActivePageIndex(idx)}
            className={`flex flex-col items-center transition-all ${
              idx === activePageIndex ? 'scale-[1.002]' : 'opacity-95'
            }`}
          >
            {/* Page Header Tag */}
            <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 px-1 mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Page {idx + 1}</span>
              </span>
              <span className="text-slate-400 font-mono">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Canvas Page Component */}
            <A4PageCanvas
              ref={(instance) => {
                pageCanvasRefs.current[idx] = instance;
              }}
              page={page}
              pageIndex={idx}
              zoom={zoom}
              tool={tool}
              pointSize={pointSize}
              pointStyle={pointStyle}
              pointColor={pointColor}
              lineThickness={lineThickness}
              lineStyle={lineStyle}
              lineColor={lineColor}
              fillColor={fillColor}
              onUpdatePage={(updater, commitHistory) => onUpdatePage(idx, updater, commitHistory)}
              onEditLatex={onEditLatex}
              onEditAngle={onEditAngle}
              onOpenPropertiesPanel={onOpenPropertiesPanel}
              onSelectObject={onSelectObject}
              rotationAngleDeg={rotationAngleDeg}
              onRotationAngleChange={onRotationAngleChange}
            />
          </div>
        ))}

        {/* Add Page Button at end of document */}
        <div className="pt-2">
          <button
            onClick={onAddPage}
            className="px-6 py-3 bg-white hover:bg-slate-50 text-indigo-700 font-semibold text-xs rounded-xl shadow-md border border-slate-300 hover:border-indigo-400 flex items-center gap-2 transition-all hover:shadow-lg"
          >
            <Plus size={16} />
            <span>New Page</span>
          </button>
        </div>
      </div>

      {/* Page indicator at bottom left */}
      <div className="hidden sm:flex fixed bottom-4 left-6 bg-slate-900/95 text-white px-3 py-1.5 rounded-lg shadow-xl text-xs items-center gap-2 backdrop-blur-md z-30 font-medium border border-slate-700 pointer-events-none">
        <span className="text-slate-300">Page {activePageIndex + 1} / {pages.length}</span>
        <span className="w-1 h-3 bg-slate-700" />
        <span className="text-emerald-400 capitalize truncate max-w-36">{tool.replace(/-/g, ' ')}</span>
      </div>

      {/* Item 2: Continuous Zoom Slider & Menu moved to bottom right of screen */}
      <div
        className="fixed bottom-3 right-2 sm:bottom-4 sm:right-6 bg-slate-900/95 text-white px-2.5 sm:px-3.5 py-2 rounded-xl shadow-2xl text-xs flex items-center gap-1.5 sm:gap-2.5 backdrop-blur-md z-30 font-medium border border-slate-700"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        <span className="hidden sm:inline text-slate-400 text-[11px] font-semibold">Zoom</span>
        <button
          type="button"
          title="Zoom Out"
          onClick={() => onZoomChange?.(Math.max(0.25, Number((zoom - 0.05).toFixed(2))))}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
        >
          -
        </button>
        <input
          type="range"
          min="0.25"
          max="2.5"
          step="0.01"
          value={zoom}
          onChange={(e) => onZoomChange?.(parseFloat(e.target.value))}
          className="w-20 sm:w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          title={`Continuous Zoom: ${Math.round(zoom * 100)}%`}
        />
        <button
          type="button"
          title="Zoom In"
          onClick={() => onZoomChange?.(Math.min(2.5, Number((zoom + 0.05).toFixed(2))))}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
        >
          +
        </button>
        <button
          type="button"
          title="Reset Zoom to 100%"
          onClick={() => onZoomChange?.(1.0)}
          className="text-indigo-300 hover:text-indigo-200 font-mono text-[11px] px-1.5 py-0.5 rounded hover:bg-slate-800 border border-slate-700 ml-0.5"
        >
          {Math.round(zoom * 100)}%
        </button>
      </div>
    </div>
  );
};
