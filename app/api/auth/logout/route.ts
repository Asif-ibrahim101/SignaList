import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/Database/Mongoose';
import Session from '@/models/Session';

export async function POST(request: NextRequest) {
  await connectToDatabase();

  const token = request.cookies.get('session')?.value;
  if (token) {
    await Session.deleteOne({ token });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}
