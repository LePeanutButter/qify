/**
 * TypeScript Visualizer for Quality Attribute DSL
 * Handles canvas-based visualization of DSL programs
 */

import type {
  DSLProgram,
  System,
  Attribute,
  ValidationError,
  ValidationResult
} from '../../dsl/types/DSL.types';
import { DSLParser } from '../../dsl/services/DSLParser';

/**
 * Visual configuration interface
 */
export interface VisualConfig {
  colors: {
    background: string;
    system: string;
    attribute: string;
    artifact: string;
    category: string;
    scenario: string;
    text: string;
    error: string;
    warning: string;
  };
  fonts: {
    title: string;
    label: string;
    small: string;
  };
  spacing: {
    margin: number;
    padding: number;
    gap: number;
    lineHeight: number;
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
 * Handles rendering of DSL programs to canvas
 */
export class DSLVisualizer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly renderTarget: HTMLElement | null;
  private currentProgram: DSLProgram | null = null;
  private currentDSLText: string = '';
  private currentAttributeIndex = 0;
  private errors: ValidationError[] = [];
  
  // Visual configuration
  private config: VisualConfig = {
    colors: {
      background: '#0c0e12',
      system: '#4a9eff',
      attribute: '#52c41a',
      artifact: '#fa8c16',
      category: '#722ed1',
      scenario: '#eb2f96',
      text: '#ffffff',
      error: '#ff4d4f',
      warning: '#faad14'
    },
    fonts: {
      title: 'bold 16px Arial',
      label: '12px Arial',
      small: '10px Arial'
    },
    spacing: {
      margin: 20,
      padding: 15,
      gap: 30,
      lineHeight: 20
    }
  };

  /**
   * Create a new visualizer instance
   * @param canvasId The ID of the canvas element
   */
  constructor(canvasId: string, renderTargetId?: string) {
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
      throw new Error(`Canvas element with ID '${canvasId}' not found`);
    }

    this.canvas = canvasElement;
    const context = canvasElement.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = context;

    if (renderTargetId) {
      const renderElement = document.getElementById(renderTargetId);
      if (!renderElement) {
        throw new Error(`Render target element with ID '${renderTargetId}' not found`);
      }
      this.renderTarget = renderElement;
    } else {
      this.renderTarget = null;
    }
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
      
      // Parse DSL (this would use the actual DSL parser)
      this.currentProgram = this.parseDSL(dslText);
      
      // Validate program
      const validation = this.validateProgram();
      this.errors = validation.errors;

      this.renderCurrentVisualization();

      return {
        success: this.errors.length === 0,
        errors: this.errors,
        imageData: this.canvas.toDataURL()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown visualization error';
      this.errors = [{ message: errorMessage, severity: 'error' }];
      this.clearCanvas();
      this.drawError(errorMessage);

      return {
        success: false,
        errors: this.errors
      };
    }
  }

