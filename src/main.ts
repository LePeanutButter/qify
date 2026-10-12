/**
 * Main entry point for Quality Attribute DSL IDE
 * Orchestrates the application logic using refactored services and components
 */

import { DSLVisualizer } from './core/domain/visualization/services/Visualizer';
import { ExportService } from './services/export.service';
import { EditorManager } from './hooks/use-editor';
import { updateStatus, triggerDownload, copyErrors, sanitizeFileName } from './utils/dom.utils';
import { onLanguageChange, setLanguage, type Language } from './services/i18n.service';
import {
  applyAccessibilityPreferences,
  getAccessibilityPreferences,
  updateAccessibilityPreference
} from './services/accessibility.service';

// Global instances
let visualizer: DSLVisualizer;
let exporter: ExportService;
let editor: EditorManager;

/**
 * Initialize the application
 */
function initializeApp(): void {
  try {
    applyAccessibilityPreferences(getAccessibilityPreferences());
    // 1. Initialize core components
    visualizer = new DSLVisualizer('canvas', 'visualization');
    exporter = new ExportService(visualizer);
    editor = new EditorManager(visualizer);
    const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement | null;
    if (languageSelect) {
      languageSelect.value = 'en';
      languageSelect.addEventListener('change', () => {
        setLanguage(languageSelect.value as Language);
      });
    }
    setLanguage('en');
    onLanguageChange(language => {
      visualizer.setLanguage(language);
      editor.refreshExampleLanguage();
    });
    
    // 2. Set up editor event listeners
    editor.setupEventListeners();
    
    // 3. Bind global UI actions to the window object for HTML access
    setupGlobalActions();
    setupWorkspaceResizer();
    
    // 4. Load default example
    editor.loadExample('basic');
    
    updateStatus('Ready');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize';
    updateStatus(`Error: ${errorMessage}`);
  }

  function setupWorkspaceResizer(): void {
    const workspace = document.querySelector<HTMLElement>('.workspace');
    const divider = document.getElementById('workspaceDivider');
    if (!workspace || !divider) return;

    let dragging = false;
    const updateEditorWidth = (clientX: number): void => {
      const bounds = workspace.getBoundingClientRect();
      const dividerWidth = divider.getBoundingClientRect().width;
      const styles = window.getComputedStyle(workspace);
      const contentLeft = bounds.left + Number.parseFloat(styles.paddingLeft);
      const contentRight = bounds.right - Number.parseFloat(styles.paddingRight);
      const minimumEditorWidth = 500;
      const minimumCanvasWidth = 560;
      const maximumEditorWidth = contentRight - contentLeft - dividerWidth - minimumCanvasWidth;
      const editorWidth = Math.max(minimumEditorWidth, Math.min(maximumEditorWidth, clientX - contentLeft));
      workspace.style.setProperty('--editor-width', `${editorWidth}px`);
    };

    divider.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      divider.setPointerCapture(event.pointerId);
      document.body.classList.add('is-resizing-workspace');
      event.preventDefault();
    });

    divider.addEventListener('pointermove', (event) => {
      if (dragging) updateEditorWidth(event.clientX);
    });

    const stopDragging = (event: PointerEvent): void => {
      if (!dragging) return;
      dragging = false;
      if (divider.hasPointerCapture(event.pointerId)) {
        divider.releasePointerCapture(event.pointerId);
      }
      document.body.classList.remove('is-resizing-workspace');
    };

    divider.addEventListener('pointerup', stopDragging);
    divider.addEventListener('pointercancel', stopDragging);
    divider.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const bounds = workspace.getBoundingClientRect();
      const currentWidth = workspace.querySelector<HTMLElement>('.left-panel')?.getBoundingClientRect().width ?? 0;
      updateEditorWidth(bounds.left + currentWidth + (event.key === 'ArrowRight' ? 24 : -24));
      event.preventDefault();
    });
  }
}

/**
 * Expose necessary functions to the global scope for HTML event attributes (onclick, etc.)
 */
function setupGlobalActions(): void {
  (window as any).toggleExamples = () => editor.toggleExamples();
  (window as any).loadExample = (name: string) => editor.loadExample(name);
  (window as any).downloadCode = () => {
    const codeElement = document.getElementById('code');
    const code = codeElement ? (codeElement.textContent || '') : '';
    if (code) {
      const program = visualizer.getCurrentProgram();
      const systemName = program?.system?.name ? sanitizeFileName(program.system.name) : 'code';
      triggerDownload(new Blob([code], { type: 'application/octet-stream' }), `${systemName}.qify`);
      updateStatus('Code downloaded');
    }
  };
  (window as any).importCode = () => (document.getElementById('fileInput') as HTMLInputElement)?.click();
  (window as any).copyErrors = () => copyErrors();
  (window as any).handleFileImport = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      file.text().then(content => {
        const area = document.getElementById('code');
        if (area) {
          area.textContent = content;
          editor.handleCodeInput(true);
          updateStatus('Code imported');
        }
      });
    }
  }

  const accessibilityModal = document.getElementById('accessibilityModal');
  const accessibilityBackdrop = document.getElementById('accessibilityBackdrop');
  (window as any).openAccessibility = () => {
    accessibilityModal?.classList.add('is-open');
    accessibilityBackdrop?.classList.add('is-open');
    accessibilityModal?.setAttribute('aria-hidden', 'false');
    accessibilityBackdrop?.setAttribute('aria-hidden', 'false');
    syncAccessibilityControls();
  };
  (window as any).closeAccessibility = () => {
    accessibilityModal?.classList.remove('is-open');
    accessibilityBackdrop?.classList.remove('is-open');
    accessibilityModal?.setAttribute('aria-hidden', 'true');
    accessibilityBackdrop?.setAttribute('aria-hidden', 'true');
  };

  const bindToggle = (id: string, key: 'theme' | 'contrast' | 'textSize' | 'motion'): void => {
    document.getElementById(id)?.addEventListener('change', event => {
      const checked = (event.target as HTMLInputElement).checked;
      if (key === 'contrast') updateAccessibilityPreference(key, checked ? 'high' : 'normal');
      if (key === 'textSize') updateAccessibilityPreference(key, checked ? 'large' : 'normal');
      if (key === 'motion') updateAccessibilityPreference(key, checked ? 'reduced' : 'normal');
      if (key === 'theme') updateAccessibilityPreference(key, checked ? 'light' : 'dark');
    });
  };
  bindToggle('lightModeToggle', 'theme');
  bindToggle('highContrastToggle', 'contrast');
  bindToggle('largeTextToggle', 'textSize');
  bindToggle('reducedMotionToggle', 'motion');
  function syncAccessibilityControls(): void {
    const preferences = getAccessibilityPreferences();
    const values: Record<string, boolean> = {
      lightModeToggle: preferences.theme === 'light',
      highContrastToggle: preferences.contrast === 'high',
      largeTextToggle: preferences.textSize === 'large',
      reducedMotionToggle: preferences.motion === 'reduced'
    };
    Object.entries(values).forEach(([id, checked]) => {
      const input = document.getElementById(id) as HTMLInputElement | null;
      if (input) input.checked = checked;
    });
  }
  syncAccessibilityControls();

  // Export actions
  (window as any).exportPNG = () => exporter.exportPNG();
  (window as any).exportSVG = () => exporter.exportSVG();
  (window as any).exportPDF = () => exporter.exportPDF();
  
  // Navigation actions
  (window as any).nextSlide = () => visualizer.nextAttribute();
  (window as any).previousSlide = () => visualizer.previousAttribute();
}

// Start the app when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
