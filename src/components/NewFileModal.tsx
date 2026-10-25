import React, { useState } from 'react';
import { FilePlus, FileText, Grid, Sparkles, Orbit, X, Check } from 'lucide-react';

export type TemplateType = 'blank' | 'grid' | 'ruled';

interface NewFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmNewFile: (fileName: string, template: TemplateType) => void;
  initialDefaultIndex?: number;
}

export const NewFileModal: React.FC<NewFileModalProps> = ({
  isOpen,
  onClose,
  onConfirmNewFile,
  initialDefaultIndex = 1,
}) => {
  const [fileName, setFileName] = useState<string>(`Untitled-${initialDefaultIndex}`);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('blank');

  if (!isOpen) return null;

  const templates: {
    id: TemplateType;
    title: string;
    desc: string;
    icon: React.ComponentType<{ size: number; className?: string }>;
    accent: string;
  }[] = [
    {
      id: 'blank',
      title: 'Blank Document',
      desc: 'Clean, plain white pages for freehand notes, teaching drafts, and custom geometric drawings.',
      icon: FilePlus,
      accent: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      id: 'grid',
      title: 'Math Graph Paper',
      desc: 'Standard metric coordinate grid for Euclidean geometry, coordinates, and graphing.',
      icon: Grid,
      accent: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'ruled',
      title: 'Ruled Notebook',
      desc: 'Horizontal lined notebook pages for handwriting notes, proofs, and definitions.',
      icon: FileText,
      accent: 'text-amber-600 bg-amber-50 border-amber-200',
    },
  ];

  const handleCreate = () => {
    const finalName = fileName.trim() || `Document-${Date.now().toString().slice(-4)}`;
    onConfirmNewFile(finalName, selectedTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-white">
              <FilePlus size={14} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Create New Document / File</h3>
              <p className="text-[11px] text-slate-400">Add a new file to your workspace anytime</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* File Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              File Name / Title:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. Geometry Lesson 1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreate();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 bg-slate-50 focus:bg-white"
              />
              <span className="text-xs text-slate-400 font-mono">.gnote</span>
            </div>
          </div>

          {/* Template Choice */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Starting Template:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {templates.map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all text-xs relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg border ${tpl.accent}`}>
                        <Icon size={16} />
                      </div>
                      <span className="font-semibold text-slate-800">
                        {tpl.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {tpl.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            You can have multiple files open and switch anytime
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <FilePlus size={13} />
              <span>Create File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