  /**
   * Clear the canvas
   */
  clearCanvas(): void {
    this.ctx.fillStyle = this.config.colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.renderTarget) {
      this.renderTarget.innerHTML = '';
    }
  }

  /**
   * Get the current navigation state.
   */
  getAttributeNavigationState(): { current: number; total: number } {
    const total = this.currentProgram?.allAttributes.length ?? 0;

    return {
      current: total === 0 ? 0 : this.currentAttributeIndex + 1,
      total
    };
  }

  /**
   * Get the active parsed program.
   */
  getCurrentProgram(): DSLProgram | null {
    return this.currentProgram;
  }

  /**
   * Move to the next attribute and redraw.
   */
  nextAttribute(): { current: number; total: number } | null {
    if (!this.currentProgram || this.currentProgram.allAttributes.length === 0) return null;

    this.currentAttributeIndex = (this.currentAttributeIndex + 1) % this.currentProgram.allAttributes.length;
    this.renderCurrentVisualization();

    return this.getAttributeNavigationState();
  }

  /**
   * Move to the previous attribute and redraw.
   */
  previousAttribute(): { current: number; total: number } | null {
    if (!this.currentProgram || this.currentProgram.allAttributes.length === 0) return null;

    this.currentAttributeIndex = (this.currentAttributeIndex - 1 + this.currentProgram.allAttributes.length) % this.currentProgram.allAttributes.length;
    this.renderCurrentVisualization();

    return this.getAttributeNavigationState();
  }

  /**
   * Set the active attribute index and redraw.
   */
  setCurrentAttributeIndex(index: number): void {
    if (!this.currentProgram || this.currentProgram.allAttributes.length === 0) return;

    const maxIndex = this.currentProgram.allAttributes.length - 1;
    this.currentAttributeIndex = Math.max(0, Math.min(index, maxIndex));
    this.renderCurrentVisualization();
  }

  /**
   * Get the current attribute, if any.
   */
  private getCurrentAttribute(): Attribute | null {
    if (!this.currentProgram || this.currentProgram.allAttributes.length === 0) return null;

    return this.currentProgram.allAttributes[this.currentAttributeIndex] ?? null;
  }

  /**
   * Redraw the canvas and preview for the current attribute.
   */
  private renderCurrentVisualization(): void {
    this.clearCanvas();
    this.renderTemplate();
    this.drawProgram();

    if (this.errors.length > 0) {
      this.drawErrors();
    }
  }

  /**
   * Draw the complete program visualization
   */
  private drawProgram(): void {
    if (!this.currentProgram) return;

    let y = this.config.spacing.margin;

    // Draw system header
    y = this.drawSystem(this.currentProgram.system, y);

    const activeAttribute = this.getCurrentAttribute();
    if (activeAttribute) {
      this.drawAttribute(activeAttribute, y, this.currentAttributeIndex + 1);
    }
  }

  /**
   * Render the canva-example.html template into the DOM preview
   */
  private renderTemplate(): void {
    if (!this.renderTarget || !this.currentProgram) return;

    const hideInfo = /\bhideInfo\b/i.exec(this.currentDSLText) !== null;
    const systemMatch = /system\s+([A-Za-z_]\w*)/i.exec(this.currentDSLText);
    const systemName = systemMatch?.[1] ?? this.currentProgram.system.name;
    const currentDate = new Date().toLocaleDateString('es-ES');
    const attributeCount = this.currentProgram.allAttributes.length;
    const currentAttribute = this.getCurrentAttribute();

    const attributeMatches = Array.from(this.currentDSLText.matchAll(/attribute\s+([A-Za-z_]\w*)/g));
    const attributeName = currentAttribute
      ? this.escapeHtml(attributeMatches[this.currentAttributeIndex]?.[1] ?? currentAttribute.name)
      : '';
    const categoryText = currentAttribute ? this.escapeHtml(currentAttribute.category.toString()) : '';

    const flowHtml = currentAttribute ? this.buildAttributeFlowHtml(currentAttribute) : '';
    const infoBoxesHtml = !hideInfo && currentAttribute
      ? this.buildInfoBoxHtml(systemName, attributeName, categoryText, currentDate, attributeCount)
      : '';

    this.renderTarget.innerHTML = `
      <div class="diagram-template">
        <div class="contenedor">
          ${flowHtml}
          ${infoBoxesHtml}
        </div>
      </div>
    `;
  }

  /**
   * Build the horizontal flow HTML for one attribute.
   */
  private buildAttributeFlowHtml(attribute: Attribute): string {
    const sourceText = this.escapeHtml(attribute.scenario.source.text || '');
    const stimulusText = this.escapeHtml(attribute.scenario.stimulus.text || '');
    const environmentText = this.escapeHtml(attribute.scenario.environment.text || '');
    const responseText = this.escapeHtml(attribute.scenario.response.text || '');
    const measureText = this.escapeHtml(attribute.scenario.measure.text || '');
    const artifactText = this.escapeHtml(attribute.artifact.name || '');

    return `
      <div class="fila">
        <div class="columna">
          ${this.getSourceSvg()}
          <div class="texto"><strong>Fuente:</strong><br>${sourceText}</div>
        </div>

        <div class="columna">
          ${this.getArrowSvg()}
          <div class="texto"><strong>Estimulo:</strong><br>${stimulusText}</div>
        </div>

        <div class="columna artifact-columna">
          ${this.getArtifactBox(artifactText)}
          <div class="texto"><strong>Entorno:</strong><br>${environmentText}</div>
        </div>

        <div class="columna">
          ${this.getArrowSvg()}
          <div class="texto"><strong>Respuesta:</strong><br>${responseText}</div>
        </div>

        <div class="columna">
          ${this.getMeasureSvg()}
          <div class="texto"><strong>Medidas:</strong><br>${measureText}</div>
        </div>
      </div>
    `;
  }

  /**
   * Build the info box HTML for the current attribute.
   */
  private buildInfoBoxHtml(systemName: string, attributeName: string, categoryText: string, currentDate: string, attributeCount: number): string {
    const navigationHtml = attributeCount > 1
      ? `
        <div class="slide-controls">
          <button class="slide-btn prev" onclick="previousSlide()">&lt;</button>
          <span class="slide-counter"><span class="current">${this.currentAttributeIndex + 1}</span>/<span class="total">${attributeCount}</span></span>
          <button class="slide-btn next" onclick="nextSlide()">&gt;</button>
        </div>
      `
      : '';

    return `
      <div class="artifact-box-container">
        <div class="artifact-box">
          <div class="info-row"><strong>Sistema:</strong> ${this.escapeHtml(systemName)}</div>
          <div class="info-row"><strong>Atributo:</strong> ${attributeName}</div>
          <div class="info-row"><strong>Categoría:</strong> ${categoryText}</div>
          <div class="info-row"><strong>Modificado:</strong> ${currentDate}</div>
        </div>
        ${navigationHtml}
      </div>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private getArrowSvg(): string {
    return `
      <svg width="70" height="40" aria-hidden="true" style="flex-shrink: 0;">
        <line x1="0" y1="20" x2="50" y2="20" stroke="black" stroke-width="2" />
        <polygon points="50,10 70,20 50,30" fill="black" />
      </svg>
    `;
  }

  private getArtifactSvg(artifactText: string): string {
    return `
      <svg width="220" height="120" aria-hidden="true">
        <rect x="10" y="10" width="200" height="100"
              fill="white"
              stroke="black"
              stroke-width="2"
              rx="20" ry="20"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14">
          <tspan font-weight="bold">Artefacto:</tspan><tspan> ${artifactText}</tspan>
        </text>
      </svg>
    `;
  }

  private getArtifactBox(artifactText: string): string {
    return `
      <div class="artifact-artifact-box">
        <strong>Artefacto:</strong><br/>${artifactText}
      </div>
    `;
  }

  private getSourceSvg(): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" display="block" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1470.5 1524.6" style="flex-shrink: 0;">
        <path fill="#d0d0d0" d="m1126 342.6-21 19-32 24-3 3-2 4-7 2q-5-1-7 3c2 9-27 53-25 67l-1 3-10 7 5 1 9 4 5 1 3 1 1 1h2l1 1 3 1 2 1h1l2 1 11 4 4 1 6 3 1 1 5 2 4 1 2 1h2l3 2h1l1 1h2l3 2h2l2 1 3 1h3l2 1 10 4 3 1h1l3 1 2 1h2v1h1l4 1h2v1c1 0 9 4 8-4 3-9 21-30 28-37 10 4 15 8 24 14l5-5-19-13-25-18c2-4 1-4-2-8-1-2-26-16-30-19l-24-16 1-2c10-4 42-32 47-42-1-21-2-25-24-25" display="inline"/>
        <path fill="#a7a7a8" d="M1030 468.6c-9.2 0-14.4 4.9-16.2 8.2l-41.2 123.8-45.1 136.8c-1.1 1.2-4.7.1-7.7-1.4l-103.6-74.5c-65.2-47-88.3-66-113.2-80-9-5-34-2-294-2s-287-1-297 1c-11.6 6-36.3-15.3-85 303.6-36 479.3-23 460.2-19.7 470.5.9 2.3 10.1 22.2 59.7 16 49.6-6 62.6-9.4 63.6-16 2.2-13.4 3.3-51.8 3.8-218.5.5-166.8 1-172.3 1.7-177.7q.6-1.4 2-1.1c.7 0 1.7.5 1.9 2.3l47 588.9 432-1 22.5-264L682 826l.3-.4c14.5.4 62.8 24 171.8 71 108.9 47 145.9 65 155.9 63 11-1 31-68 81.5-208.5s71.5-204 74-220.5c0-1.8-.7-3.5-3-5 0 0-113.5-57-132.5-57"/>
        <path fill="#d0d0d0" d="M9 1357.6h120a60 119 0 0 1-120 0m392-1162a148 183 0 1 0 .1 0z" display="inline"/>
        <path fill="#fafafa" d="m1181 22.6-6 4c-5-2-6-3-11-2-4 1-4 1-8-2q-14 18-25 39c-12 22-30 40-37 64l-2 3c-18 14-41 58-56 78-23 30-41 63-62 94l-12 21q-5 12 6 19c6 6 78 55 86 57q2-4 7-3 5-1 9-4l2-1 1-4 32-24 21-19c22 0 23 4 24 25-5 10-37 38-47 42l-1 2 24 16c4 3 29 17 30 19 3 4 4 4 2 8l25 18 19 13-5 5q8 10 19 15c13 7 24 17 35 1l6-10c17-31 40-57 57-88 13-24 30-42 42-67l3-3c21-29 45-69 64-99 8-8 19-21 24-30v-19l-24-14-33-20-7-4c-22-18-59-38-84-54-12-7-19-13-29-21q-12-5-22-12c-21-15-46-28-67-43" display="inline"/>
        <path fill="none" stroke="#49484b" stroke-linecap="round" stroke-linejoin="round" stroke-width="25.1" d="M1172.1 13.9 959.9 332.4 1244.4 511l212.2-318.6Z" display="inline"/>
        <path fill="#d0d0d0" d="m1126 342.6-21 19-32 24-2.2 2.2-.4.3c-3.2 3-6.4 5.6-9.7 6.1l-4.6 1-.6.4q-.9.8-1.5 2l-1.1 2.2-3.6 13.2c-3 6.6-6.9 14.3-10.5 21.8l2.2 3.9q.5 1 1.3 2c2 2 3.6 3.4 6 4.6 4.4 2.1 9.1 3 13.8 3.8l3 .4q2.4.3 4.7.2 2.5.2 4.8-.6c.7-.3 1.9-1.4 2.3-1.9q.7-.7 1.2-1.5.8-.8 1.4-1.7 1.4-2 2.5-4l.8-1.3.2-.9.2-.2.2-.2q0-.4.2-.7l.2-.3.3-.7q0-.2.3-.5l9.6-3.4 2.4-6.7s3.8-5.9 6.3-15l.3-.5c10-4 42-32 47-42-1-21-2-25-24-25" display="inline"/>
      </svg>
    `;
  }

  private getMeasureSvg(): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" display="block" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1044 1024" style="flex-shrink: 0;">
        <circle cx="534" cy="514" r="510" display="inline"/>
        <path fill="#fcfdfc" d="M1019 514a485 485 0 1 0-970 0 485 485 0 0 0 970 0" display="inline"/>
        <path d="M235 106v11h203l-45 139h-50a472 462 0 0 0-168-94l-18 15a451 442 0 0 1 153 772l17 11a472 462 0 0 0 133-548h565v-12H613l33-138h42l27 46 27-46h76l21 63 13-7-16-56h132v-6H834l-38-134-73 134h-9l-63-109-25 109h-60l-7-14-9 14h-46l-59-139h392v-11zm205 59 41 91h-67zm351 14 25 77h-71zm-133 32 26 45h-37zm-468 21c-3 8-7 21-19 22h-12v18h31v82h23V232zm159 30h42l-10 32a472 462 0 0 0-32-32m63 0h72l37 83 36-50 55 105H454a472 462 0 0 0-57-87zm95 0h40l-23 39zm62 0h56l-17 77zm148 0h2l-1 2zm-385 82c-41 0-44 40-41 41h19c-1-8 1-25 21-24 26-1 22 24 21 25-7 33-67 52-63 82h84v-21h-46c19-16 44-39 46-61 0-22-10-41-41-42m-73 17c-14 1-62 27-63 29-1 5 14 3 23 6L41 582l3 6 182-188c9 11 4 26 8 28 5 0 35-64 27-67zm379 119-128 50 128 50v-42h192v-16H638zm-242 67c-42-1-43 40-40 41h17c-1-7 1-23 23-22 24 0 24 16 16 27-7 10-28 8-28 8v16c45-6 38 42 12 40-22-2-23-26-23-27h-17c-2 12 4 45 40 45 34 5 66-53 20-66 29-10 28-60-20-62m-84 5L40 615l5 21 271-83zm500 48v42H620v16h192v42l128-50zM350 733c-14 1-45 53-52 78v17h48v26h23v-26h13v-17h-13v-78zm-7 27c5 0 3 42 2 51h-28a151 151 0 0 1 26-51m223 5v155h17V765zm218 0v155h20V765zm-297 1v154h20V766zm150 0v154h22V766zm74 0v154h22V766zm107 68v81h16v-81zm-287 1v85h11v-85zm146 0v82h12v-82zm72 0v81h13v-81zm-144 1v81h11v-81z"/>
      </svg>
    `;
  }

  /**
   * Draw system visualization
   * @param system The system to draw
   * @param y Starting y position
   * @returns Next y position
   */
  private drawSystem(system: System, y: number): number {
    const ctx = this.ctx;
    const config = this.config;

    // System container
    ctx.fillStyle = config.colors.system;
    ctx.fillRect(
      config.spacing.margin,
      y,
      this.canvas.width - config.spacing.margin * 2,
      60
    );

    // System name
    ctx.fillStyle = config.colors.text;
    ctx.font = config.fonts.title;
    ctx.fillText(
      `System: ${system.name}`,
      config.spacing.margin + 20,
      y + 35
    );

    // Attribute count
    ctx.font = config.fonts.small;
    ctx.fillText(
      `${system.attributes.length} attributes`,
      this.canvas.width - config.spacing.margin - 100,
      y + 35
    );

    return y + 60 + config.spacing.gap;
  }

  /**
   * Draw attribute visualization matching canva-example.html design
   * @param attribute The attribute to draw
   * @param y Starting y position
   * @param index Attribute index
   * @returns Next y position
   */
  private drawAttribute(attribute: Attribute, y: number, index: number): number {
    const ctx = this.ctx;
    const config = this.config;
    const startX = config.spacing.margin;
    
    // Attribute header
    ctx.fillStyle = config.colors.attribute;
    ctx.fillRect(startX, y, this.canvas.width - config.spacing.margin * 2, 40);

    ctx.fillStyle = config.colors.text;
    ctx.font = config.fonts.label;
    ctx.fillText(
      `${index}. ${attribute.name}`,
      startX + 15,
      y + 25
    );

    // Category badge
    const categoryText = attribute.category.toString();
    const categoryWidth = ctx.measureText(categoryText).width + 20;
    ctx.fillStyle = config.colors.category;
    ctx.fillRect(
      this.canvas.width - config.spacing.margin - categoryWidth - 15,
      y + 10,
      categoryWidth,
      20
    );
    ctx.fillStyle = config.colors.text;
    ctx.font = config.fonts.small;
    ctx.fillText(
      categoryText,
      this.canvas.width - config.spacing.margin - categoryWidth - 10,
      y + 25
    );

    y += 60; // Space for header

    // Draw the horizontal flow layout like canva-example.html
    const elementWidth = 150;
    const arrowWidth = 100;
    const gap = 20;
    const totalWidth = (elementWidth * 3) + (arrowWidth * 2) + (gap * 4);
    const startX2 = (this.canvas.width - totalWidth) / 2;

    // Element 1: Source (person icon placeholder)
    this.drawIconElement(startX2, y, elementWidth, attribute.scenario.source.text, 'Fuente:', '#d0d0d0');

    // Arrow 1
    this.drawArrow(startX2 + elementWidth + gap, y + 50, arrowWidth);

    // Element 2: Artifact (rectangle with rounded corners)
    this.drawArtifactElement(startX2 + elementWidth + gap + arrowWidth + gap, y, elementWidth, attribute.artifact.name, attribute.scenario.environment.text);

    // Arrow 2
    this.drawArrow(startX2 + elementWidth + gap + arrowWidth + gap + elementWidth + gap, y + 50, arrowWidth);

    // Element 3: Measure (chart icon placeholder)
    this.drawIconElement(startX2 + elementWidth + gap + arrowWidth + gap + elementWidth + gap + arrowWidth + gap, y, elementWidth, attribute.scenario.measure.text, 'Medidas:', '#fcfdfc');

    y += 150; // Space for the attribute visualization

    return y;
  }

  /**
   * Draw an icon element (like the person or chart icons)
   */
  private drawIconElement(x: number, y: number, width: number, text: string, label: string, bgColor: string): void {
    const ctx = this.ctx;
    const iconHeight = 100;

    // Draw icon placeholder (circle)
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + iconHeight / 2, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#49484b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw label below
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width / 2, y + iconHeight + 20);
    ctx.fillText(text, x + width / 2, y + iconHeight + 35);
    ctx.textAlign = 'left';
  }

  /**
   * Draw an artifact element (rectangle with rounded corners)
   */
  private drawArtifactElement(x: number, y: number, width: number, artifactName: string, environmentText: string): void {
    const ctx = this.ctx;
    const rectHeight = 120;

    // Draw rectangle with rounded corners
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    this.roundRect(ctx, x + 10, y, width - 20, rectHeight, 20);
    ctx.fill();
    ctx.stroke();

    // Draw artifact text inside rectangle
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Artefacto: ${artifactName}`, x + width / 2, y + rectHeight / 2);
    ctx.textAlign = 'left';

    // Draw environment label below
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Entorno:', x + width / 2, y + rectHeight + 20);
    ctx.fillText(environmentText, x + width / 2, y + rectHeight + 35);
    ctx.textAlign = 'left';
  }

  /**
   * Draw an arrow
   */
  private drawArrow(x: number, y: number, width: number): void {
    const ctx = this.ctx;

    // Draw line
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();

    // Draw arrowhead
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(x + width, y - 10);
    ctx.lineTo(x + width + 20, y);
    ctx.lineTo(x + width, y + 10);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw a rounded rectangle
   */
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Draw error message
   * @param message The error message to display
   */
  private drawError(message: string): void {
    const ctx = this.ctx;
    const config = this.config;

    ctx.fillStyle = config.colors.error;
    ctx.font = config.fonts.label;

    const lines = this.wrapText(`Error: ${message}`, this.canvas.width - 40);
    lines.forEach((line, i) => {
      ctx.fillText(line, 20, 50 + i * 20);
    });
  }

  /**
   * Draw validation errors
   */
  private drawErrors(): void {
    const ctx = this.ctx;
    const config = this.config;

    const y = this.canvas.height - 100;

    ctx.fillStyle = config.colors.error;
    ctx.font = config.fonts.small;
    ctx.fillText(`Validation Errors (${this.errors.length}):`, 20, y);

    this.errors.slice(0, 3).forEach((error, i) => {
      ctx.fillText(`• ${error.message}`, 20, y + 20 + i * 15);
    });

    if (this.errors.length > 3) {
      ctx.fillText(`... and ${this.errors.length - 3} more`, 20, y + 65);
    }
  }

  /**
   * Wrap text to fit within maximum width
   * @param text The text to wrap
   * @param maxWidth Maximum width for each line
   * @returns Array of wrapped lines
   */
  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Export the current canvas view as PNG with high resolution.
   * @returns Data URL of the canvas image
   */
  exportPNG(): string {
    const scale = 2;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = Math.max(1200, this.canvas.width) * scale;
    exportCanvas.height = Math.max(800, this.canvas.height) * scale;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) {
      return this.canvas.toDataURL('image/png');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.canvas, 0, 0, exportCanvas.width, exportCanvas.height);

    return exportCanvas.toDataURL('image/png');
  }

  /**
   * Export the current canvas view as a standalone SVG wrapper.
   */
  exportSVG(): string {
    const width = Math.max(1200, this.canvas.width);
    const height = Math.max(800, this.canvas.height);
    const pngDataUrl = this.exportPNG();

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="${this.config.colors.background}" />
        <image href="${pngDataUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" />
      </svg>
    `.trim();
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
   * @param program The program to validate
   * @returns Validation result
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
   * @param newConfig New configuration to merge
   */
  updateConfig(newConfig: Partial<VisualConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      colors: { ...this.config.colors, ...newConfig.colors },
      fonts: { ...this.config.fonts, ...newConfig.fonts },
      spacing: { ...this.config.spacing, ...newConfig.spacing }
    };
  }

  /**
   * Get current configuration
   * @returns Current visual configuration
   */
  getConfig(): VisualConfig {
    return { ...this.config };
  }

  /**
   * Get canvas dimensions
   * @returns Canvas width and height
   */
  getDimensions(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  /**
   * Set canvas dimensions
   * @param width New canvas width
   * @param height New canvas height
   */
  setDimensions(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
