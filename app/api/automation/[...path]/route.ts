import { NextRequest, NextResponse } from "next/server";

import { assertAutomationAccess, forwardCustomerRequest } from "../../operations/_shared";

type Context = { params: Promise<{ path: string[] }> };

function isAllowedFollowupPath(path: string[], method: string): boolean {
  const isCollection = path.length === 1 && path[0] === "followups";
  const isIndividual = path.length === 2 && path[0] === "followups" && Boolean(path[1]);
  return (method === "GET" && isCollection) || (method === "PATCH" && isIndividual);
}

async function proxy(request: NextRequest, context: Context) {
  const denied = assertAutomationAccess(request);
  if (denied) return denied;

  const { path } = await context.params;
  if (!isAllowedFollowupPath(path, request.method)) {
    return NextResponse.json({ detail: "This PHI automation route is not available." }, { status: 404 });
  }

  const requestPath = `/api/v1/customer-journey/${path.join("/")}${request.nextUrl.search}`;
  try {
    const body = request.method === "GET" ? undefined : await request.text();
    return forwardCustomerRequest(requestPath, {
      method: request.method,
      body: body || undefined,
    });
  } catch {
    return NextResponse.json(
      { detail: "PHI automation is temporarily unavailable." },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest, context: Context) {
  return proxy(request, context);
}

export async function PATCH(request: NextRequest, context: Context) {
  return proxy(request, context);
}
