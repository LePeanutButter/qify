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
  private codeElement: HTMLElement | null = null;
  private lineNumbersDiv: HTMLElement | null = null;
  private examplesDiv: HTMLElement | null = null;
  private isHighlighting: boolean = false;
  
  // Undo/Redo stack
  private history: { text: string; caretPos: number }[] = [];
  private historyIndex: number = -1;
  private isUndoRedo: boolean = false;

  constructor(private visualizer: DSLVisualizer) {
    this.initElements();
  }

  private initElements(): void {
    this.codeElement = document.getElementById('code');
    this.lineNumbersDiv = document.getElementById('lineNumbers');
    this.examplesDiv = document.getElementById('examples');
  }

  /**
   * Set up all editor event listeners
   */
  setupEventListeners(): void {
    if (this.codeElement) {
      this.codeElement.addEventListener('input', () => this.handleCodeInput());
      this.codeElement.addEventListener('scroll', () => this.syncScroll());
      this.codeElement.addEventListener('keydown', (e) => this.handleKeyDown(e));
      
      this.codeElement.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData?.getData('text/plain');
        if (text) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(text);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            sel.removeAllRanges();
            sel.addRange(range);
            this.handleCodeInput();
          }
        }
      });
      
      // Perform initial highlighting and rendering
      this.handleCodeInput(true);
    }

    // Close examples when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as Element;
      if (this.examplesDiv && !target?.closest('.header') && !target?.closest('.examples')) {
        this.examplesDiv.classList.remove('show');
      }
    });
  }

  private saveHistory(text: string, caretPos: number) {
    if (this.historyIndex >= 0 && this.history[this.historyIndex]?.text === text) return;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({ text, caretPos });
    this.historyIndex++;
  }

  private handleUndo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const state = this.history[this.historyIndex];
      if (state) this.applyHistoryState(state);
    }
  }

  private handleRedo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const state = this.history[this.historyIndex];
      if (state) this.applyHistoryState(state);
    }
  }

  private applyHistoryState(state: { text: string; caretPos: number }) {
    if (!this.codeElement) return;
    this.isUndoRedo = true;
    this.codeElement.textContent = state.text;
    this.handleCodeInput(false, state.caretPos);
    this.isUndoRedo = false;
  }

  private getCaretPosition(element: HTMLElement): number {
    let caretOffset = 0;
    const doc = element.ownerDocument;
    const win = doc.defaultView || window;
    const sel = win.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
  }

  private setCaretPosition(element: HTMLElement, offset: number) {
    let charIndex = 0;
    const range = document.createRange();
    range.setStart(element, 0);
    range.collapse(true);
    const nodeStack: Node[] = [element];
    let node: Node | undefined;
    let foundStart = false;
    let stop = false;

    while (!stop && (node = nodeStack.pop())) {
      if (node.nodeType === 3) {
        const nextCharIndex = charIndex + (node.textContent?.length || 0);
        if (!foundStart && offset >= charIndex && offset <= nextCharIndex) {
          range.setStart(node, offset - charIndex);
          foundStart = true;
        }
        if (foundStart && offset >= charIndex && offset <= nextCharIndex) {
          range.setEnd(node, offset - charIndex);
          stop = true;
        }
        charIndex = nextCharIndex;
      } else {
        let i = node.childNodes.length;
        while (i--) {
          const child = node.childNodes[i];
          if (child) nodeStack.push(child);
        }
      }
    }

    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  /**
   * Handle code input: highlight, validate, and render
   */
  handleCodeInput(initial: boolean = false, overrideCaretPos: number = -1): void {
    if (!this.codeElement || this.isHighlighting) return;

    this.isHighlighting = true;
    
    // We use textContent because we strictly maintain \n text nodes and prevent divs/brs
    let text = this.codeElement.textContent || '';

    // Save cursor position
    const caretPos = overrideCaretPos !== -1 ? overrideCaretPos : (initial ? 0 : this.getCaretPosition(this.codeElement));

    if (!this.isUndoRedo && !initial) {
      this.saveHistory(text, caretPos);
    }

    // 1. Validate DSL first to get latest errors
    const parseResult = DSLParser.parseDSL(text);
    const errors = parseResult.errors || [];
    this.updateFileName(text);

    // 2. Update syntax highlighting with error info
    this.codeElement.innerHTML = SyntaxHighlighter.highlight(text, errors);

    // Restore cursor position
    if (!initial) {
      this.setCaretPosition(this.codeElement, caretPos);
    }

    // 3. Update line numbers with wrap support
    if (this.lineNumbersDiv) {
      const lines = text.split('\n');
      
      // Create or get mirror element for height calculation
      let mirror = document.getElementById('line-mirror');
      if (!mirror) {
        mirror = document.createElement('div');
        mirror.id = 'line-mirror';
        mirror.style.position = 'absolute';
        mirror.style.visibility = 'hidden';
        mirror.style.left = '-99999px';
        mirror.style.top = '0';
        mirror.style.whiteSpace = 'pre-wrap';
        mirror.style.wordBreak = 'break-word';
        mirror.style.overflowWrap = 'anywhere';
        mirror.style.boxSizing = 'border-box';
        mirror.style.padding = '0';
        mirror.style.tabSize = '2';
        document.body.appendChild(mirror);
      }

      const computed = window.getComputedStyle(this.codeElement);
      const lineHeight = Number.parseFloat(computed.lineHeight) || (Number.parseFloat(computed.fontSize) * 1.5) || 22;

      mirror.style.width = `${this.codeElement.clientWidth}px`;
      mirror.style.fontFamily = computed.fontFamily;
      mirror.style.fontSize = computed.fontSize;
      mirror.style.fontWeight = computed.fontWeight;
      mirror.style.fontStyle = computed.fontStyle;
      mirror.style.letterSpacing = computed.letterSpacing;
      mirror.style.lineHeight = computed.lineHeight;
      mirror.style.paddingLeft = computed.paddingLeft;
      mirror.style.paddingRight = computed.paddingRight;
      mirror.style.paddingTop = computed.paddingTop;
      mirror.style.paddingBottom = computed.paddingBottom;
      mirror.style.borderLeftWidth = computed.borderLeftWidth;
      mirror.style.borderRightWidth = computed.borderRightWidth;
      mirror.style.borderTopWidth = computed.borderTopWidth;
      mirror.style.borderBottomWidth = computed.borderBottomWidth;

      let lineNumbersHTML = '';
      for (let i = 0; i < lines.length; i++) {
        mirror.textContent = lines[i] || ' ';
        const wrappedHeight = mirror.getBoundingClientRect().height || lineHeight;
        const wrappedLines = Math.max(1, Math.ceil(wrappedHeight / lineHeight));

        for (let wrapIndex = 0; wrapIndex < wrappedLines; wrapIndex++) {
          if (wrapIndex === 0) {
            lineNumbersHTML += `<div class="line-number-row">${i + 1}</div>`;
          } else {
            lineNumbersHTML += '<div class="line-number-row line-number-empty">&nbsp;</div>';
          }
        }
      }
      this.lineNumbersDiv.innerHTML = lineNumbersHTML;
    }

    this.codeElement.dataset['lineCount'] = text.split('\n').length.toString();

    // 4. Sync scroll immediately
    this.syncScroll();

    // 5. Update Status and Render
    this.validate(text);
    if (text.trim()) {
      this.render(text);
    } else {
      clearCanvas();
    }
    
    this.isHighlighting = false;
  }

  /**
   * Sync scroll between editor and line numbers
   */
  syncScroll(): void {
    if (!this.codeElement) return;
    if (this.lineNumbersDiv) {
      this.lineNumbersDiv.scrollTop = this.codeElement.scrollTop;
    }
  }

  /**
   * Handle special keys like Tab, Enter and Undo/Redo
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.codeElement) return;

    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          this.handleRedo();
        } else {
          this.handleUndo();
        }
        return;
      }
      if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.handleRedo();
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const tabNode = document.createTextNode('  ');
        range.insertNode(tabNode);
        range.setStartAfter(tabNode);
        range.setEndAfter(tabNode);
        sel.removeAllRanges();
        sel.addRange(range);
        this.handleCodeInput();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const brNode = document.createTextNode('\n');
        range.insertNode(brNode);
        range.setStartAfter(brNode);
        range.setEndAfter(brNode);
        sel.removeAllRanges();
        sel.addRange(range);
        this.handleCodeInput();
      }
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
    if (this.codeElement && EXAMPLES[exampleName as keyof typeof EXAMPLES]) {
      this.codeElement.textContent = EXAMPLES[exampleName as keyof typeof EXAMPLES];
      // Save initial state to history
      const text = this.codeElement.textContent;
      this.history = [{ text, caretPos: 0 }];
      this.historyIndex = 0;
      this.handleCodeInput(true);
      this.examplesDiv?.classList.remove('show');
    }
  }

  /**
   * Toggle examples dropdown
   */
  toggleExamples(): void {
    this.examplesDiv?.classList.toggle('show');
  }

  private updateFileName(text: string): void {
    const fileNameElement = document.getElementById('fileName');
    if (!fileNameElement) return;

    const match = /\bsystem\s+([A-Za-z_][A-Za-z0-9_]*)/i.exec(text);
    fileNameElement.textContent = `${match?.[1] ?? 'Untitled-1'}.qify`;
  }
}
