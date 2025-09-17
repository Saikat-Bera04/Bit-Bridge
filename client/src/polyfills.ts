// Polyfills for browser compatibility
import { Buffer } from 'buffer';

// Set up global polyfills
// Ensure global and globalThis reference the window in browser
(window as any).global = (window as any).global || window;
(window as any).globalThis = (window as any).globalThis || window;

// Set up Buffer globally
(window as any).Buffer = Buffer;
(globalThis as any).Buffer = Buffer;

// Process polyfill
const existingProcess = (window as any).process || {};
(window as any).process = {
  ...existingProcess,
  env: existingProcess.env || { NODE_ENV: (import.meta as any).env?.MODE || 'development' },
  browser: true,
  nextTick: (fn: Function) => setTimeout(fn, 0),
};