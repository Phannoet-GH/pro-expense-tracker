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
    return { ok: res.ok, status: res.status, data: {} };
  }

  try {
    const data = JSON.parse(text);
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: res.status,
      data: { error: text || 'Server returned invalid JSON response' }
    };
  }
}
