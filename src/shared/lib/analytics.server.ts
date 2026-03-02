// Server-side analytics helpers with optional MongoDB wiring and mock fallback.
// Avoid requiring `chart.js` types on the server helper to keep the
// helper usable when chart deps are not installed. Use a local alias.
// Make it generic so callers can use `ChartData<'pie'>` etc. without errors.
type ChartData<T = any> = any;
import { getCache, setCache } from './simpleCache';

type Series = { label: string; data: number[]; backgroundColor?: string | string[]; borderColor?: string };

function monthsAgoKeysLabels(count = 12) {
  const keys: string[] = [];
  const labels: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM matches $dateToString('%Y-%m')
    keys.push(key);
    labels.push(d.toLocaleString('default', { month: 'short', year: 'numeric' }));
  }
  return { keys, labels };
}

// Return the month "keys" (YYYY-MM) for callers that need to match DB months.
function monthsAgoLabels(count = 12) {
  return monthsAgoKeysLabels(count).keys;
}

function randomSeries(count: number, scale = 100) {
  const data: number[] = [];
  for (let i = 0; i < count; i++) data.push(Math.max(0, Math.round(Math.random() * scale + 10)));
  return data;
}

// Lightweight Mongo helper: dynamically require the driver only when MONGODB_URI is present.
async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  // cache client on global to avoid multiple connections during hot reload
  const g = globalThis as any;
  if (g.__analyticsMongoClient && g.__analyticsMongoClient.isConnected) {
    return g.__analyticsMongoClient.db();
  }

  try {
    // require dynamically so devs without the dependency won't break until they opt-in
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(uri, { maxPoolSize: 10 });
    await client.connect();
    g.__analyticsMongoClient = client;
    return client.db(process.env.MONGODB_DB || undefined);
  } catch (err) {
    // If driver not installed or connection fails, fall back to null (mock)
    // Do not throw here — caller will use mock data.
    // eslint-disable-next-line no-console
    console.warn('analytics.server: MongoDB not available, using mock data.', err);
    return null;
  }
}

