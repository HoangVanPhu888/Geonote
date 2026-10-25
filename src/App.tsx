/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { TitleBar } from './components/TitleBar';
import { DocumentTabBar } from './components/DocumentTabBar';
import { RibbonToolbar } from './components/RibbonToolbar';
import { PagesSidebar } from './components/PagesSidebar';
import { ContinuousDocument } from './components/ContinuousDocument';
import { LatexModal, type TextFormatting } from './components/LatexModal';
import { AngleShadingModal } from './components/AngleShadingModal';
import { NewFileModal, TemplateType } from './components/NewFileModal';
import { PreferencesModal } from './components/PreferencesModal';
import { MeasureCalculatorModal } from './components/MeasureCalculatorModal';
import { PropertiesPanel } from './components/PropertiesPanel';
import { PageData, ToolMode, LineStyle, LatexItem, DocumentFile, SelectedItemType } from './types';
import { A4PageCanvasRef } from './components/A4PageCanvas';
import { exportDocumentToPdf } from './utils/pdfExport';
import { deleteGeometryObjects, GeoAngle } from './geometry/engine';
import { useAppLanguage } from './i18n';

// Initial sample seed data for teaching materials demonstration
const createGeometryLessonPages = (): PageData[] => [
  {
    id: 'page_1',
    pageNumber: 1,
    points: [
      { id: 'p_a', name: 'A', x: 280, y: 320, size: 4, color: '#1e293b', style: 'solid', pageIndex: 0 },
      { id: 'p_b', name: 'B', x: 520, y: 320, size: 4, color: '#1e293b', style: 'solid', pageIndex: 0 },
      { id: 'p_c', name: 'C', x: 400, y: 150, size: 4, color: '#1e293b', style: 'solid', pageIndex: 0 },
      {
        id: 'p_o',
        name: 'O',
        x: 400,
        y: 256,
        size: 5,
        color: '#dc2626',
        style: 'hollow',
        pageIndex: 0,
        dependsOn: { type: 'circumcenter', parentPointIds: ['p_a', 'p_b', 'p_c'] },
      },
      {
        id: 'p_g',
        name: 'G',
        x: 400,
        y: 263,
        size: 4,
        color: '#9333ea',
        style: 'solid',
        pageIndex: 0,
        dependsOn: { type: 'centroid', parentPointIds: ['p_a', 'p_b', 'p_c'] },
      },
      {
        id: 'p_h',
        name: 'H',
        x: 400,
        y: 278,
        size: 4,
        color: '#2563eb',
        style: 'cross',
        pageIndex: 0,
        dependsOn: { type: 'orthocenter', parentPointIds: ['p_a', 'p_b', 'p_c'] },
      },
      {
        id: 'p_f1',
        name: 'F₁',
        x: 300,
        y: 720,
        size: 4,
        color: '#d97706',
        style: 'solid',
        pageIndex: 0,
      },
      {
        id: 'p_f2',
        name: 'F₂',
        x: 500,
        y: 720,
        size: 4,
        color: '#d97706',
        style: 'solid',
        pageIndex: 0,
      },
      {
        id: 'p_e',
        name: 'P',
        x: 400,
        y: 640,
        size: 4,
        color: '#d97706',
        style: 'hollow',
        pageIndex: 0,
      },
    ],
    lines: [
      { id: 'l_ab', p1: { x: 280, y: 320 }, p2: { x: 520, y: 320 }, p1PointId: 'p_a', p2PointId: 'p_b', thickness: 2, color: '#334155', style: 'solid', pageIndex: 0 },
      { id: 'l_bc', p1: { x: 520, y: 320 }, p2: { x: 400, y: 150 }, p1PointId: 'p_b', p2PointId: 'p_c', thickness: 2, color: '#334155', style: 'solid', pageIndex: 0 },
      { id: 'l_ca', p1: { x: 400, y: 150 }, p2: { x: 280, y: 320 }, p1PointId: 'p_c', p2PointId: 'p_a', thickness: 2, color: '#334155', style: 'solid', pageIndex: 0 },
      {
        id: 'l_euler',
        p1: { x: 400, y: 80 },
        p2: { x: 400, y: 450 },
        p1PointId: 'p_o',
        p2PointId: 'p_h',
        dependsOn: { type: 'euler-line', parentPointIds: ['p_a', 'p_b', 'p_c'] },
        thickness: 1.5,
        color: '#dc2626',
        style: 'dash-dot',
        isInfinite: true,
        pageIndex: 0,
      },
    ],
    circles: [
      {
        id: 'c_circum',
        center: { x: 400, y: 256 },
        radius: 160,
        centerPointId: 'p_o',
        dependsOn: { type: 'circumcircle', parentPointIds: ['p_a', 'p_b', 'p_c'] },
        thickness: 1.5,
        color: '#2563eb',
        style: 'dash',
        pageIndex: 0,
      },
    ],
    conics: [
      {
        id: 'conic_demo',
        name: 'Ellipse E',
        type: 'ellipse',
        subType: 'ellipse-2foci-1pt',
        foci: [{ x: 300, y: 720 }, { x: 500, y: 720 }],
        fociPointIds: ['p_f1', 'p_f2'],
        point: { x: 400, y: 640 },
        pointId: 'p_e',
        thickness: 2,
        color: '#d97706',
        style: 'solid',
        pageIndex: 0,
      },
    ],
    angles: [
      {
        id: 'ang_1',
        center: { x: 280, y: 320 },
        p1: { x: 520, y: 320 },
        p2: { x: 400, y: 150 },
        centerPointId: 'p_a',
        p1PointId: 'p_b',
        p2PointId: 'p_c',
        radius: 35,
        angleDeg: 55,
        label: '55°',
        style: 'sector',
        color: '#2563eb',
        fillColor: 'rgba(37, 99, 235, 0.2)',
        pageIndex: 0,
      },
    ],
    polygons: [
      {
        id: 'poly_triangle_abc',
        points: [{ x: 280, y: 320 }, { x: 520, y: 320 }, { x: 400, y: 150 }],
        pointIds: ['p_a', 'p_b', 'p_c'],
        thickness: 2,
        color: '#334155',
        style: 'solid',
        fillColor: 'rgba(59, 130, 246, 0.08)',
        pageIndex: 0,
      },
    ],
    strokes: [
      {
        id: 's_note1',
        points: [
          { x: 100, y: 80 },
          { x: 120, y: 82 },
          { x: 160, y: 80 },
          { x: 200, y: 83 },
        ],
        color: '#eab308',
        width: 12,
        isHighlighter: true,
        pageIndex: 0,
      },
    ],
    latexItems: [
      {
        id: 'tex_title',
        x: 80,
        y: 40,
        latex: '\\mathbf{\\text{Theorem: Euler Line and Circumcircle in } \\triangle ABC}',
        fontSize: 18,
        color: '#0f172a',
        pageIndex: 0,
      },
      {
        id: 'tex_euler',
        x: 420,
        y: 380,
        latex: '\\text{Euler line: } H, G, O \\text{ are collinear with } \\overrightarrow{OH} = 3\\overrightarrow{OG}',
        fontSize: 15,
        color: '#b91c1c',
        pageIndex: 0,
      },
      {
        id: 'tex_conic',
        x: 240,
        y: 840,
        latex: '\\mathcal{E}: \\frac{(x-h)^2}{a^2} + \\frac{(y-k)^2}{b^2} = 1 \\quad (F_1, F_2 \\text{ are foci})',
        fontSize: 16,
        color: '#b45309',
        pageIndex: 0,
      },
    ],
    gridType: 'grid',
  },
];

