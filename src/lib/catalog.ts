import { unstable_cache } from 'next/cache';
import { getPrismaClient } from './prisma';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MockCategory, MockProduct } from './mockData';

export type ProductSortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating';

export interface ProductQueryOptions {
  categoryId?: string;
  searchQuery?: string;
  isFeatured?: boolean;
  sortBy?: ProductSortOption;
  limit?: number;
  offset?: number;
}

/**
 * Enterprise Catalog Data Access Layer
 * Seamlessly queries live PostgreSQL via Prisma ORM when available,
 * utilizing composite database indexes and falling back to memory catalog.
 */

export async function getCategories(): Promise<MockCategory[]> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return MOCK_CATEGORIES;
  }

  try {
    const dbCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (dbCategories && dbCategories.length > 0) {
      return dbCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        image: c.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        itemCount: c._count.products,
      }));
    }
  } catch (_err) {
    // Fallback to mock data if database is not reachable
  }

  return MOCK_CATEGORIES;
}

/**
 * Cached Categories Layer (revalidates every 300 seconds)
 * Drastically reduces PostgreSQL connection load for repeated navigation requests.
 */
export const getCachedCategories = unstable_cache(
  async () => getCategories(),
  ['catalog-categories'],
  { revalidate: 300, tags: ['categories'] }
);

export async function getProducts(options?: ProductQueryOptions): Promise<MockProduct[]> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return filterMockProducts(options);
  }

  try {
    const whereClause: Record<string, any> = {};

    if (options?.categoryId && options.categoryId !== 'all') {
      whereClause.categoryId = options.categoryId;
    }

    if (options?.isFeatured !== undefined) {
      whereClause.isFeatured = options.isFeatured;
    }

    if (options?.searchQuery) {
      whereClause.OR = [
        { title: { contains: options.searchQuery, mode: 'insensitive' } },
        { description: { contains: options.searchQuery, mode: 'insensitive' } },
        { brand: { contains: options.searchQuery, mode: 'insensitive' } },
      ];
    }

    // Determine query ordering mapping to indexed columns
    let orderByClause: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' };
    if (options?.sortBy === 'price_asc') {
      orderByClause = { basePrice: 'asc' };
    } else if (options?.sortBy === 'price_desc') {
      orderByClause = { basePrice: 'desc' };
    } else if (options?.sortBy === 'rating') {
      orderByClause = { rating: 'desc' };
    }

    const takeLimit = options?.limit ?? 40;
    const skipOffset = options?.offset ?? 0;

    const dbProducts = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        variants: true,
        reviews: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: orderByClause,
      take: takeLimit,
      skip: skipOffset,
    });

    if (dbProducts && dbProducts.length > 0) {
      return dbProducts.map((p) => ({
        id: p.id,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        title: p.title,
        slug: p.slug,
        description: p.description,
        basePrice: p.basePrice,
        images: p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80'],
        brand: p.brand || 'NexMart',
        rating: p.rating,
        numReviews: p.numReviews,
        isFeatured: p.isFeatured,
        highlights: [],
        variants: p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          name: v.name,
          priceOffset: v.priceOffset,
          stock: v.stock,
        })),
        reviews: p.reviews.map((r) => ({
          id: r.id,
          userName: r.user.name || 'Verified Buyer',
          rating: r.rating,
          comment: r.comment || '',
          date: r.createdAt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
        })),
      }));
    }
  } catch (_err) {
    // Fallback to mock data if database is offline
  }

  return filterMockProducts(options);
}

function filterMockProducts(options?: ProductQueryOptions): MockProduct[] {
  let list = MOCK_PRODUCTS.filter((p) => {
    if (options?.categoryId && options.categoryId !== 'all') {
      if (p.categoryId !== options.categoryId) return false;
    }
    if (options?.isFeatured !== undefined && p.isFeatured !== options.isFeatured) {
      return false;
    }
    if (options?.searchQuery) {
      const q = options.searchQuery.toLowerCase().trim();
      const match =
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  if (options?.sortBy === 'price_asc') {
    list = [...list].sort((a, b) => a.basePrice - b.basePrice);
  } else if (options?.sortBy === 'price_desc') {
    list = [...list].sort((a, b) => b.basePrice - a.basePrice);
  } else if (options?.sortBy === 'rating') {
    list = [...list].sort((a, b) => b.rating - a.rating);
  }

  if (options?.offset || options?.limit) {
    const start = options.offset || 0;
    const end = start + (options.limit || 40);
    list = list.slice(start, end);
  }

  return list;
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<MockProduct | undefined> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const p = await prisma.product.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
        include: {
          category: true,
          variants: true,
          reviews: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      });

      if (p) {
        return {
          id: p.id,
          categoryId: p.categoryId,
          categoryName: p.category.name,
          title: p.title,
          slug: p.slug,
          description: p.description,
          basePrice: p.basePrice,
          images: p.images,
          brand: p.brand || 'NexMart',
          rating: p.rating,
          numReviews: p.numReviews,
          isFeatured: p.isFeatured,
          highlights: [],
          variants: p.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            name: v.name,
            priceOffset: v.priceOffset,
            stock: v.stock,
          })),
          reviews: p.reviews.map((r) => ({
            id: r.id,
            userName: r.user.name || 'Verified Buyer',
            rating: r.rating,
            comment: r.comment || '',
            date: r.createdAt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
          })),
        };
      }
    } catch (_err) {
      // Fallback
    }
  }

  return MOCK_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}
