import Stripe from 'stripe';

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
    })
  : null;

export const PLANS = {
  free: {
    name: 'Free',
    monthlySearches: 100,
    priceId: null,
    price: 0,
  },
  pro: {
    name: 'Pro',
    monthlySearches: 5000,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    price: 29,
  },
  enterprise: {
    name: 'Enterprise',
    monthlySearches: 100000,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    price: 99,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
