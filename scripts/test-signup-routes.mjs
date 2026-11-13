import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import * as routing from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server.js';

function load(path, dependencies) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true,
        },
    }).outputText;
    const exports = {};
    vm.runInNewContext(compiled, {
        exports,
        require: name => {
            if (name === 'react') return React;
            if (name === 'react/jsx-runtime') return jsxRuntime;
            if (name === 'react-router-dom') return routing;
            assert.ok(name in dependencies, `Unexpected import: ${name}`);
            return dependencies[name];
        },
    });
    return exports;
}

const { SignupPage } = load('../src/pages/Signup/SignupPage.tsx', {
    '../../api/authApi': { authApi: {} },
});
const { LoginPage } = load('../src/pages/Login/LoginPage.tsx', {
    '../../hooks/useAuth': { useAuth: () => ({}) },
});
const passthrough = ({ children }) => children;
const routeSource = readFileSync(new URL('../src/app/router.tsx', import.meta.url), 'utf8');
const routeExports = {};
vm.runInNewContext(ts.transpileModule(routeSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
    exports: routeExports,
    require: name => {
        if (name === 'react/jsx-runtime') return jsxRuntime;
        if (name === 'react-router-dom') return { ...routing, createBrowserRouter: routes => routes };
        if (name.endsWith('/SignupPage')) return { SignupPage };
        if (name.endsWith('/LoginPage')) return { LoginPage };
        if (name === './PrivateRoute') return { PublicRoute: passthrough, PrivateRoute: passthrough };
        return new Proxy({}, { get: () => passthrough });
    },
});
const routes = routeExports.router;
const RenderRoutes = () => routing.useRoutes(routes);
const render = path => renderToStaticMarkup(
    React.createElement(StaticRouter, { location: path }, React.createElement(RenderRoutes)),
);

test('로그인의 알바생 가입 링크가 등록된 가입 화면으로 연결된다', () => {
    const html = render('/login');
    const href = html.match(/href="([^"]+)"[^>]*>알바생 회원가입/)[1];
    assert.ok(routing.matchRoutes(routes, href), `${href} has no matching route`);
});

test('알바생 가입 주소를 직접 열면 초대 코드 입력 화면을 표시한다', () => {
    const html = render('/signup/worker');
    assert.ok(html.includes('초대받은 직원 계정 만들기'));
    assert.ok(html.includes('aria-label="초대 코드"'));
});

test('사장 가입 주소는 사장 가입 화면을 유지한다', () => {
    const html = render('/signup');
    assert.ok(html.includes('사장님 계정 만들기'));
    assert.ok(!html.includes('aria-label="초대 코드"'));
});
