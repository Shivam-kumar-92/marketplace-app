import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, resolveCustomerAccount } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "productId" is required' },
        { status: 400 }
      );
    }

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where: { productId } }),
      prisma.review.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
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
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        author: r.user?.name || 'Verified Buyer',
        authorImage: r.user?.image || null,
      })),
    });
  } catch (error: any) {
    console.error('[GET_REVIEWS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve reviews', message: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`review_${clientIp}`, {
    windowMs: 60000,
    maxRequests: 5,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Review rate limit exceeded. Please wait ${rateLimitResult.retryAfterSeconds} seconds before submitting again.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimitResult.retryAfterSeconds) },
      }
    );
  }

  try {
    let body: {
      productId: string;
      rating: number;
      comment?: string;
      userName?: string;
      userEmail?: string;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const { productId, rating, comment, userName, userEmail } = body;

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid productId is required' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify product exists in database
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true, rating: true, numReviews: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: `Product not found with ID: ${productId}` },
        { status: 404 }
      );
    }

    // Resolve user (logged-in session or verified customer email)
    const currentUser = await getCurrentUser(req);
    let user;
    if (currentUser) {
      user = await prisma.user.findUnique({ where: { id: currentUser.id } });
    } else {
      user = await resolveCustomerAccount({
        email: userEmail || 'reviewer@marketplace.local',
        name: userName || 'Product Reviewer',
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User could not be resolved' },
        { status: 400 }
      );
    }

    let review: any;
    await prisma.$transaction(async (tx) => {
      // DCI-007 Concurrency Guard: Lookup existing review inside transaction boundary
      const existingReview = await tx.review.findFirst({
        where: {
          userId: user.id,
          productId,
        },
      });

      if (existingReview) {
        // Update existing review
        review = await tx.review.update({
          where: { id: existingReview.id },
          data: {
            rating,
            comment: comment || existingReview.comment,
          },
        });
      } else {
        // Create new review
        review = await tx.review.create({
          data: {
            userId: user.id,
            productId,
            rating,
            comment: comment || '',
          },
        });
      }

      // Re-aggregate average rating for the product inside transaction
      const aggregations = await tx.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const newAvgRating = aggregations._avg.rating !== null ? aggregations._avg.rating : rating;
      const newNumReviews = aggregations._count.rating || 1;

      await tx.product.update({
        where: { id: productId },
        data: {
          rating: Math.round(newAvgRating * 10) / 10,
          numReviews: newNumReviews,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      review: {
        id: review?.id,
        productId,
        rating,
        comment,
      },
    });
  } catch (error: any) {
    console.error('[POST_REVIEW_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review', message: error?.message },
      { status: 500 }
    );
  }
}
