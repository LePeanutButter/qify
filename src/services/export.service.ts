import JSZip from 'jszip';
import type { DSLVisualizer } from '../core/domain/visualization/services/Visualizer';
import { sanitizeFileName, triggerDownload, updateStatus } from '../utils/dom.utils';

/**
 * Service for exporting visualizations in various formats
 */
export class ExportService {
  constructor(private visualizer: DSLVisualizer) {}

  /**
   * Export canvas as PNG (single or batch)
   */
  async exportPNG(): Promise<void> {
    try {
      const program = this.visualizer.getCurrentProgram();
      const navigationState = this.visualizer.getAttributeNavigationState();
      const systemName = sanitizeFileName(program?.system.name ?? 'quality-attributes');

      if (navigationState.total > 1 && program) {
        const zip = new JSZip();
        const originalIndex = navigationState.current - 1;

        for (let index = 0; index < navigationState.total; index++) {
          this.visualizer.setCurrentAttributeIndex(index);
          const attribute = program.allAttributes[index];
          const attributeName = sanitizeFileName(attribute?.name ?? `attribute_${index + 1}`);
          const dataUrl = await this.visualizer.exportPNG();
          const base64 = dataUrl.split(',')[1] ?? '';
          zip.file(`${systemName}_${attributeName}.png`, base64, { base64: true });
        }

        this.visualizer.setCurrentAttributeIndex(originalIndex);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, `${systemName}_attributes.zip`);
      } else {
        const dataUrl = await this.visualizer.exportPNG();
        const response = await globalThis.fetch(dataUrl);
        const blob = await response.blob();
        triggerDownload(blob, `${systemName}.png`);
      }
      updateStatus('Exported PNG');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      updateStatus(`Error: ${errorMessage}`);
    }
  }

  /**
   * Export visualization as SVG (single or batch)
   */
  async exportSVG(): Promise<void> {
    try {
      const program = this.visualizer.getCurrentProgram();
      const navigationState = this.visualizer.getAttributeNavigationState();
      const systemName = sanitizeFileName(program?.system.name ?? 'quality-attributes');

      if (navigationState.total > 1 && program) {
        const zip = new JSZip();
        const originalIndex = navigationState.current - 1;
        const originalButtonState = this.visualizer.hideNavigationButtons();

        for (let index = 0; index < program.allAttributes.length; index++) {
          this.visualizer.setCurrentAttributeIndex(index);
          const attribute = program.allAttributes[index];
          const attributeName = sanitizeFileName(attribute?.name ?? `attribute_${index + 1}`);
          zip.file(`${systemName}_${attributeName}.svg`, this.visualizer.exportSVG());
        }

        this.visualizer.showNavigationButtons(originalButtonState);
        this.visualizer.setCurrentAttributeIndex(originalIndex);
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, `${systemName}_all_attributes.zip`);
        updateStatus(`Exported ${program.allAttributes.length} attributes as SVG batch`);
      } else {
        const originalButtonState = this.visualizer.hideNavigationButtons();
        const svgText = this.visualizer.exportSVG();
        triggerDownload(new Blob([svgText], { type: 'image/svg+xml' }), `${systemName}.svg`);
        this.visualizer.showNavigationButtons(originalButtonState);
        updateStatus('Exported SVG');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      updateStatus(`Error: ${errorMessage}`);
    }
  }

  /**
   * Export visualization as PDF (single or batch)
   */
  async exportPDF(): Promise<void> {
    try {
      const program = this.visualizer.getCurrentProgram();
      const navigationState = this.visualizer.getAttributeNavigationState();
      const systemName = sanitizeFileName(program?.system.name ?? 'quality-attributes');

      if (navigationState.total > 1 && program) {
        const zip = new JSZip();
        const originalIndex = navigationState.current - 1;
        const originalButtonState = this.visualizer.hideNavigationButtons();

        for (let index = 0; index < program.allAttributes.length; index++) {
          this.visualizer.setCurrentAttributeIndex(index);
          const attribute = program.allAttributes[index];
          const attributeName = sanitizeFileName(attribute?.name ?? `attribute_${index + 1}`);
          const svgText = this.visualizer.exportSVG();
          const pdfBlob = await this.svgToPdfBlob(svgText);
          const pdfBytes = await pdfBlob.arrayBuffer();
          zip.file(`${systemName}_${attributeName}.pdf`, pdfBytes);
        }

        this.visualizer.showNavigationButtons(originalButtonState);
        this.visualizer.setCurrentAttributeIndex(originalIndex);
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, `${systemName}_all_attributes.zip`);
        updateStatus(`Exported ${program.allAttributes.length} attributes as PDF batch`);
      } else {
        const originalButtonState = this.visualizer.hideNavigationButtons();
        const svgText = this.visualizer.exportSVG();
        const pdfBlob = await this.svgToPdfBlob(svgText);
        triggerDownload(pdfBlob, `${systemName}.pdf`);
        this.visualizer.showNavigationButtons(originalButtonState);
        updateStatus('Exported PDF');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      updateStatus(`Error: ${errorMessage}`);
    }
  }

  /**
   * Convert SVG text to PDF Blob
   */
  private async svgToPdfBlob(svgText: string): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    const svg2pdfModule = await import('svg2pdf.js');
    const svg2pdf = ((svg2pdfModule.default ?? (svg2pdfModule as any).svg2pdf) as unknown) as (svgElement: SVGSVGElement, pdf: any, options: any) => Promise<void>;

    if (typeof svg2pdf !== 'function') {
      throw new Error('svg2pdf.js export not found');
    }

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    if (svgDoc.querySelector('parsererror')) throw new Error('Invalid SVG');

    const svgElement = svgDoc.documentElement as unknown as SVGSVGElement;
    const { width, height } = this.getSvgPdfSize(svgElement);

    const pdf = new jsPDF({
      orientation: width >= height ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [width, height],
      compress: true
    });

    await svg2pdf(svgElement, pdf, {
      xOffset: 0,
      yOffset: 0,
      scale: 1,
      width,
      height
    });

    return pdf.output('blob');
  }

  /**
   * Calculate SVG size for PDF
   */
  private getSvgPdfSize(svgElement: SVGSVGElement): { width: number; height: number } {
    const viewBox = svgElement.getAttribute('viewBox')?.trim();
    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(Number);
      if (parts.length === 4 && parts[2] != null && parts[3] != null && parts[2] > 0 && parts[3] > 0) {
        return { width: parts[2], height: parts[3] };
      }
    }
    const width = Number.parseFloat(svgElement.getAttribute('width') ?? '706.56');
    const height = Number.parseFloat(svgElement.getAttribute('height') ?? '310.72');
    return { width, height };
  }
}
