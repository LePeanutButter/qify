import type { ValidationError } from '../core/domain/dsl/types/DSL.types';
import { KEYWORDS, CATEGORIES } from '../constants/dsl.constants';
import { escapeHtml, escapeRegExp } from '../utils/dom.utils';

/**
 * Service for handling DSL syntax highlighting
 */
export class SyntaxHighlighter {
  /**
   * Apply syntax highlighting to the provided text
   */
  static highlight(text: string, errors: ValidationError[] = []): string {
    // Step 1: Escape HTML entities FIRST
    let processed = escapeHtml(text);

    // Step 2: Mark strings with placeholders to protect them
    const stringPlaceholders: string[] = [];
    let placeholderIndex = 0;

    processed = processed.replaceAll(/&quot;([^&]*)&quot;/g, (_match, content) => {
      const placeholder = `__STRING_${placeholderIndex}__`;
      stringPlaceholders[placeholderIndex] = `<span class="string">"${content}"</span>`;
      placeholderIndex++;
      return placeholder;
    });

    processed = processed.replaceAll(/&#39;([^&]*)&#39;/g, (_match, content) => {
      const placeholder = `__STRING_${placeholderIndex}__`;
      stringPlaceholders[placeholderIndex] = `<span class="string">'${content}'</span>`;
      placeholderIndex++;
      return placeholder;
    });

    // Step 3: Highlight system and attribute names
    processed = processed.replaceAll(/\bsystem\s+([A-Za-z_]\w*)\b/g, 'system <span class="number">$1</span>');
    processed = processed.replaceAll(/\battribute\s+([A-Za-z_]\w*)\b/g, 'attribute <span class="number">$1</span>');

    // Step 4: Highlight keywords - but NOT inside placeholders
    KEYWORDS.forEach(keyword => {
      const parts = processed.split(/(__STRING_\d+__)/);
      const processedParts = parts.map((part, index) => {
        if (index % 2 === 0) {
          return part.replaceAll(new RegExp(String.raw`\b${escapeRegExp(keyword)}\b`, 'g'), `<span class="keyword">${keyword}</span>`);
        }
        return part;
      });
      processed = processedParts.join('');
    });

    // Step 5: Highlight categories
    const sortedCategories = [...CATEGORIES].sort((a, b) => b.length - a.length);
    sortedCategories.forEach(category => {
      const regex = new RegExp(String.raw`\b${escapeRegExp(category)}\b`, 'g');
      processed = processed.replaceAll(regex, `<span class="category">${category}</span>`);
    });

    // Step 6: Highlight comments
    processed = processed.replaceAll(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    processed = processed.replaceAll(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');

    // Step 7: Restore strings from placeholders
    stringPlaceholders.forEach((replacement, index) => {
      processed = processed.replace(`__STRING_${index}__`, replacement);
    });

    // Step 8: Highlight errors with red underline
    if (errors.length > 0) {
      processed = this.highlightErrors(processed, errors);
    }

    return processed;
  }

  /**
   * Highlight errors with red underline
   */
  private static highlightErrors(processedText: string, errors: ValidationError[]): string {
    const lines = processedText.split('\n');
    errors.forEach(error => {
      if (error.line && error.line <= lines.length) {
        const line = lines[error.line - 1];
        if (line && !line.includes('error-line-highlight')) {
          lines[error.line - 1] = `<span class="error-line-highlight">${line}</span>`;
        }
      }
    });

    return lines.join('\n');
  }
}
