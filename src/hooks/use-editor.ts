import { DSLParser } from '../core/domain/dsl/services/DSLParser';
import type { DSLVisualizer } from '../core/domain/visualization/services/Visualizer';
import { SyntaxHighlighter } from '../services/syntax-highlighter.service';
import { 
  updateStatus, 
  clearErrors, 
  showErrors, 
  clearCanvas 
} from '../utils/dom.utils';
import { EXAMPLES } from '../constants/dsl.constants';

/**
 * Hook-like service to manage editor state and event listeners
 */
export class EditorManager {
  private codeTextarea: HTMLTextAreaElement | null = null;
  private syntaxHighlightDiv: HTMLElement | null = null;
  private lineNumbersDiv: HTMLElement | null = null;
  private examplesDiv: HTMLElement | null = null;

  constructor(private visualizer: DSLVisualizer) {
    this.initElements();
  }

  private initElements(): void {
    this.codeTextarea = document.getElementById('code') as HTMLTextAreaElement;
    this.syntaxHighlightDiv = document.getElementById('syntaxHighlight');
    this.lineNumbersDiv = document.getElementById('lineNumbers');
    this.examplesDiv = document.getElementById('examples');
  }

  /**
   * Set up all editor event listeners
   */
  setupEventListeners(): void {
    if (this.codeTextarea) {
      this.codeTextarea.addEventListener('input', () => this.handleCodeInput());
      this.codeTextarea.addEventListener('keyup', () => this.handleCodeInput());
      this.codeTextarea.addEventListener('scroll', () => this.syncScroll());
      this.codeTextarea.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    // Close examples when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as Element;
      if (this.examplesDiv && !target?.closest('.header') && !target?.closest('.examples')) {
        this.examplesDiv.classList.remove('show');
      }
    });
  }

  /**
   * Handle code input: highlight, validate, and render
   */
  handleCodeInput(): void {
    if (!this.codeTextarea || !this.syntaxHighlightDiv) return;

    const text = this.codeTextarea.value;
    const parseResult = DSLParser.parseDSL(text);
    const errors = parseResult.errors || [];

    // Update syntax highlighting
    this.syntaxHighlightDiv.innerHTML = SyntaxHighlighter.highlight(text, errors);

    // Update line numbers
    if (this.lineNumbersDiv) {
      const lines = text.split('\n');
      this.lineNumbersDiv.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
    }

    this.syntaxHighlightDiv.dataset['lineCount'] = text.split('\n').length.toString();

    // Validate and Render
    this.validate(text);
    if (text.trim()) {
      this.render(text);
    } else {
      clearCanvas();
    }
  }

  /**
   * Sync scroll between textarea, syntax highlight, and line numbers
   */
  syncScroll(): void {
    if (!this.codeTextarea || !this.syntaxHighlightDiv) return;
    
    this.syntaxHighlightDiv.scrollTop = this.codeTextarea.scrollTop;
    this.syntaxHighlightDiv.scrollLeft = this.codeTextarea.scrollLeft;
    
    if (this.lineNumbersDiv) {
      this.lineNumbersDiv.scrollTop = this.codeTextarea.scrollTop;
    }
  }

  /**
   * Handle special keys like Tab
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.codeTextarea) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.codeTextarea.selectionStart;
      const end = this.codeTextarea.selectionEnd;
      const value = this.codeTextarea.value;

      if (e.shiftKey) {
        // Shift+Tab: Remove indentation
        const lines = value.split('\n');
        const currentLineIndex = value.substring(0, start).split('\n').length - 1;
        const currentLine = lines[currentLineIndex];

        if (currentLine?.startsWith('  ')) {
          lines[currentLineIndex] = currentLine.substring(2);
          this.codeTextarea.value = lines.join('\n');
          this.codeTextarea.selectionStart = Math.max(0, start - 2);
          this.codeTextarea.selectionEnd = Math.max(0, end - 2);
          this.handleCodeInput();
        }
      } else {
        // Tab: Add indentation
        this.codeTextarea.setRangeText('  ', start, end, 'end');
        this.handleCodeInput();
      }
    }

    if (e.key === 'Enter') {
      globalThis.setTimeout(() => this.handleCodeInput(), 0);
    }
  }

  /**
   * Validate DSL text
   */
  validate(text: string): void {
    try {
      updateStatus('Validating...');
      clearErrors();
      const result = DSLParser.parseDSL(text);
      
      if (result.success) {
        updateStatus('Valid DSL');
      } else {
        showErrors(result.errors);
        updateStatus('Validation failed');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      showErrors([{ message: msg, severity: 'error' }]);
      updateStatus(`Error: ${msg}`);
    }
  }

  /**
   * Render DSL visualization
   */
  render(text: string): void {
    try {
      updateStatus('Rendering...');
      const result = this.visualizer.visualize(text);
      if (result.success) {
        updateStatus('Rendered successfully');
      } else {
        showErrors(result.errors);
        updateStatus('Error: Invalid DSL');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      showErrors([{ message: msg, severity: 'error' }]);
      updateStatus(`Error: ${msg}`);
    }
  }

  /**
   * Load an example into the editor
   */
  loadExample(exampleName: string): void {
    if (this.codeTextarea && EXAMPLES[exampleName as keyof typeof EXAMPLES]) {
      this.codeTextarea.value = EXAMPLES[exampleName as keyof typeof EXAMPLES];
      this.handleCodeInput();
    }
  }

  /**
   * Toggle examples dropdown
   */
  toggleExamples(): void {
    this.examplesDiv?.classList.toggle('show');
  }
}
