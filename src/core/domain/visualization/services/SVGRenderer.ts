/// <reference lib="dom" />

/**
 * Pure SVG Rendering Engine
 * Provides utilities for creating and managing SVG elements
 * No HTML, no foreignObject, no canvas dependencies
 */

export const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * SVG element creation helpers
 */
export function createSVGElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes?: Record<string, string | number>
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag);
  
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });
  }
  
  return element;
}

/**
 * Create SVG root element matching svg-appearence.txt format
 */
export function createSVGRoot(
  width: number,
  height: number,
  viewBox?: string
): SVGSVGElement {
  const svg = createSVGElement('svg', {
    'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
    'xmlns:cc': 'http://creativecommons.org/ns#',
    'xmlns:rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'xmlns:svg': SVG_NS,
    xmlns: SVG_NS,
    viewBox: viewBox ?? `0 0 ${width} ${height}`,
    height: String(height),
    width: String(width),
    xmlSpace: 'preserve',
    id: 'svg2',
    version: '1.1'
  });
  // Make SVG responsive within its container while keeping pixel viewBox for exports
  svg.setAttribute('style', `width: 100%; height: 100%; display: block;`);
  return svg;
}

/**
 * Create a group element
 */
export function createGroup(
  id?: string,
  transform?: string
): SVGGElement {
  const attrs: Record<string, string> = {};
  if (id) attrs['id'] = id;
  if (transform) attrs['transform'] = transform;
  return createSVGElement('g', attrs);
}

/**
 * Create a rectangle
 */
export function createRect(
  x: number,
  y: number,
  width: number,
  height: number,
  options?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    rx?: number;
    ry?: number;
    opacity?: number;
    id?: string;
  }
): SVGRectElement {
  const attrs: Record<string, string | number> = { x, y, width, height };
  
  if (options) {
    // Build style attribute matching svg-appearence.txt format
    const styleParts: string[] = [];
    
    if (options.fill) {
      styleParts.push(`fill:${options.fill}`);
      styleParts.push('fill-opacity:1');
      styleParts.push('fill-rule:nonzero');
    }
    if (options.stroke) {
      styleParts.push(`stroke:${options.stroke}`);
    } else {
      styleParts.push('stroke:none');
    }
    if (options.opacity !== undefined) {
      styleParts.push(`opacity:${options.opacity}`);
    }
    
    if (styleParts.length > 0) {
      attrs['style'] = styleParts.join(';');
    }
    
    if (options.strokeWidth) attrs['stroke-width'] = options.strokeWidth;
    if (options.rx) attrs['rx'] = options.rx;
    if (options.ry) attrs['ry'] = options.ry;
    if (options.id) attrs['id'] = options.id;
  }
  return createSVGElement('rect', attrs);
}

/**
 * Create a circle
 */
export function createCircle(
  cx: number,
  cy: number,
  r: number,
  options?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    id?: string;
  }
): SVGCircleElement {
  const attrs: Record<string, string | number> = { cx, cy, r };
  
  if (options) {
    if (options.fill) attrs['fill'] = options.fill;
    if (options.stroke) attrs['stroke'] = options.stroke;
    if (options.strokeWidth) attrs['stroke-width'] = options.strokeWidth;
    if (options.opacity) attrs['opacity'] = options.opacity;
    if (options.id) attrs['id'] = options.id;
  }
  
  return createSVGElement('circle', attrs);
}

/**
 * Create a line
 */
export function createLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options?: {
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    id?: string;
  }
): SVGLineElement {
  const attrs: Record<string, string | number> = { x1, y1, x2, y2 };
  
  if (options) {
    if (options.stroke) attrs['stroke'] = options.stroke;
    if (options.strokeWidth) attrs['stroke-width'] = options.strokeWidth;
    if (options.opacity) attrs['opacity'] = options.opacity;
    if (options.id) attrs['id'] = options.id;
  }
  
  return createSVGElement('line', attrs);
}

/**
 * Create a path
 */
export function createPath(
  d: string,
  options?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    id?: string;
  }
): SVGPathElement {
  const attrs: Record<string, string | number> = { d };
  
  if (options) {
    if (options.fill) attrs['fill'] = options.fill;
    if (options.stroke) attrs['stroke'] = options.stroke;
    if (options.strokeWidth) attrs['stroke-width'] = options.strokeWidth;
    if (options.opacity) attrs['opacity'] = options.opacity;
    if (options.id) attrs['id'] = options.id;
  }
  
  return createSVGElement('path', attrs);
}

/**
 * Create a polygon
 */
export function createPolygon(
  points: string,
  options?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    id?: string;
  }
): SVGPolygonElement {
  const attrs: Record<string, string | number> = { points };
  
  if (options) {
    if (options.fill) attrs['fill'] = options.fill;
    if (options.stroke) attrs['stroke'] = options.stroke;
    if (options.strokeWidth) attrs['stroke-width'] = options.strokeWidth;
    if (options.opacity) attrs['opacity'] = options.opacity;
    if (options.id) attrs['id'] = options.id;
  }
  
  return createSVGElement('polygon', attrs);
}

