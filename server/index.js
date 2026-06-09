// Bootstrap for runtime compatibility on platforms using older Node runtimes.
if (typeof globalThis.File === 'undefined' && typeof globalThis.Blob !== 'undefined') {
  globalThis.File = class File extends Blob {
    constructor(chunks = [], name = '', options = {}) {
      super(chunks, options);
      this.name = String(name);
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

await import('./server.js');
