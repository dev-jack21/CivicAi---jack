/**
 * Database-level feedback RLS verification (anon / citizen JWT / admin JWT).
 * Usage: node scripts/verify-feedback-rls.mjs
 * Reads credentials from .env.local in project root (manual parse).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envText = readFileSync(join(root, '.env.local'), 'utf8');
const env = {};
for (const line of envText.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !ANON || !SERVICE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, or SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const PASSWORD = 'TestPass123!';
const CITIZEN_EMAIL = 'citizen@civicai.ke';
const ADMIN_EMAIL = 'admin@civicai.ke';
const OTHER_EMAIL = 'other-citizen-rls@civicai.ke';

const admin = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const results = [];
function assert(name, ok, detail) {
  results.push({ name, status: ok ? 'PASS' : 'FAIL', detail });
}

async function getOrCreateUser(email, role) {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw listErr;
  let user = list.users.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  }
  await new Promise((r) => setTimeout(r, 400));
  if (role === 'admin') {
    const { error } = await admin.from('profiles').update({ role: 'admin' }).eq('id', user.id);
    if (error) throw error;
  }
  const { data: profile } = await admin
    .from('profiles')
    .select('id,email,role')
    .eq('id', user.id)
    .single();
  return { user, profile };
}

async function signIn(email) {
  const authClient = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  const client = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
  return { client, userId: data.user.id };
}

async function upsertFeedback(svc, { policy_id, user_id, content, status }) {
  const { data: existing } = await svc
    .from('feedback')
    .select('id')
    .eq('policy_id', policy_id)
    .eq('user_id', user_id)
    .maybeSingle();
  if (existing) {
    const { data, error } = await svc
      .from('feedback')
      .update({ content, status })
      .eq('id', existing.id)
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }
  const { data, error } = await svc
    .from('feedback')
    .insert({ policy_id, user_id, content, status })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function main() {
  const fixtures = {};

  const citizen = await getOrCreateUser(CITIZEN_EMAIL, 'citizen');
  const adminUser = await getOrCreateUser(ADMIN_EMAIL, 'admin');
  const other = await getOrCreateUser(OTHER_EMAIL, 'citizen');

  fixtures.users = {
    citizen: { id: citizen.user.id, email: CITIZEN_EMAIL, role: citizen.profile?.role },
    admin: { id: adminUser.user.id, email: ADMIN_EMAIL, role: adminUser.profile?.role },
    other: { id: other.user.id, email: OTHER_EMAIL, role: other.profile?.role },
  };

  const publishedTitle = 'RLS Test Published Policy';
  let { data: pubPol } = await admin
    .from('policies')
    .select('id')
    .eq('title', publishedTitle)
    .maybeSingle();
  if (!pubPol) {
    const { data, error } = await admin
      .from('policies')
      .insert({
        title: publishedTitle,
        ministry: 'Test Ministry',
        document_url: 'https://example.com/test.pdf',
        document_type: 'pdf',
        status: 'ready',
        published_at: new Date().toISOString(),
        uploaded_by: adminUser.user.id,
      })
      .select('id')
      .single();
    if (error) throw error;
    pubPol = data;
  } else {
    await admin
      .from('policies')
      .update({ status: 'ready', published_at: new Date().toISOString() })
      .eq('id', pubPol.id);
  }

  const draftTitle = 'RLS Test Draft Policy';
  let { data: draftPol } = await admin
    .from('policies')
    .select('id')
    .eq('title', draftTitle)
    .maybeSingle();
  if (!draftPol) {
    const { data, error } = await admin
      .from('policies')
      .insert({
        title: draftTitle,
        ministry: 'Test Ministry',
        document_url: 'https://example.com/draft.pdf',
        document_type: 'pdf',
        status: 'ready',
        published_at: null,
        uploaded_by: adminUser.user.id,
      })
      .select('id')
      .single();
    if (error) throw error;
    draftPol = data;
  } else {
    await admin
      .from('policies')
      .update({ status: 'ready', published_at: null })
      .eq('id', draftPol.id);
  }

  fixtures.policies = { published: pubPol.id, draft: draftPol.id };

  fixtures.feedback = {
    citizenOwnOnDraft: await upsertFeedback(admin, {
      policy_id: draftPol.id,
      user_id: citizen.user.id,
      content: 'Citizen own feedback on draft policy row.',
      status: 'unreviewed',
    }),
    otherOnDraft: await upsertFeedback(admin, {
      policy_id: draftPol.id,
      user_id: other.user.id,
      content: 'Other user feedback on draft policy row.',
      status: 'unreviewed',
    }),
    publicOnPublished: await upsertFeedback(admin, {
      policy_id: pubPol.id,
      user_id: other.user.id,
      content: 'Public visible feedback on published policy.',
      status: 'unreviewed',
    }),
    flaggedOnPublished: await upsertFeedback(admin, {
      policy_id: pubPol.id,
      user_id: citizen.user.id,
      content: 'Flagged feedback should stay hidden from public.',
      status: 'flagged',
    }),
  };

  const anon = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: anonRows, error: anonReadErr } = await anon.from('feedback').select('id');
  assert(
    '1. anon SELECT succeeds',
    !anonReadErr,
    anonReadErr?.message ?? `count=${anonRows?.length ?? 0}`
  );
  const anonIds = new Set((anonRows ?? []).map((r) => r.id));
  assert(
    '1. anon CAN read public on published (non-flagged)',
    anonIds.has(fixtures.feedback.publicOnPublished) &&
      !anonIds.has(fixtures.feedback.flaggedOnPublished),
    `visible=[${[...anonIds].join(',')}] want=${fixtures.feedback.publicOnPublished}`
  );
  assert(
    '1. anon CANNOT read citizen own on draft',
    !anonIds.has(fixtures.feedback.citizenOwnOnDraft),
    fixtures.feedback.citizenOwnOnDraft
  );
  assert(
    '1. anon CANNOT read other on draft',
    !anonIds.has(fixtures.feedback.otherOnDraft),
    fixtures.feedback.otherOnDraft
  );

  const { error: anonInsertErr } = await anon.from('feedback').insert({
    policy_id: pubPol.id,
    user_id: citizen.user.id,
    content: 'Anon insert attempt should fail here.',
  });
  assert(
    '1. anon CANNOT insert feedback',
    !!anonInsertErr,
    anonInsertErr?.message ?? 'insert succeeded'
  );

  const citizenSession = await signIn(CITIZEN_EMAIL);
  const { data: citRows, error: citReadErr } = await citizenSession.client
    .from('feedback')
    .select('id');
  assert(
    '2. citizen SELECT succeeds',
    !citReadErr,
    citReadErr?.message ?? `count=${citRows?.length ?? 0}`
  );
  const citIds = new Set((citRows ?? []).map((r) => r.id));
  assert(
    '2. citizen CAN read own on draft',
    citIds.has(fixtures.feedback.citizenOwnOnDraft),
    fixtures.feedback.citizenOwnOnDraft
  );
  assert(
    '2. citizen CAN read public on published',
    citIds.has(fixtures.feedback.publicOnPublished),
    fixtures.feedback.publicOnPublished
  );
  assert(
    '2. citizen CANNOT read other on draft',
    !citIds.has(fixtures.feedback.otherOnDraft),
    fixtures.feedback.otherOnDraft
  );

  const { data: otherDraftRow } = await citizenSession.client
    .from('feedback')
    .select('id')
    .eq('id', fixtures.feedback.otherOnDraft)
    .maybeSingle();
  assert('2. citizen point SELECT other draft empty', !otherDraftRow, 'unexpected row');

  const { error: citInsertErr } = await citizenSession.client.from('feedback').insert({
    policy_id: pubPol.id,
    user_id: other.user.id,
    content: 'Citizen trying wrong user_id insert.',
  });
  assert(
    '2. citizen CANNOT insert as another user',
    !!citInsertErr,
    citInsertErr?.message ?? 'insert succeeded'
  );

  const adminSession = await signIn(ADMIN_EMAIL);
  const { data: admRows, error: admReadErr } = await adminSession.client
    .from('feedback')
    .select('id');
  assert(
    '3. admin SELECT succeeds',
    !admReadErr,
    admReadErr?.message ?? `count=${admRows?.length ?? 0}`
  );
  const admIds = new Set((admRows ?? []).map((r) => r.id));
  for (const [label, id] of Object.entries(fixtures.feedback)) {
    assert(`3. admin CAN read ${label}`, admIds.has(id), id);
  }

  const overall = results.every((r) => r.status === 'PASS') ? 'PASS' : 'FAIL';
  const report = {
    fixtures,
    results,
    overall,
    policyMigration: 'supabase/migrations/20260620000006_rls_policies.sql',
  };
  console.log(JSON.stringify(report, null, 2));
  process.exit(overall === 'PASS' ? 0 : 1);
}

main().catch((e) => {
  console.error(JSON.stringify({ fatal: String(e), stack: e.stack }));
  process.exit(2);
});
