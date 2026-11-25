const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1'];

/**
 * The hostname the app is served from. Kept in its own function so tests can stub it:
 * jsdom does not allow window.location.hostname to change inside a running test.
 * @returns {string}
 */
export function currentHostname() {
  return typeof window === 'undefined' ? '' : window.location.hostname;
}

/**
 * @param {string} hostname
 * @returns {boolean}
 */
export function isLocalHostname(hostname) {
  return LOCAL_HOSTNAMES.includes(hostname);
}
