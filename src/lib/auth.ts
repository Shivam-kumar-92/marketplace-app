import { prisma } from './prisma';

export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  role: 'CUSTOMER' | 'ADMIN';
}

/**
 * Resolves the authenticated user from request headers, session cookies,
 * or direct user identifiers. Supports seamless expansion to NextAuth / custom JWTs.
 */
export async function getCurrentUser(req: Request): Promise<AuthUser | null> {
  try {
    // 1. Direct user identifier header (trusted internal gateway / client session state)
    const headerUserId = req.headers.get('x-user-id');
    if (headerUserId && headerUserId !== 'guest') {
      const user = await prisma.user.findUnique({
        where: { id: headerUserId },
        select: { id: true, name: true, email: true, role: true },
      });
      if (user) return user;
    }

    // 2. Cookie-based session lookup (NextAuth / custom session tokens)
    const cookieHeader = req.headers.get('cookie') || '';
    const sessionTokenMatch = cookieHeader.match(/(?:next-auth\.session-token|session-token)=([^;]+)/);
    if (sessionTokenMatch && sessionTokenMatch[1]) {
      const sessionToken = decodeURIComponent(sessionTokenMatch[1]);
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      });
      if (session && session.user && session.expires > new Date()) {
        return session.user;
      }
    }

    // 3. Authorization Bearer Token
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const session = await prisma.session.findUnique({
        where: { sessionToken: token },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      });
      if (session && session.user && session.expires > new Date()) {
        return session.user;
      }
    }

    return null;
  } catch (err) {
    console.warn('[AUTH_USER_RESOLVE_WARN] Could not resolve current user:', err);
    return null;
  }
}

/**
 * Validates whether the incoming request has ADMIN privileges.
 * Supports ADMIN user sessions or a server-side ADMIN_SECRET_KEY header.
 */
export async function requireAdmin(req: Request): Promise<{ isAdmin: boolean; error?: string }> {
  // Check for admin master key header (useful for CI/CD, webhooks, or admin integrations)
  const adminSecretHeader = req.headers.get('x-admin-key');
  const configuredAdminSecret = process.env.ADMIN_SECRET_KEY || 'marketplace_admin_secret_dev';
  if (adminSecretHeader && adminSecretHeader === configuredAdminSecret) {
    return { isAdmin: true };
  }

  // Check for logged-in user with ADMIN role
  const user = await getCurrentUser(req);
  if (!user) {
    return { isAdmin: false, error: 'Authentication required. Please log in.' };
  }

  if (user.role !== 'ADMIN') {
    return { isAdmin: false, error: 'Forbidden. Admin privileges required.' };
  }

  return { isAdmin: true };
}

/**
 * Resolves or creates an individualized customer record.
 * Avoids pooling all guest checkouts into a single dummy account if an email is provided.
 */
export async function resolveCustomerAccount(params: {
  userId?: string;
  email?: string;
  name?: string;
}) {
  const { userId, email, name } = params;

  // 1. Try finding by ID if provided and not literal 'guest'
  if (userId && userId !== 'guest' && userId !== 'guest_user') {
    const existingById = await prisma.user.findUnique({ where: { id: userId } });
    if (existingById) return existingById;
  }

  // 2. Try finding or creating by individual customer email
  const targetEmail = (email && email.trim().toLowerCase()) || 'guest@marketplace.local';
  const customerName = name || (targetEmail === 'guest@marketplace.local' ? 'Guest Customer' : 'Customer');

  const customer = await prisma.user.upsert({
    where: { email: targetEmail },
    update: {}, // Security guard: Never overwrite existing user name or attributes from unauthenticated input
    create: {
      name: customerName,
      email: targetEmail,
      role: 'CUSTOMER',
    },
  });

  return customer;
}
