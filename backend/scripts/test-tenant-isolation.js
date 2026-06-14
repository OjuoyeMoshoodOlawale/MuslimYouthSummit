/**
 * Multi-tenant isolation test.
 *
 * Verifies that two tenants (mys, icp) cannot see each other's data. Run this
 * AFTER `npm run setup:tenant` and with the backend running (npm run dev).
 *
 *   node scripts/test-tenant-isolation.js
 *   API_BASE=http://localhost:5000 node scripts/test-tenant-isolation.js
 *
 * It logs in as each tenant's seeded super_admin, creates a uniquely-named event
 * in each, then asserts each admin's event list contains ONLY its own events.
 * No data is deleted; the test events are clearly labelled with a timestamp.
 */
import 'dotenv/config';

const API = process.env.API_BASE || `http://localhost:${process.env.PORT || 5000}`;
const stamp = Date.now();

let passed = 0, failed = 0;
const ok   = (m) => { passed++; console.log(`  ✅ ${m}`); };
const bad  = (m) => { failed++; console.log(`  ❌ ${m}`); };

const TENANTS = [
  { slug: 'mys', email: 'admin@muslimyouthsummit.com', pass: 'MYS@Admin2024!' },
  { slug: 'icp', email: 'admin@icp.org',               pass: 'ICP@Admin2024!' },
];

// Fetch helper that always sends the tenant slug header
const call = async (slug, path, { method = 'GET', token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json', 'X-Tenant-Slug': slug };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/api${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
};

const login = async (t) => {
  const r = await call(t.slug, '/auth/login', { method: 'POST', body: { email: t.email, password: t.pass } });
  if (r.status !== 200 || !r.data?.data?.token) {
    throw new Error(`Login failed for ${t.slug} (${t.email}): ${r.data?.message || r.status}. Did you run "npm run setup:tenant"?`);
  }
  return r.data.data.token;
};

const createEvent = async (t, token) => {
  const title = `ISOTEST ${t.slug.toUpperCase()} ${stamp}`;
  const r = await call(t.slug, '/events', {
    method: 'POST', token,
    body: {
      title, edition: `T${stamp.toString().slice(-4)}`,
      start_date: '2030-01-01', end_date: '2030-01-02',
      venue: 'Isolation Test Venue',
    },
  });
  if (r.status !== 201 && r.status !== 200) {
    throw new Error(`Create event failed for ${t.slug}: ${r.data?.message || r.status}`);
  }
  return title;
};

const listEventTitles = async (t, token) => {
  const r = await call(t.slug, '/events/admin/all?limit=100', { token });
  const rows = r.data?.data || r.data?.items || [];
  return rows.map(e => e.title);
};

const run = async () => {
  console.log(`\n🔒 Tenant isolation test → ${API}\n`);

  // 1. Login both tenants
  const tokens = {};
  for (const t of TENANTS) {
    tokens[t.slug] = await login(t);
    ok(`logged in as ${t.slug} admin`);
  }

  // 2. Create one event per tenant
  const titles = {};
  for (const t of TENANTS) {
    titles[t.slug] = await createEvent(t, tokens[t.slug]);
    ok(`created event for ${t.slug}: "${titles[t.slug]}"`);
  }

  // 3. Each tenant sees its OWN event and NOT the other's
  for (const t of TENANTS) {
    const seen = await listEventTitles(t, tokens[t.slug]);
    const others = TENANTS.filter(x => x.slug !== t.slug);

    if (seen.includes(titles[t.slug])) ok(`${t.slug} sees its own event`);
    else bad(`${t.slug} does NOT see its own event (expected "${titles[t.slug]}")`);

    for (const o of others) {
      if (seen.includes(titles[o.slug])) {
        bad(`ISOLATION LEAK: ${t.slug} can see ${o.slug}'s event "${titles[o.slug]}"`);
      } else {
        ok(`${t.slug} cannot see ${o.slug}'s event (correct)`);
      }
    }
  }

  // 4. Cross-token check: using mys token but icp slug header should still be
  //    bound to the admin's own tenant (admin tenant wins in scopeId).
  const crossSeen = await listEventTitles({ slug: 'icp' }, tokens['mys']);
  if (crossSeen.includes(titles['icp'])) {
    bad('CROSS-TOKEN LEAK: mys admin token + icp header exposed icp data');
  } else {
    ok('mys token cannot reach icp data even with icp slug header');
  }

  console.log(`\n──────────────────────────────`);
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log(`──────────────────────────────\n`);
  if (failed) {
    console.log('⚠️  Isolation problems detected. Review the ❌ lines above.\n');
    process.exit(1);
  }
  console.log('🎉 All isolation checks passed. Tenants are properly separated.\n');
  console.log('Note: test events named "ISOTEST …" were created (status draft). Delete them from each admin panel if you wish.\n');
  process.exit(0);
};

run().catch(e => { console.error('\n💥 Test aborted:', e.message, '\n'); process.exit(1); });
