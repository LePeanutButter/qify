/// <reference lib="dom" />

/**
 * SVG Layout Engine
 * Provides utilities for positioning and sizing SVG elements
 */

import { SVG_NS, createGroup } from './SVGRenderer';

export interface LayoutBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutOptions {
  gap?: number;
  padding?: number;
  align?: 'start' | 'center' | 'end';
  justify?: 'start' | 'center' | 'end' | 'space-between';
}

/**
 * Stack elements vertically
 */
export function stackVertical(
  elements: Array<{ element: SVGElement; width: number; height: number }>,
  startX: number,
  startY: number,
  options?: LayoutOptions
): LayoutBox {
  const gap = options?.gap ?? 0;
  const align = options?.align ?? 'start';
  const maxWidth = Math.max(...elements.map(e => e.width), 0);
  
  let currentY = startY;
  
  elements.forEach((item, i) => {
    if (i > 0) currentY += gap;
    
    let itemX = startX;
    if (align === 'center') {
      itemX = startX + (maxWidth - item.width) / 2;
    } else if (align === 'end') {
      itemX = startX + maxWidth - item.width;
    }
    
    item.element.setAttribute('transform', `translate(${itemX}, ${currentY})`);
    currentY += item.height;
  });
  
  return {
    x: startX,
    y: startY,
    width: maxWidth,
    height: currentY - startY
  };
}

/**
 * Stack elements horizontally
 */
export function stackHorizontal(
  elements: Array<{ element: SVGElement; width: number; height: number }>,
  startX: number,
  startY: number,
  options?: LayoutOptions
): LayoutBox {
  const gap = options?.gap ?? 0;
  const align = options?.align ?? 'start';
  const maxHeight = Math.max(...elements.map(e => e.height), 0);
  
  let currentX = startX;
  
  elements.forEach((item, i) => {
    if (i > 0) currentX += gap;
    
    let itemY = startY;
    if (align === 'center') {
      itemY = startY + (maxHeight - item.height) / 2;
    } else if (align === 'end') {
      itemY = startY + maxHeight - item.height;
    }
    
    item.element.setAttribute('transform', `translate(${currentX}, ${itemY})`);
    currentX += item.width;
  });
  
  return {
    x: startX,
    y: startY,
    width: currentX - startX,
    height: maxHeight
  };
}

/**
 * Type for flex container
 */
interface FlexContainerType {
  container: SVGGElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  add: any;
  getBox(): LayoutBox;
}

/**
 * Create a flex-like container
 */
export function createFlexContainer(
  direction: 'row' | 'column' = 'column',
  options?: LayoutOptions & { width?: number; height?: number }
): FlexContainerType {
  const container = createGroup();
  const children: Array<{ element: SVGElement; width: number; height: number }> = [];
  
  return {
    container,
    add: (element: SVGElement, width: number, height: number): void => {
      children.push({ element, width, height });
      container.appendChild(element);
    },
    getBox: (): LayoutBox => {
      if (direction === 'row') {
        return stackHorizontal(children, 0, 0, options);
      } else {
        return stackVertical(children, 0, 0, options);
      }
    }
  };
}

/**
 * Center an element within a box
 */
export function centerElement(
  element: SVGElement,
  containerWidth: number,
  containerHeight: number,
  elementWidth: number,
  elementHeight: number
): void {
  const x = (containerWidth - elementWidth) / 2;
  const y = (containerHeight - elementHeight) / 2;
  element.setAttribute('transform', `translate(${x}, ${y})`);
}

/**
 * Position an element at a specific point
 */
export function positionElement(
  element: SVGElement,
  x: number,
  y: number
): void {
  element.setAttribute('transform', `translate(${x}, ${y})`);
}

/**
 * Apply padding to a group by adding a transform
 */
export function applyPadding(
  element: SVGElement,
  padding: number | { top?: number; right?: number; bottom?: number; left?: number }
): void {
  let paddingValue = 0;
  if (typeof padding === 'number') {
    paddingValue = padding;
  } else if (typeof padding === 'object') {
    paddingValue = padding.left ?? 0;
  }
  
  if (paddingValue > 0) {
    const currentTransform = element.getAttribute('transform') ?? '';
    const newTransform = `translate(${String(paddingValue)}, ${String(paddingValue)}) ${currentTransform}`;
    element.setAttribute('transform', newTransform.trim());
  }
}

/**
 * Calculate text bounding box width (approximation)
 */
export function getTextWidth(
  text: string,
  fontSize: number = 12,
  fontFamily: string = 'Arial',
  fontWeight: string | number = 'normal'
): number {
  // Create a temporary SVG text element to measure
  const tempSvg = document.createElementNS(SVG_NS, 'svg');
  const tempText = document.createElementNS(SVG_NS, 'text');
  tempText.setAttribute('font-size', String(fontSize));
  tempText.setAttribute('font-family', fontFamily);
  tempText.setAttribute('font-weight', String(fontWeight));
  tempText.textContent = text;
  tempSvg.appendChild(tempText);
  
  const bbox = tempText.getBBox?.() ?? { width: text.length * fontSize * 0.6 };
  tempSvg.remove();
  
  return bbox.width;
}

/**
 * Calculate text bounding box height
 */
export function getTextHeight(
  fontSize: number = 12
): number {
  // Line height is roughly 1.2 * font size
  return fontSize * 1.2;
}

/**
 * Grid layout - positions elements in a grid
 */
export function gridLayout(
  elements: Array<{ element: SVGElement; width: number; height: number }>,
  startX: number,
  startY: number,
  columns: number,
  options?: { gap?: number; rowGap?: number }
): LayoutBox {
  const gap = options?.gap ?? 0;
  const rowGap = options?.rowGap ?? gap;
  
  const colWidth = Math.max(...elements.map(e => e.width), 0);
  const rowHeight = Math.max(...elements.map(e => e.height), 0);
  
  let currentX = startX;
  let currentY = startY;
  let col = 0;
  
  elements.forEach((item) => {
    item.element.setAttribute('transform', `translate(${currentX}, ${currentY})`);
    
    col++;
    if (col >= columns) {
      col = 0;
      currentY += rowHeight + rowGap;
      currentX = startX;
    } else {
      currentX += colWidth + gap;
    }
  });
  
  const totalHeight = currentY - startY + (col === 0 ? -rowGap : rowHeight);
  const totalWidth = Math.min(columns, elements.length) * (colWidth + gap) - gap;
  
  return {
    x: startX,
    y: startY,
    width: totalWidth,
    height: totalHeight
  };
}

/**
 * Create a table-like layout
 */
export interface TableCell {
  element: SVGElement;
  width: number;
  height: number;
}

export function tableLayout(
  rows: TableCell[][],
  startX: number,
  startY: number,
  options?: { gap?: number; colGap?: number; rowGap?: number }
): LayoutBox {
  const gap = options?.gap ?? 0;
  const colGap = options?.colGap ?? gap;
  const rowGap = options?.rowGap ?? gap;
  
  let currentY = startY;
  let maxWidth = 0;
  
  rows.forEach((row) => {
    let currentX = startX;
    const maxRowHeight = Math.max(...row.map(cell => cell.height), 0);
    
    row.forEach((cell) => {
      cell.element.setAttribute('transform', `translate(${currentX}, ${currentY})`);
      currentX += cell.width + colGap;
      maxWidth = Math.max(maxWidth, currentX);
    });
    
    currentY += maxRowHeight + rowGap;
  });
  
  return {
    x: startX,
    y: startY,
    width: maxWidth - startX - colGap,
    height: currentY - startY - rowGap
  };
}
