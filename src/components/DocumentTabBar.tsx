import React, { useState } from 'react';
import {
  FileText,
  Plus,
  X,
  FolderOpen,
  Save,
  Check,
  Edit2,
  FilePlus,
} from 'lucide-react';
import { DocumentFile } from '../types';

interface DocumentTabBarProps {
  files: DocumentFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCloseFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onOpenNewFileModal: () => void;
  onSaveCurrentFile: () => void;
  onOpenFilePicker: () => void;
}

export const DocumentTabBar: React.FC<DocumentTabBarProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCloseFile,
  onRenameFile,
  onOpenNewFileModal,
  onSaveCurrentFile,
  onOpenFilePicker,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const startRename = (file: DocumentFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(file.id);
    setEditingName(file.name);
  };

  const finishRename = (fileId: string) => {
    if (editingName.trim()) {
      onRenameFile(fileId, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="bg-slate-800 text-slate-300 border-b border-slate-700/80 px-2 flex items-center justify-between select-none text-xs overflow-x-auto h-8.5">
      {/* Left: Open Document Tabs & + New File */}
      <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 pr-2">
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isEditing = editingId === file.id;

          return (
            <div
              key={file.id}
              onClick={() => {
                if (!isEditing) onSelectFile(file.id);
              }}
              title={`File: ${file.name}.gnote (${file.pages.length} page${file.pages.length > 1 ? 's' : ''}) - Double click to rename`}
              className={`group flex items-center gap-1.5 px-3 py-1 rounded-t-md transition-all cursor-pointer max-w-56 shrink-0 relative border-t-2 text-xs ${
                isActive
                  ? 'bg-slate-100 text-slate-900 border-indigo-500 font-semibold shadow-xs'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <FileText
                size={12}
                className={isActive ? 'text-indigo-600 shrink-0' : 'text-slate-500 shrink-0'}
              />

              {isEditing ? (
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editingName}
                    autoFocus
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishRename(file.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => finishRename(file.id)}
                    className="w-28 px-1 py-0.5 text-xs text-slate-900 bg-white border border-indigo-500 rounded outline-none font-medium"
                  />
                  <button
                    onClick={() => finishRename(file.id)}
                    className="text-emerald-600 hover:text-emerald-700 p-0.5"
                    title="Confirm rename"
                  >
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <span
                  onDoubleClick={(e) => startRename(file, e)}
                  className="truncate text-[11px] font-medium"
                  data-no-translate
                >
                  {file.name}
                  <span className="text-[10px] opacity-60 ml-0.5 font-normal">
                    ({file.pages.length}p)
                  </span>
                </span>
              )}

              {/* Rename button on hover */}
              {!isEditing && (
                <button
                  onClick={(e) => startRename(file, e)}
                  title="Rename document"
                  className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    isActive ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-700 text-slate-400'
                  }`}
                >
                  <Edit2 size={10} />
                </button>
              )}

              {/* Close Tab Button */}
              {files.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseFile(file.id);
                  }}
                  title="Close document tab"
                  className={`p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity ${
                    isActive
                      ? 'hover:bg-rose-100 hover:text-rose-600 text-slate-600'
                      : 'hover:bg-slate-700 text-slate-400'
                  }`}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}

        {/* Dedicated "+ New File" Button on the Tab Bar */}
        <button
          onClick={onOpenNewFileModal}
          title="Add a new file / document anytime (Ctrl+Alt+N)"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs transition-colors shadow-2xs shrink-0 ml-1"
        >
          <Plus size={13} strokeWidth={2.5} />
          <span className="text-[11px]">New File</span>
        </button>
      </div>

      {/* Right: Quick Document Actions (Open, Save .gnote) */}
      <div className="flex items-center gap-1 shrink-0 pl-2">
        <button
          onClick={onOpenFilePicker}
          title="Open saved document file (.gnote / JSON)"
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
        >
          <FolderOpen size={12} className="text-amber-400" />
          <span className="hidden md:inline">Open File</span>
        </button>

        <button
          onClick={onSaveCurrentFile}
          title="Save active document (.gnote)"
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
        >
          <Save size={12} className="text-emerald-400" />
          <span className="hidden md:inline">Save .gnote</span>
        </button>
      </div>
    </div>
  );
};
