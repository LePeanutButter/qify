import { DSLParser } from '../core/domain/dsl/services/DSLParser';
import type { DSLVisualizer } from '../core/domain/visualization/services/Visualizer';
import { SyntaxHighlighter } from '../services/syntax-highlighter.service';
import { 
  updateStatus, 
  clearErrors, 
  showErrors, 
  clearCanvas 
} from '../utils/dom.utils';
import { EXAMPLES, CATEGORIES } from '../constants/dsl.constants';

/**
 * Hook-like service to manage editor state and event listeners
 */
export class EditorManager {
  private codeElement: HTMLElement | null = null;
  private lineNumbersDiv: HTMLElement | null = null;
  private examplesDiv: HTMLElement | null = null;
  private editorAreaDiv: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeRafId: number | null = null;
  private autocompleteBackdrop: HTMLElement | null = null;
  private autocompleteElement: HTMLElement | null = null;
  private autocompleteVisible = false;
  private autocompleteMode: 'ghost' | 'list' | null = null;
  private autocompleteItems: Array<{ label: string; insert: string; kind: 'category' | 'field' | 'keyword' }> = [];
  private autocompleteIndex = 0;
  private autocompleteRange: { start: number; end: number } | null = null;
  private autocompleteSuppressed = false;
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
    this.editorAreaDiv = this.codeElement?.parentElement as HTMLElement | null;
    this.autocompleteBackdrop = document.getElementById('autocompleteBackdrop');

    if (this.autocompleteBackdrop) {
      this.autocompleteBackdrop.hidden = true;
    }

    if (this.editorAreaDiv && this.codeElement && !this.autocompleteBackdrop) {
      this.autocompleteBackdrop = document.createElement('div');
      this.autocompleteBackdrop.id = 'autocompleteBackdrop';
      this.autocompleteBackdrop.className = 'autocomplete-backdrop';
      this.autocompleteBackdrop.setAttribute('aria-hidden', 'true');
      this.autocompleteBackdrop.hidden = true;
      this.editorAreaDiv.insertBefore(this.autocompleteBackdrop, this.codeElement);
    }

