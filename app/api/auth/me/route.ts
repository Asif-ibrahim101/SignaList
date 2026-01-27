import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    user: { id: user._id.toString(), name: user.fullName, email: user.email },
  });
}
