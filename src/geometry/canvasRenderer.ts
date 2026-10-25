import { PageData, LineStyle, GeoLocus } from '../types';
import {
  Point2D,
  GeoPoint,
  GeoLine,
  GeoCircle,
  GeoAngle,
  GeoConic,
  GeoPolygon,
  getEllipse2Foci,
  getParabolaFocusDirectrix,
  getHyperbola2Foci,
  getIsogonalLine,
  rotatePoint,
  dist,
  getCircumcenter,
  perpendicularBisector,
} from './engine';

const CHOICE_OPTION_NAMES = new Set([
  'ellipse (5-pt)',
  'ellipse',
  'parabola',
  'parabola (5-pt)',
  'hyperbola',
  'hyperbola (5-pt)',
  'circle',
  'line',
  'segment',
  'ray',
  'directrix',
  'inverted circle',
  'inverted line',
  'circumcircle',
  'incircle',
  'excircle',
  'euler-line',
  'euler-circle',
  'euler line',
  'euler circle',
  'mixtilinear incircle',
  'mixtilinear excircle',
  'radical axis',
  'polar line',
  'polygon',
]);

export function isUserDefinedLabel(name?: string): boolean {
  if (!name || !name.trim()) return false;
  const lower = name.trim().toLowerCase();
  if (CHOICE_OPTION_NAMES.has(lower)) return false;
  if (lower.startsWith('inversion of') || lower.startsWith('inverted ')) return false;
  if (lower.endsWith('(5-pt)') || lower.endsWith('(2 foci + 1 point)')) return false;
  return true;
}

export function applyLineDash(ctx: CanvasRenderingContext2D, style: LineStyle, scale = 1) {
  switch (style) {
    case 'dash':
      ctx.setLineDash([8 * scale, 5 * scale]);
      break;
    case 'dash-dot':
      ctx.setLineDash([9 * scale, 3 * scale, 2 * scale, 3 * scale]);
      break;
    case 'dash-2dot':
      ctx.setLineDash([9 * scale, 3 * scale, 2 * scale, 2 * scale, 2 * scale, 3 * scale]);
      break;
    case 'dotted':
      ctx.setLineDash([2 * scale, 3 * scale]);
      break;
    case 'solid':
    default:
      ctx.setLineDash([]);
      break;
  }
}

