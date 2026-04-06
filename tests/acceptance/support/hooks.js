import { BeforeAll, AfterAll, Before } from '@cucumber/cucumber';
import { startServer, stopServer, resetServerState } from './server-handle.js';

BeforeAll({ timeout: 30000 }, async function () {
  await startServer();
});

AfterAll(async function () {
  await stopServer();
});

Before(async function () {
  await resetServerState();
  this.response = null;
  this.seededUserId = null;
});
