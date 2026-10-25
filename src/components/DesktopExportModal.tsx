import React, { useState } from 'react';
import { X, Download, Terminal, CheckCircle2, ShieldCheck, Monitor } from 'lucide-react';

interface DesktopExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopExportModal: React.FC<DesktopExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'electron'>('pwa');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const electronCode = `@echo off
echo ============================================================
echo   Building GeoNote Studio Windows Desktop Executable (.exe)
echo ============================================================
call npm install --save-dev electron electron-builder
call npm run build
call npx electron-builder --win --x64
echo.
echo Build complete! Look in the 'dist' folder for GeoNote-Setup.exe
pause
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(electronCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBatch = () => {
    const blob = new Blob([electronCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'build-windows-exe.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Title */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="text-cyan-400" size={18} />
            <h3 className="font-semibold text-sm">Windows Desktop Application (.exe) Hub</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close desktop modal"
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex border-b border-slate-200 gap-4">
            <button
              onClick={() => setActiveTab('pwa')}
              className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'pwa'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Method 1: Windows Desktop PWA (Immediate .exe)
            </button>
            <button
              onClick={() => setActiveTab('electron')}
              className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'electron'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Method 2: Standalone .exe Installer (Electron)
            </button>
          </div>

          {activeTab === 'pwa' ? (
            <div className="space-y-3 text-sm text-slate-700">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-3">
                <ShieldCheck className="text-indigo-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-indigo-950 text-xs">Direct Native Windows App</h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    This studio includes Windows Desktop App manifests. You can install it immediately as an independent Windows window on your Desktop & Taskbar with zero browser frame.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs flex items-center justify-center font-bold shrink-0">1</span>
                  <p className="text-xs">
                    In your browser (Microsoft Edge or Google Chrome), look at the address bar on the right.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs flex items-center justify-center font-bold shrink-0">2</span>
                  <p className="text-xs">
                    Click the <strong>"App available. Install GeoNote Studio"</strong> icon (or menu → Apps → Install this site as an app).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs flex items-center justify-center font-bold shrink-0">3</span>
                  <p className="text-xs">
                    Windows creates a desktop shortcut and a registered <code>.exe</code> running in standalone app mode!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1.5 text-amber-900">
                <span className="font-semibold block flex items-center gap-1.5 text-amber-800">
                  ⚠️ Note About the ~10 KB Download:
                </span>
                <p className="text-[11px] leading-relaxed">
                  When downloading source archives from AI Studio / Git, only raw text code files (~10 KB) are included; 150+ MB binary <code>.exe</code> files are omitted from git repositories.
                </p>
                <p className="text-[11px] font-medium text-amber-950">
                  To turn your extracted 10 KB folder into a working desktop app on Windows, simply double-click <strong><code>run-windows.bat</code></strong> or <strong><code>make-exe.bat</code></strong>!
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                <span className="font-semibold text-slate-800 block">⚡ Two Quick Windows Launch Options:</span>
                <div className="text-[11px] space-y-1.5 text-slate-700">
                  <div className="p-2 bg-white border border-slate-200 rounded">
                    <span className="text-emerald-700 font-bold block">1. Instant Desktop Launch (Recommended):</span>
                    Double-click <code>run-windows.bat</code>. It installs dependencies and opens the desktop app in a native Windows window immediately.
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded">
                    <span className="text-indigo-700 font-bold block">2. Compile Standalone GeoNote Studio.exe:</span>
                    Double-click <code>make-exe.bat</code>. It compiles a standalone <code>GeoNote Studio.exe</code> into <code>dist-electron\win-unpacked\</code>.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