const createPagesForTemplate = (template: TemplateType): PageData[] => {
  return [
    {
      id: `page_${Date.now()}`,
      pageNumber: 1,
      points: [],
      lines: [],
      circles: [],
      conics: [],
      angles: [],
      polygons: [],
      strokes: [],
      latexItems: [],
      gridType: template === 'blank' ? 'blank' : template === 'ruled' ? 'ruled' : 'grid',
    },
  ];
};

const createInitialDocument = (): DocumentFile => {
  const initialPages = createPagesForTemplate('blank');
  return {
    id: 'doc_1',
    name: 'Untitled Document',
    pages: initialPages,
    activePageIndex: 0,
    history: [initialPages],
    historyIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

export default function App() {
  const { language, setLanguage } = useAppLanguage();
  // Multi-document files state
  const [files, setFiles] = useState<DocumentFile[]>([createInitialDocument()]);
  const [activeFileId, setActiveFileId] = useState<string>('doc_1');

  // UI state
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return 1;
    return Math.max(0.25, Math.min(1, (window.innerWidth - 64) / 794));
  });
  const [tool, setTool] = useState<ToolMode>('select');
  const [gridType, setGridType] = useState<'blank' | 'ruled' | 'grid' | 'dots'>('blank');

  // Point & Line controls (user specifically requested size/thickness down to 1!)
  const [pointSize, setPointSize] = useState<number>(3);
  const [pointStyle, setPointStyle] = useState<'solid' | 'hollow' | 'cross' | 'plus'>('solid');
  const [pointColor, setPointColor] = useState<string>('#2563eb');

  const [lineThickness, setLineThickness] = useState<number>(2);
  const [lineStyle, setLineStyle] = useState<LineStyle>('solid');
  const [lineColor, setLineColor] = useState<string>('#2563eb');
  const [fillColor, setFillColor] = useState<string>('rgba(37, 99, 235, 0.15)');
  const [rotationAngleDeg, setRotationAngleDeg] = useState<number>(45);

  // Modals & Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() =>
    typeof window === 'undefined' || window.innerWidth >= 1024
  );
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState<boolean>(false);
  const [isLatexModalOpen, setIsLatexModalOpen] = useState<boolean>(false);
  const [editingLatexItem, setEditingLatexItem] = useState<LatexItem | null>(null);
  const [isAngleModalOpen, setIsAngleModalOpen] = useState<boolean>(false);
  const [editingAngle, setEditingAngle] = useState<Partial<GeoAngle> | null>(null);
  const [isMenuBarHidden, setIsMenuBarHidden] = useState<boolean>(false);

  // User Rules 2, 3, 4: Preferences, Measure, Calculator, and Properties Panel States
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState<boolean>(false);
  const [isMeasureModalOpen, setIsMeasureModalOpen] = useState<boolean>(false);
  const [measureModalType, setMeasureModalType] = useState<'distance' | 'angle' | 'circumference' | 'area'>('distance');
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState<boolean>(false);
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState<boolean>(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<SelectedItemType>(null);

  // Global keyboard shortcut to toggle menu bar (Ctrl+M or Cmd+M)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsMenuBarHidden((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active document resolution
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];
  const pages = activeFile.pages;
  const activePageIndex = activeFile.activePageIndex;
  const activePage = pages[activePageIndex] || pages[0];
  const eyeProtectionPaperColor = '#fff3e0';
  const eyeProtectionWorkspaceColor = '#f1faef';
  const previousEyeProtectionColors = ['#e8f5e9', '#80f4cd'];
  const isEyeProtectionEnabled = Boolean(
    activePage &&
      (activePage.backgroundColor === eyeProtectionPaperColor ||
        previousEyeProtectionColors.includes(activePage.backgroundColor || ''))
  );
  const history = activeFile.history;
  const historyIndex = activeFile.historyIndex;

  // Canvas references for PDF export
  const pageCanvasRefs = useRef<(A4PageCanvasRef | null)[]>([]);

  // Update active document
  const updateActiveDoc = useCallback(
    (updater: (prev: DocumentFile) => DocumentFile) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === activeFileId ? updater(f) : f))
      );
    },
    [activeFileId]
  );

  // Push new pages to active document history with max 50 entries
  const pushToHistory = useCallback(
    (newPages: PageData[]) => {
      updateActiveDoc((doc) => {
        const sliced = doc.history.slice(0, doc.historyIndex + 1);
        const newHistory = [...sliced, newPages];
        const trimmedHistory =
          newHistory.length > 50
            ? newHistory.slice(newHistory.length - 50)
            : newHistory;
        return {
          ...doc,
          pages: newPages,
          history: trimmedHistory,
          historyIndex: trimmedHistory.length - 1,
          updatedAt: Date.now(),
        };
      });
    },
    [updateActiveDoc]
  );

  // Set active page index for active document
  const setActivePageIndex = useCallback(
    (idx: number) => {
      updateActiveDoc((doc) => ({
        ...doc,
        activePageIndex: Math.max(0, Math.min(doc.pages.length - 1, idx)),
      }));
    },
    [updateActiveDoc]
  );

  // Update a single page in active document with optional commitHistory
  const handleUpdatePage = useCallback(
    (pageIdx: number, updater: (prev: PageData) => PageData, commitHistory = true) => {
      setFiles((prev) =>
        prev.map((doc) => {
          if (doc.id !== activeFileId) return doc;
          const updatedPages = doc.pages.map((p, idx) =>
            idx === pageIdx ? updater(p) : p
          );

          if (!commitHistory) {
            // Transient update (e.g. active dragging) without polluting undo history
            return {
              ...doc,
              pages: updatedPages,
              updatedAt: Date.now(),
            };
          }

          const slicedHistory = doc.history.slice(0, doc.historyIndex + 1);
          const newHistory = [...slicedHistory, updatedPages];
          const trimmedHistory =
            newHistory.length > 50
              ? newHistory.slice(newHistory.length - 50)
              : newHistory;
          return {
            ...doc,
            pages: updatedPages,
            history: trimmedHistory,
            historyIndex: trimmedHistory.length - 1,
            updatedAt: Date.now(),
          };
        })
      );
    },
    [activeFileId]
  );

  // Undo in active document
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      updateActiveDoc((doc) => ({
        ...doc,
        pages: doc.history[nextIndex],
        historyIndex: nextIndex,
      }));
    }
  }, [historyIndex, updateActiveDoc]);

  // Redo in active document
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      updateActiveDoc((doc) => ({
        ...doc,
        pages: doc.history[nextIndex],
        historyIndex: nextIndex,
      }));
    }
  }, [historyIndex, history.length, updateActiveDoc]);

  // Create a new document file anytime
  const handleCreateNewFile = (fileName: string, template: TemplateType) => {
    const newPages = createPagesForTemplate(template);
    const newFile: DocumentFile = {
      id: `doc_${Date.now()}`,
      name: fileName,
      pages: newPages,
      activePageIndex: 0,
      history: [newPages],
      historyIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  // Close a document file tab
  const handleCloseFile = (fileId: string) => {
    if (files.length <= 1) {
      // If closing the only file, start a fresh blank one
      const blankPages = createPagesForTemplate('blank');
      const freshFile: DocumentFile = {
        id: `doc_${Date.now()}`,
        name: 'Untitled-1',
        pages: blankPages,
        activePageIndex: 0,
        history: [blankPages],
        historyIndex: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setFiles([freshFile]);
      setActiveFileId(freshFile.id);
      return;
    }
    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining[0].id);
    }
  };

  // Rename a document file
  const handleRenameFile = (fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, name: newName, updatedAt: Date.now() } : f
      )
    );
  };

  // Save current active document as .gnote file
  const handleSaveCurrentFile = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(activeFile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeFile.name}.gnote`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Open file picker to import .gnote / JSON
  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.pages)) {
          const loadedFile: DocumentFile = {
            id: `doc_${Date.now()}`,
            name: parsed.name || file.name.replace(/\.[^/.]+$/, ''),
            pages: parsed.pages,
            activePageIndex: 0,
            history: [parsed.pages],
            historyIndex: 0,
            createdAt: parsed.createdAt || Date.now(),
            updatedAt: Date.now(),
          };
          setFiles((prev) => [...prev, loadedFile]);
          setActiveFileId(loadedFile.id);
        }
      } catch (err) {
        console.error('Failed to load file', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Add Page (A4) to active document
  const handleAddPage = () => {
    const newPage: PageData = {
      id: `page_${Date.now()}`,
      pageNumber: pages.length + 1,
      points: [],
      lines: [],
      circles: [],
      conics: [],
      angles: [],
      polygons: [],
      strokes: [],
      latexItems: [],
      gridType,
    };
    const newPages = [...pages, newPage];
    pushToHistory(newPages);
    setActivePageIndex(newPages.length - 1);
  };

  // Duplicate Page in active document
  const handleDuplicatePage = (idx: number) => {
    const target = pages[idx];
    const cloned: PageData = {
      ...JSON.parse(JSON.stringify(target)),
      id: `page_${Date.now()}`,
      pageNumber: pages.length + 1,
    };
    const newPages = [...pages, cloned];
    pushToHistory(newPages);
    setActivePageIndex(newPages.length - 1);
  };

  // Delete Page in active document
  const handleDeletePage = (idx: number) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== idx);
    pushToHistory(newPages);
    setActivePageIndex(Math.max(0, idx - 1));
  };

  // Export to PDF
  const handleExportPdf = useCallback(async () => {
    await exportDocumentToPdf(
      pages,
      (pageIdx, scale) => {
        const ref = pageCanvasRefs.current[pageIdx];
        return ref ? ref.getCanvas(scale) : null;
      },
      `${activeFile.name}.pdf`
    );
  }, [pages, activeFile.name]);

  // Save LaTeX from Modal
  const handleSaveLatex = useCallback((
    latex: string,
    fontSize: number,
    color: string,
    formatting: TextFormatting
  ) => {
    if (editingLatexItem) {
      // Edit existing
      handleUpdatePage(editingLatexItem.pageIndex, (p) => ({
        ...p,
        latexItems: p.latexItems.map((item) =>
          item.id === editingLatexItem.id
            ? { ...item, latex, fontSize, color, ...formatting }
            : item
        ),
      }));
      setEditingLatexItem(null);
    } else {
      // Create new LaTeX formula in the center of active page
      const newItem: LatexItem = {
        id: `tex_${Date.now()}`,
        x: 180,
        y: 200,
        latex,
        fontSize,
        color,
        pageIndex: activePageIndex,
        ...formatting,
      };
      handleUpdatePage(activePageIndex, (p) => ({
        ...p,
        latexItems: [...p.latexItems, newItem],
      }));
    }
  }, [editingLatexItem, handleUpdatePage, activePageIndex]);

  // Save Angle Shading & Style to active angle or default
  const handleSaveAngle = useCallback(
    (
      style: GeoAngle['style'],
      label: string,
      color: string,
      fillCol: string,
      radius: number
    ) => {
      setLineColor(color);
      setFillColor(fillCol);

      if (editingAngle && editingAngle.id) {
        handleUpdatePage(activePageIndex, (p) => ({
          ...p,
          angles: p.angles.map((ang) =>
            ang.id === editingAngle.id
              ? {
                  ...ang,
                  style,
                  label,
                  color,
                  fillColor: fillCol,
                  radius,
                }
              : ang
          ),
        }));
        setEditingAngle(null);
      }
    },
    [editingAngle, activePageIndex, handleUpdatePage]
  );

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+N, Ctrl+Alt+N, Ctrl+S for .gnote, Ctrl+P/Shift+S for PDF)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (e.altKey || e.shiftKey) {
          // Ctrl+Alt+N or Ctrl+Shift+N: New Document File
          setIsNewFileModalOpen(true);
        } else {
          // Ctrl+N: Add A4 Page
          handleAddPage();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl+Shift+S: Export to PDF
          handleExportPdf();
        } else {
          // Ctrl+S: Save .gnote document file
          handleSaveCurrentFile();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        // Ctrl+P: Export to PDF
        e.preventDefault();
        handleExportPdf();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'v' || e.key === 'V') {
          setTool('select');
        } else if (e.key === 'Escape') {
          setTool('select');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleAddPage,
    handleSaveCurrentFile,
    handleExportPdf,
  ]);

  return (
    <div className="flex flex-col h-dvh w-full min-w-0 overflow-hidden bg-slate-900 font-sans antialiased text-slate-900">
      {/* Hidden file input for opening .gnote documents */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".gnote,.json"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Floating Restore Menu Button when Menu Bar is hidden */}
      {isMenuBarHidden && (
        <div className="absolute top-2 left-4 z-50 flex items-center gap-2">
          <button
            onClick={() => setIsMenuBarHidden(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/95 hover:bg-slate-800 text-amber-300 hover:text-white rounded-md shadow-2xl border border-slate-700/80 text-xs font-semibold backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
            title="Restore Menu Bar (Ctrl+M)"
          >
            <ChevronDown size={14} className="rotate-0" />
            <span>Show Menu Bar</span>
            <span className="text-[10px] text-slate-400 font-mono">Ctrl+M</span>
          </button>
        </div>
      )}

      {/* 1. Native Windows Fluent TitleBar & Dropdown Menus */}
      {!isMenuBarHidden && (
        <TitleBar
          tool={tool}
          language={language}
          onLanguageChange={setLanguage}
          setTool={setTool}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onOpenNewFileModal={() => setIsNewFileModalOpen(true)}
          onSaveCurrentFile={handleSaveCurrentFile}
          onOpenFilePicker={handleOpenFilePicker}
          onAddPage={handleAddPage}
          onExportPdf={handleExportPdf}
          onOpenLatexModal={() => {
            setEditingLatexItem(null);
            setIsLatexModalOpen(true);
          }}
          onOpenPreferencesModal={() => setIsPreferencesModalOpen(true)}
          onOpenMeasureModal={(type) => {
            if (type === 'length') setMeasureModalType('distance');
            else if (type) setMeasureModalType(type as any);
            setIsMeasureModalOpen(true);
          }}
          onOpenCalculatorModal={() => setIsCalculatorModalOpen(true)}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          zoom={zoom}
          setZoom={setZoom}
          gridType={gridType}
          eyeProtectionEnabled={isEyeProtectionEnabled}
          onToggleEyeProtection={() => {
            handleUpdatePage(activePageIndex, (page) => ({
              ...page,
              backgroundColor:
                page.backgroundColor === eyeProtectionPaperColor ||
                previousEyeProtectionColors.includes(page.backgroundColor || '')
                  ? undefined
                  : eyeProtectionPaperColor,
            }));
          }}
          isMenuBarHidden={isMenuBarHidden}
          onToggleMenuBar={() => setIsMenuBarHidden((p) => !p)}
          setGridType={(gt) => {
            setGridType(gt);
            updateActiveDoc((doc) => ({
              ...doc,
              pages: doc.pages.map((p) => ({ ...p, gridType: gt })),
            }));
          }}
        />
      )}

      {/* 2. Document Tab Bar: Multi-File Support with tabs, rename, close, + New File button */}
      <DocumentTabBar
        files={files}
        activeFileId={activeFileId}
        onSelectFile={setActiveFileId}
        onCloseFile={handleCloseFile}
        onRenameFile={handleRenameFile}
        onOpenNewFileModal={() => setIsNewFileModalOpen(true)}
        onSaveCurrentFile={handleSaveCurrentFile}
        onOpenFilePicker={handleOpenFilePicker}
      />

      {/* 3. Ribbon Toolbar: Scrble Inking, GSP, Conics, LaTeX, New File, Point Size & Line Thickness down to 1 */}
      {!isMenuBarHidden && (
        <RibbonToolbar
        tool={tool}
        setTool={setTool}
        pointSize={pointSize}
        setPointSize={setPointSize}
        pointStyle={pointStyle}
        setPointStyle={setPointStyle}
        lineThickness={lineThickness}
        setLineThickness={setLineThickness}
        lineStyle={lineStyle}
        setLineStyle={setLineStyle}
        pointColor={pointColor}
        setPointColor={setPointColor}
        lineColor={lineColor}
        setLineColor={setLineColor}
        fillColor={fillColor}
        setFillColor={setFillColor}
        zoom={zoom}
        setZoom={setZoom}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenLatexModal={() => {
          setEditingLatexItem(null);
          setIsLatexModalOpen(true);
        }}
        onOpenAngleModal={() => setIsAngleModalOpen(true)}
        rotationAngleDeg={rotationAngleDeg}
        setRotationAngleDeg={setRotationAngleDeg}
      />
      )}

      {/* 4. Main Workspace Area: Left Page Thumbnails Sidebar + Continuous Scroll A4 Document */}
      <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden relative">
        <PagesSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          pages={pages}
          activePageIndex={activePageIndex}
          onSelectPage={setActivePageIndex}
          onAddPage={handleAddPage}
          onDeletePage={handleDeletePage}
          onDuplicatePage={handleDuplicatePage}
        />

        <ContinuousDocument
          pages={pages}
          eyeProtectionWorkspaceColor={isEyeProtectionEnabled ? eyeProtectionWorkspaceColor : undefined}
          activePageIndex={activePageIndex}
          setActivePageIndex={setActivePageIndex}
          zoom={zoom}
          onZoomChange={setZoom}
          tool={tool}
          pointSize={pointSize}
          pointStyle={pointStyle}
          pointColor={pointColor}
          lineThickness={lineThickness}
          lineStyle={lineStyle}
          lineColor={lineColor}
          fillColor={fillColor}
          rotationAngleDeg={rotationAngleDeg}
          onRotationAngleChange={setRotationAngleDeg}
          onUpdatePage={handleUpdatePage}
          onAddPage={handleAddPage}
          onEditLatex={(item) => {
            setEditingLatexItem(item);
            setIsLatexModalOpen(true);
          }}
          onEditAngle={(angle) => {
            setEditingAngle(angle);
            setIsAngleModalOpen(true);
          }}
          onOpenPropertiesPanel={() => setIsPropertiesPanelOpen(true)}
          onSelectObject={(id, type) => {
            setSelectedObjectId(id);
            setSelectedObjectType(type);
          }}
          pageCanvasRefs={pageCanvasRefs}
        />
      </div>

      {/* 5. New File / Document Modal */}
      <NewFileModal
        isOpen={isNewFileModalOpen}
        onClose={() => setIsNewFileModalOpen(false)}
        onConfirmNewFile={handleCreateNewFile}
        initialDefaultIndex={files.length + 1}
      />

      {/* 6. LaTeX / Text Formula Editor Modal */}
      <LatexModal
        isOpen={isLatexModalOpen}
        initialLatex={editingLatexItem?.latex || '\\triangle ABC'}
        initialFontSize={editingLatexItem?.fontSize || 18}
        initialColor={editingLatexItem?.color || '#1e293b'}
        initialFormatting={editingLatexItem ? {
          fontFamily: editingLatexItem.fontFamily,
          bold: editingLatexItem.bold,
          italic: editingLatexItem.italic,
          underline: editingLatexItem.underline,
        } : undefined}
        onSave={handleSaveLatex}
        onClose={() => {
          setIsLatexModalOpen(false);
          setEditingLatexItem(null);
        }}
      />

      {/* 7. Angle Shading Settings Modal */}
      <AngleShadingModal
        isOpen={isAngleModalOpen}
        angle={editingAngle}
        onSave={handleSaveAngle}
        onClose={() => setIsAngleModalOpen(false)}
      />

      {/* 9. Preferences Modal (Rule 2: Point size 2-10, Line thickness 2-10, Color palette) */}
      <PreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        pointSize={pointSize}
        setPointSize={setPointSize}
        pointStyle={pointStyle}
        setPointStyle={setPointStyle}
        pointColor={pointColor}
        setPointColor={setPointColor}
        lineThickness={lineThickness}
        setLineThickness={setLineThickness}
        lineStyle={lineStyle}
        setLineStyle={setLineStyle}
        lineColor={lineColor}
        setLineColor={setLineColor}
        fillColor={fillColor}
        setFillColor={setFillColor}
      />

      {/* 10. Measure / Calculator Modal (Rule 4: Distance cm, Angle deg, Circumference cm, Area cm², Interactive Calculator) */}
      <MeasureCalculatorModal
        isOpen={isMeasureModalOpen || isCalculatorModalOpen}
        onClose={() => {
          setIsMeasureModalOpen(false);
          setIsCalculatorModalOpen(false);
        }}
        page={pages[activePageIndex] || pages[0]}
        activePageIndex={activePageIndex}
        initialTab={isCalculatorModalOpen ? 'calculator' : 'measure'}
        measureType={measureModalType === 'distance' ? 'length' : measureModalType}
      />

      {/* 11. Properties Panel (Rule 3: GeoGebra style right side drawer) */}
      <PropertiesPanel
        isOpen={isPropertiesPanelOpen}
        onClose={() => setIsPropertiesPanelOpen(false)}
        selectedId={selectedObjectId}
        selectedType={selectedObjectType}
        page={pages[activePageIndex] || pages[0]}
        onUpdatePage={(updater, commitHistory) => {
          handleUpdatePage(activePageIndex, updater, commitHistory);
        }}
        onDeleteSelected={(id, type) => {
          handleUpdatePage(activePageIndex, (p) => {
            const geometry = deleteGeometryObjects(p, [id]);
            return {
              ...geometry,
              strokes: type === 'stroke' ? p.strokes.filter((item) => item.id !== id) : p.strokes,
              latexItems: type === 'latex' ? p.latexItems.filter((item) => item.id !== id) : p.latexItems,
            };
          }, true);
          setIsPropertiesPanelOpen(false);
        }}
      />
    </div>
  );
}
