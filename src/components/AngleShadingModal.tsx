import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { GeoAngle } from '../geometry/engine';

interface AngleShadingModalProps {
  isOpen: boolean;
  angle: Partial<GeoAngle> | null;
  onSave: (style: GeoAngle['style'], label: string, color: string, fillColor: string, radius: number) => void;
  onClose: () => void;
}

export const AngleShadingModal: React.FC<AngleShadingModalProps> = ({
  isOpen,
  angle,
  onSave,
  onClose,
}) => {
  const [style, setStyle] = useState<GeoAngle['style']>(angle?.style || 'sector');
  const [label, setLabel] = useState(angle?.label || '60°');
  const [color, setColor] = useState(angle?.color || '#2563eb');
  const [fillColor, setFillColor] = useState(angle?.fillColor || 'rgba(37, 99, 235, 0.2)');
  const [radius, setRadius] = useState(angle?.radius || 35);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(style, label, color, fillColor, radius);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="font-semibold text-sm">Angle Settings</h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          {/* Shading Style */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Shading Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'sector', name: 'Solid Sector' },
                { id: 'hatch', name: 'Hatched Lines' },
                { id: 'arc', name: 'Single Arc' },
                { id: 'double-arc', name: 'Double Arc' },
                { id: 'right-angle', name: 'Right Angle ⦜' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStyle(opt.id as GeoAngle['style'])}
                  className={`px-2.5 py-2 text-xs rounded-lg border font-medium transition-all ${
                    style === opt.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Angle Label (or degree)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 60° or α or θ"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex gap-1.5 mt-1.5">
              {['30°', '45°', '60°', '90°', 'α', 'β', 'γ', 'θ'].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setLabel(sym)}
                  className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 rounded border border-slate-200"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Arc Radius */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
              <span>Arc Size / Radius</span>
              <span>{radius} px</span>
            </div>
            <input
              type="range"
              min="15"
              max="80"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Line / Arc Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
              />
            </div>
            {style === 'sector' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fill Tint</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFillColor('rgba(37, 99, 235, 0.2)')}
                    className="w-6 h-6 rounded bg-blue-500/20 border border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFillColor('rgba(239, 68, 68, 0.2)')}
                    className="w-6 h-6 rounded bg-red-500/20 border border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFillColor('rgba(34, 197, 94, 0.2)')}
                    className="w-6 h-6 rounded bg-green-500/20 border border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFillColor('rgba(234, 179, 8, 0.2)')}
                    className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5"
          >
            <Check size={16} /> Apply Angle Shading
          </button>
        </div>
      </div>
    </div>
  );
};
