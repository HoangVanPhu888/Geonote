import React, { useState } from 'react';
import { X, Calculator, Ruler, Copy, Check, Plus, Equal, Delete } from 'lucide-react';
import { PageData } from '../types';
import { dist, polygonArea } from '../geometry/engine';

// Standard A4 dimensions: 21.0 cm x 29.7 cm at 794px width (96 DPI)
export const PX_TO_CM = 21.0 / 794; // ~0.02644836 cm/px
export const CM_TO_PX = 794 / 21.0; // ~37.8095 px/cm

interface MeasureCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: PageData;
  activePageIndex: number;
  onAddLatexItem?: (latex: string) => void;
  initialTab?: 'measure' | 'calculator';
  measureType?: 'length' | 'angle' | 'circumference' | 'area';
}

export const MeasureCalculatorModal: React.FC<MeasureCalculatorModalProps> = ({
  isOpen,
  onClose,
  page,
  onAddLatexItem,
  initialTab = 'measure',
  measureType = 'length',
}) => {
  const [activeTab, setActiveTab] = useState<'measure' | 'calculator'>(initialTab);
  const [selectedMeasure, setSelectedMeasure] = useState<'length' | 'angle' | 'circumference' | 'area'>(measureType);

  // Measure selection state
  // 4.2: Origin is chosen FIRST, then ray 1, then ray 2
  const [originPoint, setOriginPoint] = useState<string>(page.points[0]?.id || '');
  const [selectedPoint1, setSelectedPoint1] = useState<string>(page.points[0]?.id || '');
  const [selectedPoint2, setSelectedPoint2] = useState<string>(page.points[1]?.id || '');
  const [selectedCircle, setSelectedCircle] = useState<string>(page.circles[0]?.id || '');
  const [selectedPolygon, setSelectedPolygon] = useState<string>(page.polygons[0]?.id || '');
  const [copied, setCopied] = useState<boolean>(false);

  // Calculator state
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [calcFormula, setCalcFormula] = useState<string>('');

  if (!isOpen) return null;

  // Measurement calculations
  const ptOrigin = page.points.find((p) => p.id === originPoint);
  const pt1 = page.points.find((p) => p.id === selectedPoint1);
  const pt2 = page.points.find((p) => p.id === selectedPoint2);
  const curCirc = page.circles.find((c) => c.id === selectedCircle);
  const curPoly = page.polygons.find((pl) => pl.id === selectedPolygon);

  let measureResult = '';
  let measureLatex = '';
  let numericMeasureVal = 0;

  // 4.1. Distance should be calculated based on the unit cm (choosing 2 points and measure their distance)
  if (selectedMeasure === 'length') {
    if (pt1 && pt2) {
      const lenPx = dist(pt1, pt2);
      const lenCm = lenPx * PX_TO_CM;
      const name = `${pt1.name}${pt2.name}`;
      numericMeasureVal = lenCm;
      measureResult = `d(${name}) = ${lenCm.toFixed(3)} cm (${lenPx.toFixed(1)} px)`;
      measureLatex = `d(${name}) = ${lenCm.toFixed(2)}\\text{ cm}`;
    }
  }
  // 4.2. Angle should be based on the unit degree. works by choosing 3 points (first by choosing the origin, then the 2 points forming the ray.)
  else if (selectedMeasure === 'angle') {
    if (ptOrigin && pt1 && pt2) {
      const v1 = { x: pt1.x - ptOrigin.x, y: pt1.y - ptOrigin.y };
      const v2 = { x: pt2.x - ptOrigin.x, y: pt2.y - ptOrigin.y };
      const len1 = Math.hypot(v1.x, v1.y);
      const len2 = Math.hypot(v2.x, v2.y);
      if (len1 > 1e-6 && len2 > 1e-6) {
        const dot = v1.x * v2.x + v1.y * v2.y;
        const cosTheta = Math.max(-1, Math.min(1, dot / (len1 * len2)));
        const deg = (Math.acos(cosTheta) * 180) / Math.PI;
        numericMeasureVal = deg;
        measureResult = `∠(${pt1.name}-${ptOrigin.name}-${pt2.name}) [Origin: ${ptOrigin.name}] = ${deg.toFixed(2)}°`;
        measureLatex = `\\angle ${pt1.name}${ptOrigin.name}${pt2.name} = ${deg.toFixed(2)}^{\\circ}`;
      } else {
        measureResult = 'Select distinct points';
      }
    }
  }
  // 4.3. Circumference works by choosing a closed simple object and measure the length of their bound in cm.
  else if (selectedMeasure === 'circumference') {
    if (curCirc) {
      const cCm = 2 * Math.PI * (curCirc.radius * PX_TO_CM);
      const name = curCirc.name || 'Circle';
      numericMeasureVal = cCm;
      measureResult = `Circumference(${name}) = 2π·R = ${cCm.toFixed(3)} cm`;
      measureLatex = `C(${name}) = 2\\pi R = ${cCm.toFixed(2)}\\text{ cm}`;
    } else if (curPoly && curPoly.points.length >= 3) {
      let perimPx = 0;
      for (let i = 0; i < curPoly.points.length; i++) {
        const pA = curPoly.points[i];
        const pB = curPoly.points[(i + 1) % curPoly.points.length];
        perimPx += dist(pA, pB);
      }
      const perimCm = perimPx * PX_TO_CM;
      const name = curPoly.name || `Polygon(${curPoly.points.length})`;
      numericMeasureVal = perimCm;
      measureResult = `Circumference(${name}) = ${perimCm.toFixed(3)} cm`;
      measureLatex = `\\text{Perimeter}(${name}) = ${perimCm.toFixed(2)}\\text{ cm}`;
    }
  }
  // 4.4. Area works by choosing a closed simple object and measure the area of the region bounded by that object in cm².
  else if (selectedMeasure === 'area') {
    if (curPoly && curPoly.points.length >= 3) {
      const areaPx2 = polygonArea(curPoly.points);
      const areaCm2 = areaPx2 * PX_TO_CM * PX_TO_CM;
      const name = curPoly.name || `Polygon(${curPoly.points.length})`;
      numericMeasureVal = areaCm2;
      measureResult = `Area(${name}) = ${areaCm2.toFixed(3)} cm²`;
      measureLatex = `\\text{Area}(${name}) = ${areaCm2.toFixed(2)}\\text{ cm}^2`;
    } else if (curCirc) {
      const rCm = curCirc.radius * PX_TO_CM;
      const areaCm2 = Math.PI * rCm * rCm;
      const name = curCirc.name || 'Circle';
      numericMeasureVal = areaCm2;
      measureResult = `Area(${name}) = π·R² = ${areaCm2.toFixed(3)} cm²`;
      measureLatex = `\\text{Area}(${name}) = \\pi R^2 = ${areaCm2.toFixed(2)}\\text{ cm}^2`;
    }
  }

  // Pre-generate available measurements for calculator insertion
  const availableMeasures: { label: string; value: number; unit: string }[] = [];
  // 1. Distances between adjacent points
  if (page.points.length >= 2) {
    for (let i = 0; i < Math.min(6, page.points.length); i++) {
      for (let j = i + 1; j < Math.min(6, page.points.length); j++) {
        const pA = page.points[i];
        const pB = page.points[j];
        const dCm = dist(pA, pB) * PX_TO_CM;
        availableMeasures.push({
          label: `d(${pA.name}, ${pB.name})`,
          value: Number(dCm.toFixed(3)),
          unit: 'cm',
        });
      }
    }
  }
  // 2. Circumference of circles
  page.circles.forEach((c) => {
    const cCm = 2 * Math.PI * (c.radius * PX_TO_CM);
    availableMeasures.push({
      label: `Circum(${c.name || 'Circle'})`,
      value: Number(cCm.toFixed(3)),
      unit: 'cm',
    });
    const aCm2 = Math.PI * Math.pow(c.radius * PX_TO_CM, 2);
    availableMeasures.push({
      label: `Area(${c.name || 'Circle'})`,
      value: Number(aCm2.toFixed(3)),
      unit: 'cm²',
    });
  });
  // 3. Polygons
  page.polygons.forEach((poly) => {
    let perimPx = 0;
    for (let i = 0; i < poly.points.length; i++) {
      perimPx += dist(poly.points[i], poly.points[(i + 1) % poly.points.length]);
    }
    const perimCm = perimPx * PX_TO_CM;
    const aCm2 = polygonArea(poly.points) * PX_TO_CM * PX_TO_CM;
    const name = poly.name || 'Poly';
    availableMeasures.push({
      label: `Circum(${name})`,
      value: Number(perimCm.toFixed(3)),
      unit: 'cm',
    });
    availableMeasures.push({
      label: `Area(${name})`,
      value: Number(aCm2.toFixed(3)),
      unit: 'cm²',
    });
  });

  // Calculator input
  const handleCalcInput = (char: string) => {
    if (calcDisplay === '0' || calcDisplay === 'Error') {
      setCalcDisplay(char);
    } else {
      setCalcDisplay((prev) => prev + char);
    }
  };

  const handleInsertMeasureIntoCalc = (val: number) => {
    if (calcDisplay === '0' || calcDisplay === 'Error') {
      setCalcDisplay(String(val));
    } else {
      const lastChar = calcDisplay.slice(-1);
      const isOperator = ['+', '-', '×', '÷', '*', '/', '('].includes(lastChar);
      setCalcDisplay((prev) => (isOperator ? prev + val : prev + '+' + val));
    }
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcFormula('');
  };

  const handleCalcEval = () => {
    try {
      let expr = calcDisplay
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin((Math.PI/180)*')
        .replace(/cos\(/g, 'Math.cos((Math.PI/180)*')
        .replace(/tan\(/g, 'Math.tan((Math.PI/180)*')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/\^/g, '**');

      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expr});`)();
      setCalcFormula(calcDisplay + ' =');
      setCalcDisplay(String(Number(result.toFixed(6))));
    } catch {
      setCalcDisplay('Error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg text-slate-100 overflow-hidden flex flex-col">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('measure')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'measure'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Ruler size={14} />
              <span>Measure (cm & deg)</span>
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calculator size={14} />
              <span>Calculator with Measures</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab 1: Measure Mode */}
        {activeTab === 'measure' && (
          <div className="p-4 space-y-4">
            {/* Measure Type Selectors */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/50 text-center">
              {(['length', 'angle', 'circumference', 'area'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMeasure(m)}
                  className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                    selectedMeasure === m
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'length' ? 'Distance (cm)' : m === 'angle' ? 'Angle (°)' : m === 'circumference' ? 'Circumference (cm)' : 'Area (cm²)'}
                </button>
              ))}
            </div>

            {/* Selection Form */}
            {selectedMeasure === 'length' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">4.1 Distance:</span> Measure distance between 2 points in centimeters (cm). Default page is 21.0 cm × 29.7 cm.
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Point 1</label>
                    <select
                      value={selectedPoint1}
                      onChange={(e) => setSelectedPoint1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                    >
                      {page.points.map((p) => (
                        <option key={p.id} value={p.id}>Point {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Point 2</label>
                    <select
                      value={selectedPoint2}
                      onChange={(e) => setSelectedPoint2(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                    >
                      {page.points.map((p) => (
                        <option key={p.id} value={p.id}>Point {p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {selectedMeasure === 'angle' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">4.2 Angle:</span> Based on degrees (°). Choosing 3 points (first by choosing the origin, then the 2 points forming the ray).
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-amber-300 mb-0.5 font-bold uppercase">1. Origin (Vertex)</label>
                    <select
                      value={originPoint}
                      onChange={(e) => setOriginPoint(e.target.value)}
                      className="w-full bg-slate-800 border border-amber-500 rounded-lg px-2 py-1.5 text-xs text-amber-200 font-mono font-bold"
                    >
                      {page.points.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5 font-bold uppercase">2. Ray 1</label>
                    <select
                      value={selectedPoint1}
                      onChange={(e) => setSelectedPoint1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono"
                    >
                      {page.points.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5 font-bold uppercase">3. Ray 2</label>
                    <select
                      value={selectedPoint2}
                      onChange={(e) => setSelectedPoint2(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono"
                    >
                      {page.points.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {selectedMeasure === 'circumference' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">4.3 Circumference:</span> Length of the boundary of a closed simple object in centimeters (cm).
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Select Closed Object (Circle or Polygon)</label>
                  <select
                    value={selectedCircle || selectedPolygon}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (page.circles.some((c) => c.id === id)) {
                        setSelectedCircle(id);
                        setSelectedPolygon('');
                      } else {
                        setSelectedPolygon(id);
                        setSelectedCircle('');
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <optgroup label="Circles">
                      {page.circles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || 'Circle'} (R = {(c.radius * PX_TO_CM).toFixed(2)} cm)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Polygons">
                      {page.polygons.map((poly) => (
                        <option key={poly.id} value={poly.id}>
                          {poly.name || `Polygon (${poly.points.length} vertices)`}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            )}

            {selectedMeasure === 'area' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">4.4 Area:</span> Area of the region bounded by a closed simple object in square centimeters (cm²).
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Select Closed Object (Polygon or Circle)</label>
                  <select
                    value={selectedPolygon || selectedCircle}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (page.polygons.some((pl) => pl.id === id)) {
                        setSelectedPolygon(id);
                        setSelectedCircle('');
                      } else {
                        setSelectedCircle(id);
                        setSelectedPolygon('');
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <optgroup label="Polygons">
                      {page.polygons.map((poly) => (
                        <option key={poly.id} value={poly.id}>
                          {poly.name || `Polygon (${poly.points.length} vertices)`}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Circles">
                      {page.circles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || 'Circle'} (R = {(c.radius * PX_TO_CM).toFixed(2)} cm)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            )}

            {/* Result Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Computed Measurement</span>
              <div className="font-mono text-base font-bold text-amber-300 truncate">
                {measureResult || 'Select elements above'}
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <button
                  disabled={!measureResult}
                  onClick={() => copyToClipboard(measureResult)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {numericMeasureVal > 0 && (
                  <button
                    onClick={() => {
                      handleInsertMeasureIntoCalc(Number(numericMeasureVal.toFixed(3)));
                      setActiveTab('calculator');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <Calculator size={12} />
                    <span>Send to Calculator</span>
                  </button>
                )}
                {onAddLatexItem && (
                  <button
                    disabled={!measureLatex}
                    onClick={() => {
                      onAddLatexItem(measureLatex);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white disabled:opacity-40 transition-colors shadow-xs ml-auto cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add to Document</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Scientific Calculator (Rule 4.5) */}
        {activeTab === 'calculator' && (
          <div className="p-4 space-y-3">
            {/* Display */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-right">
              <div className="text-slate-500 text-xs font-mono h-4 truncate">{calcFormula}</div>
              <div className="text-2xl font-mono font-bold text-emerald-400 truncate tracking-wide mt-1">
                {calcDisplay}
              </div>
            </div>

            {/* Rule 4.5: Clickable Measurements to incorporate into calculations */}
            {availableMeasures.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold">
                  <span>Click Measure to Incorporate:</span>
                  <span className="text-indigo-400 text-[10px]">Rule 4.5</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-950/50 rounded-lg border border-slate-800">
                  {availableMeasures.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleInsertMeasureIntoCalc(m.value)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-[11px] font-mono border border-slate-700/80 transition-colors cursor-pointer"
                      title={`Click to insert ${m.value} into calculation`}
                    >
                      <span>{m.label}: </span>
                      <span className="font-bold text-amber-300">{m.value}</span>
                      <span className="text-[10px] text-slate-400 ml-0.5">{m.unit}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calculator Keypad */}
            <div className="grid grid-cols-4 gap-1.5 font-mono text-xs font-semibold">
              <button onClick={handleCalcClear} className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 cursor-pointer">C</button>
              <button onClick={() => setCalcDisplay((p) => p.length > 1 ? p.slice(0, -1) : '0')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"><Delete size={14} className="mx-auto" /></button>
              <button onClick={() => handleCalcInput('(')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 cursor-pointer">(</button>
              <button onClick={() => handleCalcInput(')')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 cursor-pointer">)</button>

              <button onClick={() => handleCalcInput('sin(')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 cursor-pointer">sin</button>
              <button onClick={() => handleCalcInput('cos(')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 cursor-pointer">cos</button>
              <button onClick={() => handleCalcInput('tan(')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 cursor-pointer">tan</button>
              <button onClick={() => handleCalcInput('÷')} className="p-2 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 cursor-pointer font-bold">÷</button>

              <button onClick={() => handleCalcInput('sqrt(')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 cursor-pointer">√</button>
              <button onClick={() => handleCalcInput('^')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 cursor-pointer">xʸ</button>
              <button onClick={() => handleCalcInput('π')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 cursor-pointer">π</button>
              <button onClick={() => handleCalcInput('×')} className="p-2 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 cursor-pointer font-bold">×</button>

              {['7', '8', '9'].map((n) => (
                <button key={n} onClick={() => handleCalcInput(n)} className="p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-sm cursor-pointer">{n}</button>
              ))}
              <button onClick={() => handleCalcInput('-')} className="p-2 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 font-bold cursor-pointer">-</button>

              {['4', '5', '6'].map((n) => (
                <button key={n} onClick={() => handleCalcInput(n)} className="p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-sm cursor-pointer">{n}</button>
              ))}
              <button onClick={() => handleCalcInput('+')} className="p-2 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 font-bold cursor-pointer">+</button>

              {['1', '2', '3'].map((n) => (
                <button key={n} onClick={() => handleCalcInput(n)} className="p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-sm cursor-pointer">{n}</button>
              ))}
              <button onClick={handleCalcEval} className="row-span-2 p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center shadow-lg cursor-pointer"><Equal size={18} /></button>

              <button onClick={() => handleCalcInput('0')} className="col-span-2 p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-sm cursor-pointer">0</button>
              <button onClick={() => handleCalcInput('.')} className="p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-sm cursor-pointer">.</button>
            </div>

            {onAddLatexItem && (
              <button
                onClick={() => {
                  if (calcDisplay && calcDisplay !== 'Error') {
                    onAddLatexItem(calcFormula ? `${calcFormula} ${calcDisplay}` : calcDisplay);
                    onClose();
                  }
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                Insert Calculation into Document
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
