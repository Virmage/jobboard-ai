import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { jobs, employers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

const PRICING: Record<number, { amount: number; label: string }> = {
  7: { amount: 4900, label: "7-Day Featured Listing" },
  30: { amount: 14900, label: "30-Day Featured Listing" },
  90: { amount: 34900, label: "90-Day Featured Listing" },
};

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is required");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { job_id, duration } = body as {
      job_id?: string;
      duration?: number;
    };

    if (!job_id || !duration || !PRICING[duration]) {
      return NextResponse.json(
        { error: "job_id and duration (7, 30, or 90) are required" },
        { status: 400 },
      );
    }

    // Verify job exists
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, job_id),
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const stripe = getStripe();
    const pricing = PRICING[duration];

    // Get or create Stripe customer
    const employer = await db.query.employers.findFirst({
      where: eq(employers.id, session.employerId),
    });
    if (!employer) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }

    let customerId = employer.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: employer.email,
        name: employer.companyName ?? employer.name,
        metadata: { employerId: employer.id },
      });
      customerId = customer.id;
      await db
        .update(employers)
        .set({ stripeCustomerId: customerId })
        .where(eq(employers.id, employer.id));
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pricing.label,
              description: `Feature "${job.title}" at ${job.company} for ${duration} days`,
            },
            unit_amount: pricing.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        employerId: session.employerId,
        jobId: job_id,
        duration: String(duration),
      },
      success_url: `${appUrl}/employers/listings?payment=success`,
      cancel_url: `${appUrl}/employers/listings?payment=cancelled`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Billing POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
