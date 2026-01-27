import { connectToDatabase } from '@/Database/Mongoose';
import Session from '@/models/Session';
import User from '@/models/User';

export const getUserFromSession = async (token?: string) => {
  if (!token) return null;
  await connectToDatabase();

  const session = await Session.findOne({ token, expiresAt: { $gt: new Date() } });
  if (!session) return null;

  const user = await User.findById(session.userId).lean();
  return user;
};
