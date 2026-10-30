import { execSync } from 'node:child_process';

/** Base de test jetable : schéma recréé puis migrations appliquées. */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? 'postgresql://nocturne:nocturne@localhost:5432/nocturne_test';
  if (!/_test\b/.test(url)) throw new Error('TEST_DATABASE_URL doit pointer vers une base *_test');
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient({ datasourceUrl: url });
  await db.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE');
  await db.$executeRawUnsafe('CREATE SCHEMA public');
  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: url }, stdio: 'ignore' });
  const { seed } = await import('../prisma/seed');
  await seed(db);
  await db.$disconnect();
}
