import { PrismaClient, type Prisma } from '@prisma/client';

export const prisma = new PrismaClient();
export type Tx = Prisma.TransactionClient;

/** Verrou ligne sur le joueur : sérialise toutes les opérations de solde d'un même joueur. */
export async function lockUsers(tx: Tx, ...ids: string[]) {
  for (const id of [...new Set(ids)].sort()) await tx.$queryRaw`SELECT 1 FROM "User" WHERE id = ${id} FOR UPDATE`;
}

export const transaction = <T>(fn: (tx: Tx) => Promise<T>) => prisma.$transaction(fn, { timeout: 15_000 });
