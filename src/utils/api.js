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
