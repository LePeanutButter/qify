#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, 'dist/index.html');

try {
  let html = fs.readFileSync(indexPath, 'utf-8');
  const original = html;
  
  // Replace /assets/ or '/assets/ with ./assets/
  html = html.replace(/(href|src)=(["'])\/?assets\//g, "$1=$2./assets/");

  // Remove crossorigin attributes which break file:// loads
  html = html.replace(/\s+crossorigin\b/gi, '');

  // Also update any literal occurrences inside bundled JS/CSS in dist/assets
  const assetsDir = path.resolve(__dirname, 'dist', 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    for (const file of files) {
      const full = path.join(assetsDir, file);
      if (!fs.statSync(full).isFile()) continue;
      if (!/\.(js|css|html|map)$/.test(file)) continue;
      try {
        let content = fs.readFileSync(full, 'utf-8');
        const originalContent = content;
        // Replace quoted or unquoted occurrences like "assets/... or '/assets/ or `assets/... or /assets/
        content = content.replace(/(["'`])\/?assets\//g, '$1./assets/');
        // Also replace any bare /assets/ occurrences (leading slash)
        content = content.replace(/(^|\W)\/assets\//g, '$1./assets/');
        if (content !== originalContent) {
          fs.writeFileSync(full, content, 'utf-8');
          console.log(`Patched asset paths in ${full}`);
        }
      } catch (err) {
        console.warn(`Failed patching ${full}: ${err.message}`);
      }
    }
  }

  // Inline main CSS and module script into index.html to avoid file:// network errors
  try {
    // Inline stylesheet
    html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=(["'])(\.\/assets\/[\w\-\.]+)\1[^>]*>/i, (m, q, href) => {
      const p = path.resolve(__dirname, 'dist', href.replace(/^\.\//, ''));
      if (fs.existsSync(p)) {
        const css = fs.readFileSync(p, 'utf-8');
        return `<style>${css}</style>`;
      }
      return m;
    });

    // Inline module script
    html = html.replace(/<script[^>]*type=["']module["'][^>]*src=(["'])(\.\/assets\/[\w\-\.]+)\1[^>]*>\s*<\/script>/i, (m, q, src) => {
      const p = path.resolve(__dirname, 'dist', src.replace(/^\.\//, ''));
      if (fs.existsSync(p)) {
        let js = fs.readFileSync(p, 'utf-8');
        // Remove sourceMappingURL comments to avoid console noise
        js = js.replace(/\/\/# sourceMappingURL=.*$/gm, '');
        // Silence console methods when opened via file:// to avoid logs
        const silence = `(function(){try{if(location && location.protocol==='file:'){['log','info','warn','error','debug'].forEach(function(m){console[m]=function(){}});}}catch(e){}})();\n`;
        return `<script type="module">${silence}${js}</script>`;
      }
      return m;
    });
  } catch (err) {
    console.warn('Inlining failed:', err.message);
  }

  if (html !== original) {
    fs.writeFileSync(indexPath, html, 'utf-8');
    console.log('Fixed asset paths and removed crossorigin in dist/index.html');
  } else {
    console.log('No changes needed in dist/index.html');
  }
} catch (err) {
  console.error('Error fixing asset paths:', err.message);
  process.exit(1);
}