export async function getAcademicOverview(opts?: { months?: number; start?: string; end?: string }) {
  const months = opts?.months ?? 12;
  const { keys, labels } = monthsAgoKeysLabels(months);
  const db = await getDb();
  const cacheKey = `academic:${JSON.stringify(opts ?? {})}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  if (!db) {
    // fallback mock
    const datasets: Series[] = [
      { label: 'Average Grade', data: randomSeries(months, 70), borderColor: '#2563eb' },
      { label: 'Pass Rate (%)', data: randomSeries(months, 100), borderColor: '#10b981' },
    ];
    const chartData: ChartData<'line'> = {
      labels,
      datasets: datasets.map((s) => ({ label: s.label, data: s.data, borderColor: s.borderColor, fill: false })),
    } as any;
    const out = { labels, datasets, chartData };
    setCache(cacheKey, out, 30);
    return out;
  }

  try {
    const start = opts?.start ? new Date(opts.start) : new Date(new Date().getFullYear(), new Date().getMonth() - (months - 1), 1);
    const end = opts?.end ? new Date(opts.end) : new Date();

    const grades = db.collection('grades');

    const pipeline = [
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { month: { $dateToString: { format: '%Y-%m', date: '$date' } } },
          avgScore: { $avg: '$score' },
          passed: { $sum: { $cond: [{ $eq: ['$passed', true] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
      { $project: { month: '$_id.month', avgScore: 1, passRate: { $cond: [{ $eq: ['$total', 0] }, 0, { $multiply: [{ $divide: ['$passed', '$total'] }, 100] }] } } },
      { $sort: { month: 1 } },
    ];

        const rows = await grades.aggregate(pipeline).toArray();
    
        const map = new Map<string, { avgScore?: number; passRate?: number }>(rows.map((r: any) => [String(r.month), r]));
        const avgSeries: number[] = [];
        const passSeries: number[] = [];
        for (const key of keys) {
          const r = map.get(key) ?? null;
          const avg = r?.avgScore ?? 0;
          const pass = r?.passRate ?? 0;
          avgSeries.push(Math.round(avg * 100) / 100);
          passSeries.push(Math.round(pass * 100) / 100);
        }
    
        const datasets: Series[] = [
          { label: 'Average Grade', data: avgSeries, borderColor: '#2563eb' },
          { label: 'Pass Rate (%)', data: passSeries, borderColor: '#10b981' },
        ];
        const chartData: ChartData<'line'> = { labels, datasets: datasets.map((s) => ({ label: s.label, data: s.data, borderColor: s.borderColor, fill: false })) } as any;
        const out = { labels, datasets, chartData };
        setCache(cacheKey, out, 30);
        return out;
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.warn('analytics.server.getAcademicOverview failed, using mock', err?.message ?? err);
        const datasets: Series[] = [
          { label: 'Average Grade', data: randomSeries(months, 70), borderColor: '#2563eb' },
          { label: 'Pass Rate (%)', data: randomSeries(months, 100), borderColor: '#10b981' },
        ];
        const chartData: ChartData<'line'> = { labels, datasets: datasets.map((s) => ({ label: s.label, data: s.data, borderColor: s.borderColor, fill: false })) } as any;
        const out = { labels, datasets, chartData };
        setCache(cacheKey, out, 30);
        return out;
      }
    }
    
    export async function getFeesOverview(opts?: { months?: number; start?: string; end?: string }) {
      const months = opts?.months ?? 12;
      const labels = monthsAgoLabels(months);
      const db = await getDb();
      const cacheKey = `fees:${JSON.stringify(opts ?? {})}`;
      const cached = getCache(cacheKey);
      if (cached) return cached;
      if (!db) {
        const datasets: Series[] = [
          { label: 'Collected', data: randomSeries(months, 50000), backgroundColor: '#2563eb' },
          { label: 'Pending', data: randomSeries(months, 20000), backgroundColor: '#f59e0b' },
        ];
        const chartData: ChartData<'bar'> = { labels, datasets: datasets.map((s) => ({ label: s.label, data: s.data, backgroundColor: s.backgroundColor })) } as any;
        const out = { labels, datasets, chartData };
        setCache(cacheKey, out, 30);
        return out;
      }
    
      try {
        const start = opts?.start ? new Date(opts.start) : new Date(new Date().getFullYear(), new Date().getMonth() - (months - 1), 1);
        const end = opts?.end ? new Date(opts.end) : new Date();
    
        const payments = db.collection('payments');
        const pipeline = [
          { $match: { date: { $gte: start, $lte: end } } },
          { $group: { _id: { month: { $dateToString: { format: '%Y-%m', date: '$date' } }, status: '$status' }, total: { $sum: '$amount' } } },
          { $group: { _id: '$_id.month', totals: { $push: { status: '$_id.status', total: '$total' } } } },
          { $project: { month: '$_id', totals: 1 } },
          { $sort: { month: 1 } },
        ];
    
        const rows = await payments.aggregate(pipeline).toArray();
        const map = new Map<string, Array<{ status?: string; total?: number }>>(rows.map((r: any) => [String(r.month), (r.totals as any[]) ?? []]));
    
        const collected: number[] = [];
        const pending: number[] = [];
        for (const lbl of labels) {
          const totals = map.get(lbl) ?? [];
          let c = 0;
          let p = 0;
          for (const t of totals) {
            if (String(t.status).toLowerCase() === 'paid' || String(t.status).toLowerCase() === 'collected') c += t.total || 0;
            else p += t.total || 0;
          }
          collected.push(Math.round(c));
          pending.push(Math.round(p));
        }
    
        const datasets: Series[] = [
          { label: 'Collected', data: collected, backgroundColor: '#2563eb' },
          { label: 'Pending', data: pending, backgroundColor: '#f59e0b' },
        ];
        const chartData: ChartData<'bar'> = { labels, datasets: datasets.map((s) => ({ label: s.label, data: s.data, backgroundColor: s.backgroundColor })) } as any;
        const out = { labels, datasets, chartData };
        setCache(cacheKey, out, 30);
        return out;
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.warn('analytics.server.getFeesOverview failed, using mock', err?.message ?? err);
        const datasets: Series[] = [
          { label: 'Collected', data: randomSeries(months, 50000), backgroundColor: '#2563eb' },
          { label: 'Pending', data: randomSeries(months, 20000), backgroundColor: '#f59e0b' },
        ];
        const chartData: ChartData<'bar'> = { labels, datasets: datasets.map((s) => ({ label: s.label, data: s.data, backgroundColor: s.backgroundColor })) } as any;
        const out = { labels, datasets, chartData };
        setCache(cacheKey, out, 30);
        return out;
      }
    }
    
    export async function getUsersOverview() {
      const cacheKey = `users:summary`;
      const cached = getCache(cacheKey);
      if (cached) return cached;
      const db = await getDb();
      if (!db) {
        const labels = ['Students', 'Teachers', 'Parents', 'Staff', 'Admins'];
        const datasets: Series[] = [
          { label: 'Users', data: [1200, 120, 800, 60, 12], backgroundColor: ['#2563eb', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'] },
        ];
        const chartData: ChartData<'pie'> = { labels, datasets: datasets.map((s) => ({ label: s.label, data: s.data, backgroundColor: s.backgroundColor } as any)) } as any;
        const out = { labels, datasets, chartData };
        setCache(cacheKey, out, 60);
        return out;
      }
    
      try {
        const users = db.collection('users');
        const pipeline = [{ $group: { _id: '$role', count: { $sum: 1 } } }];
        const rows = await users.aggregate(pipeline).toArray();
        const roleOrder = ['STUDENT', 'TEACHER', 'PARENT', 'STAFF', 'ADMIN'];
        const map = new Map<string, number>(rows.map((r: any) => [String(r._id).toUpperCase(), Number(r.count) ?? 0]));
        const labels: string[] = [];
        const data: number[] = [];
        for (const r of roleOrder) {
          labels.push(r[0] + r.slice(1).toLowerCase());
          data.push(map.get(r) ?? 0);
        }
    
        const datasets: Series[] = [{ label: 'Users', data, backgroundColor: ['#2563eb', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'] }];
        const chartData: ChartData<'pie'> = { labels, datasets: datasets.map((s) => ({ label: s.label, data: s.data, backgroundColor: s.backgroundColor } as any)) } as any;
        const out = { labels, datasets, chartData };
        setCache(cacheKey, out, 60);
        return out;
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.warn('analytics.server.getUsersOverview failed, using mock', err?.message ?? err);
        const labels = ['Students', 'Teachers', 'Parents', 'Staff', 'Admins'];
        const datasets: Series[] = [
          { label: 'Users', data: [1200, 120, 800, 60, 12], backgroundColor: ['#2563eb', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'] },
        ];
        const chartData: ChartData<'pie'> = { labels, datasets: datasets.map((s) => ({ label: s.label, data: s.data, backgroundColor: s.backgroundColor } as any)) } as any;
        const out = { labels, datasets, chartData };
        setCache(cacheKey, out, 60);
        return out;
      }
    }
    
    export default {
      getAcademicOverview,
      getFeesOverview,
      getUsersOverview,
    };
