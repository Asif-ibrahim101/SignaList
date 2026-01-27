import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/Database/Mongoose';
import Session from '@/models/Session';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  await connectToDatabase();

  const token = request.cookies.get('session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await Session.findOne({ token, expiresAt: { $gt: new Date() } });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findById(session.userId);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    user: { id: user._id.toString(), name: user.fullName, email: user.email },
  });
}
