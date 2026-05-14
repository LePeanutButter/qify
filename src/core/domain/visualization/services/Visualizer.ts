/// <reference lib="dom" />

/**
 * TypeScript Visualizer for Quality Attribute DSL
 * Pure SVG rendering - no HTML embedding, no foreignObject, no canvas
 */

import type {
  DSLProgram,
  Attribute,
  ValidationError,
  ValidationResult
} from '../../dsl/types/DSL.types';
import { DSLParser } from '../../dsl/services/DSLParser';
import { SVGVisualizer } from './SVGVisualization';

/**
 * Visual configuration interface
 */
export interface VisualConfig {
  colors?: {
    background?: string;
    system?: string;
    attribute?: string;
    artifact?: string;
    category?: string;
    text?: string;
    textLight?: string;
    error?: string;
    border?: string;
    card?: string;
  };
  fonts?: {
    titleSize?: number;
    labelSize?: number;
    smallSize?: number;
    family?: string;
  };
  spacing?: {
    margin?: number;
    padding?: number;
    gap?: number;
  };
}

/**
 * Visualization result interface
 */
export interface VisualizationResult {
  success: boolean;
  errors: ValidationError[];
  imageData?: string;
}

/**
 * Component rendering interface
 */
export interface ComponentData {
  label: string;
  value: string;
  color: string;
}

/**
 * Main Visualizer class
 * Pure SVG rendering - no canvas, no HTML embedding
 */
export class DSLVisualizer {
  private readonly svgRenderer: SVGVisualizer;
  private readonly svgContainer: HTMLElement | null;
  private currentProgram: DSLProgram | null = null;
  private currentDSLText: string = '';
  private currentAttributeIndex = 0;
  private errors: ValidationError[] = [];
  private lastSvgString: string = '';
  // Track navigation button visibility for compatibility with legacy UI callers
  private navigationButtonsVisible = true;
  
  /**
   * Create a new visualizer instance
   * @param svgContainerId The ID of the container element where SVG will be rendered
   */
  constructor(containerIdOrCanvasId: string, svgContainerId?: string) {
    // Accept either a single svg container id (legacy) or two args: canvasId, svgContainerId
    const primaryEl = document.getElementById(containerIdOrCanvasId);

    // Resolve the actual SVG container element
    let resolvedSvgContainer: HTMLElement | null = null;

    if (svgContainerId) {
      resolvedSvgContainer = document.getElementById(svgContainerId);
      if (!resolvedSvgContainer) {
        throw new Error(`SVG container element with ID '${svgContainerId}' not found`);
      }
    } else if (primaryEl?.tagName === 'CANVAS') {
      // If the primary element is a canvas, prefer a sibling/container with id 'visualization'
      resolvedSvgContainer = document.getElementById('visualization') ?? primaryEl;
    } else if (primaryEl) {
      resolvedSvgContainer = primaryEl;
    } else {
      throw new Error(`Container element with ID '${containerIdOrCanvasId}' not found`);
    }

    this.svgContainer = resolvedSvgContainer;
    this.svgRenderer = new SVGVisualizer();
  }

