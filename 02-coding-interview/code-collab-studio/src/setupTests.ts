import '@testing-library/jest-dom';

// Polyfill for performance.now in JSDOM environment if missing
if (typeof performance === 'undefined') {
  // @ts-ignore
  global.performance = { now: () => Date.now() };
}
