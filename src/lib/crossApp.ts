// ---------------------------------------------------------------------------
// Cross-App Data Fetching — TrueNorthOS → Build Authority
// Workstream 3 Integration Layer
// ---------------------------------------------------------------------------

const BA_URL = 'https://rqhmegnxtdlvytpxamjn.supabase.co';
const BA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxaG1lZ254dGRsdnl0cHhhbWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTA5NTIsImV4cCI6MjA4Njc2Njk1Mn0.l89Cdxn3TM7-UvHFyodRwvNOy9FZfq4jpuyxLieT6ww';

export interface LinkedBet {
  id: string;
  title: string;
  status: string;
  score: number | null;
  app: 'build_authority';
  url: string;
}

const betCache = new Map<string, LinkedBet | null>();

async function fetchWithTimeout(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 3000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLinkedBet(betId: string): Promise<LinkedBet | null> {
  if (betCache.has(betId)) return betCache.get(betId)!;
  try {
    const headers = { apikey: BA_ANON, Authorization: `Bearer ${BA_ANON}` };
    const res = await fetchWithTimeout(
      `${BA_URL}/rest/v1/decisions?id=eq.${betId}&select=id,title,status,score`,
      headers,
    );
    if (!res.ok) { betCache.set(betId, null); return null; }
    const rows = await res.json();
    if (!rows || rows.length === 0) { betCache.set(betId, null); return null; }
    const row = rows[0];
    const linked: LinkedBet = {
      id: row.id,
      title: row.title ?? '',
      status: row.status ?? 'unknown',
      score: row.score ?? null,
      app: 'build_authority',
      url: `https://buildauthority.vercel.app/decisions?bet=${row.id}`,
    };
    betCache.set(betId, linked);
    return linked;
  } catch {
    betCache.set(betId, null);
    return null;
  }
}
