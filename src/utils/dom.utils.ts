/**
 * Utility functions for DOM and text processing
 */

/**
 * Escape special regex characters
 */
export function escapeRegExp(string: string): string {
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

/**
 * Escape HTML entities to prevent XSS and rendering issues
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Sanitize a string for use as a filename
 */
export function sanitizeFileName(value: string): string {
  return value
    .trim()
    .replaceAll(/[^a-zA-Z0-9_-]+/g, '_')
    .replaceAll(/^_+|_+$/g, '');
}

/**
 * Trigger a file download in the browser
 */
export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Update the status message in the UI
 */
export function updateStatus(message: string): void {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

/**
 * Show errors in the UI
 */
export function showErrors(errors: { message: string; severity: string }[]): void {
  const errorContainer = document.getElementById('errorList');
  const errorPanel = document.getElementById('errorPanel');
  if (errorContainer) {
    errorContainer.innerHTML = errors
      .map(err => `<div class="error-item ${err.severity}">${err.message}</div>`)
      .join('');
    errorPanel?.classList.add('show');
  }
}

/**
 * Clear errors from the UI
 */
export function clearErrors(): void {
  const errorContainer = document.getElementById('errorList');
  const errorPanel = document.getElementById('errorPanel');
  if (errorContainer) {
    errorContainer.innerHTML = '';
    errorPanel?.classList.remove('show');
  }
}

/**
 * Clear the canvas container
 */
export function clearCanvas(): void {
  const canvasContainer = document.getElementById('visualization');
  if (canvasContainer) {
    canvasContainer.innerHTML = '';
  }
}

/**
 * Copy errors from the UI to clipboard
 */
export function copyErrors(): void {
  const errorList = document.getElementById('errorList');
  if (errorList) {
    const text = errorList.innerText;
    navigator.clipboard.writeText(text).then(() => {
      updateStatus('Errors copied to clipboard');
    });
  }
}
