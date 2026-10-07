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
    description: 'Flagship headphones, wireless earbuds, smart wearables, and studio audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    itemCount: 48,
  },
  {
    id: 'cat-computers',
    name: 'Computers & Gaming',
    slug: 'computers-gaming',
    description: 'Ultrawide displays, mechanical keyboards, ergonomic mice, and NVMe drives',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
    itemCount: 36,
  },
  {
    id: 'cat-fashion',
    name: 'Fashion & Luxury Apparel',
    slug: 'fashion',
    description: 'French Terry hoodies, Japanese selvedge denim, and minimalist outerwear',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80',
    itemCount: 96,
  },
  {
    id: 'cat-home',
    name: 'Home, Kitchen & Coffee',
    slug: 'home-kitchen',
    description: 'Artisanal espresso machines, cast iron cookware, and smart kitchen tools',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
    itemCount: 64,
  },
  {
    id: 'cat-sports',
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Tournament badminton rackets, adjustable dumbbells, and endurance gear',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
    itemCount: 32,
  },
  {
    id: 'cat-watches',
    name: 'Watches & Accessories',
    slug: 'watches-accessories',
    description: 'Automatic chronographs, titanium dive watches, and RFID leather goods',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    itemCount: 42,
  },
  {
    id: 'cat-beauty',
    name: 'Beauty & Grooming',
    slug: 'beauty-grooming',
    description: 'Ionic styling tools, dermatologist-grade skincare, and precision shavers',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    itemCount: 28,
  },
  {
    id: 'cat-footwear',
    name: 'Footwear & Sneakers',
    slug: 'footwear',
    description: 'Engineered trail runners, Italian leather boots, and everyday sneakers',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    itemCount: 54,
  },
];

