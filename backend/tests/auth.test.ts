import test from 'node:test';
import assert from 'node:assert/strict';
import { requireAuth, type AuthenticatedRequest } from '../src/middleware/auth';

test('auth middleware rejects requests without a bearer token', async () => {
  let statusCode = 0;
  let payload: unknown;
  let nextCalled = false;
  const req = {
    header: () => undefined,
  } as unknown as AuthenticatedRequest;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      payload = value;
      return this;
    },
  } as any;

  await requireAuth(req, res, () => { nextCalled = true; });

  assert.equal(statusCode, 401);
  assert.deepEqual(payload, {
    error: 'Unauthorized',
    message: 'A valid Supabase access token is required.',
  });
  assert.equal(nextCalled, false);
});
