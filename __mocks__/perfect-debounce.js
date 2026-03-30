// CJS shim for perfect-debounce (v2 is ESM-only, incompatible with Jest CJS mode)
function debounce(fn) {
  return fn
}

module.exports = { debounce }
