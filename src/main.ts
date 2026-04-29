/**
 * Main entry point for Quality Attribute DSL IDE
 * Integrates all components and initializes the application
 */

import { DSLParser } from './core/domain/dsl/services/DSLParser';
import type { ValidationError } from './core/domain/dsl/types/DSL.types';
import { DSLVisualizer } from './core/domain/visualization/services/Visualizer';
import JSZip from 'jszip';

// Global instances
let visualizer: DSLVisualizer;

// Example DSL templates
const examples = {
  basic: `system Ecommerce

attribute PerformanceCheckout {
  artifact: "CheckoutService",
  category: PerformanceEfficiency.TimeBehaviour,
  
  source: "external user",
  stimulus: "1000 concurrent users",
  environment: "peak hours",
  response: "response time < 2s",
  measure: "latency percentile p95"
}`,

  ecommerce: `system EcommercePlatform

attribute CheckoutPerformance {
  artifact: "CheckoutService",
  category: PerformanceEfficiency.TimeBehaviour,
  
  source: "customer",
  stimulus: "1000 concurrent checkout requests",
  environment: "peak shopping season",
  response: "complete checkout within 3 seconds",
  measure: "95th percentile response time"
}

attribute DataIntegrity {
  artifact: "PaymentGateway",
  category: Security.Integrity,
  
  source: "payment processor",
  stimulus: "transaction processing",
  environment: "normal operations",
  response: "encrypted data transmission",
  measure: "AES-256 encryption standard"
}`,

  healthcare: `system HealthcareSystem

attribute PatientDataAvailability {
  artifact: "ElectronicHealthRecord",
  category: Reliability.Availability,
  
  source: "medical staff",
  stimulus: "emergency patient access",
  environment: "24/7 operations",
  response: "system uptime 99.99%",
  measure: "monthly availability percentage"
}

attribute UsabilityForClinicians {
  artifact: "PatientDashboard",
  category: Usability.Operability,
  
  source: "healthcare providers",
  stimulus: "patient data entry",
  environment: "clinical workflow",
  response: "complete records in < 2 minutes",
  measure: "average task completion time"
}`,

  iot: `system IoTMonitoring

attribute RealTimeProcessing {
  artifact: "DataProcessor",
  category: PerformanceEfficiency.TimeBehaviour,
  
  source: "sensor network",
  stimulus: "10,000 concurrent data streams",
  environment: "normal operations",
  response: "process data within 100ms",
  measure: "end-to-end latency"
}

attribute Scalability {
  artifact: "CloudInfrastructure",
  category: PerformanceEfficiency.Capacity,
  
  source: "system administrator",
  stimulus: "100% sensor growth",
  environment: "peak usage",
  response: "auto-scale within 5 minutes",
  measure: "horizontal scaling time"
}`
};

/**
 * Initialize the application
 */
function initializeApp(): void {
  try {
    // Initialize components
    visualizer = new DSLVisualizer('canvas', 'visualization');
    // DSLParser is used statically, no need to instantiate
    
    // Set up event listeners
    setupEventListeners();
    
    // Load default example
    loadExample('basic');
    
    updateStatus('Ready');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize';
    updateStatus(`Error: ${errorMessage}`);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners(): void {
  const codeTextarea = document.getElementById('code') as HTMLTextAreaElement;
  const examplesDiv = document.getElementById('examples');
  
  if (codeTextarea) {
    codeTextarea.addEventListener('input', handleCodeInput);
    codeTextarea.addEventListener('keyup', handleCodeInput);
    codeTextarea.addEventListener('scroll', syncScroll);
    codeTextarea.addEventListener('keydown', handleKeyDown);
    
    // Add specific listener for Enter key
    codeTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        // Force immediate update on Enter
        globalThis.setTimeout(() => handleCodeInput(), 0);
      }
    });
  }
  
  // Close examples when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as Element;
    if (examplesDiv && !target?.closest('.header') && !target?.closest('.examples')) {
      examplesDiv.classList.remove('show');
    }
  });
}

/**
 * Handle code input with syntax highlighting
 */