/**
 * Create a text element
 * Note: Use createTextWithLines() for multiline text
 */
export function createText(
  content: string,
  x: number,
  y: number,
  options?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold' | number;
    fill?: string;
    textAnchor?: 'start' | 'middle' | 'end';
    dominantBaseline?: 'auto' | 'middle' | 'hanging' | 'baseline';
    id?: string;
  }
): SVGTextElement {
  const attrs: Record<string, string | number> = { x, y };
  
  if (options) {
    if (options.fontSize) attrs['font-size'] = options.fontSize;
    if (options.fontFamily) attrs['font-family'] = options.fontFamily;
    if (options.fontWeight) attrs['font-weight'] = options.fontWeight;
    if (options.fill) attrs['fill'] = options.fill;
    if (options.textAnchor) attrs['text-anchor'] = options.textAnchor;
    if (options.dominantBaseline) attrs['dominant-baseline'] = options.dominantBaseline;
    if (options.id) attrs['id'] = options.id;
  }
  
  const text = createSVGElement('text', attrs);
  text.textContent = content;
  return text;
}

/**
 * Create multiline text with tspan elements
 */
export function createTextWithLines(
  lines: string[],
  x: number,
  y: number,
  lineHeight: number = 20,
  options?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold' | number;
    fill?: string;
    textAnchor?: 'start' | 'middle' | 'end';
    dominantBaseline?: 'auto' | 'middle' | 'hanging' | 'baseline';
    id?: string;
  }
): SVGTextElement {
  const attrs: Record<string, string | number> = { x, y };
  
  if (options) {
    if (options.fontSize) attrs['font-size'] = options.fontSize;
    if (options.fontFamily) attrs['font-family'] = options.fontFamily;
    if (options.fontWeight) attrs['font-weight'] = options.fontWeight;
    if (options.fill) attrs['fill'] = options.fill;
    if (options.textAnchor) attrs['text-anchor'] = options.textAnchor;
    if (options.dominantBaseline) attrs['dominant-baseline'] = options.dominantBaseline;
    if (options.id) attrs['id'] = options.id;
  }
  
  const text = createSVGElement('text', attrs);
  
  lines.forEach((line, index) => {
    const tspan = createSVGElement('tspan');
    tspan.textContent = line;
    
    if (index > 0) {
      tspan.setAttribute('x', String(x));
      tspan.setAttribute('dy', String(lineHeight));
    }
    
    text.appendChild(tspan);
  });
  
  return text;
}

/**
 * Create an arrow pointing to the right
 */
export function createArrow(
  x: number,
  y: number,
  length: number = 50,
  headSize: number = 10,
  options?: {
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    id?: string;
  }
): SVGGElement {
  const group = createGroup(options?.id);
  
  const stroke = options?.stroke ?? '#000000';
  const strokeWidth = options?.strokeWidth ?? 2;
  const fill = options?.fill ?? '#000000';
  
  // Line
  const line = createLine(x, y, x + length, y, {
    stroke,
    strokeWidth
  });
  group.appendChild(line);
  
  // Arrowhead (triangle)
  const arrowhead = createPolygon(
    `${x + length},${y - headSize} ${x + length + headSize},${y} ${x + length},${y + headSize}`,
    { fill }
  );
  group.appendChild(arrowhead);
  
  return group;
}

/**
 * Create a drop shadow filter
 */
export function createShadowFilter(
  id: string = 'shadow',
  options?: {
    offsetX?: number;
    offsetY?: number;
    blurRadius?: number;
    color?: string;
    opacity?: number;
  }
): SVGFilterElement {
  const offsetX = options?.offsetX ?? 2;
  const offsetY = options?.offsetY ?? 2;
  const blurRadius = options?.blurRadius ?? 4;
  const color = options?.color ?? '#000000';
  const opacity = options?.opacity ?? 0.3;
  
  const filter = createSVGElement('filter', {
    id,
    x: '-50%',
    y: '-50%',
    width: '200%',
    height: '200%'
  });
  
  const feGaussianBlur = createSVGElement('feGaussianBlur', {
    in: 'SourceAlpha',
    stdDeviation: blurRadius
  });
  filter.appendChild(feGaussianBlur);
  
  const feOffset = createSVGElement('feOffset', {
    dx: offsetX,
    dy: offsetY,
    result: 'offsetblur'
  });
  filter.appendChild(feOffset);
  
  const feFlood = createSVGElement('feFlood', {
    'flood-color': color,
    'flood-opacity': opacity
  });
  filter.appendChild(feFlood);
  
  const feComposite = createSVGElement('feComposite', {
    in2: 'offsetblur',
    operator: 'in'
  });
  filter.appendChild(feComposite);
  
  const feMerge = createSVGElement('feMerge');
  const feMergeNode1 = createSVGElement('feMergeNode');
  const feMergeNode2 = createSVGElement('feMergeNode', { in: 'SourceGraphic' });
  feMerge.appendChild(feMergeNode1);
  feMerge.appendChild(feMergeNode2);
  filter.appendChild(feMerge);
  
  return filter;
}

