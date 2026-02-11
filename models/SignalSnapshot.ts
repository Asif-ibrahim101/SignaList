import mongoose, { Schema } from 'mongoose';

const SignalFactorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    score: { type: Number, required: true },
    weight: { type: Number, required: true },
    contribution: { type: Number, required: true },
    direction: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      required: true,
    },
  },
  { _id: false }
);

const SignalSnapshotSchema = new Schema(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
    score: { type: Number, required: true },
    scoreDelta: { type: Number, required: true, default: 0 },
    confidence: { type: Number, required: true },
    price: { type: Number, required: true },
    changePercent: { type: Number, required: true },
    volume: { type: Number, required: true },
    sentiment: { type: Number, required: true },
    volumeZScore: { type: Number, required: true, default: 0 },
    source: {
      type: String,
      enum: ['hybrid', 'finnhub', 'alpha_vantage', 'synthetic'],
      required: true,
    },
    mode: { type: String, enum: ['intraday', 'batch'], required: true },
    narrative: { type: String, required: true },
    factors: { type: [SignalFactorSchema], default: [] },
    providerMeta: {
      finnhubQuote: { type: Boolean, required: true, default: false },
      alphaQuote: { type: Boolean, required: true, default: false },
      finnhubSentiment: { type: Boolean, required: true, default: false },
      alphaSentiment: { type: Boolean, required: true, default: false },
      syntheticFallback: { type: Boolean, required: true, default: false },
    },
    timestamp: { type: Date, required: true, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

SignalSnapshotSchema.index({ symbol: 1, timestamp: -1 });

const SignalSnapshot =
  mongoose.models.SignalSnapshot || mongoose.model('SignalSnapshot', SignalSnapshotSchema);

export default SignalSnapshot;
