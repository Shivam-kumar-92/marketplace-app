export interface MockVariant {
  id: string;
  sku: string;
  name: string;
  priceOffset: number;
  stock: number;
}

export interface MockReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface MockProduct {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  slug: string;
  description: string;
  basePrice: number;
  originalPrice?: number;
  images: string[];
  brand: string;
  rating: number;
  numReviews: number;
  isFeatured: boolean;
  badge?: string;
  highlights: string[];
  variants: MockVariant[];
  reviews: MockReview[];
}

export interface MockCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  itemCount: number;
}

export const MOCK_CATEGORIES: MockCategory[] = [
  {
    id: 'cat-electronics',
    name: 'Electronics & Audio',
    slug: 'electronics',
    description: 'Flagship headphones, smart wearables, and mobile accessories',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    itemCount: 48,
  },
  {
    id: 'cat-fashion',
    name: 'Fashion & Apparel',
    slug: 'fashion',
    description: 'Modern luxury streetwear, premium jackets, and casual essentials',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80',
    itemCount: 96,
  },
  {
    id: 'cat-home',
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Artisanal coffee makers, smart culinary tools, and interior aesthetics',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
    itemCount: 64,
  },
  {
    id: 'cat-sports',
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Pro badminton gear, training weights, and endurance gear',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
    itemCount: 32,
  },
];

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'prod-1',
    categoryId: 'cat-electronics',
    categoryName: 'Electronics & Audio',
    title: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
    slug: 'sony-wh-1000xm5-wireless-headphones',
    description: 'Industry-leading noise canceling with two processors and 8 microphones. Magnificent sound engineered to perfection with the integrated processor V1 and specially designed 30mm driver unit.',
    basePrice: 26990,
    originalPrice: 34990,
    brand: 'Sony',
    rating: 4.8,
    numReviews: 2410,
    isFeatured: true,
    badge: 'Best Seller',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Industry-leading dual-chip Active Noise Cancellation',
      'Up to 30-hour battery life with quick charge (3 min = 3 hrs)',
      'Multipoint connection to pair 2 Bluetooth devices seamlessly',
      'Ultra-comfortable, lightweight design with soft-fit leather',
    ],
    variants: [
      { id: 'var-1a', sku: 'SONY-XM5-BLK', name: 'Matte Black', priceOffset: 0, stock: 45 },
      { id: 'var-1b', sku: 'SONY-XM5-SLV', name: 'Platinum Silver', priceOffset: 500, stock: 18 },
      { id: 'var-1c', sku: 'SONY-XM5-BLU', name: 'Midnight Blue', priceOffset: 1200, stock: 9 },
    ],
    reviews: [
      { id: 'rev-1', userName: 'Aarav Mehta', rating: 5, comment: 'Phenomenal sound stage and battery life. Best commute companion!', date: '2 days ago' },
      { id: 'rev-2', userName: 'Pooja Sharma', rating: 5, comment: 'The mic quality during office conference calls is unmatched.', date: '1 week ago' },
    ],
  },
  {
    id: 'prod-2',
    categoryId: 'cat-electronics',
    categoryName: 'Electronics & Audio',
    title: 'Apple Watch Ultra 2 Titanium GPS + Cellular 49mm',
    slug: 'apple-watch-ultra-2-titanium',
    description: 'The ultimate sports and adventure watch. Featuring the S9 SiP, a magical new way to use your watch without touching the screen, and the brightest Apple display ever.',
    basePrice: 89900,
    originalPrice: 94900,
    brand: 'Apple',
    rating: 4.9,
    numReviews: 890,
    isFeatured: true,
    badge: 'Deal of the Day',
    images: [
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Rugged 49mm Aerospace-grade titanium case',
      'Up to 36 hours of normal battery life, 72 hours in low power',
      'Precision dual-frequency GPS for route accuracy',
      '100m water resistance and certified dive computer',
    ],
    variants: [
      { id: 'var-2a', sku: 'AW-ULTRA-ALPINE', name: 'Alpine Loop (Orange)', priceOffset: 0, stock: 15 },
      { id: 'var-2b', sku: 'AW-ULTRA-OCEAN', name: 'Ocean Band (Midnight)', priceOffset: 1500, stock: 22 },
      { id: 'var-2c', sku: 'AW-ULTRA-TRAIL', name: 'Trail Loop (Grey)', priceOffset: 1500, stock: 8 },
    ],
    reviews: [
      { id: 'rev-3', userName: 'Vikram Rao', rating: 5, comment: 'Indestructible watch. GPS lock is instant during mountain trails.', date: '3 days ago' },
    ],
  },
  {
    id: 'prod-3',
    categoryId: 'cat-fashion',
    categoryName: 'Fashion & Apparel',
    title: 'Minimalist Heavyweight Oversized Cotton Hoodie',
    slug: 'minimalist-heavyweight-oversized-hoodie',
    description: 'Crafted from 480 GSM French Terry organic cotton. Features double-stitched ribbing, dropped shoulder silhouette, and custom kangaroo front pocket designed for all-season layering.',
    basePrice: 3499,
    originalPrice: 4999,
    brand: 'Aura Atelier',
    rating: 4.7,
    numReviews: 650,
    isFeatured: true,
    badge: 'Trending',
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      '100% Organic combed French Terry cotton (480 GSM)',
      'Pre-shrunk fabric with silicone enzyme wash',
      'Drop-shoulder boxy modern streetwear fit',
      'Reinforced cuffs and waistband with elastane',
    ],
    variants: [
      { id: 'var-3a', sku: 'HOODIE-BLK-M', name: 'Charcoal Black - M', priceOffset: 0, stock: 60 },
      { id: 'var-3b', sku: 'HOODIE-BLK-L', name: 'Charcoal Black - L', priceOffset: 0, stock: 45 },
      { id: 'var-3c', sku: 'HOODIE-SAGE-M', name: 'Sage Green - M', priceOffset: 200, stock: 30 },
      { id: 'var-3d', sku: 'HOODIE-SAGE-L', name: 'Sage Green - L', priceOffset: 200, stock: 25 },
    ],
    reviews: [
      { id: 'rev-4', userName: 'Karan Joshi', rating: 5, comment: 'Incredible heavyweight drape. Feels like an international luxury brand.', date: '4 days ago' },
    ],
  },
  {
    id: 'prod-4',
    categoryId: 'cat-sports',
    categoryName: 'Sports & Fitness',
    title: 'Yonex Astrox 99 Pro Professional Badminton Racket',
    slug: 'yonex-astrox-99-pro-badminton-racket',
    description: 'Developed in collaboration with world number one Kento Momota. Features Rotational Generator System and Namd graphite for explosive smashes and pinpoint court control.',
    basePrice: 15490,
    originalPrice: 19990,
    brand: 'Yonex',
    rating: 4.9,
    numReviews: 1120,
    isFeatured: true,
    badge: 'Top Rated',
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Head-heavy balance optimized for aggressive attacking smashes',
      'Namd next-generation graphite provides fast snapback',
      'Energy Boost Cap Plus maximizes shaft flex and stability',
      'Includes tournament-grade thermal carrying bag',
    ],
    variants: [
      { id: 'var-4a', sku: 'ASTROX-99-4U-G5', name: '4U / G5 (Cherry Sunburst)', priceOffset: 0, stock: 24 },
      { id: 'var-4b', sku: 'ASTROX-99-3U-G5', name: '3U / G5 (White Tiger)', priceOffset: 800, stock: 14 },
    ],
    reviews: [
      { id: 'rev-5', userName: 'Devendra K.', rating: 5, comment: 'Smash speed increased noticeably. The grip and balance are pure gold.', date: '5 days ago' },
    ],
  },
  {
    id: 'prod-5',
    categoryId: 'cat-home',
    categoryName: 'Home & Kitchen',
    title: 'Breville Barista Touch Espresso Machine with PID Control',
    slug: 'breville-barista-touch-espresso-machine',
    description: 'Barista quality performance with an intuitive touchscreen menu of pre-programmed café drinks. Integrated precision conical burr grinder delivers the right amount of coffee on demand.',
    basePrice: 68990,
    originalPrice: 79990,
    brand: 'Breville',
    rating: 4.8,
    numReviews: 530,
    isFeatured: false,
    badge: 'Editor’s Choice',
    images: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Intuitive touch screen display with automatic microfoam texturing',
      'Innovative ThermoJet heating system achieves optimum extraction temperature in 3 seconds',
      'Digital Temperature Control (PID) delivers water at precise +/- 2°C',
      'Automatic purge function clears heat system after steaming',
    ],
    variants: [
      { id: 'var-5a', sku: 'BREV-TOUCH-SS', name: 'Brushed Stainless Steel', priceOffset: 0, stock: 12 },
      { id: 'var-5b', sku: 'BREV-TOUCH-BLK', name: 'Black Truffle', priceOffset: 2500, stock: 6 },
    ],
    reviews: [
      { id: 'rev-6', userName: 'Ananya S.', rating: 5, comment: 'Brought café mornings into my home. Flat whites taste authentic!', date: '1 week ago' },
    ],
  },
  {
    id: 'prod-6',
    categoryId: 'cat-electronics',
    categoryName: 'Electronics & Audio',
    title: 'Logitech MX Master 3S Wireless Performance Mouse',
    slug: 'logitech-mx-master-3s-wireless-mouse',
    description: 'An icon remastered with quiet clicks and an 8,000 DPI track-on-glass sensor for next-level productivity and ergonomics.',
    basePrice: 8995,
    originalPrice: 10995,
    brand: 'Logitech',
    rating: 4.8,
    numReviews: 3100,
    isFeatured: false,
    badge: 'Popular',
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Quiet clicks provide tactile feel with 90% less click noise',
      'MagSpeed electromagnetic scrolling scrolls 1,000 lines per second',
      '8,000 DPI optical sensor tracks seamlessly even on glass surfaces',
      'Cross-computer Flow control between Mac and Windows machines',
    ],
    variants: [
      { id: 'var-6a', sku: 'LOGI-MX3S-GRY', name: 'Space Graphite', priceOffset: 0, stock: 85 },
      { id: 'var-6b', sku: 'LOGI-MX3S-WHT', name: 'Pale Grey', priceOffset: 300, stock: 40 },
    ],
    reviews: [
      { id: 'rev-7', userName: 'Rahul Verma', rating: 5, comment: 'My wrist fatigue disappeared after using this. The MagSpeed scroll is addictive.', date: '2 weeks ago' },
    ],
  },
];

export function getProductByIdOrSlug(idOrSlug: string): MockProduct | undefined {
  return MOCK_PRODUCTS.find(
    (p) => p.id === idOrSlug || p.slug === idOrSlug
  );
}

export function getFeaturedProducts(): MockProduct[] {
  return MOCK_PRODUCTS.filter((p) => p.isFeatured);
}
