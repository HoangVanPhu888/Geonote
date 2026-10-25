import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  FileText,
  Save,
  Plus,
  Undo2,
  Redo2,
  Printer,
  Grid,
  ChevronDown,
  HelpCircle,
  Minimize2,
  Maximize2,
  X,
  Compass,
  FilePlus,
  FolderOpen,
  Sliders,
  Ruler,
  Calculator,
} from 'lucide-react';
import { ToolMode } from '../types';
import { LANGUAGES, type LanguageCode } from '../i18n';

interface TitleBarProps {
  tool: ToolMode;
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  setTool: (tool: ToolMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenNewFileModal: () => void;
  onSaveCurrentFile: () => void;
  onOpenFilePicker: () => void;
  onAddPage: () => void;
  onExportPdf: () => void;
  onOpenLatexModal: () => void;
  onOpenPreferencesModal?: () => void;
  onOpenMeasureModal?: (type?: 'length' | 'angle' | 'circumference' | 'area') => void;
  onOpenCalculatorModal?: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  gridType: 'blank' | 'ruled' | 'grid' | 'dots';
  setGridType: (type: 'blank' | 'ruled' | 'grid' | 'dots') => void;
  eyeProtectionEnabled: boolean;
  onToggleEyeProtection: () => void;
  isMenuBarHidden?: boolean;
  onToggleMenuBar?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  setTool,
  language,
  onLanguageChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenNewFileModal,
  onSaveCurrentFile,
  onOpenFilePicker,
  onAddPage,
  onExportPdf,
  onOpenLatexModal,
  onOpenPreferencesModal = () => {},
  onOpenMeasureModal = () => {},
  onOpenCalculatorModal = () => {},
  isSidebarOpen,
  setIsSidebarOpen,
  zoom,
  setZoom,
  gridType,
  setGridType,
  eyeProtectionEnabled,
  onToggleEyeProtection,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (menu: string) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const closeMenu = () => setActiveMenu(null);

  useEffect(() => {
    if (!activeMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-ribbon-menu]')) {
        closeMenu();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [activeMenu]);

  useLayoutEffect(() => {
    if (!activeMenu || !menuBarRef.current) return;

    const menu = menuBarRef.current.querySelector<HTMLElement>(`[data-menu-key="${activeMenu}"]`);
    const trigger = menu?.querySelector('button');
    const dropdown = menu?.querySelector<HTMLElement>('[data-ribbon-dropdown]');
    if (!menu || !trigger || !dropdown) return;

    trigger.scrollIntoView({ block: 'nearest', inline: 'center' });
    const triggerBounds = trigger.getBoundingClientRect();
    const dropdownWidth = dropdown.getBoundingClientRect().width;
    const left = Math.max(8, Math.min(triggerBounds.left, window.innerWidth - dropdownWidth - 8));
    dropdown.style.left = `${left}px`;
    dropdown.style.top = `${triggerBounds.bottom + 2}px`;
  }, [activeMenu]);

  return (
    <div className="bg-slate-900 text-slate-200 select-none border-b border-slate-800 text-xs">
      {/* Top native Windows Titlebar - Rule 14: Title shall only be Geonote Studio */}
      <div className="h-7 sm:h-8 flex items-center justify-between px-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* App Icon */}
          <div className="w-4 h-4 rounded bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
            <Compass size={11} />
          </div>
          <span className="hidden sm:inline font-semibold text-slate-100 text-xs tracking-wide">
            Geonote Studio
          </span>
        </div>

        {/* Windows Window Controls */}
        <div className="hidden sm:flex items-center">
          <button
            aria-label="Minimize"
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <span className="w-2.5 h-[1px] bg-current"></span>
          </button>
          <button
            aria-label="Maximize"
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <Maximize2 size={11} />
          </button>
          <button
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center hover:bg-rose-600 text-slate-400 hover:text-white"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Menu Bar: File, Edit, View, Construct (Circles & Lines), Transformations, Triangle Centers, Conics, LaTeX, Desktop */}
      <div
        ref={menuBarRef}
        className={`ribbon-scrollbar-hidden h-8 px-2 flex flex-nowrap items-center gap-1 bg-slate-900 relative whitespace-nowrap [&>*]:shrink-0 ${
          activeMenu ? 'overflow-x-hidden touch-none' : 'overflow-x-auto overscroll-x-contain touch-pan-x'
        }`}
      >
        {/* File Menu */}
        <div className="relative" data-ribbon-menu data-menu-key="file">
          <button
            onClick={() => toggleMenu('file')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 transition-colors ${
              activeMenu === 'file' ? 'bg-slate-800 text-white font-medium' : ''
            }`}
          >
            File
          </button>
          {activeMenu === 'file' && (
            <div
              data-ribbon-dropdown
              className="fixed left-0 top-0 flex flex-col max-h-[calc(100dvh-4rem)] overflow-y-auto w-68 max-w-[calc(100vw-1rem)] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-slate-200"
            >
              <button
                onClick={() => {
                  onOpenNewFileModal();
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center justify-between text-emerald-300 font-medium"
              >
                <span className="flex items-center gap-2">
                  <FilePlus size={13} className="text-emerald-400" /> New Document / File...
                </span>
                <span className="text-[10px] text-slate-400">Ctrl+Alt+N</span>
              </button>
              <button
                onClick={() => {
                  onOpenFilePicker();
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen size={13} className="text-amber-400" /> Open Document (.gnote)...
                </span>
              </button>
              <button
                onClick={() => {
                  onSaveCurrentFile();
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Save size={13} className="text-blue-400" /> Save Document (.gnote)
                </span>
              </button>
              <div className="h-px bg-slate-700 my-1" />
              <button
                onClick={() => {
                  onAddPage();
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Plus size={13} className="text-emerald-400" /> New Page
                </span>
                <span className="text-[10px] text-slate-400">Ctrl+N</span>
              </button>
              <button
                onClick={() => {
                  onExportPdf();
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <FileText size={13} className="text-indigo-400" /> Save as PDF
                </span>
                <span className="text-[10px] text-slate-400">Ctrl+S</span>
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative" data-ribbon-menu data-menu-key="edit">
          <button
            onClick={() => toggleMenu('edit')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 transition-colors ${
              activeMenu === 'edit' ? 'bg-slate-800 text-white font-medium' : ''
            }`}
          >
            Edit
          </button>
          {activeMenu === 'edit' && (
            <div
              data-ribbon-dropdown
              className="fixed left-0 top-0 flex flex-col max-h-[calc(100dvh-4rem)] overflow-y-auto w-52 max-w-[calc(100vw-1rem)] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-slate-200"
            >
              <button
                disabled={!canUndo}
                onClick={() => {
                  onUndo();
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center justify-between disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <Undo2 size={13} /> Undo
                </span>
                <span className="text-[10px] text-slate-400">Ctrl+Z</span>
              </button>
              <button
                disabled={!canRedo}
                onClick={() => {
                  onRedo();
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center justify-between disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <Redo2 size={13} /> Redo
                </span>
                <span className="text-[10px] text-slate-400">Ctrl+Y</span>
              </button>
            </div>
          )}
        </div>

        {/* View Menu */}
        <div className="relative" data-ribbon-menu data-menu-key="view">
          <button
            onClick={() => toggleMenu('view')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 transition-colors ${
              activeMenu === 'view' ? 'bg-slate-800 text-white font-medium' : ''
            }`}
          >
            View
          </button>
          {activeMenu === 'view' && (
            <div
              data-ribbon-dropdown
              className="fixed left-0 top-0 flex flex-col max-h-[calc(100dvh-4rem)] overflow-y-auto w-56 max-w-[calc(100vw-1rem)] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-slate-200"
            >
              <button
                onClick={() => {
                  setIsSidebarOpen((p) => !p);
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Toggle Page Thumbnails</span>
                <span className="text-[10px] text-slate-400">{isSidebarOpen ? '✓ Open' : 'Closed'}</span>
              </button>
              <button
                onClick={() => {
                  onToggleEyeProtection();
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span className="flex items-center">
                    <span className="w-3 h-3 rounded-sm border border-slate-500" style={{ backgroundColor: '#f1faef' }} />
                    <span className="w-3 h-3 -ml-1 rounded-sm border border-slate-500" style={{ backgroundColor: '#fff3e0' }} />
                  </span>
                  Eye Protection
                </span>
                <span className="text-[10px] text-slate-400">{eyeProtectionEnabled ? '✓ On' : 'Off'}</span>
              </button>
              <div className="h-[1px] bg-slate-700 my-1" />
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">Zoom Level</div>
              {[0.5, 0.75, 1.0, 1.25, 1.5].map((z) => (
                <button
                  key={z}
                  onClick={() => {
                    setZoom(z);
                    closeMenu();
                  }}
                  className="w-full px-3 py-1 text-left hover:bg-slate-700 flex items-center justify-between"
                >
                  <span>{Math.round(z * 100)}%</span>
                  {zoom === z && <span className="text-indigo-400 text-xs">✓</span>}
                </button>
              ))}
              <div className="h-[1px] bg-slate-700 my-1" />
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">Paper Pattern</div>
              {(['blank', 'ruled', 'grid', 'dots'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setGridType(g);
                    closeMenu();
                  }}
                  className="w-full px-3 py-1 text-left hover:bg-slate-700 capitalize flex items-center justify-between"
                >
                  <span>{g}</span>
                  {gridType === g && <span className="text-indigo-400 text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="flex shrink-0 items-center gap-1.5 border-l border-slate-700 pl-2 text-slate-300">
          <span className="text-[10px] font-semibold uppercase tracking-wide">Language</span>
          <select
            aria-label="Language"
            value={language}
            onChange={(event) => {
              const selected = LANGUAGES.find((item) => item.code === event.target.value);
              if (selected) onLanguageChange(selected.code);
            }}
            className="max-w-28 rounded bg-slate-800 px-1.5 py-1 text-slate-100 outline-none focus:ring-1 focus:ring-indigo-400"
          >
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </label>

        {/* Preferences Menu beside File/Edit/View (Item 17) */}
        <div className="relative">
          <button
            onClick={() => onOpenPreferencesModal()}
            className="px-2.5 py-1 rounded hover:bg-slate-800 transition-colors text-amber-300 font-medium flex items-center gap-1.5"
            title="Configure Default Point Size, Line Thickness, Styles, and Colors"
          >
            <Sliders size={12} className="text-amber-400" />
            <span>Preferences</span>
          </button>
        </div>



        {/* Measure & Calculate Menu (Item 15) */}
        <div className="relative" data-ribbon-menu data-menu-key="measure-calc">
          <button
            onClick={() => toggleMenu('measure-calc')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 ${
              activeMenu === 'measure-calc' ? 'bg-slate-800 text-white font-medium' : ''
            }`}
          >
            <Ruler size={12} className="text-indigo-400" />
            <span>Measure & Calculate</span>
          </button>
          {activeMenu === 'measure-calc' && (
            <div
              data-ribbon-dropdown
              className="fixed left-0 top-0 flex flex-col max-h-[calc(100dvh-4rem)] overflow-y-auto w-60 max-w-[calc(100vw-1rem)] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-slate-200"
            >
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Geometric Measure
              </div>
              <button
                onClick={() => {
                  onOpenMeasureModal('length');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Distance / Length</span>
                <span className="text-[10px] text-slate-400">px</span>
              </button>
              <button
                onClick={() => {
                  onOpenMeasureModal('angle');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Angle (3 Points)</span>
                <span className="text-[10px] text-slate-400">deg / rad</span>
              </button>
              <button
                onClick={() => {
                  onOpenMeasureModal('circumference');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Circumference (Circle)</span>
                <span className="text-[10px] text-slate-400">2πR</span>
              </button>
              <button
                onClick={() => {
                  onOpenMeasureModal('area');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Area (Polygon / Circle)</span>
                <span className="text-[10px] text-slate-400">px²</span>
              </button>
              <div className="h-[1px] bg-slate-700 my-1" />
              <button
                onClick={() => {
                  onOpenCalculatorModal();
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex items-center gap-2 text-emerald-300 font-semibold"
              >
                <Calculator size={13} />
                <span>Scientific Calculator</span>
              </button>
            </div>
          )}
        </div>

        {/* Circles & Lines Menu (Image 1 from user) */}
        <div className="relative" data-ribbon-menu data-menu-key="circles-lines">
          <button
            onClick={() => toggleMenu('circles-lines')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 transition-colors ${
              activeMenu === 'circles-lines' ? 'bg-slate-800 text-white font-medium' : ''
            }`}
          >
            Circles & Lines
          </button>
          {activeMenu === 'circles-lines' && (
            <div
              data-ribbon-dropdown
              className="fixed left-0 top-0 flex flex-col max-h-[calc(100dvh-4rem)] overflow-y-auto w-64 max-w-[calc(100vw-1rem)] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-slate-200"
            >
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                GSP / GeoGebra Circles & Lines
              </div>
              <button
                onClick={() => {
                  setTool('circumcircle');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Circumcircle (Triangle or 3 points)
              </button>
              <button
                onClick={() => {
                  setTool('thebault-circle');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Thebault Circle (A, B, C, then D on BC)
              </button>
              <button
                onClick={() => {
                  setTool('incircle');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Incircle
              </button>
              <button
                onClick={() => {
                  setTool('excircle');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Excircle
              </button>
              <button
                onClick={() => {
                  setTool('euler-line');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Euler's Line
              </button>
              <button
                onClick={() => {
                  setTool('euler-circle');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Euler's Circle (Nine-Point Circle)
              </button>
              <button
                onClick={() => {
                  setTool('mixtilinear-incircle');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Mixtilinear Incircle
              </button>
              <button
                onClick={() => {
                  setTool('mixtilinear-excircle');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Mixtilinear Excircle
              </button>
              <button
                onClick={() => {
                  setTool('radical-axis');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Radical Axis of 2 Circles
              </button>
            </div>
          )}
        </div>

        {/* Construction Menu (Rule 10: Circle Center + 7 construction tools) */}
        <div className="relative" data-ribbon-menu data-menu-key="construction">
          <button
            onClick={() => toggleMenu('construction')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 transition-colors ${
              activeMenu === 'construction' ? 'bg-slate-800 text-white font-medium' : ''
            }`}
          >
            Construction
          </button>
          {activeMenu === 'construction' && (
            <div
              data-ribbon-dropdown
              className="fixed left-0 top-0 flex flex-col max-h-[calc(100dvh-4rem)] overflow-y-auto w-64 max-w-[calc(100vw-1rem)] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-slate-200"
            >
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Geometric Construction
              </div>
              <button
                onClick={() => {
                  setTool('circle-center');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
                title="Click a circle to construct its center point"
              >
                Circle Center
              </button>
              <div className="h-[1px] bg-slate-700 my-1" />
              <button
                onClick={() => {
                  setTool('circular-arc');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Arc (Center, Start, End)
              </button>
              <button
                onClick={() => {
                  setTool('circumcircular-arc');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Circumcircular Arc (A, Through B, End C)
              </button>
              <div className="h-[1px] bg-slate-700 my-1" />
              <button
                onClick={() => {
                  setTool('midpoint');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Midpoint (2 Points / Segment)
              </button>
              <button
                onClick={() => {
                  setTool('parallel-line');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Parallel Line (Point & Line)
              </button>
              <button
                onClick={() => {
                  setTool('perpendicular-line');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Perpendicular Line (Point & Line)
              </button>
              <button
                onClick={() => {
                  setTool('tangent');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Tangent (Point to Circle)
              </button>
              <div className="h-[1px] bg-slate-700 my-1" />
              <button
                onClick={() => {
                  setTool('perpendicular-bisector');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Perpendicular Bisector
              </button>
              <button
                onClick={() => {
                  setTool('angle-bisector-in');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Angle In-Bisector
              </button>
              <button
                onClick={() => {
                  setTool('angle-bisector-out');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Angle Out-Bisector
              </button>
            </div>
          )}
        </div>

        {/* Transformations Menu */}
        <div className="relative" data-ribbon-menu data-menu-key="transformations">
          <button
            onClick={() => toggleMenu('transformations')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 transition-colors ${
              activeMenu === 'transformations' ? 'bg-slate-800 text-white font-medium' : ''
            }`}
          >
            Transformations
          </button>
          {activeMenu === 'transformations' && (
            <div
              data-ribbon-dropdown
              className="fixed left-0 top-0 flex flex-col max-h-[calc(100dvh-4rem)] overflow-y-auto w-64 max-w-[calc(100vw-1rem)] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-slate-200"
            >
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Transformations
              </div>
              <button
                onClick={() => {
                  setTool('reflection');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Reflection (across Line)
              </button>
              <button
                onClick={() => {
                  setTool('translate-vector');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Translation of Points (by Vector)
              </button>
              <button
                onClick={() => {
                  setTool('rotation');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Rotation around Center
              </button>
              <button
                onClick={() => {
                  setTool('dilation');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Dilation (Homothety)
              </button>
              <div className="h-[1px] bg-slate-700 my-1" />
              <button
                onClick={() => {
                  setTool('inversion-circle');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Inversion with Circle
              </button>
              <button
                onClick={() => {
                  setTool('polar-line');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Polar Line of a Point
              </button>
              <button
                onClick={() => {
                  setTool('pole-line');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Pole of a Line
              </button>
              <div className="h-[1px] bg-slate-700 my-1" />
              <button
                onClick={() => {
                  setTool('isogonal-line');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Isogonal Line in Angle
              </button>
              <button
                onClick={() => {
                  setTool('isogonal-conjugate');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Isogonal Conjugate
              </button>
              <button
                onClick={() => {
                  setTool('isotomic-conjugate');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Isotomic Conjugate
              </button>
            </div>
          )}
        </div>

        {/* Triangle Centers Menu */}
        <div className="relative" data-ribbon-menu data-menu-key="triangle-centers">
          <button
            onClick={() => toggleMenu('triangle-centers')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 transition-colors ${
              activeMenu === 'triangle-centers' ? 'bg-slate-800 text-white font-medium' : ''
            }`}
          >
            Triangle Centers
          </button>
          {activeMenu === 'triangle-centers' && (
            <div
              data-ribbon-dropdown
              className="fixed left-0 top-0 flex flex-col max-h-[calc(100dvh-4rem)] overflow-y-auto w-60 max-w-[calc(100vw-1rem)] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-slate-200"
            >
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Triangle Centers
              </div>
              <button
                onClick={() => {
                  setTool('center-centroid');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex justify-between"
              >
                <span>Medicenter (Centroid)</span>
                <span className="font-serif italic">G</span>
              </button>
              <button
                onClick={() => {
                  setTool('center-circumcenter');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex justify-between"
              >
                <span>Circumcenter</span>
                <span className="font-serif italic">O</span>
              </button>
              <button
                onClick={() => {
                  setTool('center-orthocenter');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex justify-between"
              >
                <span>Orthocenter</span>
                <span className="font-serif italic">H</span>
              </button>
              <button
                onClick={() => {
                  setTool('center-humpty');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex justify-between"
              >
                <span>A-Humpty Point</span>
                <span className="font-serif italic">Hₐ</span>
              </button>
              <button
                onClick={() => {
                  setTool('center-dumpty');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex justify-between"
              >
                <span>A-Dumpty Point</span>
                <span className="font-serif italic">Dₐ</span>
              </button>
              <button
                onClick={() => {
                  setTool('center-incenter');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex justify-between"
              >
                <span>Incenter</span>
                <span className="font-serif italic">I</span>
              </button>
              <button
                onClick={() => {
                  setTool('center-feuerbach');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex justify-between"
              >
                <span>Feuerbach Point</span>
                <span className="font-serif italic">Fe</span>
              </button>
              <button
                onClick={() => {
                  setTool('center-excenter');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex justify-between"
              >
                <span>Excenter</span>
                <span className="font-serif italic">Iₐ</span>
              </button>
              <button
                onClick={() => {
                  setTool('center-lemoine');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex justify-between"
              >
                <span>Lemoine Point (Symmedian)</span>
                <span className="font-serif italic">K</span>
              </button>
              <button
                onClick={() => {
                  setTool('center-gergonne');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex justify-between"
              >
                <span>Gergonne Point</span>
                <span className="font-serif italic">Ge</span>
              </button>
              <button
                onClick={() => {
                  setTool('center-nagel');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex justify-between"
              >
                <span>Nagel Point</span>
                <span className="font-serif italic">Na</span>
              </button>
              <button
                onClick={() => {
                  setTool('center-euler');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700 flex justify-between"
              >
                <span>Euler's Center (9-Point)</span>
                <span className="font-serif italic">N</span>
              </button>
            </div>
          )}
        </div>

        {/* Conics Menu */}
        <div className="relative" data-ribbon-menu data-menu-key="conics">
          <button
            onClick={() => toggleMenu('conics')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 transition-colors ${
              activeMenu === 'conics' ? 'bg-slate-800 text-white font-medium' : ''
            }`}
          >
            Conic Sections
          </button>
          {activeMenu === 'conics' && (
            <div
              data-ribbon-dropdown
              className="fixed left-0 top-0 flex flex-col max-h-[calc(100dvh-4rem)] overflow-y-auto w-64 max-w-[calc(100vw-1rem)] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-slate-200"
            >
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Conic Sections
              </div>
              <button
                onClick={() => {
                  setTool('conic-ellipse-2foci-1pt');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Ellipse: 2 Foci + 1 Point
              </button>
              <button
                onClick={() => {
                  setTool('conic-5pt');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Conic with 5 Points
              </button>
              <div className="h-[1px] bg-slate-700 my-1" />
              <button
                onClick={() => {
                  setTool('conic-parabola-focus-directrix');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Parabola: Focus + Directrix
              </button>
              <div className="h-[1px] bg-slate-700 my-1" />
              <button
                onClick={() => {
                  setTool('conic-hyperbola-2foci-1pt');
                  closeMenu();
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700"
              >
                Hyperbola: 2 Foci + 1 Point
              </button>
            </div>
          )}
        </div>

        {/* Text Menu (Rule 12: Text & LaTeX) */}
        <div className="relative">
          <button
            onClick={() => onOpenLatexModal()}
            className="px-2.5 py-1 rounded hover:bg-slate-800 transition-colors font-medium text-indigo-300 flex items-center gap-1.5"
            title="Add text or LaTeX math formula"
          >
            <span>Text / Formula</span>
          </button>
        </div>

      </div>
    </div>
  );
};
