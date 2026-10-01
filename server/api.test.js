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

  const donation = await fetch(`${app.url}/donations`, {
    method: 'POST',
    headers: { Cookie: donor.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'Alimentos sellados', product: 'Arroz', quantity: 1, requestId: 'approved-1' })
  });
  assert.equal(donation.status, 201);
  assert.equal((await donation.json()).donorId, 'donor');
});
