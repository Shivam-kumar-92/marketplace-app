import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Returns the PrismaClient singleton if configured and running on the server,
 * or null if not yet connected / missing database driver options.
 */
export const getPrismaClient = (): PrismaClient | null => {
  if (typeof window !== 'undefined') return null;
  if (!process.env.DATABASE_URL) return null;

  if (!globalThis.prismaGlobal) {
    try {
      globalThis.prismaGlobal = new PrismaClient();
    } catch {
      return null;
    }
  }
  return globalThis.prismaGlobal;
};

/**
 * Lazy proxy allowing direct `prisma.product.findMany()` calls
 * without failing during static module evaluation at build time.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (!client) {
      throw new Error(
        'Database connection not initialized. Please configure DATABASE_URL in your .env file.'
      );
    }
    return (client as any)[prop];
  },
});

export default prisma;
