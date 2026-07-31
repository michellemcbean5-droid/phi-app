// Universal no-op stub for native-only modules when running on web.
// Any import (named, default, class, constant) resolves to a permissive proxy
// that returns itself for any property access, call, or construction.
// This lets the app render in a browser for testing; native builds never see this file.

const handler = {
  get(target, key) {
    if (key === '__esModule') return true;
    if (key === Symbol.toPrimitive) return () => 0;
    if (key === 'then') return undefined; // not thenable — avoids hangs
    return proxied;
  },
  apply() {
    return proxied;
  },
  construct() {
    return proxied;
  },
};

const base = function () {};
const proxied = new Proxy(base, handler);

module.exports = proxied;
module.exports.default = proxied;
