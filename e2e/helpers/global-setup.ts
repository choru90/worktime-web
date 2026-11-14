import { request, expect } from '@playwright/test';

export default async function globalSetup() {
  const database = process.env.WT_E2E_DATABASE ?? 'h2';
  if (!['h2', 'mysql'].includes(database)) throw new Error('Only disposable H2/MySQL E2E targets are supported');
  const client = await request.newContext();
  try {
    const health = await client.get('http://127.0.0.1:8080/actuator/health');
    expect(health.status()).toBe(200);
    const body = await health.json();
    expect(body.components.db.details.database).toBe(database === 'mysql' ? 'MySQL' : 'H2');
  } finally { await client.dispose(); }
}
