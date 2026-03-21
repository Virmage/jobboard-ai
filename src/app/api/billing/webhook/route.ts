import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { stripe, PLANS } from '@/lib/stripe';
import { db } from '@/db/index';
import { apiKeys } from '@/db/schema';

// ---------------------------------------------------------------------------
// POST /api/billing/webhook
// Stripe webhook handler for subscription events
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const apiKeyId = session.metadata?.apiKeyId;
        const plan = session.metadata?.plan as 'pro' | 'enterprise' | undefined;

        if (!apiKeyId || !plan || !(plan in PLANS)) {
          console.warn('Webhook: missing or invalid metadata', session.metadata);
          break;
        }

        const tierConfig = PLANS[plan];

        await db
          .update(apiKeys)
          .set({
            tier: plan,
            monthlyLimit: tierConfig.monthlySearches,
          })
          .where(eq(apiKeys.id, apiKeyId));

        console.log(`Upgraded API key ${apiKeyId} to ${plan}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerEmail =
          typeof subscription.customer === 'string'
            ? null
            : null;

        // Look up customer email from Stripe
        let email: string | null = null;
        if (typeof subscription.customer === 'string') {
          const customer = await stripe.customers.retrieve(subscription.customer);
          if (!customer.deleted && customer.email) {
            email = customer.email;
          }
        }

        if (email) {
          await db
            .update(apiKeys)
            .set({
              tier: 'free',
              monthlyLimit: PLANS.free.monthlySearches,
            })
            .where(eq(apiKeys.email, email.toLowerCase()));

          console.log(`Downgraded API keys for ${email} to free`);
        } else {
          console.warn('Webhook: could not resolve customer email for subscription deletion');
        }
        break;
      }

      default:
        // Unhandled event type — ignore silently
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