  /**
   * Visualize a DSL program
   * @param dslText The DSL text to visualize
   * @returns VisualizationResult with success status and errors
   */
  visualize(dslText: string): VisualizationResult {
    try {
      // Store current DSL text for validation
      this.currentDSLText = dslText;
      this.currentAttributeIndex = 0;
      
      // Parse DSL
      this.currentProgram = this.parseDSL(dslText);
      
      // Validate program
      const validation = this.validateProgram();
      this.errors = validation.errors;

      this.renderCurrentVisualization();

      return {
        success: this.errors.length === 0,
        errors: this.errors,
        imageData: this.lastSvgString
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown visualization error';
      this.errors = [{ message: errorMessage, severity: 'error' }];
      this.renderError(errorMessage);

      return {
        success: false,
        errors: this.errors
      };
    }
  }

  /**
   * Clear and re-render the current visualization
   */
  private renderCurrentVisualization(): void {
    const activeAttribute = this.getCurrentAttribute();
    
    if (!this.currentProgram || !activeAttribute) {
      return;
    }

    // Generate SVG
    this.lastSvgString = this.svgRenderer.renderProgram(
      this.currentProgram.system,
      activeAttribute,
      this.currentAttributeIndex,
      { showInfo: this.getShowInfoForAttribute(activeAttribute) }
    );

    // Render SVG to DOM
    if (this.svgContainer) {
      this.svgContainer.innerHTML = this.lastSvgString;
      this.renderCanvasControls();
    }

    if (this.errors.length > 0) {
      // Optionally log validation errors
      // eslint-disable-next-line no-console
      console.warn('Validation errors:', this.errors);
    }
  }

  /**
   * Render error message to SVG
   */
  private renderError(message: string): void {
    const errorSvg = this.svgRenderer.renderErrors([
      { message, severity: 'error' }
    ]);
    this.lastSvgString = errorSvg;

    if (this.svgContainer) {
      this.svgContainer.innerHTML = errorSvg;
    }
  }

  /**
   * Get the current navigation state
   */
  getAttributeNavigationState(): { current: number; total: number } {
    const total = this.currentProgram?.allAttributes.length ?? 0;
    return {
      current: total === 0 ? 0 : this.currentAttributeIndex + 1,
      total
    };
  }

  /**
   * Get the active parsed program
   */
  getCurrentProgram(): DSLProgram | null {
    return this.currentProgram;
  }

  /**
   * Move to the next attribute and redraw
   */
  nextAttribute(): { current: number; total: number } | null {
    if (!this.currentProgram || this.currentProgram.allAttributes.length === 0) return null;

    this.currentAttributeIndex = (this.currentAttributeIndex + 1) % this.currentProgram.allAttributes.length;
    this.renderCurrentVisualization();

    return this.getAttributeNavigationState();
  }

  /**
   * Move to the previous attribute and redraw
   */
  previousAttribute(): { current: number; total: number } | null {
    if (!this.currentProgram || this.currentProgram.allAttributes.length === 0) return null;

    this.currentAttributeIndex = (this.currentAttributeIndex - 1 + this.currentProgram.allAttributes.length) % this.currentProgram.allAttributes.length;
    this.renderCurrentVisualization();

    return this.getAttributeNavigationState();
  }

  /**
   * Set the active attribute index and redraw
   */
  setCurrentAttributeIndex(index: number): void {
    if (!this.currentProgram || this.currentProgram.allAttributes.length === 0) return;

    const maxIndex = this.currentProgram.allAttributes.length - 1;
    this.currentAttributeIndex = Math.max(0, Math.min(index, maxIndex));
    this.renderCurrentVisualization();
  }

  /**
   * Hide navigation buttons (compat shim).
   * Returns previous visibility state so callers can restore it.
   */
  hideNavigationButtons(): boolean {
    const prev = this.navigationButtonsVisible;
    this.navigationButtonsVisible = false;

    // Attempt to hide any DOM elements that may represent navigation controls
    try {
      if (this.svgContainer) {
        const controls = this.svgContainer.querySelectorAll('.navigation-controls, .nav-controls, .nav-buttons');
        controls.forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      }
    } catch {
      // swallow DOM errors to preserve compatibility
    }

    return prev;
  }

  /**
   * Restore navigation buttons visibility from previous state (compat shim).
   */
  showNavigationButtons(previousState: boolean): void {
    this.navigationButtonsVisible = !!previousState;

    try {
      if (this.svgContainer) {
        const controls = this.svgContainer.querySelectorAll('.navigation-controls, .nav-controls, .nav-buttons');
        controls.forEach((el) => {
          (el as HTMLElement).style.display = this.navigationButtonsVisible ? '' : 'none';
        });
      }
    } catch {
      // ignore
    }
  }

  /**
   * Clear the rendered SVG and cached export data.
   */
  clearCanvas(): void {
    this.lastSvgString = '';

    if (this.svgContainer) {
      this.svgContainer.innerHTML = '';
    }
  }

  /**
   * Export the current visualization as a high-resolution PNG
   * Converts SVG to canvas and exports as PNG
   * @returns Promise<string> PNG data URL
   */
  async exportPNG(): Promise<string> {
    if (!this.lastSvgString) {
      return '';
    }

    const svgString = this.lastSvgString;
    const scale = 2;
    const width = 1200 * scale;
    const height = 900 * scale;

    // Encode SVG as base64
    const encoded = globalThis.btoa(
      encodeURIComponent(svgString).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCodePoint(Number.parseInt(p1, 16))
      )
    );
    const dataUrl = `data:image/svg+xml;base64,${encoded}`;

    return new Promise<string>((resolve) => {
      const img = new globalThis.Image();

      img.onload = (): void => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = (): void => {
        resolve('');
      };

      img.src = dataUrl;
    });
  }

  /**
   * Export the current visualization as pure SVG (no foreignObject)
   * Returns a valid, self-contained SVG string
   * @returns SVG string
   */
  exportSVG(): string {
    return this.lastSvgString || '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"></svg>';
  }