function handleCodeInput(): void {
  const codeTextarea = document.getElementById('code') as HTMLTextAreaElement;
  const syntaxHighlightDiv = document.getElementById('syntaxHighlight');
  const lineNumbersDiv = document.getElementById('lineNumbers');
  
  if (codeTextarea && syntaxHighlightDiv) {
    const text = codeTextarea.value;
    
    
    // Auto-validate first to get errors
    const validationErrors = getValidationErrors(text);
    
    const highlightedText = syntaxHighlight(text, validationErrors);
    syntaxHighlightDiv.innerHTML = highlightedText;
    
    
    // Update line numbers with wrap detection
    if (lineNumbersDiv) {
      const lines = text.split('\n');
      let lineNumbersHTML = '';
      
      lines.forEach((line, index) => {
        if (line.trim() === '') {
          // Empty line - still show number
          lineNumbersHTML += `<div>${index + 1}</div>`;
        } else {
          // Create a temporary element to measure actual line height with wrap
          const tempDiv = document.createElement('div');
          tempDiv.style.cssText = `
            position: absolute;
            visibility: hidden;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: "Fira Code", monospace;
            font-size: 14px;
            line-height: 1.5;
            width: ${codeTextarea.clientWidth}px;
            padding: 0;
            margin: 0;
            box-sizing: border-box;
            text-align: left;
            letter-spacing: normal;
            tab-size: 4;
          `;
          tempDiv.textContent = line;
          document.body.appendChild(tempDiv);
          
          const height = tempDiv.offsetHeight;
          const lineHeight = 21; // 14px * 1.5
          const wrappedLines = Math.round(height / lineHeight);
          
          tempDiv.remove();
          
          // Add line number for the first line, empty divs for wrapped lines
          lineNumbersHTML += `<div>${index + 1}</div>`;
          for (let i = 1; i < wrappedLines; i++) {
            lineNumbersHTML += `<div>&nbsp;</div>`;
          }
        }
      });
      
      lineNumbersDiv.innerHTML = lineNumbersHTML;
    }
    
    // Force scroll to bottom if content was added (like pressing Enter)
    const currentLines = text.split('\n').length;
    const previousLines = Number.parseInt(syntaxHighlightDiv.dataset['lineCount'] ?? '0');
    
    if (currentLines > previousLines) {
      // New line was added, scroll to bottom
      syntaxHighlightDiv.scrollTop = syntaxHighlightDiv.scrollHeight;
      if (lineNumbersDiv) {
        lineNumbersDiv.scrollTop = lineNumbersDiv.scrollHeight;
      }
    }
    
    syntaxHighlightDiv.dataset['lineCount'] = currentLines.toString();
    
    // Auto-validate
    validate();
    
    // Auto-render if there's code, auto-clear if empty
    if (text.trim()) {
      render();
    } else {
      clearCanvas();
    }
  }
}

/**
 * Get validation errors from DSLParser
 */
function getValidationErrors(text: string): ValidationError[] {
  const parseResult = DSLParser.parseDSL(text);
  return parseResult.errors || [];
}

/**
 * Sync scroll between textarea and syntax highlight
 */
function syncScroll(): void {
  const codeTextarea = document.getElementById('code') as HTMLTextAreaElement;
  const syntaxHighlightDiv = document.getElementById('syntaxHighlight');
  const lineNumbersDiv = document.getElementById('lineNumbers');
  
  if (codeTextarea && syntaxHighlightDiv) {
    syntaxHighlightDiv.scrollTop = codeTextarea.scrollTop;
    syntaxHighlightDiv.scrollLeft = codeTextarea.scrollLeft;
    
    if (lineNumbersDiv) {
      lineNumbersDiv.scrollTop = codeTextarea.scrollTop;
    }
  }
}

/**
 * Handle keyboard shortcuts (Tab, Shift+Tab)
 */
function handleKeyDown(e: KeyboardEvent): void {
  const codeTextarea = e.target as HTMLTextAreaElement;
  
  if (e.key === 'Tab') {
    e.preventDefault();
    
    const start = codeTextarea.selectionStart;
    const end = codeTextarea.selectionEnd;
    const value = codeTextarea.value;
    
    if (e.shiftKey) {
      // Shift+Tab: Remove indentation
      const lines = value.split('\n');
      const currentLineIndex = value.substring(0, start).split('\n').length - 1;
      const currentLine = lines[currentLineIndex];

      if (currentLine?.startsWith('  ')) {
        lines[currentLineIndex] = currentLine.substring(2);
        codeTextarea.value = lines.join('\n');
        codeTextarea.selectionStart = Math.max(0, start - 2);
        codeTextarea.selectionEnd = Math.max(0, end - 2);
        handleCodeInput();
      }
    } else {
      // Tab: Add indentation
      codeTextarea.setRangeText('  ', start, end, 'end');
      handleCodeInput();
    }
  }
}

