import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

// Không đặt dưới /api/ vì nginx đang route /api/ sang backend NestJS.
export async function GET(request: Request) {
  const draft = await draftMode();
  draft.enable(); // bật -> mọi cache bị bypass
  return NextResponse.redirect(new URL("/", publicOrigin(request)));
}

function publicOrigin(request: Request) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
