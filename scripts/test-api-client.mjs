import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import axios from 'axios';

function client() {
    const source = readFileSync(new URL('../src/lib/apiClient.ts', import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText;
    const entries = new Map([['accessToken', 'synthetic'], ['user', 'synthetic-user']]);
    const location = { pathname: '/dashboard', href: '/dashboard' };
    const exports = {};
    vm.runInNewContext(compiled, {
        exports,
        require: name => { assert.equal(name, 'axios'); return axios; },
        localStorage: {
            getItem: key => entries.get(key),
            removeItem: key => entries.delete(key),
        },
        window: { location },
    });
    return { api: exports.default, entries, location };
}

for (const status of [403, 404, 500]) {
    test(`${status} preserves session and rejects request`, async () => {
        const { api, entries, location } = client();
        await assert.rejects(api.get('/synthetic', {
            adapter: () => Promise.reject({ response: { status } }),
        }));
        assert.equal(entries.get('accessToken'), 'synthetic');
        assert.equal(entries.get('user'), 'synthetic-user');
        assert.equal(location.href, '/dashboard');
    });
}

test('401 clears expired session and redirects to login', async () => {
    const { api, entries, location } = client();
    await assert.rejects(api.get('/synthetic', {
        adapter: () => Promise.reject({ response: { status: 401 } }),
    }));
    assert.equal(entries.size, 0);
    assert.equal(location.href, '/login');
});
