/// <reference lib="dom" />

/**
 * Pure SVG Visualization Engine
 * Uses svg-appearence.txt as the visual source of truth and only replaces
 * DSL-dependent text nodes.
 */

import type {
  Attribute,
  System,
  ValidationError
} from '../../dsl/types/DSL.types';
import svgAppearanceTemplate from '../../../../../svg-appearence.txt?raw';
import {
  createRect,
  createSVGRoot,
  createText,
  serializeSVG
} from './SVGRenderer';

export interface SVGVisualizationConfig {
  colors: {
    background: string;
    system: string;
    attribute: string;
    artifact: string;
    category: string;
    text: string;
    textLight: string;
    error: string;
    border: string;
    card: string;
  };
  fonts: {
    title: string;
    titleSize: number;
    label: string;
    labelSize: number;
    small: string;
    smallSize: number;
    family: string;
  };
  spacing: {
    margin: number;
    padding: number;
    gap: number;
    lineHeight: number;
  };
  sizes: {
    cardRadius: number;
    iconSize: number;
    arrowLength: number;
    lineHeight: number;
  };
}

type TextLineIds = readonly [string, string?];
interface RenderOptions {
  showInfo?: boolean;
}

export class SVGVisualizer {
  private config: SVGVisualizationConfig = {
    colors: {
      background: '#ffffff',
      system: '#d0d0d0',
      attribute: '#a7a7a8',
      artifact: '#fafafa',
      category: '#f9f9f9',
      text: '#111827',
      textLight: '#333333',
      error: '#ff4d4f',
      border: '#d0d0d0',
      card: '#f9f9f9'
    },
    fonts: {
      title: 'bold 14px Arial',
      titleSize: 14,
      label: '13px Arial',
      labelSize: 13,
      small: '11px Arial',
      smallSize: 11,
      family: 'Arial'
    },
    spacing: {
      margin: 13,
      padding: 13,
      gap: 18,
      lineHeight: 18
    },
    sizes: {
      cardRadius: 0,
      iconSize: 90,
      arrowLength: 70,
      lineHeight: 18
    }
  };

  /**
   * Render a complete DSL program as SVG.
   */

  renderProgram(
    system: System,
    attribute: Attribute,
    _attributeIndex?: number,
    options?: RenderOptions
  ): string {
    const documentSvg = new DOMParser().parseFromString(svgAppearanceTemplate, 'image/svg+xml');
    const svg = documentSvg.documentElement;

    svg.setAttribute('class', 'diagram-template');
    this.forceArial(svg);

    // 1. Prepare all wrapped lines
    const artifactLines = this.wrapFixedWidth(attribute.artifact.name, 15);
    const sourceLines = this.wrapFixedWidth(attribute.scenario.source.text, 18);
    const stimulusLines = this.wrapFixedWidth(attribute.scenario.stimulus.text, 16);
    const environmentLines = this.wrapFixedWidth(attribute.scenario.environment.text, 18);
    const responseLines = this.wrapFixedWidth(attribute.scenario.response.text, 18);
    const measureLines = this.wrapFixedWidth(attribute.scenario.measure.text, 16);

    // 2. Calculate growth heights
    const artifactExtraHeight = Math.max(0, (artifactLines.length - 1) * 16);
    
    // Calculate scenario text growth (extra lines beyond what template allocated)
    const extraSource = Math.max(0, sourceLines.length - 1);
    const extraStimulus = Math.max(0, stimulusLines.length - 2);
    const extraEnv = Math.max(0, environmentLines.length - 1);
    const extraResp = Math.max(0, responseLines.length - 1);
    const extraMeasure = Math.max(0, measureLines.length - 2);
    
    const maxExtraScenarioLines = Math.max(extraSource, extraStimulus, extraEnv, extraResp, extraMeasure);
    const scenarioExtraHeight = maxExtraScenarioLines * 18;

    // 3. Render content
    const text76 = svg.querySelector('#text76') as SVGTextElement;
    if (text76) {
      this.setMultiLineContent(text76, artifactLines, 'middle');
      text76.setAttribute('transform', 'translate(353, 90)');
    }

    this.setWrappedText(svg, ['text100'], attribute.scenario.source.text);
    this.setWrappedText(svg, ['text108', 'text112'], attribute.scenario.stimulus.text);
    this.setWrappedText(svg, ['text120'], attribute.scenario.environment.text);
    this.setWrappedText(svg, ['text128'], attribute.scenario.response.text);
    this.setWrappedText(svg, ['text136', 'text140'], attribute.scenario.measure.text);

    // 4. Adjust layout (Box growth and pushing)
    this.adjustLayout(svg, artifactExtraHeight, scenarioExtraHeight, artifactLines.length);

    // 5. Info and metadata
    this.setText(svg, 'text162', system.name);
    this.setText(svg, 'text180', attribute.name);
    this.setText(svg, 'text198', attribute.category.toString());
    this.setText(svg, 'text216', new Date().toLocaleDateString('es-ES'));
    this.setInfoBoxVisibility(svg, options?.showInfo ?? attribute.showInfo ?? false);

    return new XMLSerializer().serializeToString(svg);
  }

