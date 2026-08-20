import { NextRequest, NextResponse } from "next/server";

import { assertOperationsAccess, forwardCustomerRequest } from "../_shared";

type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: Context) {
  const denied = assertOperationsAccess(request);
  if (denied) return denied;

  const { path } = await context.params;
  const requestPath = `/api/v1/customer-journey/${path.join("/")}${request.nextUrl.search}`;
  try {
    const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();
    return forwardCustomerRequest(requestPath, {
      method: request.method,
      body: body || undefined,
    });
  } catch {
    return NextResponse.json(
      { detail: "PHI customer operations are temporarily unavailable." },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest, context: Context) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: Context) {
  return proxy(request, context);
}

export async function PATCH(request: NextRequest, context: Context) {
  return proxy(request, context);
}
