/**
 * Safely parses fetch Response into JSON without throwing 'Unexpected end of JSON input'.
 * Handles empty responses (204), HTML proxy errors, and malformed bodies.
 */
export async function parseResponse(res) {
  if (!res) {
    return { ok: false, status: 0, data: { error: 'No response from server' } };
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
      data: { error: text || `Server returned invalid JSON (HTTP ${res.status})` }
    };
  }
}

/**
 * Resilient API fetch that automatically falls back to direct backend URL (http://127.0.0.1:5001)
 * if the dev proxy or static host returns 404, 405 (Method Not Allowed), or network errors.
 */
export async function apiFetch(path, options = {}) {
  const directBase = 'http://127.0.0.1:5001';

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return fetch(path, options);
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // 1. Try relative path first
  try {
    const res = await fetch(normalizedPath, options);
    // If the dev server or static host returns 404 or 405 (Method Not Allowed):
    if (res.status === 404 || res.status === 405) {
      console.warn(`[apiFetch] ${normalizedPath} returned HTTP ${res.status}. Automatically retrying directly against ${directBase}...`);
      return await fetch(`${directBase}${normalizedPath}`, options);
    }
    return res;
  } catch (err) {
    console.warn(`[apiFetch] Direct fetch error on ${normalizedPath}: ${err.message}. Retrying against backend ${directBase}...`);
    return await fetch(`${directBase}${normalizedPath}`, options);
  }
}
