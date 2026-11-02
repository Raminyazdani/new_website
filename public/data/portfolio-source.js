(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./cv-adapter.js'));
  else root.PortfolioData = Object.assign(root.PortfolioData || {}, factory(root.PortfolioData || {}));
}(typeof window !== 'undefined' ? window : globalThis, function (adapters) {
  'use strict';
  class PortfolioSourceError extends Error {
    constructor(message, code, status) { super(message); this.name = 'PortfolioSourceError'; this.code = code; this.status = status || 0; }
  }
  class PortfolioAuthError extends PortfolioSourceError {
    constructor() { super('Authentication required.', 'AUTH_REQUIRED', 401); this.name = 'PortfolioAuthError'; }
  }
  async function load(options) {
    options = options || {};
    var adapter = options.adapter || adapters.adaptCV;
    if (typeof adapter !== 'function') throw new PortfolioSourceError('CV adapter is unavailable.', 'ADAPTER_UNAVAILABLE');
    var raw;
    if (options.source) {
      if (typeof options.source !== 'function') throw new PortfolioSourceError('Invalid CV source.', 'SOURCE_INVALID');
      // Alternate transports own their parsing and return a raw document.
      raw = await options.source({ signal: options.signal });
    } else {
      var fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch : null);
      if (!fetchImpl) throw new PortfolioSourceError('CV transport is unavailable.', 'TRANSPORT_UNAVAILABLE');
      var response = await fetchImpl(options.url || '/api/cv', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }, signal: options.signal });
      if (response.status === 401) throw new PortfolioAuthError();
      if (!response.ok) throw new PortfolioSourceError('CV request failed.', 'HTTP_ERROR', response.status);
      try { raw = await response.json(); } catch (_) { throw new PortfolioSourceError('CV response is not valid JSON.', 'PARSE_ERROR', response.status); }
    }
    var model = await adapter(raw);
    if (!model || model.version !== 1) throw new PortfolioSourceError('Adapter must return PortfolioModel v1.', 'MODEL_INVALID');
    return { raw: raw, model: model };
  }
  return { load: load, PortfolioSourceError: PortfolioSourceError, PortfolioAuthError: PortfolioAuthError };
}));
