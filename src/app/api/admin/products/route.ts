import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { success: false, error: adminCheck.error || 'Admin privileges required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const [total, products] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          variants: {
            select: { id: true, name: true, sku: true, stock: true, priceOffset: true },
          },
          _count: {
            select: { reviews: true, orderItems: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      products: products.map((p) => {
        const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          basePrice: p.basePrice,
          category: p.category.name,
          images: p.images,
          rating: p.rating,
          totalStock,
          isLowStock: totalStock < 5,
          variantsCount: p.variants.length,
          variants: p.variants,
          salesCount: p._count.orderItems,
          reviewsCount: p._count.reviews,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      }),
    });
  } catch (error: any) {
    console.error('[ADMIN_GET_PRODUCTS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve admin product list', message: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { success: false, error: adminCheck.error || 'Admin privileges required' },
        { status: 403 }
      );
    }

    let body: {
      id?: string;
      title: string;
      slug: string;
      description: string;
      basePrice: number;
      categoryId: string;
      images?: string[];
      brand?: string;
      variants?: Array<{
        name: string;
        sku: string;
        priceOffset?: number;
        stock: number;
      }>;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const { id, title, slug, description, basePrice, categoryId, images, brand, variants } = body;

    if (!title || !slug || !description || typeof basePrice !== 'number' || !categoryId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required product fields: title, slug, description, basePrice, categoryId',
        },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json(
        { success: false, error: `Category not found with ID: ${categoryId}` },
        { status: 404 }
      );
    }

    let product: any;

    if (id) {
      // DCI-009: Update existing product AND its variants atomically
      await prisma.$transaction(async (tx) => {
        product = await tx.product.update({
          where: { id },
          data: {
            title,
            slug,
            description,
            basePrice,
            categoryId,
            images: images || [],
            brand: brand || null,
          },
        });

        if (variants && Array.isArray(variants) && variants.length > 0) {
          for (const v of variants) {
            if (v.sku) {
              await tx.variant.upsert({
                where: { sku: v.sku },
                update: {
                  name: v.name,
                  priceOffset: v.priceOffset || 0,
                  stock: Math.max(0, v.stock),
                },
                create: {
                  productId: id,
                  name: v.name,
                  sku: v.sku,
                  priceOffset: v.priceOffset || 0,
                  stock: Math.max(0, v.stock),
                },
              });
            }
          }
        }
      });
    } else {
      // Create new product with variants
      product = await prisma.product.create({
        data: {
          title,
          slug,
          description,
          basePrice,
          categoryId,
          images: images || [],
          brand: brand || null,
          variants: {
            create: (variants || []).map((v) => ({
              name: v.name,
              sku: v.sku,
              priceOffset: v.priceOffset || 0,
              stock: Math.max(0, v.stock),
            })),
          },
        },
        include: {
          variants: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: id ? 'Product and variants updated successfully' : 'Product created successfully',
      product,
    });
  } catch (error: any) {
    console.error('[ADMIN_SAVE_PRODUCT_ERROR]', error);

    // Intercept Prisma unique constraint violation (P2002)
    if (error?.code === 'P2002') {
      const target = (error?.meta?.target as string[]) || [];
      return NextResponse.json(
        {
          success: false,
          error: `A product or variant already exists with the same ${target.join(', ') || 'slug/SKU'}`,
          code: 'DUPLICATE_ENTRY',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to save product', message: error?.message },
      { status: 500 }
    );
  }
}