/**
 * Basic syntax highlighting
 */
function syntaxHighlight(text: string, errors: ValidationError[] = []): string {
  // Step 1: Escape HTML entities FIRST
  let processed = escapeHtml(text);

  const keywords = ['system', 'attribute', 'artifact', 'category', 'source', 'stimulus', 'environment', 'response', 'measure'];
  const categories = [
    'PerformanceEfficiency.TimeBehaviour',
    'PerformanceEfficiency.ResourceUtilization',
    'PerformanceEfficiency.Capacity',
    'Reliability.Maturity',
    'Reliability.Availability',
    'Reliability.FaultTolerance',
    'Reliability.Recoverability',
    'Usability.Understandability',
    'Usability.Learnability',
    'Usability.Operability',
    'Usability.UserErrorProtection',
    'Usability.Accessibility',
    'Usability.UserInterfaceAesthetics',
    'Security.Confidentiality',
    'Security.Integrity',
    'Security.NonRepudiation',
    'Security.Accountability',
    'Security.Authenticatic',
    'Compatibility.Coexistence',
    'Compatibility.Interoperability',
    'Maintainability.Modularity',
    'Maintainability.Reusability',
    'Maintainability.Analyzability',
    'Maintainability.Modifiability',
    'Maintainability.Testability'
  ];
  
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
  
  // Step 3: Highlight system and attribute names (before keywords to avoid conflicts)
  processed = processed.replaceAll(/\bsystem\s+([A-Za-z_]\w*)\b/g, 'system <span class="number">$1</span>');
  processed = processed.replaceAll(/\battribute\s+([A-Za-z_]\w*)\b/g, 'attribute <span class="number">$1</span>');
  
  // Step 4: Highlight keywords - but NOT inside placeholders
  keywords.forEach(keyword => {
    // Split by placeholders and process each part separately
    const parts = processed.split(/(__STRING_\d+__)/);
    const processedParts = parts.map((part, index) => {
      // Even indices are outside placeholders, odd indices are placeholders
      if (index % 2 === 0) {
        // This part is outside placeholders - safe to highlight keywords
        return part.replaceAll(new RegExp(String.raw`\b${escapeRegExp(keyword)}\b`, 'g'), `<span class="keyword">${keyword}</span>`);
      }
      // This part is inside a placeholder - don't modify
      return part;
    });
    processed = processedParts.join('');
  });
  
  // Step 5: Highlight categories (longer categories first to avoid partial matches)
  const sortedCategories = [...categories];
  sortedCategories.sort((a, b) => b.length - a.length);
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
    processed = highlightErrors(processed, text, errors);
  }
  
  return processed;
}

/**
 * Highlight errors with red underline
 */
function highlightErrors(processedText: string, originalText: string, errors: ValidationError[]): string {
  let result = processedText;
  
  errors.forEach(error => {
    if (error.line && error.column) {
      const lines = originalText.split('\n');
      if (error.line <= lines.length) {
        const errorLine = lines[error.line - 1];
        if (!errorLine) {
          return;
        }

        const errorChar = errorLine[error.column - 1];
        
        if (errorChar) {
          // Find the character in the processed text and wrap it with error span
          const charRegex = new RegExp(escapeRegExp(errorChar), 'g');
          let matchCount = 0;
          result = result.replace(charRegex, (match) => {
            matchCount++;
            // Only highlight the character at the error position
            if (matchCount === error.column) {
              return `<span class="error-underline">${match}</span>`;
            }
            return match;
          });
        }
      }
    }
  });
  
  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  let escaped = '';
  const specialCharacters = new Set(['^', '$', '.', '*', '+', '?', '(', ')', '[', ']', '{', '}', '|', String.fromCodePoint(92)]);

  for (const character of string) {
    if (specialCharacters.has(character)) {
      escaped += String.fromCodePoint(92);
    }

    escaped += character;
  }

  return escaped;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Toggle examples dropdown
 */
function toggleExamples(): void {
  const examplesDiv = document.getElementById('examples');
  if (examplesDiv) {
    examplesDiv.classList.toggle('show');
  }
}

/**
 * Load an example DSL
 */
function loadExample(exampleName: string): void {
  const codeTextarea = document.getElementById('code') as HTMLTextAreaElement;
  if (codeTextarea && examples[exampleName as keyof typeof examples]) {
    codeTextarea.value = examples[exampleName as keyof typeof examples];
    handleCodeInput();
  }
}

/**
 * Download current code as .qify file
 */
function downloadCode(): void {
  const codeTextarea = document.getElementById('code') as HTMLTextAreaElement;
  if (!codeTextarea) return;
  
  const code = codeTextarea.value;
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'code.qify';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  
  updateStatus('Code downloaded as .qify');
}

/**
 * Open file import dialog
 */
function importCode(): void {
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
  }
}

