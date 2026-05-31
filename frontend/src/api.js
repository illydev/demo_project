const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function analyzeChat(file) {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch (_e) {}
    throw new Error(msg);
  }

  return res.json();
}