export const MOCK_PRODUCTS: MockProduct[] = [
  // 1. Sony WH-1000XM5
  {
    id: 'prod-1',
    categoryId: 'cat-electronics',
    categoryName: 'Electronics & Audio',
    title: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
    slug: 'sony-wh-1000xm5-wireless-headphones',
    description: 'Industry-leading noise canceling with two processors and 8 microphones. Magnificent sound engineered to perfection with the integrated processor V1 and specially designed 30mm carbon fiber driver unit.',
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
      'Industry-leading dual-chip Active Noise Cancellation with Auto NC Optimizer',
      'Up to 30-hour battery life with 3-minute quick charge giving 3 hours playback',
      'Multipoint connection to pair 2 Bluetooth devices seamlessly',
      'Ultra-comfortable, lightweight design with soft-fit synthetic leather',
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

  // 2. Apple Watch Ultra 2
  {
    id: 'prod-2',
    categoryId: 'cat-electronics',
    categoryName: 'Electronics & Audio',
    title: 'Apple Watch Ultra 2 Titanium GPS + Cellular 49mm',
    slug: 'apple-watch-ultra-2-titanium',
    description: 'The ultimate sports and adventure watch. Featuring the S9 SiP, double tap gesture recognition, and 3,000 nits brightest Apple display ever engineered.',
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
      'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Rugged 49mm Aerospace-grade titanium case with raised sapphire crystal',
      'Up to 36 hours of normal battery life, 72 hours in low power mode',
      'Precision dual-frequency GPS (L1 and L5) for exact route accuracy',
      '100m water resistance and EN13319 certified dive computer depth gauge',
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

  // 3. Minimalist Hoodie
  {
    id: 'prod-3',
    categoryId: 'cat-fashion',
    categoryName: 'Fashion & Luxury Apparel',
    title: 'Minimalist Heavyweight Oversized Cotton Hoodie',
    slug: 'minimalist-heavyweight-oversized-hoodie',
    description: 'Crafted from 480 GSM French Terry organic combed cotton. Features double-stitched ribbing, dropped shoulder silhouette, and custom kangaroo front pocket designed for all-season layering.',
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
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      '100% Organic combed French Terry cotton (480 GSM heavy structure)',
      'Pre-shrunk fabric with vintage silicone enzyme wash',
      'Drop-shoulder boxy modern streetwear fit',
      'Reinforced cuffs and waistband with 5% elastane retention',
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

  // 4. Yonex Astrox 99 Pro
  {
    id: 'prod-4',
    categoryId: 'cat-sports',
    categoryName: 'Sports & Fitness',
    title: 'Yonex Astrox 99 Pro Professional Badminton Racket',
    slug: 'yonex-astrox-99-pro-badminton-racket',
    description: 'Developed in collaboration with world champion Kento Momota. Features Rotational Generator System and Namd graphite for explosive smashes and pinpoint court control.',
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

  // 5. Breville Espresso Machine
  {
    id: 'prod-5',
    categoryId: 'cat-home',
    categoryName: 'Home, Kitchen & Coffee',
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

  // 6. Logitech MX Master 3S
  {
    id: 'prod-6',
    categoryId: 'cat-computers',
    categoryName: 'Computers & Gaming',
    title: 'Logitech MX Master 3S Wireless Performance Ergonomic Mouse',
    slug: 'logitech-mx-master-3s-wireless-mouse',
    description: 'An ergonomic icon remastered with quiet clicks and an 8,000 DPI track-on-glass sensor for next-level productivity and coding workflows.',
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

  // 7. Keychron Q1 Pro
  {
    id: 'prod-7',
    categoryId: 'cat-computers',
    categoryName: 'Computers & Gaming',
    title: 'Keychron Q1 Pro Custom QMK/VIA Wireless Mechanical Keyboard',
    slug: 'keychron-q1-pro-wireless-mechanical-keyboard',
    description: 'A 75% layout all-metal QMK/VIA wireless mechanical keyboard. CNC machined aluminum body, double-gasket design, and hot-swappable switches for the ultimate typing experience.',
    basePrice: 16999,
    originalPrice: 19999,
    brand: 'Keychron',
    rating: 4.9,
    numReviews: 940,
    isFeatured: true,
    badge: 'Staff Pick',
    images: [
      'https://images.unsplash.com/photo-1595225476474-87563907a212?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Solid 6063 CNC aluminum chassis with acoustic sound absorbing foams',
      'QMK/VIA open-source firmware for complete custom key remapping',
      'Hot-swappable sockets compatible with 3-pin and 5-pin MX switches',
      'Bluetooth 5.1 wireless connectivity plus Type-C wired mode',
    ],
    variants: [
      { id: 'var-7a', sku: 'KEY-Q1P-RED', name: 'Carbon Black / K Pro Red (Linear)', priceOffset: 0, stock: 20 },
      { id: 'var-7b', sku: 'KEY-Q1P-BRN', name: 'Silver Grey / K Pro Brown (Tactile)', priceOffset: 500, stock: 15 },
    ],
    reviews: [
      { id: 'rev-8', userName: 'Siddharth M.', rating: 5, comment: 'The sound profile out of the box is incredible. Heavy, premium build.', date: '3 days ago' },
    ],
  },

  // 8. Bose QuietComfort Ultra Earbuds
  {
    id: 'prod-8',
    categoryId: 'cat-electronics',
    categoryName: 'Electronics & Audio',
    title: 'Bose QuietComfort Ultra Wireless Earbuds with Spatial Audio',
    slug: 'bose-quietcomfort-ultra-earbuds',
    description: 'Breakthrough spatialized audio for more immersive listening that makes music feel realer than ever. CustomTune technology personalizes sound shaped to your ears.',
    basePrice: 24900,
    originalPrice: 29900,
    brand: 'Bose',
    rating: 4.7,
    numReviews: 1420,
    isFeatured: false,
    badge: 'Popular',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'World-class noise cancellation with Aware Mode and ActiveSense',
      'Bose Immersive Audio pushes boundaries of spatial sound staging',
      'Nine combinations of eartips and stability bands for all-day comfort',
      'Up to 6 hours listening (4 hours with Immersive Audio)',
    ],
    variants: [
      { id: 'var-8a', sku: 'BOSE-QC-BLK', name: 'Black', priceOffset: 0, stock: 35 },
      { id: 'var-8b', sku: 'BOSE-QC-WHT', name: 'White Smoke', priceOffset: 0, stock: 28 },
    ],
    reviews: [
      { id: 'rev-9', userName: 'Meera N.', rating: 5, comment: 'Better ANC than any earbuds I have ever owned. Flying with these is serene.', date: '1 week ago' },
    ],
  },

  // 9. Italian Suede Chelsea Boots
  {
    id: 'prod-9',
    categoryId: 'cat-footwear',
    categoryName: 'Footwear & Sneakers',
    title: 'Artisanal Italian Suede Goodyear Welted Chelsea Boots',
    slug: 'artisanal-italian-suede-chelsea-boots',
    description: 'Handcrafted in Tuscany from full-grain water-resistant calf suede. Built on a Goodyear welted Dainite studded rubber sole for lifelong recraftability and wet-weather grip.',
    basePrice: 12999,
    originalPrice: 17999,
    brand: 'Veloce Footwear',
    rating: 4.9,
    numReviews: 480,
    isFeatured: true,
    badge: 'Handcrafted',
    images: [
      'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Full-grain Tuscan calfskin suede with hydrophobic Scotchgard coating',
      'Traditional 360-degree Goodyear welt construction (fully resolable)',
      'British Dainite studded rubber outsole for wet grip without lug bulk',
      'Calfskin leather lining and vegetable-tanned leather footbed',
    ],
    variants: [
      { id: 'var-9a', sku: 'BOOT-SD-BRN-42', name: 'Espresso Brown - EU 42', priceOffset: 0, stock: 12 },
      { id: 'var-9b', sku: 'BOOT-SD-BRN-43', name: 'Espresso Brown - EU 43', priceOffset: 0, stock: 18 },
      { id: 'var-9c', sku: 'BOOT-SD-SAN-42', name: 'Sand Taupe - EU 42', priceOffset: 500, stock: 10 },
      { id: 'var-9d', sku: 'BOOT-SD-SAN-43', name: 'Sand Taupe - EU 43', priceOffset: 500, stock: 14 },
    ],
    reviews: [
      { id: 'rev-10', userName: 'Arjun Singhania', rating: 5, comment: 'The silhouette is razor sharp. Comfortable straight out of the box.', date: '5 days ago' },
    ],
  },

  // 10. Seiko Prospex Speedtimer
  {
    id: 'prod-10',
    categoryId: 'cat-watches',
    categoryName: 'Watches & Accessories',
    title: 'Seiko Prospex Speedtimer Solar Chronograph 39mm',
    slug: 'seiko-prospex-speedtimer-solar-chronograph',
    description: 'Inspired by the historic 1969 Speedtimer. Powered by Seiko solar caliber V192 with 6-month power reserve, sandblast textured panda dial, and curved anti-reflective sapphire crystal.',
    basePrice: 58500,
    originalPrice: 65000,
    brand: 'Seiko',
    rating: 4.9,
    numReviews: 760,
    isFeatured: true,
    badge: 'Luxury',
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Solar-powered Caliber V192 charges from any ambient light source',
      'Curved sapphire crystal with anti-reflective coating on inner surface',
      '100m water resistance with solid link stainless steel bracelet',
      'Panda dial aesthetic with sub-dials and power reserve indicator',
    ],
    variants: [
      { id: 'var-10a', sku: 'SEIKO-SSC813', name: 'SSC813 (White Panda Dial)', priceOffset: 0, stock: 16 },
      { id: 'var-10b', sku: 'SEIKO-SSC817', name: 'SSC817 (Gold Sand Dial)', priceOffset: 1200, stock: 8 },
    ],
    reviews: [
      { id: 'rev-11', userName: 'Rohan Deshmukh', rating: 5, comment: 'The proportions on wrist are flawless. Looks like a watch three times its price.', date: '2 weeks ago' },
    ],
  },

  // 11. LG UltraGear 34" Curved OLED
  {
    id: 'prod-11',
    categoryId: 'cat-computers',
    categoryName: 'Computers & Gaming',
    title: 'LG UltraGear 34-Inch Curved WQHD OLED Gaming Monitor (240Hz)',
    slug: 'lg-ultragear-34-inch-curved-oled-monitor',
    description: 'Immerse yourself with an 800R curved 3440x1440 OLED panel boasting an ultra-fast 0.03ms response time, 240Hz refresh rate, and 98.5% DCI-P3 color gamut.',
    basePrice: 94990,
    originalPrice: 119990,
    brand: 'LG',
    rating: 4.8,
    numReviews: 320,
    isFeatured: false,
    badge: 'Top Tech',
    images: [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1547119957-637f8679db1e?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      '34" 21:9 WQHD (3440 x 1440) Curved OLED with 800R dramatic curvature',
      '240Hz refresh rate and lightning 0.03ms (GtG) pixel response time',
      'NVIDIA G-SYNC Compatible and AMD FreeSync Premium Pro certification',
      'Anti-glare low reflection coating preserves deep black levels in lit rooms',
    ],
    variants: [
      { id: 'var-11a', sku: 'LG-34GS95QE', name: 'Standard Ergonomic Stand', priceOffset: 0, stock: 9 },
    ],
    reviews: [
      { id: 'rev-12', userName: 'Nikhil T.', rating: 5, comment: 'Infinite contrast and zero ghosting. Coding and gaming in split screen is heaven.', date: '4 days ago' },
    ],
  },

  // 12. Bowflex Adjustable Dumbbells
  {
    id: 'prod-12',
    categoryId: 'cat-sports',
    categoryName: 'Sports & Fitness',
    title: 'Bowflex SelectTech 552 Rapid-Adjustable Dumbbells (Pair)',
    slug: 'bowflex-selecttech-552-adjustable-dumbbells',
    description: 'Replaces 15 pairs of weights with an intuitive dial system. Smoothly adjusts from 2.5 kg up to 24 kg per dumbbell for total home gym space savings.',
    basePrice: 38990,
    originalPrice: 47990,
    brand: 'Bowflex',
    rating: 4.8,
    numReviews: 1840,
    isFeatured: false,
    badge: 'Home Gym',
    images: [
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Combines 15 sets of weights into a single compact storage footprint',
      'Select desired weight in 1.1 kg increments with turning of dial',
      'Durable molding around metal plates creates quiet, clang-free lift',
      'Includes ergonomic fitted floor storage cradles',
    ],
    variants: [
      { id: 'var-12a', sku: 'BOWFLEX-552-PR', name: 'Pair (2 to 24 kg each)', priceOffset: 0, stock: 18 },
    ],
    reviews: [
      { id: 'rev-13', userName: 'Pranav K.', rating: 5, comment: 'Worth every rupee. Saves so much bedroom space and transition time between supersets.', date: '1 month ago' },
    ],
  },

  // 13. Le Creuset Dutch Oven
  {
    id: 'prod-13',
    categoryId: 'cat-home',
    categoryName: 'Home, Kitchen & Coffee',
    title: 'Le Creuset Enameled Cast Iron Signature Round Dutch Oven 5.3L',
    slug: 'le-creuset-enameled-cast-iron-dutch-oven',
    description: 'An indispensable French culinary centerpiece. Unmatched heat retention and distribution locks in moisture and flavor for stews, curries, sourdough bread, and roasts.',
    basePrice: 28900,
    originalPrice: 34900,
    brand: 'Le Creuset',
    rating: 4.9,
    numReviews: 920,
    isFeatured: false,
    badge: 'Heirloom',
    images: [
      'https://images.unsplash.com/photo-1584990347449-a2e6f43e0626?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Handcrafted in France since 1925 with lifetime manufacturer guarantee',
      'Durable vibrant exterior enamel resists chipping and cracking',
      'Tight-fitting lid circulates steam and returns moisture to food',
      'Safe for all cooktops including induction, oven safe up to 260°C',
    ],
    variants: [
      { id: 'var-13a', sku: 'LC-DUTCH-CERISE', name: 'Cerise Red (5.3L)', priceOffset: 0, stock: 14 },
      { id: 'var-13b', sku: 'LC-DUTCH-MARSEIL', name: 'Marseille Blue (5.3L)', priceOffset: 500, stock: 10 },
      { id: 'var-13c', sku: 'LC-DUTCH-VOLCAN', name: 'Volcanic Flame (5.3L)', priceOffset: 0, stock: 8 },
    ],
    reviews: [
      { id: 'rev-14', userName: 'Kavita Menon', rating: 5, comment: 'Bakes artisanal sourdough with a bakery-grade blistered crust.', date: '3 weeks ago' },
    ],
  },

  // 14. Dyson Supersonic Hair Dryer
  {
    id: 'prod-14',
    categoryId: 'cat-beauty',
    categoryName: 'Beauty & Grooming',
    title: 'Dyson Supersonic Nural Intelligent Hair Dryer',
    slug: 'dyson-supersonic-nural-intelligent-hair-dryer',
    description: 'Intelligent scalp protect mode automatically reduces heat to 55°C as it nears your head. Powered by the Dyson digital motor V9 with Air Multiplier technology for fast drying with zero heat damage.',
    basePrice: 39900,
    originalPrice: 44900,
    brand: 'Dyson',
    rating: 4.8,
    numReviews: 1250,
    isFeatured: true,
    badge: 'Innovative',
    images: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Nural sensor network maintains consistent 55°C scalp target temperature',
      'Capsule illumination changes color from cool blue to red indicating heat',
      'Attachment learning recognizes and adjusts to your preset styling preferences',
      'Includes Wave+Curl diffuser, gentle air attachment, and styling concentrator',
    ],
    variants: [
      { id: 'var-14a', sku: 'DYSON-NURAL-TEAL', name: 'Ceramic Patina & Topaz', priceOffset: 0, stock: 22 },
      { id: 'var-14b', sku: 'DYSON-NURAL-VIO', name: 'Vinca Blue & Rose', priceOffset: 1000, stock: 15 },
    ],
    reviews: [
      { id: 'rev-15', userName: 'Sunita Pillai', rating: 5, comment: 'Dries my thick hair in 6 minutes without frizzy flyaways.', date: '6 days ago' },
    ],
  },

  // 15. Ray-Ban Polarized Aviator
  {
    id: 'prod-15',
    categoryId: 'cat-watches',
    categoryName: 'Watches & Accessories',
    title: 'Ray-Ban Classic Polarized Aviator Sunglasses (Gold / G-15)',
    slug: 'ray-ban-classic-polarized-aviator-sunglasses',
    description: 'The definitive style statement originally engineered in 1937 for US aviators. Crystal polarized G-15 lenses eliminate 99% of glare and provide 100% UV protection.',
    basePrice: 11290,
    originalPrice: 13990,
    brand: 'Ray-Ban',
    rating: 4.7,
    numReviews: 2190,
    isFeatured: false,
    badge: 'Iconic',
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Authentic crystal green G-15 polarized lenses with anti-reflective back coating',
      'Corrosion-resistant gold monel metal frame with adjustable clear silicone nose pads',
      '100% UVA/UVB optical protection',
      'Includes embossed leather carrying case and microfiber lens cloth',
    ],
    variants: [
      { id: 'var-15a', sku: 'RB-3025-58-GLD', name: 'Gold / Green Polarized (58mm Medium)', priceOffset: 0, stock: 30 },
      { id: 'var-15b', sku: 'RB-3025-62-GLD', name: 'Gold / Green Polarized (62mm Large)', priceOffset: 500, stock: 20 },
    ],
    reviews: [
      { id: 'rev-16', userName: 'Vikas Malhotra', rating: 5, comment: 'Timeless silhouette. Driving in bright sun is completely fatigue-free.', date: '1 month ago' },
    ],
  },

  // 16. SanDisk 2TB Extreme SSD
  {
    id: 'prod-16',
    categoryId: 'cat-computers',
    categoryName: 'Computers & Gaming',
    title: 'SanDisk 2TB Extreme Portable NVMe USB-C SSD (1050MB/s)',
    slug: 'sandisk-2tb-extreme-portable-nvme-ssd',
    description: 'Rugged storage engineered for on-the-go creators and developers. Features NVMe solid-state performance with up to 1050MB/s read speeds, IP55 dust and water resistance.',
    basePrice: 16999,
    originalPrice: 24999,
    brand: 'SanDisk',
    rating: 4.8,
    numReviews: 4120,
    isFeatured: false,
    badge: 'Best Value',
    images: [
      'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=1000&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Fast NVMe solid state performance with 1050MB/s read and 1000MB/s write speeds',
      'Up to two-meter drop protection and IP55 water and dust resistance',
      'Handy carabiner loop to secure the drive to your belt loop or backpack',
      'Hardware 256-bit AES password encryption built in',
    ],
    variants: [
      { id: 'var-16a', sku: 'SD-EXT-2TB-BLK', name: '2TB Charcoal / Orange Accent', priceOffset: 0, stock: 50 },
      { id: 'var-16b', sku: 'SD-EXT-4TB-BLK', name: '4TB Charcoal / Orange Accent', priceOffset: 14000, stock: 25 },
    ],
    reviews: [
      { id: 'rev-17', userName: 'Aditya Sen', rating: 5, comment: 'Transfers 50GB 4K drone footage in seconds. Invaluable drive.', date: '2 weeks ago' },
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