export function drawPaperBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridType: 'blank' | 'ruled' | 'grid' | 'dots' = 'grid',
  scale = 1,
  backgroundColor = '#ffffff'
) {
  ctx.fillStyle = backgroundColor === '#80f4cd' || backgroundColor === '#e8f5e9'
    ? '#fff3e0'
    : backgroundColor;
  ctx.fillRect(0, 0, width, height);

  if (gridType === 'blank') return;

  const step = 25 * scale;
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#e2e8f0';

  if (gridType === 'grid') {
    ctx.beginPath();
    for (let x = step; x < width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = step; y < height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  } else if (gridType === 'ruled') {
    ctx.beginPath();
    for (let y = step; y < height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  } else if (gridType === 'dots') {
    ctx.fillStyle = '#cbd5e1';
    for (let x = step; x < width; x += step) {
      for (let y = step; y < height; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

/**
 * Render mathematical labels with proper subscript support (e.g. A[B] -> A with subscript B)
 */
export function renderMathLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  isSelected = false,
  scale = 1
): { width: number; height: number } {
  ctx.save();
  ctx.fillStyle = color;

  // Regex to match base label and subscript in brackets or underscore:
  // e.g. "A[B]", "P[1]", "F[2]", "A_B", "T_{1}"
  const match = text.match(/^([^\[_]+)(?:\[([^\]]+)\]|_\{?([^}]+)\}?)$/);

  let totalWidth = 0;
  if (match) {
    const base = match[1];
    const sub = match[2] || match[3];

    ctx.font = `italic ${fontSize}px "Times New Roman", Times, serif`;
    const baseW = ctx.measureText(base).width;
    ctx.fillText(base, x, y);

    const subFontSize = Math.max(8, fontSize * 0.72);
    ctx.font = `italic ${subFontSize}px "Times New Roman", Times, serif`;
    const subW = ctx.measureText(sub).width;
    const subY = y + fontSize * 0.32;
    ctx.fillText(sub, x + baseW + 1 * scale, subY);

    totalWidth = baseW + subW + 1 * scale;
  } else {
    ctx.font = `italic ${fontSize}px "Times New Roman", Times, serif`;
    ctx.fillText(text, x, y);
    totalWidth = ctx.measureText(text).width;
  }

  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1 * scale;
    ctx.setLineDash([2 * scale, 2 * scale]);
    ctx.strokeRect(x - 2 * scale, y - fontSize + 2 * scale, totalWidth + 4 * scale, fontSize + 4 * scale);
    ctx.restore();
  }

  ctx.restore();
  return { width: totalWidth, height: fontSize };
}

export function drawPoint(
  ctx: CanvasRenderingContext2D,
  pt: GeoPoint,
  scale = 1,
  isSelected = false,
  isHovered = false,
  showHidden = false
) {
  if (pt.hidden && !showHidden) return;
  ctx.save();

  if (pt.hidden && showHidden) {
    ctx.globalAlpha = 0.35;
  }

  const x = pt.x * scale;
  const y = pt.y * scale;
  const r = Math.max(0.5, pt.size * scale);

  // Outer highlight ring for selected or hovered points (Item 4: red dashed boundary)
  if (isSelected || isHovered) {
    ctx.beginPath();
    ctx.arc(x, y, (r + 4.5) * scale, 0, Math.PI * 2);
    ctx.strokeStyle = isSelected ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.setLineDash([4 * scale, 3 * scale]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.strokeStyle = isSelected ? '#ef4444' : pt.color;
  ctx.fillStyle = pt.color;
  ctx.lineWidth = Math.max(0.5, pt.size * 0.5 * scale);
  ctx.setLineDash([]);

  if (pt.style === 'solid') {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (isSelected) {
      ctx.lineWidth = 2 * scale;
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();
    }
  } else if (pt.style === 'hollow') {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
  } else if (pt.style === 'cross') {
    const s = r + 2 * scale;
    ctx.beginPath();
    ctx.moveTo(x - s, y - s);
    ctx.lineTo(x + s, y + s);
    ctx.moveTo(x + s, y - s);
    ctx.lineTo(x - s, y + s);
    ctx.stroke();
  } else if (pt.style === 'plus') {
    const s = r + 2 * scale;
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.lineTo(x + s, y);
    ctx.moveTo(x, y - s);
    ctx.lineTo(x, y + s);
    ctx.stroke();
  }

  // Label
  if (pt.name && pt.showLabel !== false) {
    const defaultDx = (r + 4) * scale;
    const defaultDy = -4 * scale;
    const lx = x + (pt.labelOffset ? pt.labelOffset.x * scale : defaultDx);
    const ly = y + (pt.labelOffset ? pt.labelOffset.y * scale : defaultDy);
    const fontSize = Math.max(12, 14 * scale);

    renderMathLabel(ctx, pt.name, lx, ly, fontSize, isSelected ? '#dc2626' : '#1e293b', isSelected, scale);
  }

  ctx.restore();
}

export function drawLine(ctx: CanvasRenderingContext2D, line: GeoLine, scale = 1, isSelected = false, showHidden = false) {
  if (line.hidden && !showHidden) return;
  ctx.save();

  if (line.hidden && showHidden) {
    ctx.globalAlpha = 0.35;
  }

  // Item 4: Red dashed boundary when selected
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = Math.max(2, 2.5 * scale);
    ctx.setLineDash([6 * scale, 4 * scale]);
    ctx.beginPath();
    if (line.isInfinite) {
      const dx = line.p2.x - line.p1.x;
      const dy = line.p2.y - line.p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      ctx.moveTo((line.p1.x - ux * 4000) * scale, (line.p1.y - uy * 4000) * scale);
      ctx.lineTo((line.p1.x + ux * 4000) * scale, (line.p1.y + uy * 4000) * scale);
    } else {
      ctx.moveTo(line.p1.x * scale, line.p1.y * scale);
      ctx.lineTo(line.p2.x * scale, line.p2.y * scale);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = line.color;
  ctx.lineWidth = Math.max(0.5, line.thickness * scale);
  applyLineDash(ctx, line.style, scale);

  ctx.beginPath();
  if (line.isInfinite) {
    // Extend across bounds
    const dx = line.p2.x - line.p1.x;
    const dy = line.p2.y - line.p1.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    ctx.moveTo((line.p1.x - ux * 4000) * scale, (line.p1.y - uy * 4000) * scale);
    ctx.lineTo((line.p1.x + ux * 4000) * scale, (line.p1.y + uy * 4000) * scale);
  } else {
    ctx.moveTo(line.p1.x * scale, line.p1.y * scale);
    ctx.lineTo(line.p2.x * scale, line.p2.y * scale);
  }
  ctx.stroke();

  // Draw line name label if custom user-defined label or name exists
  if (line.name && line.showLabel !== false && (isUserDefinedLabel(line.name) || isSelected)) {
    const midX = ((line.p1.x + line.p2.x) / 2) * scale;
    const midY = ((line.p1.y + line.p2.y) / 2) * scale;
    const lx = midX + (line.labelOffset ? line.labelOffset.x * scale : 6 * scale);
    const ly = midY + (line.labelOffset ? line.labelOffset.y * scale : -6 * scale);
    const fontSize = Math.max(10, 13 * scale);

    renderMathLabel(ctx, line.name, lx, ly, fontSize, isSelected ? '#dc2626' : '#475569', isSelected, scale);
  }

  ctx.restore();
}

export function drawCircle(ctx: CanvasRenderingContext2D, circle: GeoCircle, scale = 1, isSelected = false, showHidden = false) {
  if (circle.hidden && !showHidden) return;
  ctx.save();

  if (circle.hidden && showHidden) {
    ctx.globalAlpha = 0.35;
  }

  // Item 4: Red dashed boundary outside when selected
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = Math.max(2, 2.5 * scale);
    ctx.setLineDash([6 * scale, 4 * scale]);
    ctx.beginPath();
    ctx.arc(circle.center.x * scale, circle.center.y * scale, (circle.radius + 4) * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = circle.color;
  ctx.lineWidth = Math.max(0.5, circle.thickness * scale);
  applyLineDash(ctx, circle.style, scale);

  ctx.beginPath();
  ctx.arc(circle.center.x * scale, circle.center.y * scale, circle.radius * scale, 0, Math.PI * 2);
  if (circle.fillColor) {
    ctx.fillStyle = circle.fillColor;
    ctx.fill();
  }
  ctx.stroke();

  if (circle.name && circle.showLabel !== false && (isUserDefinedLabel(circle.name) || isSelected)) {
    const lx = circle.center.x * scale + (circle.labelOffset ? circle.labelOffset.x * scale : 8 * scale);
    const ly = (circle.center.y - circle.radius) * scale + (circle.labelOffset ? circle.labelOffset.y * scale : -4 * scale);
    const fontSize = Math.max(10, 13 * scale);

    renderMathLabel(ctx, circle.name, lx, ly, fontSize, isSelected ? '#1d4ed8' : '#475569', isSelected, scale);
  }

  ctx.restore();
}

export function drawAngle(ctx: CanvasRenderingContext2D, angle: GeoAngle, scale = 1, isSelected = false, showHidden = false) {
  if (angle.hidden && !showHidden) return;
  ctx.save();

  if (angle.hidden && showHidden) {
    ctx.globalAlpha = 0.35;
  }

  const B = { x: angle.center.x * scale, y: angle.center.y * scale };
  const A = { x: angle.p1.x * scale, y: angle.p1.y * scale };
  const C = { x: angle.p2.x * scale, y: angle.p2.y * scale };
  const r = Math.max(15, angle.radius * scale);

  const startAngle = Math.atan2(A.y - B.y, A.x - B.x);
  let endAngle = Math.atan2(C.y - B.y, C.x - B.x);

  let diff: number;
  if (angle.arcSweep === 'counterclockwise') {
    const mathStart = Math.atan2(B.y - A.y, A.x - B.x);
    const mathEnd = Math.atan2(B.y - C.y, C.x - B.x);
    diff = -(((mathEnd - mathStart) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));
  } else if (angle.arcSweep === 'through-point' && angle.throughPoint) {
    const mathStart = Math.atan2(B.y - A.y, A.x - B.x);
    const mathEnd = Math.atan2(B.y - C.y, C.x - B.x);
    const mathThrough = Math.atan2(B.y - angle.throughPoint.y, angle.throughPoint.x - B.x);
    const ccwEnd = ((mathEnd - mathStart) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const ccwThrough = ((mathThrough - mathStart) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    diff = ccwThrough <= ccwEnd ? -ccwEnd : Math.PI * 2 - ccwEnd;
  } else {
    diff = endAngle - startAngle;
    while (diff < 0) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
  }
  endAngle = startAngle + diff;

  // Item 4: Red dashed boundary when selected
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = Math.max(2, 2.5 * scale);
    ctx.setLineDash([5 * scale, 3 * scale]);
    ctx.beginPath();
    ctx.arc(B.x, B.y, r + 4 * scale, startAngle, endAngle, diff < 0);
    ctx.stroke();
    ctx.restore();
  }

  ctx.lineWidth = Math.max(0.5, (angle.thickness ?? 2) * scale);
  ctx.strokeStyle = angle.color || '#2563eb';

  if (angle.style === 'right-angle') {
    const u1 = { x: Math.cos(startAngle), y: Math.sin(startAngle) };
    const u2 = { x: Math.cos(endAngle), y: Math.sin(endAngle) };
    const s = 14 * scale;
    const pA = { x: B.x + u1.x * s, y: B.y + u1.y * s };
    const pCorner = { x: B.x + (u1.x + u2.x) * s, y: B.y + (u1.y + u2.y) * s };
    const pC = { x: B.x + u2.x * s, y: B.y + u2.y * s };

    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pCorner.x, pCorner.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(B.x, B.y, r, startAngle, endAngle, diff < 0);

    if (angle.style === 'sector') {
      ctx.lineTo(B.x, B.y);
      ctx.closePath();
      ctx.fillStyle = angle.fillColor || 'rgba(37, 99, 235, 0.15)';
      ctx.fill();
    } else if (angle.style === 'hatch') {
      ctx.stroke();
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(B.x, B.y);
      ctx.arc(B.x, B.y, r, startAngle, endAngle, diff < 0);
      ctx.closePath();
      ctx.clip();

      ctx.lineWidth = 1;
      ctx.strokeStyle = angle.color || '#2563eb';
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const frac = i / steps;
        const ang = startAngle + diff * frac;
        ctx.beginPath();
        ctx.moveTo(B.x, B.y);
        ctx.lineTo(B.x + Math.cos(ang) * r, B.y + Math.sin(ang) * r);
        ctx.stroke();
      }
      ctx.restore();
    } else if (angle.style === 'double-arc') {
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(B.x, B.y, r - 4 * scale, startAngle, endAngle, diff < 0);
      ctx.stroke();
    } else {
      ctx.stroke();
    }

    // Label if present
    if (angle.label && angle.showLabel !== false) {
      const midAngle = startAngle + diff / 2;
      const labelDist = r + 14 * scale;
      const defLx = B.x + Math.cos(midAngle) * labelDist;
      const defLy = B.y + Math.sin(midAngle) * labelDist;
      const lx = defLx + (angle.labelOffset ? angle.labelOffset.x * scale : 0);
      const ly = defLy + (angle.labelOffset ? angle.labelOffset.y * scale : 0);
      const fontSize = Math.max(10, 13 * scale);

      renderMathLabel(ctx, angle.label, lx - 8 * scale, ly + 4 * scale, fontSize, isSelected ? '#dc2626' : (angle.color || '#2563eb'), isSelected, scale);
    }
  }

  ctx.restore();
}

export function drawPolygon(ctx: CanvasRenderingContext2D, poly: GeoPolygon, scale = 1, isSelected = false, showHidden = false) {
  if (poly.hidden && !showHidden) return;
  if (poly.points.length < 2) return;
  ctx.save();

  if (poly.hidden && showHidden) {
    ctx.globalAlpha = 0.35;
  }

  // Item 4: Red dashed boundary outside when selected
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = Math.max(2, 2.5 * scale);
    ctx.setLineDash([6 * scale, 4 * scale]);
    ctx.beginPath();
    ctx.moveTo(poly.points[0].x * scale, poly.points[0].y * scale);
    for (let i = 1; i < poly.points.length; i++) {
      ctx.lineTo(poly.points[i].x * scale, poly.points[i].y * scale);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = poly.color;
  ctx.lineWidth = Math.max(0.5, poly.thickness * scale);
  applyLineDash(ctx, poly.style, scale);

  ctx.beginPath();
  ctx.moveTo(poly.points[0].x * scale, poly.points[0].y * scale);
  for (let i = 1; i < poly.points.length; i++) {
    ctx.lineTo(poly.points[i].x * scale, poly.points[i].y * scale);
  }
  ctx.closePath();

  if (poly.fillColor) {
    ctx.fillStyle = poly.fillColor;
    ctx.fill();
  }
  ctx.stroke();

  // Polygon label if defined
  if (poly.name && poly.showLabel !== false && (isUserDefinedLabel(poly.name) || isSelected)) {
    const cX = (poly.points.reduce((acc, p) => acc + p.x, 0) / poly.points.length) * scale;
    const cY = (poly.points.reduce((acc, p) => acc + p.y, 0) / poly.points.length) * scale;
    const lx = cX + (poly.labelOffset ? poly.labelOffset.x * scale : 0);
    const ly = cY + (poly.labelOffset ? poly.labelOffset.y * scale : 0);
    const fontSize = Math.max(10, 13 * scale);
    renderMathLabel(ctx, poly.name, lx, ly, fontSize, isSelected ? '#dc2626' : '#334155', isSelected, scale);
  }

  ctx.restore();
}

export function drawConic(ctx: CanvasRenderingContext2D, conic: GeoConic, scale = 1, isSelected = false, showHidden = false) {
  if (conic.hidden && !showHidden) return;
  ctx.save();

  if (conic.hidden && showHidden) {
    ctx.globalAlpha = 0.35;
  }

  // Item 4: Red dashed boundary when selected
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = Math.max(2, 2.5 * scale);
    ctx.setLineDash([6 * scale, 4 * scale]);
    if (conic.type === 'ellipse' && conic.foci && conic.point) {
      const ell = getEllipse2Foci(conic.foci[0], conic.foci[1], conic.point);
      if (ell) {
        ctx.beginPath();
        ctx.ellipse(ell.center.x * scale, ell.center.y * scale, (ell.a + 4) * scale, (ell.b + 4) * scale, ell.angle, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  ctx.strokeStyle = isSelected ? '#2563eb' : conic.color;
  ctx.lineWidth = Math.max(0.5, conic.thickness * scale);
  applyLineDash(ctx, conic.style, scale);

  if (conic.type === 'ellipse' && conic.foci && conic.point) {
    const ell = getEllipse2Foci(conic.foci[0], conic.foci[1], conic.point);
    if (ell) {
      ctx.beginPath();
      ctx.ellipse(
        ell.center.x * scale,
        ell.center.y * scale,
        ell.a * scale,
        ell.b * scale,
        ell.angle,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  } else if (conic.type === 'parabola' && conic.focus && conic.directrix) {
    const para = getParabolaFocusDirectrix(conic.focus, conic.directrix.p1, conic.directrix.p2);
    if (para) {
      ctx.beginPath();
      const tMax = 600;
      let first = true;
      for (let t = -tMax; t <= tMax; t += 5) {
        const px = para.vertex.x + t * para.perpDir.x + ((t * t) / (2 * para.p)) * para.axisDir.x;
        const py = para.vertex.y + t * para.perpDir.y + ((t * t) / (2 * para.p)) * para.axisDir.y;
        if (first) {
          ctx.moveTo(px * scale, py * scale);
          first = false;
        } else {
          ctx.lineTo(px * scale, py * scale);
        }
      }
      ctx.stroke();
    }
  } else if (conic.type === 'hyperbola' && conic.foci && conic.point) {
    const hyp = getHyperbola2Foci(conic.foci[0], conic.foci[1], conic.point);
    if (hyp) {
      const u = { x: Math.cos(hyp.angle), y: Math.sin(hyp.angle) };
      const v = { x: -Math.sin(hyp.angle), y: Math.cos(hyp.angle) };

      // Branch 1
      ctx.beginPath();
      let first1 = true;
      for (let t = -3.6; t <= 3.6; t += 0.05) {
        const coshT = Math.cosh(t);
        const sinhT = Math.sinh(t);
        const px = hyp.center.x + hyp.a * coshT * u.x + hyp.b * sinhT * v.x;
        const py = hyp.center.y + hyp.a * coshT * u.y + hyp.b * sinhT * v.y;
        if (first1) {
          ctx.moveTo(px * scale, py * scale);
          first1 = false;
        } else {
          ctx.lineTo(px * scale, py * scale);
        }
      }
      ctx.stroke();

      // Branch 2
      ctx.beginPath();
      let first2 = true;
      for (let t = -3.6; t <= 3.6; t += 0.05) {
        const coshT = Math.cosh(t);
        const sinhT = Math.sinh(t);
        const px = hyp.center.x - hyp.a * coshT * u.x + hyp.b * sinhT * v.x;
        const py = hyp.center.y - hyp.a * coshT * u.y + hyp.b * sinhT * v.y;
        if (first2) {
          ctx.moveTo(px * scale, py * scale);
          first2 = false;
        } else {
          ctx.lineTo(px * scale, py * scale);
        }
      }
      ctx.stroke();

      // Asymptotes (dashed)
      ctx.save();
      ctx.setLineDash([4 * scale, 4 * scale]);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1 * scale;
      const asymLen = 800;
      const slope1 = { x: hyp.a * u.x + hyp.b * v.x, y: hyp.a * u.y + hyp.b * v.y };
      const slope2 = { x: hyp.a * u.x - hyp.b * v.x, y: hyp.a * u.y - hyp.b * v.y };
      const len1 = Math.hypot(slope1.x, slope1.y) || 1;
      const len2 = Math.hypot(slope2.x, slope2.y) || 1;

      ctx.beginPath();
      ctx.moveTo((hyp.center.x - (slope1.x / len1) * asymLen) * scale, (hyp.center.y - (slope1.y / len1) * asymLen) * scale);
      ctx.lineTo((hyp.center.x + (slope1.x / len1) * asymLen) * scale, (hyp.center.y + (slope1.y / len1) * asymLen) * scale);
      ctx.moveTo((hyp.center.x - (slope2.x / len2) * asymLen) * scale, (hyp.center.y - (slope2.y / len2) * asymLen) * scale);
      ctx.lineTo((hyp.center.x + (slope2.x / len2) * asymLen) * scale, (hyp.center.y + (slope2.y / len2) * asymLen) * scale);
      ctx.stroke();
      ctx.restore();
    }
  } else if (conic.coefficients) {
    // 5-point conic: numerical contour tracing Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0
    drawImplicitConic(ctx, conic.coefficients, scale);
  }

  // Draw conic name if provided and user-defined or selected
  if (conic.name && conic.showLabel !== false && (isUserDefinedLabel(conic.name) || isSelected)) {
    const defaultLx = (conic.point?.x || conic.focus?.x || conic.foci?.[0]?.x || 200) * scale + 10 * scale;
    const defaultLy = (conic.point?.y || conic.focus?.y || conic.foci?.[0]?.y || 200) * scale - 10 * scale;
    const lx = defaultLx + (conic.labelOffset ? conic.labelOffset.x * scale : 0);
    const ly = defaultLy + (conic.labelOffset ? conic.labelOffset.y * scale : 0);
    const fontSize = Math.max(10, 13 * scale);
    renderMathLabel(ctx, conic.name, lx, ly, fontSize, isSelected ? '#1d4ed8' : '#475569', isSelected, scale);
  }

  ctx.restore();
}

function drawImplicitConic(ctx: CanvasRenderingContext2D, c: [number, number, number, number, number, number], scale: number) {
  const [A, B, C, D, E, F] = c;
  const discriminant = B * B - 4 * A * C;

  // 1. Analytical Ellipse rendering when discriminant < -1e-5
  if (discriminant < -1e-5) {
    const det = 4 * A * C - B * B;
    if (Math.abs(det) > 1e-9) {
      const x0 = (B * E - 2 * C * D) / det;
      const y0 = (B * D - 2 * A * E) / det;
      const F0 = A * x0 * x0 + B * x0 * y0 + C * y0 * y0 + D * x0 + E * y0 + F;

      // Real ellipse condition: F0 and (A + C) have opposite signs
      if (F0 * (A + C) < 0) {
        const theta = 0.5 * Math.atan2(B, A - C);
        const diff = Math.hypot(A - C, B);
        const l1 = (A + C - diff) / 2;
        const l2 = (A + C + diff) / 2;

        if (l1 * -F0 > 0 && l2 * -F0 > 0) {
          const a = Math.sqrt(-F0 / l1);
          const b = Math.sqrt(-F0 / l2);
          if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) {
            ctx.beginPath();
            ctx.ellipse(x0 * scale, y0 * scale, a * scale, b * scale, theta, 0, Math.PI * 2);
            ctx.stroke();
            return;
          }
        }
      }
    }
  }

  // 2. High-resolution smooth marching squares with linear interpolation on zero crossings
  const step = 4;
  const width = 800;
  const height = 1130;
  const f = (x: number, y: number) => A * x * x + B * x * y + C * y * y + D * x + E * y + F;

  ctx.save();
  ctx.beginPath();
  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < height; y += step) {
      const v00 = f(x, y);
      const v10 = f(x + step, y);
      const v01 = f(x, y + step);
      const v11 = f(x + step, y + step);

      // Find zero crossings on the 4 edges with linear interpolation
      const edges: Point2D[] = [];
      if ((v00 > 0) !== (v10 > 0)) {
        const t = -v00 / (v10 - v00);
        edges.push({ x: x + t * step, y });
      }
      if ((v10 > 0) !== (v11 > 0)) {
        const t = -v10 / (v11 - v10);
        edges.push({ x: x + step, y: y + t * step });
      }
      if ((v01 > 0) !== (v11 > 0)) {
        const t = -v01 / (v11 - v01);
        edges.push({ x: x + t * step, y: y + step });
      }
      if ((v00 > 0) !== (v01 > 0)) {
        const t = -v00 / (v01 - v00);
        edges.push({ x, y: y + t * step });
      }

      if (edges.length === 2) {
        ctx.moveTo(edges[0].x * scale, edges[0].y * scale);
        ctx.lineTo(edges[1].x * scale, edges[1].y * scale);
      } else if (edges.length === 4) {
        ctx.moveTo(edges[0].x * scale, edges[0].y * scale);
        ctx.lineTo(edges[1].x * scale, edges[1].y * scale);
        ctx.moveTo(edges[2].x * scale, edges[2].y * scale);
        ctx.lineTo(edges[3].x * scale, edges[3].y * scale);
      }
    }
  }
  ctx.stroke();
  ctx.restore();
}

export function drawFreehandStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: PageData['strokes'],
  scale = 1
) {
  for (const stroke of strokes) {
    const pts = stroke.points;
    if (pts.length < 2) continue;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);

    if (stroke.isHighlighter) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Math.max(8, stroke.width * scale * 2.5);
    } else {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Math.max(1, stroke.width * scale);
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x * scale, pts[0].y * scale);

    if (pts.length === 2) {
      ctx.lineTo(pts[1].x * scale, pts[1].y * scale);
    } else {
      // Smooth Bézier curves through midpoint segments for natural ink flow
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2;
        const midY = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(
          pts[i].x * scale,
          pts[i].y * scale,
          midX * scale,
          midY * scale
        );
      }
      ctx.lineTo(pts[pts.length - 1].x * scale, pts[pts.length - 1].y * scale);
    }

    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Draw ghost preview (rubber-banding) for in-progress construction tools
 */
export function drawGhostPreview(
  ctx: CanvasRenderingContext2D,
  tool: string,
  clickPoints: Point2D[],
  hoverPos: Point2D | null,
  scale = 1,
  color = '#2563eb'
) {
  if (!hoverPos || clickPoints.length === 0) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.setLineDash([6 * scale, 4 * scale]);
  ctx.globalAlpha = 0.7;

  if (tool === 'segment' || tool === 'line' || tool === 'ray') {
    const p1 = clickPoints[0];
    ctx.beginPath();
    if (tool === 'line') {
      const dx = hoverPos.x - p1.x;
      const dy = hoverPos.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      ctx.moveTo((p1.x - ux * 1500) * scale, (p1.y - uy * 1500) * scale);
      ctx.lineTo((p1.x + ux * 1500) * scale, (p1.y + uy * 1500) * scale);
    } else {
      ctx.moveTo(p1.x * scale, p1.y * scale);
      ctx.lineTo(hoverPos.x * scale, hoverPos.y * scale);
    }
    ctx.stroke();
  } else if (tool === 'circle-center-point') {
    const center = clickPoints[0];
    const r = dist(center, hoverPos);
    ctx.beginPath();
    ctx.arc(center.x * scale, center.y * scale, r * scale, 0, Math.PI * 2);
    ctx.stroke();
  } else if (tool === 'circle-3points') {
    if (clickPoints.length === 1) {
      ctx.beginPath();
      ctx.moveTo(clickPoints[0].x * scale, clickPoints[0].y * scale);
      ctx.lineTo(hoverPos.x * scale, hoverPos.y * scale);
      ctx.stroke();
    } else if (clickPoints.length === 2) {
      const cc = getCircumcenter(clickPoints[0], clickPoints[1], hoverPos);
      if (cc) {
        ctx.beginPath();
        ctx.arc(cc.center.x * scale, cc.center.y * scale, cc.radius * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  } else if (tool === 'polygon') {
    ctx.beginPath();
    ctx.moveTo(clickPoints[0].x * scale, clickPoints[0].y * scale);
    for (let i = 1; i < clickPoints.length; i++) {
      ctx.lineTo(clickPoints[i].x * scale, clickPoints[i].y * scale);
    }
    ctx.lineTo(hoverPos.x * scale, hoverPos.y * scale);
    ctx.lineTo(clickPoints[0].x * scale, clickPoints[0].y * scale);
    ctx.stroke();
  } else if (tool === 'perpendicular-bisector') {
    const pb = perpendicularBisector(clickPoints[0], hoverPos, 800);
    ctx.beginPath();
    ctx.moveTo(pb.p1.x * scale, pb.p1.y * scale);
    ctx.lineTo(pb.p2.x * scale, pb.p2.y * scale);
    ctx.stroke();
  } else if (tool === 'angle-shading' || tool === 'circular-arc') {
    if (clickPoints.length === 1) {
      ctx.beginPath();
      ctx.moveTo(clickPoints[0].x * scale, clickPoints[0].y * scale);
      ctx.lineTo(hoverPos.x * scale, hoverPos.y * scale);
      ctx.stroke();
    } else if (clickPoints.length === 2) {
      const B = clickPoints[0];
      const A = clickPoints[1];
      const C = hoverPos;
      const r = dist(B, A);
      const angA = Math.atan2(A.y - B.y, A.x - B.x);
      const angC = Math.atan2(C.y - B.y, C.x - B.x);
      ctx.beginPath();
      ctx.arc(B.x * scale, B.y * scale, r * scale, angA, angC);
      ctx.stroke();
    }
  } else if (tool === 'conic-ellipse-2foci-1pt' && clickPoints.length === 2) {
    const ell = getEllipse2Foci(clickPoints[0], clickPoints[1], hoverPos);
    if (ell) {
      ctx.beginPath();
      ctx.ellipse(
        ell.center.x * scale,
        ell.center.y * scale,
        ell.a * scale,
        ell.b * scale,
        ell.angle,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  } else if (tool === 'conic-parabola-focus-directrix' && clickPoints.length === 2) {
    const para = getParabolaFocusDirectrix(clickPoints[0], clickPoints[1], hoverPos);
    if (para) {
      ctx.beginPath();
      let first = true;
      for (let t = -300; t <= 300; t += 10) {
        const px = para.vertex.x + t * para.perpDir.x + ((t * t) / (2 * para.p)) * para.axisDir.x;
        const py = para.vertex.y + t * para.perpDir.y + ((t * t) / (2 * para.p)) * para.axisDir.y;
        if (first) {
          ctx.moveTo(px * scale, py * scale);
          first = false;
        } else {
          ctx.lineTo(px * scale, py * scale);
        }
      }
      ctx.stroke();
    }
  } else if (tool === 'conic-hyperbola-2foci-1pt' && clickPoints.length === 2) {
    const hyp = getHyperbola2Foci(clickPoints[0], clickPoints[1], hoverPos);
    if (hyp) {
      const u = { x: Math.cos(hyp.angle), y: Math.sin(hyp.angle) };
      const v = { x: -Math.sin(hyp.angle), y: Math.cos(hyp.angle) };
      ctx.beginPath();
      let first = true;
      for (let t = -3; t <= 3; t += 0.1) {
        const coshT = Math.cosh(t);
        const sinhT = Math.sinh(t);
        const px = hyp.center.x + hyp.a * coshT * u.x + hyp.b * sinhT * v.x;
        const py = hyp.center.y + hyp.a * coshT * u.y + hyp.b * sinhT * v.y;
        if (first) {
          ctx.moveTo(px * scale, py * scale);
          first = false;
        } else {
          ctx.lineTo(px * scale, py * scale);
        }
      }
      ctx.stroke();
    }
  } else if (tool === 'isogonal-line') {
    if (clickPoints.length === 1) {
      ctx.beginPath();
      ctx.moveTo(clickPoints[0].x * scale, clickPoints[0].y * scale);
      ctx.lineTo(hoverPos.x * scale, hoverPos.y * scale);
      ctx.stroke();
    } else if (clickPoints.length === 2) {
      ctx.beginPath();
      ctx.moveTo(clickPoints[0].x * scale, clickPoints[0].y * scale);
      ctx.lineTo(hoverPos.x * scale, hoverPos.y * scale);
      ctx.stroke();
    } else if (clickPoints.length === 3) {
      const iso = getIsogonalLine(clickPoints[0], clickPoints[1], clickPoints[2], hoverPos, 1500);
      ctx.beginPath();
      ctx.moveTo(iso.p1.x * scale, iso.p1.y * scale);
      ctx.lineTo(iso.p2.x * scale, iso.p2.y * scale);
      ctx.stroke();
    }
  } else if (tool === 'rotation' && clickPoints.length === 1) {
    ctx.beginPath();
    ctx.arc(hoverPos.x * scale, hoverPos.y * scale, dist(clickPoints[0], hoverPos) * scale, 0, Math.PI * 2);
    ctx.stroke();
    const rot = rotatePoint(clickPoints[0], hoverPos, (45 * Math.PI) / 180);
    ctx.beginPath();
    ctx.arc(rot.x * scale, rot.y * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawLocus(ctx: CanvasRenderingContext2D, locus: GeoLocus, scale = 1, isSelected = false) {
  if (!locus.samples || locus.samples.length < 2) return;
  ctx.save();

  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = Math.max(2, 2.5 * scale);
    ctx.setLineDash([6 * scale, 4 * scale]);
    ctx.beginPath();
    ctx.moveTo(locus.samples[0].x * scale, locus.samples[0].y * scale);
    for (let i = 1; i < locus.samples.length; i++) {
      ctx.lineTo(locus.samples[i].x * scale, locus.samples[i].y * scale);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = locus.color || '#7c3aed';
  ctx.lineWidth = Math.max(0.5, locus.thickness * scale);
  applyLineDash(ctx, locus.style, scale);

  ctx.beginPath();
  ctx.moveTo(locus.samples[0].x * scale, locus.samples[0].y * scale);
  for (let i = 1; i < locus.samples.length; i++) {
    ctx.lineTo(locus.samples[i].x * scale, locus.samples[i].y * scale);
  }
  ctx.stroke();

  if (isUserDefinedLabel(locus.name)) {
    const pMid = locus.samples[Math.floor(locus.samples.length / 2)];
    ctx.font = `italic ${Math.max(10, 12 * scale)}px "Times New Roman", Times, serif`;
    ctx.fillStyle = isSelected ? '#1d4ed8' : '#475569';
    ctx.fillText(locus.name!, pMid.x * scale + 8 * scale, pMid.y * scale - 6 * scale);
  }

  ctx.restore();
}

/**
 * Render the entire page elements (background, grid, strokes, geometry, angles, polygons, conics, loci)
 */
export function renderCompletePage(
  ctx: CanvasRenderingContext2D,
  page: PageData,
  width: number,
  height: number,
  scale = 1,
  selectedId: string | null = null,
  hoveredPointId: string | null = null,
  selectedIdsSet?: Set<string>,
  showHidden = false
) {
  const isSelected = (id: string) => {
    if (selectedIdsSet && selectedIdsSet.has(id)) return true;
    return id === selectedId;
  };

  // 1. Background paper & grid
  const backgroundColor = page.backgroundColor === '#80f4cd' ? '#e8f5e9' : page.backgroundColor;
  drawPaperBackground(ctx, width, height, page.gridType || 'grid', scale, backgroundColor);

  // 2. Polygons
  for (const poly of page.polygons) {
    drawPolygon(ctx, poly, scale, isSelected(poly.id), showHidden);
  }

  // 3. Circles
  for (const circle of page.circles) {
    drawCircle(ctx, circle, scale, isSelected(circle.id), showHidden);
  }

  // 4. Conics
  for (const conic of page.conics) {
    drawConic(ctx, conic, scale, isSelected(conic.id), showHidden);
  }

  // 4b. Loci
  for (const locus of page.loci || []) {
    drawLocus(ctx, locus, scale, isSelected(locus.id));
  }

  // 5. Lines
  for (const line of page.lines) {
    drawLine(ctx, line, scale, isSelected(line.id), showHidden);
  }

  // 6. Angles
  for (const angle of page.angles) {
    drawAngle(ctx, angle, scale, isSelected(angle.id), showHidden);
  }

  // 7. Freehand strokes (Pen & Highlighter)
  drawFreehandStrokes(ctx, page.strokes, scale);

  // 8. Points
  for (const pt of page.points) {
    drawPoint(ctx, pt, scale, isSelected(pt.id), pt.id === hoveredPointId, showHidden);
  }
}
