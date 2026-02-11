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

const AlertRuleSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    symbols: { type: [String], default: [] },
    conditions: { type: [AlertConditionSchema], default: [] },
    logic: { type: String, enum: ['AND', 'OR'], default: 'AND' },
    cooldownMinutes: { type: Number, required: true, default: 60, min: 1, max: 1440 },
    channel: { type: String, enum: ['in_app'], default: 'in_app' },
    isActive: { type: Boolean, default: true },
    lastTriggeredAt: { type: Date },
  },
  { timestamps: true }
);

AlertRuleSchema.index({ userId: 1, isActive: 1 });

const AlertRule = mongoose.models.AlertRule || mongoose.model('AlertRule', AlertRuleSchema);

export default AlertRule;
