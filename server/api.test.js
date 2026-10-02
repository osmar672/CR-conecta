const donationPhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAACAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDxyiiiv3E8w//Z';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './api.js';

const PASSWORD = 'conecta-demo';

function createDatabase() {
  return {
    users: [
      { id: 'admin', name: 'Admin Demo', email: 'admin@example.test', role: 'Administrador', zone: 'Barranca', phone: '111', notes: 'private' },
      { id: 'beneficiary', name: 'Beneficiary Demo', email: 'beneficiary@example.test', role: 'Beneficiario', zone: 'Barranca' },
      { id: 'other', name: 'Other Demo', email: 'other@example.test', role: 'Beneficiario', zone: 'El Roble' },
      { id: 'donor', name: 'Donor Demo', email: 'donor@example.test', role: 'Donante individual', zone: 'Barranca' }
    ],
    requests: [
      { id: 'private-1', status: 'En revisión', category: 'Alimentos sellados', amount: 25, beneficiaryId: 'beneficiary', zone: 'Barranca' },
      { id: 'approved-1', status: 'Aprobada', category: 'Alimentos sellados', amount: 3, beneficiaryId: 'beneficiary', zone: 'Barranca' },
      { id: 'approved-2', status: 'Aprobada', category: 'Alimentos sellados', amount: 2, beneficiaryId: 'other', zone: 'El Roble' }
    ],
    donations: [],
    transfers: [{ id: 'transfer-1', responsible: 'Beneficiary Demo', status: 'En ruta' }],
    inventory: [{ id: 'inventory-1', available: 5 }],
    allies: [],
    facilities: [],
    campaigns: [],
    jobs: [],
    chatbot: []
  };
}

async function startServer() {
  const database = createDatabase();
  const server = createApiServer({ database, persist: async () => {} });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    database,
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  };
}

function cookieFrom(response) {
  const value = response.headers.get('set-cookie');
  return value?.split(';', 1)[0];
}

async function login(url, userId, password = PASSWORD) {
  const response = await fetch(`${url}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password })
  });
  return { response, cookie: cookieFrom(response) };
}

test('demo login requires the password and sets an HttpOnly cookie', async t => {
  const app = await startServer();
  t.after(app.close);

  const invalid = await login(app.url, 'admin', 'wrong');
  assert.equal(invalid.response.status, 401);

  const valid = await login(app.url, 'admin');
  assert.equal(valid.response.status, 200);
  assert.match(valid.response.headers.get('set-cookie'), /HttpOnly/);
  const session = await fetch(`${app.url}/auth/session`, { headers: { Cookie: valid.cookie } });
  assert.equal(session.status, 200);
  assert.equal((await session.json()).id, 'admin');
});

test('login attempts are rate limited per client', async t => {
  const app = await startServer();
  t.after(app.close);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await login(app.url, 'admin', 'incorrecta');
    assert.equal(response.response.status, 401);
  }
  const blocked = await login(app.url, 'admin');
  assert.equal(blocked.response.status, 429);
});

test('only administrators can read the activity history', async t => {
  const app = await startServer();
  t.after(app.close);

  assert.equal((await fetch(`${app.url}/activity`)).status, 401);

  const beneficiary = await login(app.url, 'beneficiary');
  const forbidden = await fetch(`${app.url}/activity`, {
    headers: { Cookie: beneficiary.cookie }
  });
  assert.equal(forbidden.status, 403);

  const admin = await login(app.url, 'admin');
  const response = await fetch(`${app.url}/activity`, {
    headers: { Cookie: admin.cookie }
  });
  assert.equal(response.status, 200);
  const activity = await response.json();
  assert.equal(activity[0].actor, 'Admin Demo');
  assert.equal(activity[0].action, 'inició sesión');
  assert.equal(activity[0].entity, 'sesión');
  assert.equal('email' in activity[0], false);
});

test('assistant endpoint keeps the provider key server-side and answers through the API', async t => {
  let providerAuthorization;
  const database = createDatabase();
  const server = createApiServer({
    database,
    persist: async () => {},
    assistantApiKey: 'server-only-key',
    assistantFetch: async (_url, options) => {
      providerAuthorization = options.headers.Authorization;
      return { ok: true, json: async () => ({ choices: [{ message: { content: '{"answer":"Desde Necesidades.","destination":"necesidades"}' } }] }) };
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const address = server.address();

  const response = await fetch(`http://127.0.0.1:${address.port}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: '¿Dónde veo necesidades?', history: [] })
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { answer: 'Desde Necesidades.', destination: { path: '/necesidades', label: 'Necesidades' } });
  assert.equal(providerAuthorization, 'Bearer server-only-key');
});

