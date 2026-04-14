import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/Database/Mongoose';
import User from '@/models/User';
import Session from '@/models/Session';
import PasswordResetToken from '@/models/PasswordResetToken';
import { hashToken } from '@/lib/tokens';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await connectToDatabase();

  let body: { token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { token, password } = body;
  if (!token || !password) {
    return NextResponse.json(
      { error: 'Token and password are required.' },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(token);

  const resetToken = await PasswordResetToken.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!resetToken) {
    return NextResponse.json(
      { error: 'Invalid or expired reset link. Please request a new one.' },
      { status: 400 }
    );
  }

  // Update password
  const newPasswordHash = await hashPassword(password);
  await User.updateOne(
    { _id: resetToken.userId },
    { $set: { passwordHash: newPasswordHash } }
  );

  // Delete all reset tokens for this user
  await PasswordResetToken.deleteMany({ userId: resetToken.userId });

  // Invalidate all existing sessions (force re-login)
  await Session.deleteMany({ userId: resetToken.userId });

  return NextResponse.json({
    message: 'Password has been reset successfully. Please sign in with your new password.',
  });
}
