import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('session_auth', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.set('session_auth', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}
