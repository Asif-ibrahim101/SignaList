import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/Database/Mongoose';
import User from '@/models/User';
import Session from '@/models/Session';
import { generateSessionToken, hashPassword } from '@/lib/auth';

const SESSION_MAX_AGE_DAYS = 7;

export async function POST(request: NextRequest) {
  await connectToDatabase();

  let body: SignUpFormData;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const {
    fullName,
    email,
    password,
    country,
    investmentGoals,
    riskTolerance,
    preferredIndustry,
  } = body || ({} as SignUpFormData);

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: 'Full name, email, and password are required.' }, { status: 400 });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    country,
    investmentGoals,
    riskTolerance,
    preferredIndustry,
  });

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
