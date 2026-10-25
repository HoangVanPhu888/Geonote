import React from 'react';
import { X, Sliders, Palette, Check } from 'lucide-react';
import { LineStyle } from '../types';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointSize: number;
  setPointSize: (size: number) => void;
  pointStyle: 'solid' | 'hollow' | 'cross' | 'plus';
  setPointStyle: (style: 'solid' | 'hollow' | 'cross' | 'plus') => void;
  pointColor: string;
  setPointColor: (color: string) => void;
  lineThickness: number;
  setLineThickness: (th: number) => void;
  lineStyle: LineStyle;
  setLineStyle: (style: LineStyle) => void;
  lineColor: string;
  setLineColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  pointSize,
  setPointSize,
  pointStyle,
  setPointStyle,
  pointColor,
  setPointColor,
  lineThickness,
  setLineThickness,
  lineStyle,
  setLineStyle,
  lineColor,
  setLineColor,
  fillColor,
  setFillColor,
}) => {
  if (!isOpen) return null;

  const colorPresets = [
    '#2563eb', // Blue
    '#dc2626', // Red
    '#16a34a', // Green
    '#d97706', // Amber
    '#9333ea', // Purple
    '#0f172a', // Slate/Black
    '#0891b2', // Cyan
    '#ec4899', // Pink
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md text-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-indigo-400" />
            <h3 className="font-semibold text-sm">Default Drawing Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* 1. Point Size Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-300 font-semibold">
              <span>Point Size</span>
              <span className="font-mono text-indigo-400 text-sm font-bold">{pointSize.toFixed(1)} px</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={pointSize}
              onChange={(e) => setPointSize(parseFloat(e.target.value))}
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

          <div className="h-px bg-slate-800" />

          {/* 2. Line Thickness Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-300 font-semibold">
              <span>Line Thickness</span>
              <span className="font-mono text-indigo-400 text-sm font-bold">{lineThickness.toFixed(1)} px</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={lineThickness}
              onChange={(e) => setLineThickness(parseFloat(e.target.value))}
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

          <div className="h-px bg-slate-800" />

          {/* 3. Color Palette */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-slate-300 font-semibold">
              <span>Color</span>
              <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
                <span className="w-3.5 h-3.5 rounded-full border border-slate-600" style={{ backgroundColor: pointColor }} />
                <span>{pointColor}</span>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 pt-1">
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
                    setPointColor(c);
                    setLineColor(c);
                  }}
                  className={`w-9 h-9 rounded-lg border-2 transition-transform hover:scale-110 shadow-xs cursor-pointer flex items-center justify-center ${
                    pointColor.toLowerCase() === c.toLowerCase() ? 'border-white ring-2 ring-indigo-400 scale-105' : 'border-slate-700/80 hover:border-slate-500'
                  }`}
                  title={`Color: ${c}`}
                >
                  {pointColor.toLowerCase() === c.toLowerCase() && <Check size={14} className="text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-400 text-[11px]">Custom Color:</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={pointColor}
                  onChange={(e) => {
                    setPointColor(e.target.value);
                    setLineColor(e.target.value);
                  }}
                  className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0"
                />
                <span className="font-mono text-slate-300 text-xs">{pointColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
