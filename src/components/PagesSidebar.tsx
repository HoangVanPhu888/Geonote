import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Copy, FileText } from 'lucide-react';
import { PageData } from '../types';

interface PagesSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  pages: PageData[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDeletePage: (index: number) => void;
  onDuplicatePage: (index: number) => void;
}

export const PagesSidebar: React.FC<PagesSidebarProps> = ({
  isOpen,
  onToggle,
  pages,
  activePageIndex,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
}) => {
  return (
    <div
      className={`absolute inset-y-0 left-0 bg-slate-100 border-r border-slate-300 flex flex-col transition-all duration-200 select-none z-20 lg:relative lg:inset-auto ${
        isOpen ? 'w-56 max-w-[75vw] shadow-lg lg:max-w-none lg:shadow-none' : 'w-10'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        title={isOpen ? 'Collapse Pages Panel' : 'Expand Pages Panel'}
        className="h-9 w-full bg-slate-200/90 hover:bg-slate-300 flex items-center justify-between px-2.5 border-b border-slate-300 text-slate-700 transition-colors"
      >
        {isOpen && <span className="font-semibold text-xs tracking-wider uppercase">Pages ({pages.length})</span>}
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} className="mx-auto" />}
      </button>

      {/* Pages list when open */}
      {isOpen ? (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
          {pages.map((page, idx) => {
            const isActive = idx === activePageIndex;
            const strokeCount = page.strokes.length;
            const geomCount =
              page.points.length +
              page.lines.length +
              page.circles.length +
              page.conics.length +
              page.angles.length;
            const latexCount = page.latexItems.length;

            return (
              <div
                key={page.id}
                onClick={() => onSelectPage(idx)}
                className={`group relative rounded-lg border transition-all cursor-pointer p-2 flex flex-col items-center gap-1.5 ${
                  isActive
                    ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-slate-300 bg-slate-50 hover:bg-white hover:border-slate-400'
                }`}
              >
                {/* Thumbnail Preview Box */}
                <div
                  className="w-24 h-32 bg-white border border-slate-200 rounded shadow-2xs relative flex flex-col items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor:
                      page.backgroundColor === '#80f4cd' || page.backgroundColor === '#e8f5e9'
                        ? '#fff3e0'
                        : page.backgroundColor || '#ffffff',
                  }}
                >
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:6px_6px]" />
                  
                  <div className="z-10 text-center px-1">
                    <span className="text-xs font-semibold text-slate-800">
                      Page {idx + 1}
                    </span>
                  </div>

                  {isActive && (
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-indigo-600" />
                  )}
                </div>

                {/* Page Label & Action Bar */}
                <div className="w-full flex items-center justify-between text-xs px-1">
                  <span className={`font-medium ${isActive ? 'text-indigo-600' : 'text-slate-600'}`}>
                    Page {idx + 1}
                  </span>

                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      title="Duplicate Page"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicatePage(idx);
                      }}
                      className="p-1 hover:bg-slate-200 text-slate-600 rounded"
                    >
                      <Copy size={11} />
                    </button>
                    {pages.length > 1 && (
                      <button
                        title="Delete Page"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(idx);
                        }}
                        className="p-1 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Add Page Button */}
          <button
            onClick={onAddPage}
            className="w-full py-2.5 rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-600 hover:text-indigo-600 flex items-center justify-center gap-1 text-xs font-semibold transition-all mt-2"
          >
            <Plus size={14} /> New Page
          </button>
        </div>
      ) : (
        /* Collapsed Icon Bar */
        <div className="flex-1 flex flex-col items-center py-3 gap-2">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPage(idx)}
              title={`Jump to Page ${idx + 1}`}
              className={`w-7 h-9 rounded flex items-center justify-center text-[10px] font-bold border transition-colors ${
                idx === activePageIndex
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={onAddPage}
            title="Add Page"
            className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 mt-1"
          >
            <Plus size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
