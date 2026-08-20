import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const customerApiUrl = process.env.PHI_CUSTOMER_API_URL?.replace(/\/$/, "");
  if (!customerApiUrl) {
    return NextResponse.json(
      {
        detail:
          "PHI lead intake is being activated. Please try again shortly or contact the PHI team directly.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid assessment submission." }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${customerApiUrl}/api/v1/customer-journey/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await upstream.json();
    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { detail: "PHI lead intake is temporarily unavailable. Please try again shortly." },
      { status: 502 },
    );
  }
}