  /**
   * Export the current visualization as PDF
   * Requires: jspdf and svg2pdf.js libraries (optional dependency)
   * @returns Promise<void>
   */
  async exportPDF(): Promise<void> {
    try {
      // Dynamic imports for optional PDF dependencies
      const { jsPDF } = await import('jspdf');

      if (!this.lastSvgString) {
        throw new Error('No visualization to export');
      }

      // Create SVG element from string
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(this.lastSvgString, 'image/svg+xml');
      const svgElement = svgDoc.documentElement as unknown as SVGSVGElement;
      const { width, height } = this.getSvgPdfSize(svgElement);

      // Create PDF
      const pdf = new jsPDF({
        orientation: width >= height ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [width, height],
        compress: true
      });

      // Try to import svg2pdf for advanced PDF conversion
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const svg2pdfModule: any = await import('svg2pdf.js');
        
        // Convert SVG to PDF
        await svg2pdfModule.default(svgElement, pdf, {
          xOffset: 0,
          yOffset: 0,
          scale: 1,
          width,
          height
        });
      } catch {
        // If svg2pdf is not available, throw error
        throw new Error('svg2pdf.js not found. Install with: npm install svg2pdf.js');
      }

      // Save PDF
      pdf.save('diagram.pdf');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PDF export error:', error);
      throw new Error('Failed to export PDF. Ensure jspdf and svg2pdf.js are installed.');
    }
  }

  private getSvgPdfSize(svgElement: SVGSVGElement): { width: number; height: number } {
    const viewBox = svgElement.getAttribute('viewBox')?.trim();
    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(Number);
      const width = parts[2] ?? Number.NaN;
      const height = parts[3] ?? Number.NaN;

      if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
        return { width, height };
      }
    }

    const width = Number.parseFloat(svgElement.getAttribute('width') ?? '');
    const height = Number.parseFloat(svgElement.getAttribute('height') ?? '');

    return {
      width: Number.isFinite(width) && width > 0 ? width : 706.56,
      height: Number.isFinite(height) && height > 0 ? height : 310.72
    };
  }

  /**
   * Parse DSL text using DSLParser
   * @param dslText The DSL text to parse
   * @returns Parsed DSL program
   */
  private parseDSL(dslText: string): DSLProgram {
    const parseResult = DSLParser.parseDSL(dslText);
    if (!parseResult.program) {
      throw new Error('Failed to parse DSL text');
    }
    return parseResult.program;
  }

  /**
   * Validate DSL program using DSLParser errors
   */
  private validateProgram(): ValidationResult {
    const parseResult = DSLParser.parseDSL(this.currentDSLText || '');
    return {
      isValid: parseResult.errors.length === 0,
      errors: parseResult.errors,
      warnings: []
    };
  }

  /**
   * Update visual configuration
   */
  updateConfig(newConfig: Partial<VisualConfig>): void {
    if (newConfig) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.svgRenderer.setConfig(newConfig as any);
    }
  }

  /**
   * Get the current attribute
   */
  private getCurrentAttribute(): Attribute | null {
    if (!this.currentProgram || this.currentProgram.allAttributes.length === 0) return null;
    return this.currentProgram.allAttributes[this.currentAttributeIndex] ?? null;
  }

  private getShowInfoForAttribute(attribute: Attribute): boolean {
    if (typeof attribute.showInfo === 'boolean') {
      return attribute.showInfo;
    }

    const attributeBlock = this.getAttributeBlock(attribute.name);
    const match = /\bshowInfo(?:\s*:\s*(true|false))?\b/i.exec(attributeBlock);
    return match ? match[1]?.toLowerCase() !== 'false' : false;
  }

  private getAttributeBlock(attributeName: string): string {
    const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`\\battribute\\s+${escapedName}\\s*\\{([\\s\\S]*?)\\}`, 'i').exec(this.currentDSLText);
    return match?.[1] ?? '';
  }

  private renderCanvasControls(): void {
    if (!this.svgContainer || !this.currentProgram) return;

    const total = this.currentProgram.allAttributes.length;
    const controls = document.createElement('div');
    controls.className = 'canvas-controls navigation-controls nav-controls nav-buttons';
    controls.style.display = this.navigationButtonsVisible ? '' : 'none';
    controls.addEventListener('mousedown', event => {
      event.stopPropagation();
    });
    controls.addEventListener('click', event => {
      event.stopPropagation();
    });

    if (total > 1) {
      const prev = this.createControlButton('‹', 'Previous diagram', () => {
        this.previousAttribute();
      });

      const counter = document.createElement('span');
      counter.className = 'diagram-counter';
      counter.innerHTML = `<span class="current">${this.currentAttributeIndex + 1}</span><span class="separator">/</span>${total}`;

      const next = this.createControlButton('›', 'Next diagram', () => {
        this.nextAttribute();
      });

      controls.append(prev, counter, next, this.createDivider());
    }

    controls.append(
      this.createControlButton('-', 'Zoom out', () => this.zoomDiagram(0.9)),
      this.createControlButton('100', 'Reset zoom', () => this.resetDiagramZoom(), 'wide'),
      this.createControlButton('+', 'Zoom in', () => this.zoomDiagram(1.1))
    );

    this.svgContainer.appendChild(controls);
  }

  private createControlButton(
    label: string,
    title: string,
    onClick: () => void,
    variant?: 'wide'
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `canvas-control-btn${variant === 'wide' ? ' wide' : ''}`;
    button.setAttribute('aria-label', title);
    button.title = title;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  private createDivider(): HTMLSpanElement {
    const divider = document.createElement('span');
    divider.className = 'canvas-control-divider';
    return divider;
  }

  private zoomDiagram(factor: number): void {
    const zoom = (globalThis as typeof globalThis & { zoomDiagram?: (factor: number) => void }).zoomDiagram;
    zoom?.(factor);
  }

  private resetDiagramZoom(): void {
    const reset = (globalThis as typeof globalThis & { resetDiagramZoom?: () => void }).resetDiagramZoom;
    reset?.();
  }
}
