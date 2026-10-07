import { PrismaClient } from '@prisma/client';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../src/lib/mockData';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding NexMart database...');

  // 1. Create a demo user for reviews
  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@marketplace.local' },
    update: {},
    create: {
      name: 'NexMart Verified Buyer',
      email: 'reviewer@marketplace.local',
      role: 'CUSTOMER',
    },
  });

  // 2. Seed Categories
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

  // 3. Seed Products and Variants
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
    }

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
    }

    // Seed Reviews
    for (const rev of prod.reviews) {
      const existingReview = await prisma.review.findFirst({
        where: { productId: productId!, userId: reviewer.id },
      });

      if (!existingReview) {
        await prisma.review.create({
          data: {
            userId: reviewer.id,
            productId: productId!,
            rating: rev.rating,
            comment: rev.comment,
          },
        });
      }
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
