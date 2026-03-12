import mongoose, { Schema } from 'mongoose';

const TickerSentimentSchema = new Schema(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true },
    relevanceScore: { type: Number, required: true, default: 0 },
    sentimentScore: { type: Number, required: true, default: 0 },
    sentimentLabel: {
      type: String,
      enum: ['Bullish', 'Somewhat-Bullish', 'Neutral', 'Somewhat-Bearish', 'Bearish'],
      default: 'Neutral',
    },
  },
  { _id: false }
);

const NewsArticleSchema = new Schema(
  {
    externalId: { type: String, required: true, unique: true, index: true },

    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true, default: '' },
    url: { type: String, required: true },
    source: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },

    category: {
      type: String,
      enum: ['technology', 'finance', 'energy', 'healthcare', 'consumer_goods', 'general', 'economy'],
      default: 'general',
      index: true,
    },

    overallSentiment: { type: Number, required: true, default: 0 },
    sentimentLabel: {
      type: String,
      enum: ['Bullish', 'Somewhat-Bullish', 'Neutral', 'Somewhat-Bearish', 'Bearish'],
      default: 'Neutral',
      index: true,
    },

    tickerSentiments: { type: [TickerSentimentSchema], default: [] },
    symbols: { type: [String], default: [], index: true },

    provider: {
      type: String,
      enum: ['finnhub', 'alpha_vantage'],
      required: true,
    },

    publishedAt: { type: Date, required: true, index: true },
    fetchedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true }
);

NewsArticleSchema.index({ publishedAt: -1, category: 1 });
NewsArticleSchema.index({ symbols: 1, publishedAt: -1 });
NewsArticleSchema.index({ sentimentLabel: 1, publishedAt: -1 });

const NewsArticle = mongoose.models.NewsArticle || mongoose.model('NewsArticle', NewsArticleSchema);

export default NewsArticle;