    if (this.editorAreaDiv && !document.getElementById('autocompleteHint')) {
      this.autocompleteElement = document.createElement('div');
      this.autocompleteElement.id = 'autocompleteHint';
      this.autocompleteElement.className = 'autocomplete-hint';
      this.autocompleteElement.hidden = true;
      this.autocompleteElement.setAttribute('aria-hidden', 'true');
      this.editorAreaDiv.appendChild(this.autocompleteElement);
      this.autocompleteElement.addEventListener('wheel', (event) => {
        event.preventDefault();
        event.stopPropagation();
      }, { passive: false });
    } else {
      this.autocompleteElement = document.getElementById('autocompleteHint');
    }
  }

  /**
   * Set up all editor event listeners
   */
  setupEventListeners(): void {
    if (this.codeElement) {
      this.codeElement.addEventListener('input', () => {
        this.autocompleteSuppressed = false;
        this.handleCodeInput(false, -1, true);
      }); 
      this.codeElement.addEventListener('scroll', () => this.syncScroll());
      this.codeElement.addEventListener('keydown', (e) => this.handleKeyDown(e));

      if (this.editorAreaDiv) {
        this.editorAreaDiv.addEventListener('scroll', () => this.syncScroll());
      }

      this.setupResizeObserver();
      
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
            this.handleCodeInput(false, -1, false);
          }
        }
      });
      
      // Perform initial highlighting and rendering
      this.handleCodeInput(true, -1, false);
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
    this.handleCodeInput(false, state.caretPos, false);
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
  handleCodeInput(initial: boolean = false, overrideCaretPos: number = -1, allowAutocomplete: boolean = true): void {
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
    this.refreshLineNumbers(text);

    this.codeElement.dataset['lineCount'] = text.split('\n').length.toString();

    // 4. Sync scroll immediately
    this.syncScroll();

    // 4.5 Update autocomplete overlay only after active typing, not on click or programmatic updates
    if (allowAutocomplete && !initial && !this.autocompleteSuppressed) {
      this.refreshAutocomplete(text, caretPos);
    } else {
      this.hideAutocomplete();
    }

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
    if (this.autocompleteBackdrop) {
      this.autocompleteBackdrop.scrollTop = this.codeElement.scrollTop;
      this.autocompleteBackdrop.scrollLeft = this.codeElement.scrollLeft;
    }
  }

  private setupResizeObserver(): void {
    if (!this.codeElement || !this.lineNumbersDiv || typeof ResizeObserver === 'undefined') return;

    this.resizeObserver?.disconnect();
    let lastWidth = this.codeElement.getBoundingClientRect().width;

    this.resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;

      const nextWidth = entry.contentRect.width;
      if (Math.abs(nextWidth - lastWidth) < 0.5) return;
      lastWidth = nextWidth;

      if (this.resizeRafId !== null) {
        cancelAnimationFrame(this.resizeRafId);
      }

      this.resizeRafId = requestAnimationFrame(() => {
        this.resizeRafId = null;
        if (!this.codeElement || !this.lineNumbersDiv) return;
        this.refreshLineNumbers(this.codeElement.textContent || '');
        this.syncScroll();
      });
    });

    this.resizeObserver.observe(this.codeElement);
    if (this.editorAreaDiv) {
      this.resizeObserver.observe(this.editorAreaDiv);
    }
  }

  private refreshLineNumbers(text: string): void {
    if (!this.codeElement || !this.lineNumbersDiv) return;

    const lines = text.split('\n');

    let mirror = document.getElementById('line-mirror') as HTMLDivElement | null;
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
      mirror.style.pointerEvents = 'none';
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

    const lineNumbers: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      mirror.textContent = lines[i] || ' ';
      const wrappedHeight = mirror.getBoundingClientRect().height || lineHeight;
      const wrappedLines = Math.max(1, Math.ceil(wrappedHeight / lineHeight));

      for (let wrapIndex = 0; wrapIndex < wrappedLines; wrapIndex++) {
        lineNumbers.push(wrapIndex === 0 ? String(i + 1) : '&nbsp;');
      }
    }

    this.lineNumbersDiv.innerHTML = lineNumbers
      .map((value, index) => `<div class="line-number-row${value === '&nbsp;' ? ' line-number-empty' : ''}">${value}</div>`)
      .join('');
  }

  destroy(): void {
    if (this.resizeRafId !== null) {
      cancelAnimationFrame(this.resizeRafId);
      this.resizeRafId = null;
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
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

    if (e.key === 'Escape') {
      this.autocompleteSuppressed = true;
      this.hideAutocomplete();
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this.autocompleteSuppressed = false;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (this.autocompleteVisible && this.autocompleteItems.length > 0) {
        this.applyAutocompleteSuggestion();
        return;
      }
      
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const tabNode = document.createTextNode('  ');
        range.insertNode(tabNode);
        range.setStartAfter(tabNode);
        range.setEndAfter(tabNode);
        sel.removeAllRanges();
        sel.addRange(range);
        this.handleCodeInput(false, -1, false);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.autocompleteVisible && this.autocompleteItems.length > 0) {
        this.applyAutocompleteSuggestion();
        return;
      }
      this.hideAutocomplete();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const brNode = document.createTextNode('\n');
        range.insertNode(brNode);
        range.setStartAfter(brNode);
        range.setEndAfter(brNode);
        sel.removeAllRanges();
        sel.addRange(range);
        this.handleCodeInput(false, -1, false);
      }
    } else if (this.autocompleteVisible && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      if (this.autocompleteMode !== 'list') return;
      this.moveAutocompleteSelection(e.key === 'ArrowDown' ? 1 : -1);
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
      this.autocompleteSuppressed = true;
      this.handleCodeInput(true, -1, false);
      this.examplesDiv?.classList.remove('show');
    }
  }

  /**
   * Toggle examples dropdown
   */
  toggleExamples(): void {
    this.examplesDiv?.classList.toggle('show');
  }

  private refreshAutocomplete(text: string, caretPos: number): void {
    if (!this.codeElement || !this.editorAreaDiv || !this.autocompleteElement) return;

    const suggestion = this.getAutocompleteSuggestions(text, caretPos);
    if (!suggestion) {
      this.hideAutocomplete();
      return;
    }

    this.autocompleteMode = suggestion.mode;
    this.autocompleteItems = suggestion.items;
    this.autocompleteIndex = Math.max(0, Math.min(this.autocompleteIndex, this.autocompleteItems.length - 1));
    this.autocompleteRange = { start: suggestion.start, end: suggestion.end };
    this.autocompleteVisible = true;
    if (suggestion.mode === 'ghost') {
      this.renderAutocompleteBackdrop(text, suggestion);
      this.hideAutocompleteList();
    } else {
      this.hideAutocompleteBackdrop();
      this.autocompleteElement.hidden = false;
      this.autocompleteElement.classList.toggle('is-list', true);
      this.autocompleteElement.classList.toggle('is-ghost', false);
      this.renderAutocompleteItems();
      this.positionAutocompleteHint();
    }
  }

  private renderAutocompleteBackdrop(text: string, suggestion: { start: number; end: number; items: Array<{ label: string; insert: string; kind: 'category' | 'field' | 'keyword' }>; mode: 'ghost' | 'list'; ghostText?: string }): void {
    if (!this.autocompleteBackdrop || suggestion.mode !== 'ghost') return;

    const insert = suggestion.items[0]?.insert ?? '';
    if (!insert) {
      this.hideAutocompleteBackdrop();
      return;
    }

    const completedText = `${text.slice(0, suggestion.start)}${insert}${text.slice(suggestion.end)}`;
    this.autocompleteBackdrop.textContent = completedText;
    this.autocompleteBackdrop.hidden = false;
    this.syncScroll();
  }

  private hideAutocompleteBackdrop(): void {
    if (!this.autocompleteBackdrop) return;
    this.autocompleteBackdrop.hidden = true;
    this.autocompleteBackdrop.textContent = '';
  }

  private hideAutocompleteList(): void {
    if (!this.autocompleteElement) return;
    this.autocompleteElement.hidden = true;
    this.autocompleteElement.textContent = '';
    this.autocompleteElement.classList.remove('is-list', 'is-ghost');
    this.autocompleteElement.scrollTop = 0;
  }

  private getAutocompleteSuggestions(text: string, caretPos: number): { start: number; end: number; items: Array<{ label: string; insert: string; kind: 'category' | 'field' | 'keyword' }>; mode: 'ghost' | 'list'; ghostText?: string } | null {
    const lineStart = text.lastIndexOf('\n', caretPos - 1) + 1;
    const linePrefix = text.slice(lineStart, caretPos);

    const reservedSuggestions = [
      { trigger: 'system', insert: 'system', kind: 'keyword' as const },
      { trigger: 'attribute', insert: 'attribute', kind: 'keyword' as const },
      { trigger: 'artifact', insert: 'artifact:', kind: 'field' as const },
      { trigger: 'category', insert: 'category:', kind: 'field' as const },
      { trigger: 'source', insert: 'source:', kind: 'field' as const },
      { trigger: 'stimulus', insert: 'stimulus:', kind: 'field' as const },
      { trigger: 'environment', insert: 'environment:', kind: 'field' as const },
      { trigger: 'response', insert: 'response:', kind: 'field' as const },
      { trigger: 'measure', insert: 'measure:', kind: 'field' as const },
      { trigger: 'showinfo', insert: 'showInfo', kind: 'keyword' as const }
    ];

    const categoryMatch = /category\s*:\s*([A-Za-z_.]*)$/i.exec(linePrefix);
    if (categoryMatch) {
      const token = categoryMatch[1] ?? '';
      const familyList = Array.from(
        new Set(
          CATEGORIES
            .map(category => category.split('.')[0])
            .filter((family): family is string => Boolean(family))
        )
      ).sort((a, b) => a.localeCompare(b));

      if (!token.includes('.')) {
        const normalized = token.toLowerCase();
        const filteredFamilies = normalized ? familyList.filter(family => family.toLowerCase().startsWith(normalized)) : familyList;
        if (normalized && filteredFamilies.length === 0) {
          return null;
        }
        const items = filteredFamilies.slice(0, 12).map(family => ({ label: family, insert: family, kind: 'category' as const }));

        return {
          start: caretPos - token.length,
          end: caretPos,
          items,
          mode: 'list'
        };
      }

      const [familyRaw = '', subcategoryRaw = ''] = token.split('.', 2);
      const family = familyRaw.trim();
      const subcategoryPrefix = subcategoryRaw.trim();
      const normalizedFamily = family.toLowerCase();
      const normalizedSubcategory = subcategoryPrefix.toLowerCase();

      const subcategoryList = Array.from(
        new Set(
          CATEGORIES
            .filter(category => category.toLowerCase().startsWith(`${normalizedFamily}.`))
            .map(category => category.split('.')[1])
            .filter((subcategory): subcategory is string => Boolean(subcategory))
        )
      ).sort((a, b) => a.localeCompare(b));

      if (subcategoryList.length === 0) {
        return null;
      }

      const isCompleteCategory = CATEGORIES.some(category => category.toLowerCase() === token.toLowerCase());
      if (isCompleteCategory) {
        return null;
      }

      const filteredSubcategories = normalizedSubcategory ? subcategoryList.filter(subcategory => subcategory.toLowerCase().startsWith(normalizedSubcategory)) : subcategoryList;
      if (normalizedSubcategory && filteredSubcategories.length === 0) {
        return null;
      }

      const items = filteredSubcategories.slice(0, 12).map(subcategory => ({ label: subcategory, insert: subcategory, kind: 'category' as const }));

      return {
        start: caretPos - subcategoryPrefix.length,
        end: caretPos,
        items,
        mode: 'list'
      };
    }

    const tokenMatch = /([A-Za-z_][A-Za-z0-9_]*)$/.exec(linePrefix);
    if (!tokenMatch) return null;

    const token = tokenMatch[1] ?? '';
    const normalizedToken = token.toLowerCase();

    const reservedMatch = reservedSuggestions.find(item => item.trigger.startsWith(normalizedToken) && item.insert.toLowerCase().startsWith(normalizedToken) && item.insert.length > token.length);
    if (!reservedMatch) return null;

    return {
      start: caretPos - token.length,
      end: caretPos,
      items: [{ label: reservedMatch.insert, insert: reservedMatch.insert, kind: reservedMatch.kind }],
      mode: 'ghost',
      ghostText: reservedMatch.insert.slice(token.length)
    };
  }

  private renderAutocompleteItems(ghostText = ''): void {
    if (!this.autocompleteElement) return;

    if (this.autocompleteMode === 'ghost') {
      const item = this.autocompleteItems[0];
      this.autocompleteElement.innerHTML = item
        ? `<span class="autocomplete-ghost"><span class="autocomplete-label">${item.insert.slice(0, item.insert.length - ghostText.length)}</span><span class="autocomplete-ghost-fill">${ghostText}</span></span>`
        : '';
      return;
    }

    this.autocompleteElement.innerHTML = this.autocompleteItems
      .map((item, index) => {
        const activeClass = index === this.autocompleteIndex ? ' active' : '';
        return `<button type="button" class="autocomplete-option${activeClass} kind-${item.kind}" data-index="${index}"><span class="autocomplete-label">${item.label}</span></button>`;
      })
      .join('');

    this.autocompleteElement.querySelectorAll<HTMLButtonElement>('.autocomplete-option').forEach(option => {
      option.addEventListener('mousedown', (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      option.addEventListener('click', (event) => { 
        event.preventDefault();
        event.stopPropagation();
        const index = Number.parseInt(option.dataset['index'] || '0', 10);
        this.applyAutocompleteSuggestion(Number.isNaN(index) ? this.autocompleteIndex : index);
      });
    });

    this.ensureAutocompleteItemVisible();
  }

  private moveAutocompleteSelection(delta: number): void {
    if (!this.autocompleteVisible || this.autocompleteItems.length === 0) return;
    this.autocompleteIndex = (this.autocompleteIndex + delta + this.autocompleteItems.length) % this.autocompleteItems.length;
    this.renderAutocompleteItems();
    this.ensureAutocompleteItemVisible();
  }

  private ensureAutocompleteItemVisible(): void {
    if (!this.autocompleteElement || this.autocompleteMode !== 'list') return;

    const activeOption = this.autocompleteElement.querySelector<HTMLElement>('.autocomplete-option.active');
    if (!activeOption) return;

    const container = this.autocompleteElement;
    const optionTop = activeOption.offsetTop;
    const optionBottom = optionTop + activeOption.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;

    if (optionTop < viewTop) {
      container.scrollTop = optionTop;
      return;
    }

    if (optionBottom > viewBottom) {
      container.scrollTop = optionBottom - container.clientHeight;
    }
  }

  private positionAutocompleteHint(): void {
    if (!this.codeElement || !this.editorAreaDiv || !this.autocompleteElement) return;

    this.syncAutocompleteTypography();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      this.hideAutocomplete();
      return;
    }

    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);
    const caretRect = range.getBoundingClientRect();
    const editorRect = this.editorAreaDiv.getBoundingClientRect();

    if (!caretRect || (caretRect.x === 0 && caretRect.y === 0 && caretRect.width === 0 && caretRect.height === 0)) {
      this.hideAutocomplete();
      return;
    }

    const top = this.autocompleteMode === 'ghost'
      ? caretRect.top - editorRect.top + this.editorAreaDiv.scrollTop
      : caretRect.bottom - editorRect.top + this.editorAreaDiv.scrollTop + 8;
    const left = caretRect.left - editorRect.left + this.editorAreaDiv.scrollLeft;

    this.autocompleteElement.style.top = `${Math.max(0, top)}px`;
    this.autocompleteElement.style.left = `${Math.max(0, left)}px`;

    if (this.autocompleteMode === 'ghost') {
      this.autocompleteElement.style.transform = 'translateX(0)';
    }
  }

  private syncAutocompleteTypography(): void {
    if (!this.codeElement || !this.autocompleteElement) return;

    const computed = window.getComputedStyle(this.codeElement);
    const target = this.autocompleteElement;

    target.style.fontFamily = computed.fontFamily;
    target.style.fontSize = computed.fontSize;
    target.style.fontWeight = computed.fontWeight;
    target.style.fontStyle = computed.fontStyle;
    target.style.lineHeight = computed.lineHeight;
    target.style.letterSpacing = computed.letterSpacing;
    target.style.tabSize = computed.tabSize;
    target.style.whiteSpace = 'pre';
    target.style.margin = '0';
    target.style.padding = '0';
  }

  private applyAutocompleteSuggestion(index?: number): void {
    if (!this.codeElement || !this.autocompleteRange || this.autocompleteItems.length === 0) return;

    const currentText = this.codeElement.textContent || '';
    const { start, end } = this.autocompleteRange;
    const selectedIndex = index ?? this.autocompleteIndex;
    const insert = this.autocompleteItems[selectedIndex]?.insert;
    if (!insert) return;
    const nextText = currentText.slice(0, start) + insert + currentText.slice(end);
    this.hideAutocomplete();
    this.codeElement.textContent = nextText;
    this.handleCodeInput(false, start + insert.length, false);
  }

  private hideAutocomplete(): void {
    this.autocompleteVisible = false;
    this.autocompleteMode = null;
    this.autocompleteItems = [];
    this.autocompleteIndex = 0;
    this.autocompleteRange = null;
    this.hideAutocompleteBackdrop();
    this.hideAutocompleteList();
  }

  private updateFileName(text: string): void {
    const fileNameElement = document.getElementById('fileName');
    if (!fileNameElement) return;

    const match = /\bsystem\s+([A-Za-z_][A-Za-z0-9_]*)/i.exec(text);
    fileNameElement.textContent = `${match?.[1] ?? 'Untitled-1'}.qify`;
  }
}
