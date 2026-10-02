import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { notifyN8n } from './n8n.js';

test('notification failure never invalidates a saved action', async () => {
  const oldWarn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(await notifyN8n({ url: 'https://n8n.example/hook', token: 'secret', type: 'request.approved',
      data: { id: 'CC-1' }, fetchImpl: async () => { throw new Error('network offline'); } }), false);
    assert.equal(await notifyN8n({ type: 'request.approved', data: { id: 'CC-1' },
      fetchImpl: async () => { throw new Error('Should not run'); } }), false);
  } finally {
    console.warn = oldWarn;
  }
});

test('importable workflow has both triggers, email branches and escaped receipt content', async () => {
  const workflow = JSON.parse(await readFile(new URL('../n8n/CR-Conecta-Avisos-y-Comprobantes.json', import.meta.url), 'utf8'));
  const names = workflow.nodes.map(node => node.name);
  assert.ok(names.includes('Solicitud aprobada'));
  assert.ok(names.includes('Donación registrada'));
  assert.ok(names.includes('Avisar al equipo'));
  assert.ok(names.includes('Enviar aporte y comprobante'));
  const formatter = workflow.nodes.find(node => node.name === 'Preparar aviso y comprobante');
  const run = new Function('$input', formatter.parameters.jsCode);
  const [result] = run({ first: () => ({ json: { body: { type: 'donation.registered', data: {
    id: 'DON-1', product: '<script>alert(1)</script>', category: 'Alimentos', quantity: 2,
    destination: 'Institución', date: '2026-10-01', status: 'Registrada', anonymous: true
  } } } }) });
  assert.match(result.json.html, /Comprobante de registro/);
  assert.match(result.json.html, /&lt;script&gt;/);
  assert.doesNotMatch(result.json.html, /<script>/);
});
