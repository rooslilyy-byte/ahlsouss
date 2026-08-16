import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json();
    const adminSecret = process.env.ADMIN_SECRET_CODE;

    // Strictly enforce ADMIN_SECRET_CODE environment variable
    if (!adminSecret || !adminSecret.trim()) {
      return NextResponse.json(
        { success: false, message: 'رمز الدخول السري غير مهيأ في إعدادات الخادم (ADMIN_SECRET_CODE غير معرف)' },
        { status: 500 }
      );
    }

    if (passcode && passcode.trim() === adminSecret.trim()) {
      const response = NextResponse.json({ success: true });

      // Set HTTP-only authentication session cookie valid for 30 days
      response.cookies.set('session_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'رمز الدخول غير صحيح، يرجى التأكد وإعادة المحاولة' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' },
      { status: 500 }
    );
  }
}
