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

    this.setText(svg, 'text76', attribute.artifact.name);
    this.setWrappedText(svg, ['text100'], attribute.scenario.source.text);
    this.setWrappedText(svg, ['text108', 'text112'], attribute.scenario.stimulus.text);
    this.setWrappedText(svg, ['text120'], attribute.scenario.environment.text);
    this.setWrappedText(svg, ['text128'], attribute.scenario.response.text);
    this.setWrappedText(svg, ['text136', 'text140'], attribute.scenario.measure.text);
    this.setText(svg, 'text162', system.name);
    this.setText(svg, 'text180', attribute.name);
    this.setText(svg, 'text198', attribute.category.toString());
    this.setText(svg, 'text216', new Date().toLocaleDateString('es-ES'));
    this.setInfoBoxVisibility(svg, options?.showInfo ?? attribute.showInfo ?? false);

    return new XMLSerializer().serializeToString(svg);
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
    const lines = this.wrapFixedWidth(value || '', ids.length === 1 ? 18 : 16, ids.length);

    ids.forEach((id, index) => {
      if (!id) return;

      const text = svg.querySelector(`#${id}`);
      if (!text) return;

      const line = lines[index] ?? '';
      this.setTextContent(text, line);
      text.setAttribute('display', line ? 'inline' : 'none');
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

  private wrapFixedWidth(value: string, maxChars: number, maxLines: number): string[] {
    const words = value.trim().split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';

    words.forEach(word => {
      const next = current ? `${current} ${word}` : word;

      if (next.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    });

    if (current) {
      lines.push(current);
    }

    if (lines.length <= maxLines) {
      return lines;
    }

    const visible = lines.slice(0, maxLines);
    const lastIndex = visible.length - 1;
    const overflow = lines.slice(maxLines).join(' ');
    const lastLine = `${visible[lastIndex] ?? ''} ${overflow}`.trim();
    visible[lastIndex] = this.truncate(lastLine, maxChars);
    return visible;
  }

  private truncate(value: string, maxChars: number): string {
    if (value.length <= maxChars) {
      return value;
    }

    return `${value.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
  }

  private escapeDisplayText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }
}
