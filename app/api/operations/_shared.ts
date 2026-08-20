import { NextRequest, NextResponse } from "next/server";

const apiBase = () => process.env.PHI_CUSTOMER_API_URL?.replace(/\/$/, "");

export function assertOperationsAccess(request: NextRequest): NextResponse | null {
  const expected = process.env.PHI_OPERATIONS_ACCESS_KEY;
  if (!expected) {
    return NextResponse.json(
      { detail: "PHI operations access is not configured yet." },
      { status: 503 },
    );
  }
  if (request.headers.get("x-phi-operations-key") !== expected) {
    return NextResponse.json({ detail: "Invalid PHI operations access key." }, { status: 401 });
  }
  if (!apiBase() || !process.env.PHI_ADMIN_TOKEN) {
    return NextResponse.json(
      { detail: "PHI customer operations are not connected yet." },
      { status: 503 },
    );
  }
  return null;
}

export async function forwardCustomerRequest(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-PHI-Admin-Token": process.env.PHI_ADMIN_TOKEN as string,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const rawPayload = await response.text();
  let payload: unknown;
  try {
    payload = rawPayload ? JSON.parse(rawPayload) : { detail: "PHI customer operations returned an empty response." };
  } catch {
    payload = {
      detail: response.ok
        ? "PHI customer operations returned an invalid response."
        : "PHI customer operations are temporarily unavailable.",
    };
  }
  return NextResponse.json(payload, { status: response.ok ? response.status : response.status || 502 });
}
