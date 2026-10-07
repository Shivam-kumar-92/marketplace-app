import { PrismaClient } from '@prisma/client';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../src/lib/mockData';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding NexMart PostgreSQL Database...');

  // 1. Seed Demo Admin & Customer Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nexmart.local' },
    update: {},
    create: {
      name: 'NexMart Operations Admin',
      email: 'admin@nexmart.local',
      role: 'ADMIN',
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'buyer@nexmart.local' },
    update: {},
    create: {
      name: 'Aarav Mehta',
      email: 'buyer@nexmart.local',
      role: 'CUSTOMER',
      addresses: {
        create: {
          fullName: 'Aarav Mehta',
          street: '42, Indiranagar 100 Feet Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560038',
          country: 'India',
          isDefault: true,
        },
      },
    },
  });

  console.log(`✓ Created demo users: Admin (${adminUser.email}), Customer (${customerUser.email})`);

  // 2. Seed All Categories
  for (const cat of MOCK_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        image: cat.image,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
      },
    });
  }
  console.log(`✓ Seeded ${MOCK_CATEGORIES.length} e-commerce categories.`);

  // 3. Seed Products, Variants, and Customer Reviews
  let seededProductsCount = 0;
  let seededVariantsCount = 0;
  let seededReviewsCount = 0;

  for (const prod of MOCK_PRODUCTS) {
    const existing = await prisma.product.findUnique({
      where: { slug: prod.slug },
    });

    let productId = existing?.id;

    if (!existing) {
      const created = await prisma.product.create({
        data: {
          id: prod.id,
          categoryId: prod.categoryId,
          title: prod.title,
          slug: prod.slug,
          description: prod.description,
          basePrice: prod.basePrice,
          images: prod.images,
          brand: prod.brand,
          rating: prod.rating,
          numReviews: prod.numReviews,
          isFeatured: prod.isFeatured,
        },
      });
      productId = created.id;
    } else {
      await prisma.product.update({
        where: { id: productId },
        data: {
          categoryId: prod.categoryId,
          title: prod.title,
          description: prod.description,
          basePrice: prod.basePrice,
          images: prod.images,
          brand: prod.brand,
          rating: prod.rating,
          numReviews: prod.numReviews,
          isFeatured: prod.isFeatured,
        },
      });
    }

    seededProductsCount++;

    // Seed Variants
    for (const variant of prod.variants) {
      await prisma.variant.upsert({
        where: { sku: variant.sku },
        update: {
          name: variant.name,
          priceOffset: variant.priceOffset,
          stock: variant.stock,
        },
        create: {
          id: variant.id,
          productId: productId!,
          sku: variant.sku,
          name: variant.name,
          priceOffset: variant.priceOffset,
          stock: variant.stock,
        },
      });
      seededVariantsCount++;
    }

    // Seed Reviews
    for (const rev of prod.reviews) {
      const existingReview = await prisma.review.findFirst({
        where: { productId: productId!, userId: customerUser.id },
      });

      if (!existingReview) {
        await prisma.review.create({
          data: {
            userId: customerUser.id,
            productId: productId!,
            rating: rev.rating,
            comment: rev.comment,
          },
        });
        seededReviewsCount++;
      }
    }
  }

  console.log(`✓ Seeded ${seededProductsCount} catalog products.`);
  console.log(`✓ Seeded ${seededVariantsCount} inventory SKU variants.`);
  console.log(`✓ Seeded ${seededReviewsCount} verified customer reviews.`);
  console.log('🎉 NexMart database is fully populated and production ready!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
