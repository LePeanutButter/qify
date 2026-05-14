/**
 * Main entry point for Quality Attribute DSL IDE
 * Orchestrates the application logic using refactored services and components
 */

import { DSLVisualizer } from './core/domain/visualization/services/Visualizer';
import { ExportService } from './services/export.service';
import { EditorManager } from './hooks/use-editor';
import { updateStatus, triggerDownload, copyErrors } from './utils/dom.utils';

// Global instances
let visualizer: DSLVisualizer;
let exporter: ExportService;
let editor: EditorManager;

/**
 * Initialize the application
 */
function initializeApp(): void {
  try {
    // 1. Initialize core components
    visualizer = new DSLVisualizer('canvas', 'visualization');
    exporter = new ExportService(visualizer);
    editor = new EditorManager(visualizer);
    
    // 2. Set up editor event listeners
    editor.setupEventListeners();
    
    // 3. Bind global UI actions to the window object for HTML access
    setupGlobalActions();
    
    // 4. Load default example
    editor.loadExample('basic');
    
    updateStatus('Ready');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize';
    updateStatus(`Error: ${errorMessage}`);
  }
}

/**
 * Expose necessary functions to the global scope for HTML event attributes (onclick, etc.)
 */
function setupGlobalActions(): void {
  (window as any).toggleExamples = () => editor.toggleExamples();
  (window as any).loadExample = (name: string) => editor.loadExample(name);
  (window as any).downloadCode = () => {
    const code = (document.getElementById('code') as HTMLTextAreaElement)?.value;
    if (code) {
      triggerDownload(new Blob([code], { type: 'text/plain' }), 'code.qify');
      updateStatus('Code downloaded');
    }
  };
  (window as any).importCode = () => (document.getElementById('fileInput') as HTMLInputElement)?.click();
  (window as any).copyErrors = () => copyErrors();
  (window as any).handleFileImport = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      file.text().then(content => {
        const area = document.getElementById('code') as HTMLTextAreaElement;
        if (area) {
          area.value = content;
          editor.handleCodeInput();
          updateStatus('Code imported');
        }
      });
    }
  };
  
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
