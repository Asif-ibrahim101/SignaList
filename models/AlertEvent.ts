import mongoose, { Schema } from 'mongoose';

const AlertConditionSchema = new Schema(
  {
    field: {
      type: String,
      enum: ['score', 'scoreDelta', 'sentiment', 'volumeZScore', 'confidence', 'changePercent'],
      required: true,
    },
    operator: {
      type: String,
      enum: ['>', '>=', '<', '<=', '=='],
      required: true,
    },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const AlertEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ruleId: { type: Schema.Types.ObjectId, ref: 'AlertRule', required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
    score: { type: Number, required: true },
    scoreDelta: { type: Number, required: true },
    sentiment: { type: Number, required: true },
    volumeZScore: { type: Number, required: true },
    confidence: { type: Number, required: true },
    changePercent: { type: Number, required: true },
    matchedConditions: { type: [AlertConditionSchema], default: [] },
    triggeredAt: { type: Date, required: true, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

AlertEventSchema.index({ ruleId: 1, symbol: 1, triggeredAt: -1 });

const AlertEvent = mongoose.models.AlertEvent || mongoose.model('AlertEvent', AlertEventSchema);

export default AlertEvent;