test('assistant endpoint returns a clear configuration error when no key is present', async t => {
  const app = await startServer();
  t.after(app.close);
  const response = await fetch(`${app.url}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: '¿Cómo dono?' })
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).message, /GROQ_API_KEY/);
});

test('campaign projection is role protected and scopes company data before contacting AI', async t => {
  const database = createDatabase();
  database.users.push({ id: 'company', name: 'Company Demo', role: 'Empresa donante' });
  database.campaigns = [
    { id: 'own', companyId: 'company', category: 'Vestimenta', goal: 30, progress: 10 },
    { id: 'other', companyId: 'another', category: 'Alimentos sellados', goal: 90, progress: 80 }
  ];
  database.donations = [
    { id: 'own', donorId: 'company', category: 'Vestimenta', quantity: 4 },
    { id: 'other', donorId: 'another', category: 'Alimentos sellados', quantity: 40 }
  ];
  let providerInput;
  const server = createApiServer({ database, persist: async () => {}, assistantApiKey: 'server-only-key',
    assistantFetch: async (_url, options) => {
      providerInput = JSON.parse(options.body).messages[1].content;
      return { ok: true, json: async () => ({ choices: [{ message: { content: '{"summary":"Escenario estimado.","assumptions":["Datos escasos"],"weeklyUnits":[3,4]}' } }] }) };
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const options = cookie => ({ method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ category: 'Vestimenta', goal: 20, weeks: 2 }) });
  assert.equal((await fetch(`${url}/assistant/campaign-projection`, options())).status, 401);
  const beneficiary = await login(url, 'beneficiary');
  assert.equal((await fetch(`${url}/assistant/campaign-projection`, options(beneficiary.cookie))).status, 403);
  const company = await login(url, 'company');
  const response = await fetch(`${url}/assistant/campaign-projection`, options(company.cookie));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).weeklyUnits, [3, 4]);
  assert.match(providerInput, /Vestimenta/);
  assert.doesNotMatch(providerInput, /Alimentos sellados|another/);
});

test('public and beneficiary request reads do not disclose private records', async t => {
  const app = await startServer();
  t.after(app.close);

  const publicResponse = await fetch(`${app.url}/requests`);
  const publicRequests = await publicResponse.json();
  assert.equal(publicResponse.status, 200);
  assert.deepEqual(publicRequests.map(request => request.id), ['approved-1', 'approved-2']);
  assert.equal('beneficiaryId' in publicRequests[0], false);

  const beneficiaryLogin = await login(app.url, 'beneficiary');
  const privateResponse = await fetch(`${app.url}/requests`, { headers: { Cookie: beneficiaryLogin.cookie } });
  const privateRequests = await privateResponse.json();
  assert.deepEqual(privateRequests.map(request => request.id), ['private-1', 'approved-1']);
  assert.equal((await fetch(`${app.url}/users`)).status, 403);
});

test('only an administrator can evaluate requests and exceptions are enforced server-side', async t => {
  const app = await startServer();
  t.after(app.close);
  const admin = await login(app.url, 'admin');

  const invalidEvaluation = await fetch(`${app.url}/requests/private-1`, {
    method: 'PATCH',
    headers: { Cookie: admin.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'Aprobada',
      priority: 'Alta',
      decisionReason: 'Validada',
      decisionDate: '2026-09-29'
    })
  });
  assert.equal(invalidEvaluation.status, 400);

  const approved = await fetch(`${app.url}/requests/private-1`, {
    method: 'PATCH',
    headers: { Cookie: admin.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'Aprobada',
      priority: 'Alta',
      decisionReason: 'Validada',
      decisionDate: '2026-09-29',
      exceptionGranted: true,
      exceptionReason: 'Necesidad urgente verificada',
      exceptionAuthorizedBy: 'Nombre falso'
    })
  });
  assert.equal(approved.status, 200);
  const decision = await approved.json();
  assert.equal(decision.exceptionGranted, true);
  assert.equal(decision.exceptionAuthorizedBy, 'Admin Demo');

  const beneficiary = await login(app.url, 'beneficiary');
  const denied = await fetch(`${app.url}/requests/private-1`, {
    method: 'PATCH',
    headers: { Cookie: beneficiary.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Aprobada', priority: 'Alta', decisionReason: 'No debería poder', decisionDate: '2026-09-29' })
  });
  assert.equal(denied.status, 403);
});

test('beneficiary cannot create a request for another account or exceed validation', async t => {
  const app = await startServer();
  t.after(app.close);
  const beneficiary = await login(app.url, 'beneficiary');
  const body = {
    category: 'Alimentos sellados',
    description: 'Solicitud válida',
    amount: 2,
    unit: 'forged',
    zone: 'Barranca',
    date: '2026-09-29',
    beneficiaryId: 'other',
    status: 'Aprobada'
  };
  const response = await fetch(`${app.url}/requests`, {
    method: 'POST',
    headers: { Cookie: beneficiary.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  assert.equal(response.status, 201);
  const request = await response.json();
  assert.equal(request.beneficiaryId, 'beneficiary');
  assert.equal(request.status, 'En revisión');
  assert.equal(request.unit, 'paquetes');
  assert.equal(app.database.activity[0].actor, 'Beneficiary Demo');
  assert.equal(app.database.activity[0].entity, 'solicitud');
  assert.equal(app.database.activity[0].entityId, request.id);

  const invalid = await fetch(`${app.url}/requests`, {
    method: 'POST',
    headers: { Cookie: beneficiary.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, category: 'categoría desconocida' })
  });
  assert.equal(invalid.status, 400);
});

test('donations require a donor role and an approved request destination', async t => {
  const app = await startServer();
  t.after(app.close);

  const beneficiary = await login(app.url, 'beneficiary');
  const forbidden = await fetch(`${app.url}/donations`, {
    method: 'POST',
    headers: { Cookie: beneficiary.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'Alimentos sellados', product: 'Arroz', quantity: 1 })
  });
  assert.equal(forbidden.status, 403);

  const donor = await login(app.url, 'donor');
  const invalidDestination = await fetch(`${app.url}/donations`, {
    method: 'POST',
    headers: { Cookie: donor.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'Alimentos sellados', product: 'Arroz', quantity: 1, requestId: 'private-1' })
  });
  assert.equal(invalidDestination.status, 400);

  const withoutPhoto = await fetch(`${app.url}/donations`, {
    method: 'POST',
    headers: { Cookie: donor.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'Alimentos sellados', product: 'Arroz', quantity: 1, requestId: 'approved-1' })
  });
  assert.equal(withoutPhoto.status, 400);
  assert.match((await withoutPhoto.json()).message, /foto/);

  const donation = await fetch(`${app.url}/donations`, {
    method: 'POST',
    headers: { Cookie: donor.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'Alimentos sellados', product: 'Arroz', photo: donationPhoto, quantity: 1, requestId: 'approved-1' })
  });
  assert.equal(donation.status, 201);
  const savedDonation = await donation.json();
  assert.equal(savedDonation.donorId, 'donor');
  assert.equal(savedDonation.photo, donationPhoto);
});

test('n8n receives only approved transitions and new donations after persistence, without personal data', async t => {
  const database = createDatabase();
  const delivered = [];
  let persisted = false;
  const server = createApiServer({ database, persist: async () => { persisted = true; },
    n8nApprovalUrl: 'https://n8n.example/webhook/approval', n8nDonationUrl: 'https://n8n.example/webhook/donation',
    n8nToken: 'server-token', n8nFetch: async (url, options) => {
      assert.equal(persisted, true);
      assert.equal(options.headers['X-CR-Conecta-Token'], 'server-token');
      delivered.push({ url, ...JSON.parse(options.body) });
      return { ok: true };
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const admin = await login(url, 'admin');
  const approval = { status: 'Aprobada', priority: 'Alta', decisionReason: 'Validada', decisionDate: '2026-09-29',
    exceptionGranted: true, exceptionReason: 'Necesidad urgente' };
  const patch = () => fetch(`${url}/requests/private-1`, { method: 'PATCH',
    headers: { Cookie: admin.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(approval) });
  assert.equal((await patch()).status, 200);
  assert.equal((await patch()).status, 200);
  const donor = await login(url, 'donor');
  const donation = await fetch(`${url}/donations`, { method: 'POST',
    headers: { Cookie: donor.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'Alimentos sellados', product: 'Arroz', photo: donationPhoto, quantity: 2, requestId: 'private-1', anonymous: true }) });
  assert.equal(donation.status, 201);
  assert.equal(delivered.length, 2);
  assert.deepEqual(delivered.map(event => event.type), ['request.approved', 'donation.registered']);
  assert.deepEqual(delivered.map(event => event.url), ['https://n8n.example/webhook/approval', 'https://n8n.example/webhook/donation']);
  assert.equal(delivered[0].data.id, 'private-1');
  assert.equal(delivered[1].data.anonymous, true);
  assert.doesNotMatch(JSON.stringify(delivered), /beneficiaryId|donorId|donor@example|notes|email/);
});
