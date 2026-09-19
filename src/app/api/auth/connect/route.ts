import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform');

  if (!platform) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect to the dedicated platform setup wizard
  return NextResponse.redirect(new URL(`/connect/${platform}`, request.url));
}
