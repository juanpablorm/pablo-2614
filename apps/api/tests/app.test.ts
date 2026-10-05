import { SNAILPAY_BASE_PATH } from '@snailracer/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';

const app = createApp(loadEnv({}));

describe('app base', () => {
  it('responde 404 JSON en rutas desconocidas', async () => {
    const res = await request(app).get('/api/no-existe');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: 'not_found' });
  });

  it('expone POST /charges en la ruta del contrato', async () => {
    const res = await request(app).post(`${SNAILPAY_BASE_PATH}/charges`).send({});

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 'rejected', status_detail: 'invalid_request' });
  });

  it('agrega cabeceras de seguridad y oculta x-powered-by', async () => {
    const res = await request(app).get('/');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('permite CORS solo para el origen configurado', async () => {
    const allowed = await request(app).get('/').set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const other = await request(app).get('/').set('Origin', 'http://evil.example');
    expect(other.headers['access-control-allow-origin']).not.toBe('http://evil.example');
  });

  it('rechaza JSON malformado con 400', async () => {
    const res = await request(app)
      .post('/api/no-existe')
      .set('Content-Type', 'application/json')
      .send('{"amount": ');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_json' });
  });

  it('rechaza cuerpos mayores a 10 KB con 413', async () => {
    const res = await request(app)
      .post('/api/no-existe')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ data: 'x'.repeat(11 * 1024) }));

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: 'payload_too_large' });
  });
});
