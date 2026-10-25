import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';

export interface TextFormatting {
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

const DEFAULT_TEXT_FORMATTING: TextFormatting = {
  fontFamily: 'Euclid, "Euclid Math One", Cambria, serif',
  bold: false,
  italic: false,
  underline: false,
};

interface LatexModalProps {
  isOpen: boolean;
  initialLatex: string;
  initialFontSize?: number;
  initialColor?: string;
  initialFormatting?: Partial<TextFormatting>;
  onSave: (text: string, fontSize: number, color: string, formatting: TextFormatting) => void;
  onClose: () => void;
}

const MATH_PRESETS = [
  { label: 'Fraction', latex: '\\frac{a}{b}' },
  { label: 'Square Root', latex: '\\sqrt{x}' },
  { label: 'n-th Root', latex: '\\sqrt[n]{x}' },
  { label: 'Triangle', latex: '\\triangle ABC' },
  { label: 'Angle', latex: '\\angle ABC = 60^\\circ' },
  { label: 'Perpendicular', latex: 'AB \\perp CD' },
  { label: 'Parallel', latex: 'AB \\parallel CD' },
  { label: 'Circle', latex: '\\odot(O, R)' },
  { label: 'Vector', latex: '\\vec{v} = \\overrightarrow{AB}' },
  { label: 'Alpha', latex: '\\alpha' },
  { label: 'Beta', latex: '\\beta' },
  { label: 'Theta', latex: '\\theta' },
  { label: 'Pi', latex: '\\pi' },
  { label: 'Ellipse Eq', latex: '\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1' },
  { label: 'Hyperbola Eq', latex: '\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1' },
  { label: 'Parabola Eq', latex: 'y^2 = 2px' },
  { label: 'Incircle Radius', latex: 'r = \\frac{S}{p}' },
  { label: 'Circumcircle Radius', latex: 'R = \\frac{abc}{4S}' },
  { label: 'Euler Line', latex: '\\overrightarrow{OH} = 3\\overrightarrow{OG}' },
  { label: 'Radical Axis', latex: 'd_1^2 - r_1^2 = d_2^2 - r_2^2' },
];

export const LatexModal: React.FC<LatexModalProps> = ({
  isOpen,
  initialLatex,
  initialFontSize = 18,
  initialColor = '#1e293b',
  initialFormatting = DEFAULT_TEXT_FORMATTING,
  onSave,
  onClose,
}) => {
  const initialFontFamily = initialFormatting.fontFamily;
  const initialBold = initialFormatting.bold;
  const initialItalic = initialFormatting.italic;
  const initialUnderline = initialFormatting.underline;
  const [latex, setLatex] = useState(initialLatex || '\\triangle ABC');
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [color, setColor] = useState(initialColor);
  const [formatting, setFormatting] = useState<TextFormatting>({
    ...DEFAULT_TEXT_FORMATTING,
    fontFamily: initialFontFamily || DEFAULT_TEXT_FORMATTING.fontFamily,
    bold: initialBold ?? DEFAULT_TEXT_FORMATTING.bold,
    italic: initialItalic ?? DEFAULT_TEXT_FORMATTING.italic,
    underline: initialUnderline ?? DEFAULT_TEXT_FORMATTING.underline,
  });

  useEffect(() => {
    if (isOpen) {
      setLatex(initialLatex || '\\triangle ABC');
      setFontSize(initialFontSize || 18);
      setColor(initialColor || '#1e293b');
      setFormatting({
        fontFamily: initialFontFamily || DEFAULT_TEXT_FORMATTING.fontFamily,
        bold: initialBold ?? DEFAULT_TEXT_FORMATTING.bold,
        italic: initialItalic ?? DEFAULT_TEXT_FORMATTING.italic,
        underline: initialUnderline ?? DEFAULT_TEXT_FORMATTING.underline,
      });
    }
  }, [isOpen, initialLatex, initialFontSize, initialColor, initialFontFamily, initialBold, initialItalic, initialUnderline]);

  if (!isOpen) return null;

  const insertSnippet = (snippet: string) => {
    setLatex((prev) => (prev ? `${prev} ${snippet}` : snippet));
  };

  const handleSave = () => {
    if (latex.trim()) {
      onSave(latex.trim(), fontSize, color, formatting);
      onClose();
    }
  };

  const toggleFormatting = (key: 'bold' | 'italic' | 'underline') => {
    setFormatting((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 p-1.5 rounded-md font-mono text-xs font-bold">
              TeX
            </span>
            <h3 className="font-semibold text-sm tracking-wide">Text & Formula Editor</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close LaTeX dialog"
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Input text area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Text
            </label>
            <textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              onKeyDown={(event) => {
                if (!(event.ctrlKey || event.metaKey)) return;
                const key = event.key.toLowerCase();
                if (key === 'b' || key === 'i' || key === 'u') {
                  event.preventDefault();
                  toggleFormatting(key === 'b' ? 'bold' : key === 'i' ? 'italic' : 'underline');
                }
              }}
              rows={3}
              placeholder="Enter text or a formula"
              style={{
                fontFamily: formatting.fontFamily,
                fontWeight: formatting.bold ? 700 : 400,
                fontStyle: formatting.italic ? 'italic' : 'normal',
                textDecoration: formatting.underline ? 'underline' : 'none',
              }}
              className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            {([
              ['bold', 'Bold (Ctrl+B)', <strong>B</strong>],
              ['italic', 'Italic (Ctrl+I)', <em>I</em>],
              ['underline', 'Underline (Ctrl+U)', <u>U</u>],
            ] as const).map(([key, title, label]) => (
              <button
                key={key}
                type="button"
                title={title}
                aria-pressed={formatting[key]}
                onClick={() => toggleFormatting(key)}
                className={`w-8 h-8 rounded border text-sm ${
                  formatting[key] ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
            <span className="text-xs text-slate-500">Euclid font · Ctrl+B / Ctrl+I / Ctrl+U</span>
          </div>

          {/* Quick presets for geometry and mathematics */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-600">
              <Sparkles size={13} className="text-amber-500" />
              <span>Quick Mathematical & Geometric Symbols:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
              {MATH_PRESETS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => insertSnippet(item.latex)}
                  className="text-xs bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors shadow-2xs font-mono"
                  title={item.latex}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font size & Color */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Font Size ({fontSize}px)
              </label>
              <input
                type="range"
                min="12"
                max="48"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Formula Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-md border border-slate-300 cursor-pointer p-0.5"
                />
                <span className="text-xs font-mono text-slate-500">{color}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!latex.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} /> Place on Canvas
          </button>
        </div>
      </div>
    </div>
  );
};
