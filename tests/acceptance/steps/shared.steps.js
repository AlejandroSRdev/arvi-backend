/**
 * Shared step definitions used across multiple features.
 *
 * Pure HTTP — no imports from the application source tree.
 */

import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { getBaseUrl } from '../support/server-handle.js';

// ─────────────────────────────────────────────
// GIVEN — seeding state via /__test__ endpoints
// ─────────────────────────────────────────────

Given(
  'a registered user exists with email {string} and password {string}',
  async function (email, password) {
    const res = await fetch(`${getBaseUrl()}/__test__/seed/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(res.status, 201, `seed failed: ${res.status}`);
    const body = await res.json();
    this.seededUserId = body.userId;
  }
);

Given(
  'the user logs in with email {string} and password {string}',
  async function (email, password) {
    const res = await fetch(`${getBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-test': 'true',
      },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(res.status, 200, `login failed: ${res.status}`);
    const body = await res.json();
    this.authToken = body.token;
    this.loggedInUserId = body.userId;
  }
);

// ─────────────────────────────────────────────
// WHEN — HTTP requests
// ─────────────────────────────────────────────

When(
  'a POST request is sent to {string} with JSON body:',
  async function (path, body) {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-test': 'true',
      },
      body,
    });
    this.response = {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body: await res.json().catch(() => null),
    };
  }
);

When(
  'a GET request is sent to {string} with the Authorization header',
  async function (path) {
    assert.ok(this.authToken, 'No auth token — did you log in first?');
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: 'GET',
      headers: {
        'x-internal-test': 'true',
        'Authorization': `Bearer ${this.authToken}`,
      },
    });
    this.response = {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body: await res.json().catch(() => null),
    };
  }
);

When(
  'a GET request is sent to {string} without an Authorization header',
  async function (path) {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: 'GET',
      headers: { 'x-internal-test': 'true' },
    });
    this.response = {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body: await res.json().catch(() => null),
    };
  }
);

// ─────────────────────────────────────────────
// THEN — response assertions
// ─────────────────────────────────────────────

Then('the response status should be {int}', function (expected) {
  assert.equal(
    this.response.status,
    expected,
    `expected ${expected}, got ${this.response.status}; body=${JSON.stringify(this.response.body)}`
  );
});

Then(
  'the response header {string} should contain {string}',
  function (header, substring) {
    const value = this.response.headers[header.toLowerCase()];
    assert.ok(
      value && value.includes(substring),
      `expected header "${header}" to contain "${substring}", got "${value}"`
    );
  }
);

Then(
  'the response body should contain a non-empty {string} field',
  function (field) {
    const value = this.response.body?.[field];
    assert.ok(
      typeof value === 'string' && value.length > 0,
      `expected non-empty string in body.${field}, got ${JSON.stringify(value)}`
    );
  }
);

Then(
  'the response body field {string} should equal {string}',
  function (field, expected) {
    assert.equal(
      this.response.body?.[field],
      expected,
      `expected body.${field} === "${expected}", got ${JSON.stringify(this.response.body?.[field])}`
    );
  }
);

Then(
  "the response body field {string} should equal the registered user's id",
  function (field) {
    assert.equal(this.response.body?.[field], this.seededUserId);
  }
);

Then(
  'the response body should not contain a {string} field',
  function (field) {
    assert.equal(
      this.response.body?.[field],
      undefined,
      `expected body.${field} to be absent, got ${JSON.stringify(this.response.body?.[field])}`
    );
  }
);

Then(
  'the response body {string} object should have a non-empty {string} field',
  function (parent, field) {
    const obj = this.response.body?.[parent];
    assert.ok(obj && typeof obj === 'object', `expected body.${parent} to be an object`);
    const value = obj[field];
    assert.ok(
      typeof value === 'string' && value.length > 0,
      `expected non-empty string in body.${parent}.${field}, got ${JSON.stringify(value)}`
    );
  }
);

Then(
  'the response body {string} object field {string} should equal {string}',
  function (parent, field, expected) {
    const obj = this.response.body?.[parent];
    assert.ok(obj && typeof obj === 'object', `expected body.${parent} to be an object`);
    assert.equal(
      obj[field],
      expected,
      `expected body.${parent}.${field} === "${expected}", got ${JSON.stringify(obj[field])}`
    );
  }
);

Then(
  'the response body should contain a {string} object',
  function (field) {
    const value = this.response.body?.[field];
    assert.ok(
      value && typeof value === 'object',
      `expected body.${field} to be an object, got ${JSON.stringify(value)}`
    );
  }
);
