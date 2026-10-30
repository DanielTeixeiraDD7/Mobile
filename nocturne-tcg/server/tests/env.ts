process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://nocturne:nocturne@localhost:5432/nocturne_test';
process.env.JWT_SECRET ??= 'test-secret-test-secret-test-secret-test-secret';
process.env.APP_URL ??= 'http://localhost:5173';
process.env.CORS_ORIGINS ??= 'http://localhost:5173';
