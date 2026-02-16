// content.js (limpo) - MV3
// Objetivo: capturar authToken e projectId no lovable.dev de forma estável,
// sem depender de módulos de licença e evitando "Extension context invalidated".

(() => {
  'use strict';

  // --- utils ---
  const log = (...args) => console.log('[LeigosAcademy][content]', ...args);

  const isExtensionAlive = () => {
    try {
      return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
    } catch {
      return false;
    }
  };

  const safeStorageSet = async (obj) => {
    if (!isExtensionAlive()) return;
    try {
      await chrome.storage.local.set(obj);
    } catch (e) {
      // Context invalidated / extension reloaded
    }
  };

  const extractProjectIdFromUrl = (urlStr) => {
    try {
      const url = new URL(urlStr, location.origin);
      const m = url.pathname.match(/\/projects\/([0-9a-fA-F-]{10,})/);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  };

  const normalizeBearer = (value) => {
    if (!value) return null;
    const v = String(value).trim();
    if (!v) return null;
    // Accept both "Bearer xxx" and raw token
    return v.toLowerCase().startsWith('bearer ') ? v.slice(7).trim() : v;
  };

  // --- state ---
  let lastProjectId = null;
  let lastAuthToken = null;

  const persist = async () => {
    const payload = {
      ...(lastProjectId ? { projectId: lastProjectId } : {}),
      ...(lastAuthToken ? { authToken: lastAuthToken } : {}),
      lastSeenAt: Date.now(),
      lastUrl: location.href,
    };
    if (Object.keys(payload).length > 2) {
      await safeStorageSet(payload);
    }
  };

  // --- capture from URL on start + navigation changes ---
  const updateProjectFromLocation = async () => {
    const pid = extractProjectIdFromUrl(location.href);
    if (pid && pid !== lastProjectId) {
      lastProjectId = pid;
      log('projectId:', pid);
      await persist();
    }
  };

  // SPA navigation observer
  const hookHistory = () => {
    const _pushState = history.pushState;
    const _replaceState = history.replaceState;

    const onNav = () => {
      // microtask to allow location update
      Promise.resolve().then(updateProjectFromLocation);
    };

    history.pushState = function () {
      const r = _pushState.apply(this, arguments);
      onNav();
      return r;
    };

    history.replaceState = function () {
      const r = _replaceState.apply(this, arguments);
      onNav();
      return r;
    };

    window.addEventListener('popstate', onNav, { passive: true });
  };

  // --- capture auth token from fetch / XHR ---
  const hookFetch = () => {
    if (typeof window.fetch !== 'function') return;
    const originalFetch = window.fetch;

    window.fetch = async function () {
      try {
        const init = arguments[1] || {};
        const headers = init.headers;

        // Headers can be: Headers, array tuples, or plain object
        let auth = null;
        if (headers instanceof Headers) {
          auth = headers.get('authorization') || headers.get('Authorization');
        } else if (Array.isArray(headers)) {
          for (const [k, v] of headers) {
            if (String(k).toLowerCase() === 'authorization') {
              auth = v;
              break;
            }
          }
        } else if (headers && typeof headers === 'object') {
          auth = headers.authorization || headers.Authorization;
        }

        const token = normalizeBearer(auth);
        if (token && token !== lastAuthToken) {
          lastAuthToken = token;
          log('authToken capturado via fetch');
          await persist();
        }
      } catch {
        // ignore
      }
      return originalFetch.apply(this, arguments);
    };
  };

  const hookXHR = () => {
    if (!window.XMLHttpRequest) return;

    const XHR = window.XMLHttpRequest;
    const originalOpen = XHR.prototype.open;
    const originalSetHeader = XHR.prototype.setRequestHeader;

    XHR.prototype.open = function () {
      this.__la_url = arguments[1] || '';
      return originalOpen.apply(this, arguments);
    };

    XHR.prototype.setRequestHeader = function (name, value) {
      try {
        if (String(name).toLowerCase() === 'authorization') {
          const token = normalizeBearer(value);
          if (token && token !== lastAuthToken) {
            lastAuthToken = token;
            log('authToken capturado via XHR');
            // fire and forget
            persist();
          }
        }
      } catch {
        // ignore
      }
      return originalSetHeader.apply(this, arguments);
    };
  };

  // --- optional: ping background to confirm channel is alive (doesn't break if not) ---
  const pingBackground = async () => {
    if (!isExtensionAlive()) return;
    try {
      await chrome.runtime.sendMessage({ action: 'ping' });
    } catch {
      // ignore
    }
  };

  // --- init ---
  const init = async () => {
    await updateProjectFromLocation();
    hookHistory();
    hookFetch();
    hookXHR();
    pingBackground();
    log('iniciado');
  };

  // document_start is early; still safe
  try {
    init();
  } catch {
    // never throw in content script
  }
})();
