import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { stripe, PLANS, type PlanKey } from '@/lib/stripe';
import { db } from '@/db/index';
import { apiKeys } from '@/db/schema';

const checkoutSchema = z.object({
  email: z.string().email(),
  plan: z.enum(['pro', 'enterprise']),
});

// ---------------------------------------------------------------------------
// POST /api/billing/checkout
// Creates a Stripe Checkout Session for a plan upgrade
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request. Provide email and plan (pro | enterprise).' },
        { status: 400 },
      );
    }

    const { email, plan } = parsed.data;
    const tier = PLANS[plan as PlanKey];

    if (!tier.priceId) {
      return NextResponse.json(
        { error: `No Stripe price configured for ${plan} plan. Set STRIPE_${plan.toUpperCase()}_PRICE_ID.` },
        { status: 500 },
      );
    }

    // Verify the email has an API key
    const existingKey = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.email, email.toLowerCase()),
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: 'No API key found for this email. Create a free key first.' },
        { status: 404 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email.toLowerCase(),
      line_items: [
        {
          price: tier.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        apiKeyId: existingKey.id,
        plan,
      },
      success_url: `${appUrl}/pricing?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('POST /api/billing/checkout error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