/**
 * Create a linear gradient
 */
export function createLinearGradient(
  id: string,
  color1: string,
  color2: string,
  options?: {
    x1?: string;
    y1?: string;
    x2?: string;
    y2?: string;
  }
): SVGLinearGradientElement {
  const gradient = createSVGElement('linearGradient', {
    id,
    x1: options?.x1 ?? '0%',
    y1: options?.y1 ?? '0%',
    x2: options?.x2 ?? '100%',
    y2: options?.y2 ?? '0%'
  });
  
  const stop1 = createSVGElement('stop', {
    offset: '0%',
    'stop-color': color1
  });
  gradient.appendChild(stop1);
  
  const stop2 = createSVGElement('stop', {
    offset: '100%',
    'stop-color': color2
  });
  gradient.appendChild(stop2);
  
  return gradient;
}

/**
 * Create a radial gradient
 */
export function createRadialGradient(
  id: string,
  color1: string,
  color2: string,
  options?: {
    cx?: string;
    cy?: string;
    r?: string;
  }
): SVGRadialGradientElement {
  const gradient = createSVGElement('radialGradient', {
    id,
    cx: options?.cx ?? '50%',
    cy: options?.cy ?? '50%',
    r: options?.r ?? '50%'
  });
  
  const stop1 = createSVGElement('stop', {
    offset: '0%',
    'stop-color': color1
  });
  gradient.appendChild(stop1);
  
  const stop2 = createSVGElement('stop', {
    offset: '100%',
    'stop-color': color2
  });
  gradient.appendChild(stop2);
  
  return gradient;
}

/**
 * Create a clip path
 */
export function createClipPath(
  id: string,
  shape: SVGElement
): SVGClipPathElement {
  const clipPath = createSVGElement('clipPath', { id });
  clipPath.appendChild(shape);
  return clipPath;
}

/**
 * Create a defs element
 */
export function createDefs(): SVGDefsElement {
  return createSVGElement('defs');
}

/**
 * Serialize SVG element to string
 */
export function serializeSVG(svg: SVGElement): string {
  return new XMLSerializer().serializeToString(svg);
}

/**
 * Create metadata element matching svg-appearence.txt format
 */
export function createMetadata(): SVGElement {
  const metadata = createSVGElement('metadata', { id: 'metadata8' });
  
  // Use createElementNS directly for namespaced elements
  const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
  const DC_NS = 'http://purl.org/dc/elements/1.1/';
  const CC_NS = 'http://creativecommons.org/ns#';
  
  const rdf = document.createElementNS(RDF_NS, 'rdf:RDF');
  const work = document.createElementNS(CC_NS, 'cc:Work');
  work.setAttributeNS(RDF_NS, 'rdf:about', '');
  
  const format = document.createElementNS(DC_NS, 'dc:format');
  format.textContent = 'image/svg+xml';
  work.appendChild(format);
  
  const type = document.createElementNS(DC_NS, 'dc:type');
  type.setAttributeNS(RDF_NS, 'rdf:resource', 'http://purl.org/dc/dcmitype/StillImage');
  work.appendChild(type);
  
  rdf.appendChild(work);
  metadata.appendChild(rdf);
  
  return metadata;
}

/**
 * Create a box/card with shadow and rounded corners
 */
export function createCard(
  x: number,
  y: number,
  width: number,
  height: number,
  content: SVGElement[],
  options?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    rx?: number;
    ry?: number;
    shadow?: boolean;
    shadowId?: string;
  }
): SVGGElement {
  const group = createGroup();
  
  const bg = createRect(x, y, width, height, {
    fill: options?.fill ?? '#ffffff',
    stroke: options?.stroke ?? '#000000',
    strokeWidth: options?.strokeWidth ?? 1,
    rx: options?.rx ?? 4,
    ry: options?.ry ?? 4
  });
  
  if (options?.shadow) {
    bg.setAttribute('filter', `url(#${options?.shadowId ?? 'shadow'})`);
  }
  
  group.appendChild(bg);
  
  content.forEach(el => {
    group.appendChild(el);
  });
  
  return group;
}

/**
 * Text wrapping utility - splits text into multiple lines based on max width
 * Requires font metrics to be accurate - use with caution
 */
export function wrapText(
  text: string,
  maxWidth: number,
  charWidth: number = 6
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const lineWidth = testLine.length * charWidth;
    
    if (lineWidth > maxWidth && currentLine) {
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
 * Calculate text dimensions (approximation)
 */
export function getTextDimensions(
  text: string,
  fontSize: number = 12,
  _fontFamily: string = 'Arial'
): { width: number; height: number } {
  // Rough approximation - actual values depend on the font
  const charWidth = fontSize * 0.5;
  const lineHeight = fontSize * 1.2;
  
  return {
    width: text.length * charWidth,
    height: lineHeight
  };
}