  private adjustLayout(svg: Element, artifactExtra: number, scenarioExtra: number, artifactLineCount: number): void {
    // A. Resize and adjust artifact box
    const pathIds = ['path66', 'path68'];
    pathIds.forEach(id => {
      const path = svg.querySelector(`#${id}`);
      if (path) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('id', id);
        rect.setAttribute('x', '282');
        rect.setAttribute('y', '48');
        rect.setAttribute('width', '142');
        rect.setAttribute('height', String(60 + artifactExtra));
        rect.setAttribute('rx', '19');
        rect.setAttribute('ry', '19');
        const style = path.getAttribute('style');
        if (style) rect.setAttribute('style', style);
        path.replaceWith(rect);
      }
    });

    const text76 = svg.querySelector('#text76');
    if (text76 && artifactLineCount > 2) {
      const yAdjust = (artifactLineCount - 1) * 2;
      text76.setAttribute('transform', `translate(353, ${90 + yAdjust})`);
    }

    // B. Calculate pushes
    const scenarioPush = artifactExtra + 10;
    
    // We use a much larger buffer for the info box to ensure it's well below everything
    const infoPush = scenarioPush + scenarioExtra + 50; 

    const scenarioElements = [
      'text96', 'text104', 'text116', 'text124', 'text132',
      'text100', 'text108', 'text112', 'text120', 'text128', 'text136', 'text140'
    ];
    const infoElements = ['path142', 'path144', 'g146', 'g164', 'g182', 'g200'];

    scenarioElements.forEach(id => this.moveElement(svg, id, scenarioPush));
    infoElements.forEach(id => this.moveElement(svg, id, infoPush));

    // C. Resize SVG viewport to fit grown content precisely
    const baseWidth = 706.56;
    
    // Calculate the absolute bottom of the visible content
    let tightHeight: number;
    const showInfo = svg.querySelector('#path142')?.getAttribute('display') !== 'none';
    
    if (showInfo) {
      // Info box bottom: original 290 + push
      tightHeight = 290 + infoPush + 10; // 10px tiny buffer
    } else {
      // Scenario section bottom: 
      // Scenario values start at 159 (relative to artifact bottom)
      // We moved labels and values by scenarioPush.
      // 177 was the original bottom of the 2nd line of stimulus/measure.
      tightHeight = 177 + scenarioPush + scenarioExtra + 30;
    }
    
    svg.setAttribute('height', String(tightHeight));
    svg.setAttribute('width', String(baseWidth));
    // xMid = center horizontally, YMin = align to top
    svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');
    
