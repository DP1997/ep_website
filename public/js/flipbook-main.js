// flipbook-main.js - Slim entry point that loads the flipbook modules
// This file is intentionally small to avoid the 4096-token read_file limit.
// All logic lives in flipbook-events.js and flipbook-init.js.
(function () {
  'use strict';
  // No-op: actual initialization happens in flipbook-init.js
  // This file exists only as a stable entry point for script loading order.
  console.log('[flipbook-main] entry point loaded');
})();