/**
 * Handle file import
 */
function handleFileImport(event: Event): void {
  const fileInput = event.target as HTMLInputElement;
  const file = fileInput.files?.[0];
  
  if (file) {
    file.text().then((content) => {
      const codeTextarea = document.getElementById('code') as HTMLTextAreaElement;
      if (codeTextarea) {
        codeTextarea.value = content;
        handleCodeInput();
        updateStatus('Code imported from .qify');
      }
    }).catch((error) => {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      updateStatus(`Error: ${errorMessage}`);
    });
  }
  
  // Reset file input to allow importing the same file again
  fileInput.value = '';
}

/**
 * Render DSL visualization
 */
function render(): void {
  const codeTextarea = document.getElementById('code') as HTMLTextAreaElement;
  if (!codeTextarea || !visualizer) return;
  
  try {
    updateStatus('Rendering...');
    clearErrors();
    
    const dslText = codeTextarea.value;
    const result = visualizer.visualize(dslText);
    
    if (result.success) {
      updateStatus('Rendered successfully');
    } else {
      showErrors(result.errors);
      updateStatus('Error: Invalid DSL');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    showErrors([{ message: errorMessage, severity: 'error' }]);
    updateStatus(`Error: ${errorMessage}`);
  }
}

/**
 * Validate DSL syntax
 */
function validate(): void {
  const codeTextarea = document.getElementById('code') as HTMLTextAreaElement;
  if (!codeTextarea) return;
  
  try {
    updateStatus('Validating...');
    clearErrors();
    
    const dslText = codeTextarea.value;
    const result = DSLParser.parseDSL(dslText);
    
    if (result.success) {
      updateStatus('Valid DSL');
    } else {
      showErrors(result.errors);
      updateStatus('Validation failed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    showErrors([{ message: errorMessage, severity: 'error' }]);
    updateStatus(`Error: ${errorMessage}`);
  }
}

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .replaceAll(/[^a-zA-Z0-9_-]+/g, '_')
    .replaceAll(/^_+|_+$/g, '');
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export canvas as PNG with high resolution
 */
async function exportPNG(): Promise<void> {
  if (!visualizer) return;
  
  try {
    const program = visualizer.getCurrentProgram();
    const navigationState = visualizer.getAttributeNavigationState();
    const systemName = sanitizeFileName(program?.system.name ?? 'quality-attributes');

    if (navigationState.total > 1 && program) {
      const zip = new JSZip();
      const originalIndex = navigationState.current - 1;

      for (let index = 0; index < navigationState.total; index++) {
        visualizer.setCurrentAttributeIndex(index);

        const attribute = program.allAttributes[index];
        const attributeName = sanitizeFileName(attribute?.name ?? `attribute_${index + 1}`);
        const dataUrl = await visualizer.exportPNG();
        const base64 = dataUrl.split(',')[1] ?? '';
        zip.file(`${systemName}_${attributeName}.png`, base64, { base64: true });
      }

      visualizer.setCurrentAttributeIndex(originalIndex);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(zipBlob, `${systemName}_attributes.zip`);
    } else {
      const dataUrl = await visualizer.exportPNG();
      const response = await globalThis.fetch(dataUrl);
      const blob = await response.blob();
      triggerDownload(blob, `${systemName}.png`);
    }
    updateStatus('Exported PNG');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Export failed';
    updateStatus(`Error: ${errorMessage}`);
  }
}

/**
 * Export visualization as SVG
 */
async function exportSVG(): Promise<void> {
  if (!visualizer) return;
  
  try {
    const program = visualizer.getCurrentProgram();
    const navigationState = visualizer.getAttributeNavigationState();
    const systemName = sanitizeFileName(program?.system.name ?? 'quality-attributes');

    if (navigationState.total > 1 && program) {
      const zip = new JSZip();
      const originalIndex = navigationState.current - 1;

      // Hide navigation buttons before export
      const originalButtonState = visualizer.hideNavigationButtons();

      // Process all attributes in the array
      for (let index = 0; index < program.allAttributes.length; index++) {
        visualizer.setCurrentAttributeIndex(index);

        const attribute = program.allAttributes[index];
        
        // Use the actual attribute name (should now be extracted correctly)
        const attributeName = sanitizeFileName(attribute?.name ?? `attribute_${index + 1}`);
        const fileName = `${systemName}_${attributeName}.svg`;
        zip.file(fileName, visualizer.exportSVG());
      }

      // Restore navigation buttons after export (but keep canvas centered)
      visualizer.showNavigationButtons(originalButtonState);
      visualizer.setCurrentAttributeIndex(originalIndex);
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(zipBlob, `${systemName}_all_attributes.zip`);
      updateStatus(`Exported ${program.allAttributes.length} attributes as SVG batch`);
    } else {
      // Hide navigation buttons for single export too
      const originalButtonState = visualizer.hideNavigationButtons();
      
      const svgText = visualizer.exportSVG();
      triggerDownload(new Blob([svgText], { type: 'image/svg+xml' }), `${systemName}.svg`);
      
      // Restore navigation buttons (but keep canvas centered)
      visualizer.showNavigationButtons(originalButtonState);
      updateStatus('Exported SVG');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Export failed';
    updateStatus(`Error: ${errorMessage}`);
  }
}

/**
 * Navigate to next slide
 */
function nextSlide(): void {
  const state = visualizer?.nextAttribute();
  if (state) {
    updateSlideCounter(state.current);
  }
}

/**
 * Navigate to previous slide
 */
function previousSlide(): void {
  const state = visualizer?.previousAttribute();
  if (state) {
    updateSlideCounter(state.current);
  }
}

/**
 * Update slide counter display
 */
function updateSlideCounter(current: number): void {
  const currentSpan = document.querySelector('.slide-counter .current');
  if (currentSpan) {
    currentSpan.textContent = current.toString();
  }
}

/**
 * Clear the canvas
 */
function clearCanvas(): void {
  if (!visualizer) return;
  
  try {
    visualizer.clearCanvas();
    updateStatus('Canvas cleared');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Clear failed';
    updateStatus(`Error: ${errorMessage}`);
  }
}

/**
 * Update status message
 */
function updateStatus(message: string): void {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = 'status';
    
    if (message.includes('Error')) {
      statusElement.classList.add('error');
    } else if (message.includes('success') || message.includes('Valid')) {
      statusElement.classList.add('success');
    }
  }
}

/**
 * Show error messages
 */
function showErrors(errors: ValidationError[]): void {
  const errorPanel = document.getElementById('errorPanel');
  const errorList = document.getElementById('errorList');
  if (errorPanel && errorList && errors.length > 0) {
    errorList.innerHTML = errors.map(error => 
      `<div class="error-item">${error.message}</div>`
    ).join('');
    errorPanel.classList.add('show');
  }
}

/**
 * Clear error messages
 */
function clearErrors(): void {
  const errorPanel = document.getElementById('errorPanel');
  const errorList = document.getElementById('errorList');
  if (errorPanel && errorList) {
    errorPanel.classList.remove('show');
    errorList.innerHTML = '';
  }
}

/**
 * Copy error messages to clipboard
 */
function copyErrors(): void {
  const errorList = document.getElementById('errorList');
  if (errorList) {
    const errorText = errorList.innerText;
    navigator.clipboard.writeText(errorText).then(() => {
      updateStatus('Errors copied to clipboard');
    }).catch(() => {
      updateStatus('Failed to copy errors');
    });
  }
}

// Make functions globally available
Object.assign(globalThis as typeof globalThis & Record<string, unknown>, {
  toggleExamples,
  loadExample,
  render,
  validate,
  exportPNG,
  exportSVG,
  clearCanvas,
  downloadCode,
  importCode,
  handleFileImport,
  copyErrors,
  nextSlide,
  previousSlide
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
