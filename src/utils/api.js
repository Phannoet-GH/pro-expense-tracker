/**
 * Safely parses fetch Response into JSON without throwing 'Unexpected end of JSON input'.
 * Handles empty responses (204), HTML proxy/rewrite errors, and malformed bodies.
 */
export async function parseResponse(res) {
  if (!res) {
    return { ok: false, status: 0, isOffline: true, data: { error: 'No response from server' } };
  }

  let text = '';
  try {
    text = await res.text();
  } catch (err) {
    return { ok: res.ok, status: res.status, data: { error: err.message } };
  }

  if (!text || !text.trim()) {
    return {
      ok: res.ok,
      status: res.status,
      data: res.ok
        ? {}
        : { error: `Server error (${res.status} ${res.statusText || 'No Content'}). Backend service may be unreachable.` }
    };
  }

  const trimmed = text.trim();
  const contentType = (res.headers && res.headers.get('content-type')) || '';
  const isHtml =
    contentType.includes('text/html') ||
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    trimmed.startsWith('<head');

  if (isHtml) {
    return {
      ok: false,
      status: res.status === 200 ? 404 : res.status,
      isHtml: true,
      isOffline: true,
      data: { error: 'Backend API service is offline or unreachable on this host.' }
    };
  }

  try {
    const data = JSON.parse(text);
    if (!res.ok && !data.error && data.message) {
      data.error = data.message;
    }
    if (!res.ok && !data.error) {
      data.error = `Request failed with HTTP ${res.status} (${res.statusText || 'Error'})`;
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: res.status,
      data: { error: `Server returned invalid JSON response (HTTP ${res.status})` }
    };
  }
}

/**
 * Resilient API fetch that:
 * 1. Checks VITE_API_BASE_URL if configured.
 * 2. Only tries http://127.0.0.1:5001 when running locally on localhost/127.0.0.1 to avoid
 *    Mixed Content errors and request hangs in hosted environments.
 * 3. Incorporates a fast timeout (3.5s) to fail quickly if the server is unresponsive.
 */
export async function apiFetch(path, options = {}) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return fetch(path, options);
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const envBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');

  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]');

  const requestTimeout = options.timeout || 15000;

  const fetchWithTimeout = async (url, fetchOptions, timeoutMs = requestTimeout) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      const timeoutErr = new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
      timeoutErr.name = 'TimeoutError';
      try {
        controller.abort(timeoutErr);
      } catch {
        controller.abort();
      }
    }, timeoutMs);

    try {
      const mergedOptions = {
        ...fetchOptions,
        signal: fetchOptions.signal || controller.signal
      };
      const res = await fetch(url, mergedOptions);
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      if (
        err.name === 'AbortError' ||
        err.name === 'TimeoutError' ||
        (err.message && err.message.toLowerCase().includes('abort'))
      ) {
        const enhancedError = new Error(
          err.message && !err.message.includes('without reason')
            ? err.message
            : `Network request timed out (${Math.round(timeoutMs / 1000)}s). The server took too long to respond.`
        );
        enhancedError.name = 'TimeoutError';
        throw enhancedError;
      }
      throw err;
    }
  };

  // If remote backend configured (e.g. Render / Railway / Fly.io)
  if (envBase) {
    try {
      return await fetchWithTimeout(`${envBase}${normalizedPath}`, options, requestTimeout);
    } catch (err) {
      console.warn(`[apiFetch] Configured backend (${envBase}) failed:`, err.message);
      throw err;
    }
  }

  // Otherwise, try relative path first
  try {
    const res = await fetchWithTimeout(normalizedPath, options, requestTimeout);

    // If static host returns 404 or 405 Method Not Allowed (Vercel static SPA rewrites)
    if (res.status === 404 || res.status === 405) {
      if (isLocal) {
        console.warn(`[apiFetch] ${normalizedPath} returned HTTP ${res.status}. Retrying locally against 127.0.0.1:5001...`);
        return await fetchWithTimeout(`http://127.0.0.1:5001${normalizedPath}`, options, requestTimeout);
      }
      return res;
    }
    return res;
  } catch (err) {
    if (isLocal) {
      console.warn(`[apiFetch] Local relative fetch error: ${err.message}. Retrying against 127.0.0.1:5001...`);
      return await fetchWithTimeout(`http://127.0.0.1:5001${normalizedPath}`, options, requestTimeout);
    }
    throw err;
  }
}
