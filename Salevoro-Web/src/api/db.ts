/**
 * Data layer. Screens read/write synchronously through `db` (same API as localStorage);
 * values are cached in memory and persisted through an Adapter.
 *
 *  - mockApiAdapter()  default: simulated network latency, stored in the browser
 *  - httpAdapter(url)  real backend: set VITE_API_URL (see README for the contract)
 */
export type Adapter = {
  load(): Promise<Record<string, string>>;
  save(key: string, value: string | null): Promise<void>;
};

export const localAdapter: Adapter = {
  async load() {
    const out: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k !== 'sc_theme') out[k] = localStorage.getItem(k)!;
    }
    return out;
  },
  async save(key, value) {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  },
};

export function mockApiAdapter(latencyMs = 200): Adapter {
  const wait = () => new Promise(r => setTimeout(r, latencyMs));
  return {
    async load() { await wait(); return localAdapter.load(); },
    async save(key, value) { await wait(); return localAdapter.save(key, value); },
  };
}

export function httpAdapter(baseUrl: string): Adapter {
  const url = (p: string) => baseUrl.replace(/\/$/, '') + p;
  return {
    async load() {
      const r = await fetch(url('/state'), { credentials: 'include' });
      if (!r.ok) throw new Error('GET /state failed: ' + r.status);
      return r.json();
    },
    async save(key, value) {
      const r = await fetch(url('/state/' + encodeURIComponent(key)), {
        method: value === null ? 'DELETE' : 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: value === null ? undefined : value,
      });
      if (!r.ok) throw new Error('PUT /state/' + key + ' failed: ' + r.status);
    },
  };
}

let adapter: Adapter = localAdapter;
const cache = new Map<string, string>();
const listeners = new Set<(key: string) => void>();

export async function initDb(a: Adapter = localAdapter) {
  adapter = a;
  const data = await a.load().catch(err => { console.error('[db] load failed', err); return {}; });
  cache.clear();
  Object.entries(data).forEach(([k, v]) => cache.set(k, typeof v === 'string' ? v : JSON.stringify(v)));
}

const persist = (key: string, value: string | null) =>
  adapter.save(key, value).catch(err => console.error('[db] save failed', key, err));

export const db = {
  getItem(key: string): string | null { return cache.has(key) ? cache.get(key)! : null; },
  setItem(key: string, value: unknown) {
    const s = String(value);
    cache.set(key, s);
    persist(key, s);
    listeners.forEach(f => f(key));
  },
  removeItem(key: string) {
    cache.delete(key);
    persist(key, null);
    listeners.forEach(f => f(key));
  },
  subscribe(fn: (key: string) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
};

/** Keys the screens use — each maps to one backend resource. */
export const KEYS = {
  sc_session: 'Session state ("in" | "out")',
  sc_user: 'Signed-in staff member (name, role, mobile, photo)',
  sc_branch: 'Selected branch name',
  sc_store: 'Store configuration (name, logo, branches, invoice settings)',
  sc_categories: 'Product categories',
  sc_gst_slabs: 'GST slabs',
  sc_gst_cfg: 'GST configuration',
  sc_customers_new: 'Customers added from billing / customers page',
  sc_inv_seq: 'Invoice number sequence',
  sc_wa: 'WhatsApp Business settings and templates',
  sc_nav: 'Side menu collapsed ("1" | "0")',
} as const;