    // Handle viewBox
    const viewBox = svg.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/[,\s]+/).filter(Boolean);
      if (parts.length === 4) {
        parts[3] = String(tightHeight);
        svg.setAttribute('viewBox', parts.join(' '));
      }
    }
  }

  private moveElement(svg: Element, id: string, dy: number): void {
    const element = svg.querySelector(`#${id}`);
    if (!element) return;

    const transform = element.getAttribute('transform') || '';
    
    // Check for existing translate(x, y) or translate(x y)
    const translateRegex = /translate\s*\(\s*([^,\s]+)[,\s]+([^)\s]+)\s*\)/;
    const match = translateRegex.exec(transform);
    
    if (match) {
      const x = match[1];
      const y = Number.parseFloat(match[2]!);
      const newTransform = transform.replace(translateRegex, `translate(${x}, ${y + dy})`);
      element.setAttribute('transform', newTransform);
    } else {
      // If no translate, but has other transforms (like matrix), prepend translate
      if (transform) {
        element.setAttribute('transform', `translate(0, ${dy}) ${transform}`);
      } else {
        // If it's a text element, we can try to update 'y' directly for better compatibility
        const yAttr = element.getAttribute('y');
        if (yAttr && element.tagName === 'text') {
          element.setAttribute('y', String(Number.parseFloat(yAttr) + dy));
        } else {
          // Default to applying a translate transform
          element.setAttribute('transform', `translate(0, ${dy})`);
        }
      }
    }
  }



  /**
   * Render errors as SVG text.
   */
  renderErrors(errors: ValidationError[]): string {
    const width = 1200;
    const height = 300;
    const svg = createSVGRoot(width, height);

    const bg = createRect(0, 0, width, height, {
      fill: this.config.colors.background
    });
    svg.appendChild(bg);

    const title = createText('Validation Errors', 20, 30, {
      fontSize: this.config.fonts.titleSize,
      fontFamily: this.config.fonts.family,
      fontWeight: 'bold',
      fill: this.config.colors.error
    });
    svg.appendChild(title);

    let y = 60;
    errors.slice(0, 5).forEach(error => {
      const errorText = createText(`- ${error.message}`, 40, y, {
        fontSize: this.config.fonts.labelSize,
        fontFamily: this.config.fonts.family,
        fill: this.config.colors.error
      });
      svg.appendChild(errorText);
      y += this.config.spacing.lineHeight;
    });

    if (errors.length > 5) {
      const moreText = createText(`... and ${errors.length - 5} more errors`, 40, y, {
        fontSize: this.config.fonts.smallSize,
        fontFamily: this.config.fonts.family,
        fill: this.config.colors.error
      });
      svg.appendChild(moreText);
    }

    return serializeSVG(svg);
  }

  /**
   * Update configuration.
   */
  setConfig(config: Partial<SVGVisualizationConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      colors: { ...this.config.colors, ...config.colors },
      fonts: { ...this.config.fonts, ...config.fonts },
      spacing: { ...this.config.spacing, ...config.spacing },
      sizes: { ...this.config.sizes, ...config.sizes }
    };
  }

  private setWrappedText(svg: Element, ids: TextLineIds, value: string): void {
    const maxLines = ids.length;
    const lines = this.wrapFixedWidth(value || '', ids.length === 1 ? 18 : 16);

    ids.forEach((id, index) => {
      if (!id) return;

      const text = svg.querySelector(`#${id}`);
      if (!text) return;

      const line = lines[index] ?? '';
      
      // If this is the last available ID and we have more lines, append them to this text element
      if (index === ids.length - 1 && lines.length > ids.length) {
        const extraLines = lines.slice(index);
        this.setMultiLineContent(text, extraLines);
        text.setAttribute('display', 'inline');
      } else {
        this.setTextContent(text, line);
        text.setAttribute('display', line ? 'inline' : 'none');
      }
    });
  }

  private setText(svg: Element, id: string, value: string): void {
    const text = svg.querySelector(`#${id}`);
    if (!text) return;

    this.setTextContent(text, value);
  }

  private setTextContent(textElement: Element, value: string): void {
    const tspan = textElement.querySelector('tspan');
    const target = tspan ?? textElement;
    target.textContent = this.escapeDisplayText(value);

    if (tspan) {
      tspan.setAttribute('x', '0');
    }
  }

  private setMultiLineContent(textElement: Element, lines: string[], textAnchor: 'start' | 'middle' | 'end' = 'start'): void {
    // Clear existing content
    textElement.textContent = '';
    
    if (textAnchor !== 'start') {
      textElement.setAttribute('text-anchor', textAnchor);
    }
    
    lines.forEach((line, index) => {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.textContent = this.escapeDisplayText(line);
      tspan.setAttribute('x', '0');
      if (index > 0) {
        tspan.setAttribute('dy', '1.2em');
      }
      textElement.appendChild(tspan);
    });
  }

  private forceArial(svg: Element): void {
    svg.querySelectorAll('text').forEach(text => {
      const style = text.getAttribute('style') ?? '';
      const normalizedStyle = style
        .replace(/font-family:[^;]+/g, 'font-family:Arial')
        .replace(/-inkscape-font-specification:[^;]+/g, '-inkscape-font-specification:Arial');

      text.setAttribute('style', normalizedStyle || 'font-family:Arial');
      text.setAttribute('font-family', 'Arial');
    });
  }

  private setInfoBoxVisibility(svg: Element, showInfo: boolean): void {
    ['path142', 'path144', 'g146', 'g164', 'g182', 'g200'].forEach(id => {
      const element = svg.querySelector(`#${id}`);
      if (element) {
        element.setAttribute('display', showInfo ? 'inline' : 'none');
      }
    });
  }

  private wrapFixedWidth(value: string, maxChars: number): string[] {
    const words = value.trim().split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';

    words.forEach(word => {
      // Handle very long words by breaking them
      if (word.length > maxChars) {
        if (current) {
          lines.push(current);
          current = '';
        }
        
        let remaining = word;
        while (remaining.length > maxChars) {
          lines.push(remaining.slice(0, maxChars));
          remaining = remaining.slice(maxChars);
        }
        current = remaining;
      } else {
        const next = current ? `${current} ${word}` : word;

        if (next.length > maxChars && current) {
          lines.push(current);
          current = word;
        } else {
          current = next;
        }
      }
    });

    if (current) {
      lines.push(current);
    }

    return lines;
  }

  private escapeDisplayText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }
}
