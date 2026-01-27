import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    country: { type: String, required: true },
    investmentGoals: { type: String, required: true },
    riskTolerance: { type: String, required: true },
    preferredIndustry: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
