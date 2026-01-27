import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/Database/Mongoose';
import User from '@/models/User';
import Session from '@/models/Session';
import { generateSessionToken, verifyPassword } from '@/lib/auth';

const SESSION_MAX_AGE_DAYS = 7;

export async function POST(request: NextRequest) {
  await connectToDatabase();

  let body: SignInFormData;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { email, password } = body || ({} as SignInFormData);
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  await Session.create({ userId: user._id, token, expiresAt });

  const response = NextResponse.json({
    user: { id: user._id.toString(), name: user.fullName, email: user.email },
  });

  response.cookies.set('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60,
  });

  return response;
}
