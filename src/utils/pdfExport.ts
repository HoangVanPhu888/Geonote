import { jsPDF } from 'jspdf';
import { PageData } from '../types';

/**
 * Exports document pages to high-resolution A4 PDF.
 * Uses high-res rendering so text, LaTeX labels, and geometry lines are crisp for teaching materials.
 */
export async function exportDocumentToPdf(
  pages: PageData[],
  renderPageToCanvas: (pageIndex: number, scale: number) => Promise<HTMLCanvasElement | null> | HTMLCanvasElement | null,
  fileName = 'GeoNote-Teaching-Materials.pdf'
): Promise<void> {
  if (pages.length === 0) return;

  // Standard A4 in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    // Render at high resolution (scale 2x for sharp printing)
    const canvas = await renderPageToCanvas(i, 2);
    if (canvas) {
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
    }
  }

  pdf.save(fileName);
}
