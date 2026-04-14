import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/Database/Mongoose';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { generateResetToken, hashToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/email';

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  await connectToDatabase();

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { email } = body;
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  // Always return the same response to prevent email enumeration
  const successResponse = NextResponse.json({
    message: 'If an account with that email exists, a reset link has been sent.',
  });

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return successResponse;
  }

  // Delete any existing reset tokens for this user
  await PasswordResetToken.deleteMany({ userId: user._id });

  const plainToken = generateResetToken();
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await PasswordResetToken.create({ userId: user._id, tokenHash, expiresAt });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${plainToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }

  return successResponse;
}
