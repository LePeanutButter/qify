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
    // Step 1: Escape HTML entities FIRST to avoid issues with < or >
    let processed = escapeHtml(text);

    // Step 2: Extract and protect strings
    const stringPlaceholders: string[] = [];
    // This regex looks for escaped &quot; and &#39; which were created by escapeHtml
    const stringRegex = /(&quot;.*?&quot;|&#39;.*?&#39;)/g;
    
    processed = processed.replace(stringRegex, (match) => {
      const placeholder = `__STRP_${stringPlaceholders.length}__`;
      stringPlaceholders.push(`<span class="string">${match}</span>`);
      return placeholder;
    });

    // Step 3: Highlight system and attribute names
    // system Name { ... }
    processed = processed.replace(/\b(system|attribute)\b\s+([A-Za-z_]\w*)/g, (match, kw, name) => {
      return `<span class="keyword">${kw}</span> <span class="number">${name}</span>`;
    });

    // Step 4: Highlight keywords (only if not already highlighted)
    KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`(?<!<span[^>]*>)\\b${escapeRegExp(keyword)}\\b(?!</span>)`, 'g');
      processed = processed.replace(regex, `<span class="keyword">${keyword}</span>`);
    });

    // Step 5: Highlight categories
    const sortedCategories = [...CATEGORIES].sort((a, b) => b.length - a.length);
    sortedCategories.forEach(category => {
      const regex = new RegExp(`(?<!<span[^>]*>)\\b${escapeRegExp(category)}\\b(?!</span>)`, 'g');
      processed = processed.replace(regex, `<span class="category">${category}</span>`);
    });

    // Step 6: Highlight comments
    processed = processed.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    processed = processed.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');

    // Step 7: Restore protected strings
    stringPlaceholders.forEach((replacement, index) => {
      processed = processed.replace(`__STRP_${index}__`, replacement);
    });

    // Step 8: Ensure trailing newline is visible to match textarea scroll height
    if (text.endsWith('\n')) {
      processed += ' ';
    }

    // Step 9: Highlight errors
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
