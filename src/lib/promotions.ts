export interface CouponDefinition {
  code: string;
  type: 'FIXED' | 'PERCENTAGE' | 'FREE_SHIPPING';
  value: number; // Discount amount in INR or percentage discount
  minOrderAmount: number;
  maxDiscount?: number;
  description: string;
}

export const ACTIVE_COUPONS: Record<string, CouponDefinition> = {
  NEXMART500: {
    code: 'NEXMART500',
    type: 'FIXED',
    value: 500,
    minOrderAmount: 4999,
    description: '₹500 off on orders above ₹4,999',
  },
  WELCOME10: {
    code: 'WELCOME10',
    type: 'PERCENTAGE',
    value: 10,
    minOrderAmount: 999,
    maxDiscount: 300,
    description: '10% off (up to ₹300) on orders above ₹999',
  },
  FREESHIP: {
    code: 'FREESHIP',
    type: 'FREE_SHIPPING',
    value: 0,
    minOrderAmount: 0,
    description: 'Free shipping on all orders',
  },
};

export const FREE_SHIPPING_THRESHOLD = 499;
export const STANDARD_SHIPPING_FEE = 99;

export interface PriceCalculationResult {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  appliedCoupon: CouponDefinition | null;
  error?: string;
}

/**
 * EPSILON-safe currency rounding helper.
 * Eliminates IEEE-754 binary floating-point representation drift.
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Validates and calculates order totals strictly on the server side.
 */
export function calculateOrderFinancials(
  subtotal: number,
  couponCode?: string
): PriceCalculationResult {
  let discountAmount = 0;
  let appliedCoupon: CouponDefinition | null = null;
  let couponError: string | undefined;

  // 1. Calculate base shipping fee
  let shippingAmount = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING_FEE;

  // 2. Validate coupon if supplied
  if (couponCode) {
    const normalizedCode = couponCode.trim().toUpperCase();
    const coupon = ACTIVE_COUPONS[normalizedCode];

    if (!coupon) {
      couponError = `Invalid coupon code: "${couponCode}"`;
    } else if (subtotal < coupon.minOrderAmount) {
      couponError = `Coupon "${normalizedCode}" requires a minimum order amount of ₹${coupon.minOrderAmount.toLocaleString('en-IN')}.`;
    } else {
      appliedCoupon = coupon;
      if (coupon.type === 'FIXED') {
        discountAmount = Math.min(coupon.value, subtotal);
      } else if (coupon.type === 'PERCENTAGE') {
        const rawDiscount = (subtotal * coupon.value) / 100;
        discountAmount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
      } else if (coupon.type === 'FREE_SHIPPING') {
        shippingAmount = 0;
      }
    }
  }

  const roundedSubtotal = roundCurrency(subtotal);
  const roundedDiscount = roundCurrency(discountAmount);
  const roundedShipping = roundCurrency(shippingAmount);
  const totalAmount = roundCurrency(Math.max(0, roundedSubtotal - roundedDiscount + roundedShipping));

  return {
    subtotal: roundedSubtotal,
    discountAmount: roundedDiscount,
    shippingAmount: roundedShipping,
    totalAmount,
    appliedCoupon,
    error: couponError,
  };
}
