import mongoose, { Schema } from 'mongoose';

const SessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true }
);

const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

export default Session;
