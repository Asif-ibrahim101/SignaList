import YahooFinance from 'yahoo-finance2';
import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OllamaEmbeddings } from '@langchain/ollama';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import * as dotenv from 'dotenv';
import path from 'path';
import { POPULAR_STOCK_SYMBOLS } from '../lib/constants';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

function fmt(val: number | null | undefined, prefix = '', suffix = ''): string {
    if (val === null || val === undefined) return 'N/A';
    if (Math.abs(val) >= 1e12) return `${prefix}${(val / 1e12).toFixed(2)}T${suffix}`;
    if (Math.abs(val) >= 1e9) return `${prefix}${(val / 1e9).toFixed(2)}B${suffix}`;
    if (Math.abs(val) >= 1e6) return `${prefix}${(val / 1e6).toFixed(2)}M${suffix}`;
    return `${prefix}${val.toFixed(2)}${suffix}`;
}

function pct(val: number | null | undefined): string {
    if (val === null || val === undefined) return 'N/A';
    return `${(val * 100).toFixed(1)}%`;
}

function safe(val: unknown): string {
    if (val === null || val === undefined) return 'N/A';
    return String(val);
}

const fetchStockData = async (symbol: string): Promise<string> => {
    console.log(`Fetching data for ${symbol}...`);

    const [quote, summary] = await Promise.all([
        yf.quote(symbol),
        yf.quoteSummary(symbol, {
            modules: [
                'summaryProfile',
                'financialData',
                'defaultKeyStatistics',
                'recommendationTrend',
                'earnings',
                'earningsTrend',
                'calendarEvents',
            ],
        }),
    ]);

    const profile = summary.summaryProfile;
    const financial = summary.financialData;
    const stats = summary.defaultKeyStatistics;
    const recTrend = summary.recommendationTrend;
    const earnings = summary.earnings;
    const earningsTrend = summary.earningsTrend;
    const calendar = summary.calendarEvents;

    const lines: string[] = [];

    lines.push(`=== STOCK DATA: ${symbol} (${safe(quote.shortName)}) ===`);
    lines.push(`Fetched: ${new Date().toISOString()}`);
    lines.push('');

    // Company Overview
    lines.push('COMPANY OVERVIEW:');
    if (profile) {
        if (profile.sector) lines.push(`Sector: ${profile.sector}, Industry: ${safe(profile.industry)}`);
        if (profile.fullTimeEmployees) lines.push(`Full-time Employees: ${profile.fullTimeEmployees.toLocaleString()}`);
        if (profile.longBusinessSummary) lines.push(`Business Description: ${profile.longBusinessSummary}`);
    } else {
        lines.push(`${safe(quote.shortName)} trades on ${safe(quote.exchange)} exchange.`);
    }
    lines.push('');

    // Current Market Data
    lines.push('CURRENT MARKET DATA:');
    lines.push(`Current Price: ${fmt(quote.regularMarketPrice, '$')}`);
    lines.push(`Change: ${fmt(quote.regularMarketChange, '$')} (${fmt(quote.regularMarketChangePercent, '', '%')})`);
    if (quote.marketCap) lines.push(`Market Cap: ${fmt(quote.marketCap, '$')}`);
    if (quote.fiftyTwoWeekLow != null && quote.fiftyTwoWeekHigh != null) {
        lines.push(`52-Week Range: ${fmt(quote.fiftyTwoWeekLow, '$')} - ${fmt(quote.fiftyTwoWeekHigh, '$')}`);
    }
    if (quote.averageDailyVolume3Month) lines.push(`Avg Daily Volume (3M): ${quote.averageDailyVolume3Month.toLocaleString()}`);
    lines.push('');

    // Valuation Metrics
    lines.push('VALUATION METRICS:');
    if (stats) {
        if (stats.forwardPE != null) lines.push(`Forward P/E: ${stats.forwardPE.toFixed(2)}`);
        if (stats.pegRatio != null) lines.push(`PEG Ratio: ${stats.pegRatio.toFixed(2)}`);
        if (stats.priceToBook != null) lines.push(`Price-to-Book: ${stats.priceToBook.toFixed(2)}`);
        if (stats.enterpriseValue != null) lines.push(`Enterprise Value: ${fmt(stats.enterpriseValue, '$')}`);
        if (stats.beta != null) lines.push(`Beta: ${stats.beta.toFixed(2)}`);
    }
    if (quote.trailingPE != null) lines.push(`Trailing P/E: ${quote.trailingPE.toFixed(2)}`);
    lines.push('');

    // Financial Health
    if (financial) {
        lines.push('FINANCIAL HEALTH:');
        if (financial.totalRevenue != null) lines.push(`Total Revenue: ${fmt(financial.totalRevenue, '$')}`);
        if (financial.revenueGrowth != null) lines.push(`Revenue Growth: ${pct(financial.revenueGrowth)}`);
        if (financial.profitMargins != null) lines.push(`Profit Margins: ${pct(financial.profitMargins)}`);
        if (financial.returnOnEquity != null) lines.push(`Return on Equity: ${pct(financial.returnOnEquity)}`);
        if (financial.debtToEquity != null) lines.push(`Debt-to-Equity: ${financial.debtToEquity.toFixed(1)}`);
        if (financial.freeCashflow != null) lines.push(`Free Cash Flow: ${fmt(financial.freeCashflow, '$')}`);
        if (financial.operatingCashflow != null) lines.push(`Operating Cash Flow: ${fmt(financial.operatingCashflow, '$')}`);
        lines.push('');
    }

    // Analyst Consensus
    if (financial) {
        lines.push('ANALYST CONSENSUS:');
        if (financial.recommendationKey) lines.push(`Recommendation: ${financial.recommendationKey}`);
        if (financial.targetMeanPrice != null) lines.push(`Mean Target Price: ${fmt(financial.targetMeanPrice, '$')}`);
        if (financial.targetLowPrice != null && financial.targetHighPrice != null) {
            lines.push(`Target Range: ${fmt(financial.targetLowPrice, '$')} - ${fmt(financial.targetHighPrice, '$')}`);
        }
        if (financial.numberOfAnalystOpinions != null) lines.push(`Number of Analysts: ${financial.numberOfAnalystOpinions}`);
    }
    if (recTrend?.trend && recTrend.trend.length > 0) {
        const latest = recTrend.trend[0];
        lines.push(`Distribution: ${latest.strongBuy} Strong Buy, ${latest.buy} Buy, ${latest.hold} Hold, ${latest.sell} Sell, ${latest.strongSell} Strong Sell`);
    }
    lines.push('');

    // Earnings
    if (earnings?.earningsChart?.quarterly && earnings.earningsChart.quarterly.length > 0) {
        lines.push('RECENT EARNINGS:');
        for (const q of earnings.earningsChart.quarterly) {
            lines.push(`${q.date}: Actual EPS ${fmt(q.actual, '$')}, Estimate ${fmt(q.estimate, '$')}`);
        }
        lines.push('');
    }

    // Earnings Trend / Forward Estimates
    if (earningsTrend?.trend && earningsTrend.trend.length > 0) {
        lines.push('FORWARD ESTIMATES:');
        for (const t of earningsTrend.trend) {
            if (t.growth != null) {
                const endDateStr = t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : 'N/A';
                lines.push(`${t.period} (${endDateStr}): EPS Estimate ${fmt(t.earningsEstimate?.avg, '$')}, Growth ${pct(t.growth)}`);
            }
        }
        lines.push('');
    }

    // Upcoming Events
    if (calendar) {
        lines.push('UPCOMING EVENTS:');
        if (calendar.earnings?.earningsDate && calendar.earnings.earningsDate.length > 0) {
            lines.push(`Next Earnings Date: ${calendar.earnings.earningsDate.map((d: Date) => new Date(d).toISOString().split('T')[0]).join(' to ')}`);
        }
        if (calendar.exDividendDate) lines.push(`Ex-Dividend Date: ${new Date(calendar.exDividendDate).toISOString().split('T')[0]}`);
        if (calendar.dividendDate) lines.push(`Dividend Date: ${new Date(calendar.dividendDate).toISOString().split('T')[0]}`);
        lines.push('');
    }

    const content = lines.join('\n');
    console.log(`Fetched ${content.length} characters for ${symbol}.`);
    return content;
};

const clearExistingDocuments = async (symbol: string) => {
    const { error } = await client
        .from('documents')
        .delete()
        .filter('metadata->>symbol', 'eq', symbol);

    if (error) {
        console.warn(`Warning: Could not clear old docs for ${symbol}:`, error.message);
    }
};

const storeInSupabase = async (content: string, symbol: string) => {
    if (!content) return;

    await clearExistingDocuments(symbol);

    console.log('Generating embeddings and storing in Supabase...');

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 300,
    });

    const docs = await splitter.createDocuments(
        [content],
        [{ symbol, source: 'yahoo-finance2', fetchedAt: new Date().toISOString() }]
    );

    const embeddings = new OllamaEmbeddings({
        model: "nomic-embed-text",
        baseUrl: "http://localhost:11434",
    });

    await SupabaseVectorStore.fromDocuments(docs, embeddings, {
        client,
        tableName: 'documents',
        queryName: 'match_documents',
    });

    console.log(`Stored ${docs.length} chunks for ${symbol} in Supabase.`);
};

const main = async () => {
    const arg = process.argv[2] || 'AAPL';

    if (arg === 'ALL') {
        console.log(`Starting fetch for ${POPULAR_STOCK_SYMBOLS.length} symbols...`);
        let success = 0;
        let failed = 0;
        for (const symbol of POPULAR_STOCK_SYMBOLS) {
            try {
                const content = await fetchStockData(symbol);
                await storeInSupabase(content, symbol);
                success++;
                // 2-second delay to avoid rate limiting
                await new Promise(r => setTimeout(r, 2000));
            } catch (e) {
                console.error(`Failed to process ${symbol}:`, e);
                failed++;
            }
        }
        console.log(`\nDone! ${success} succeeded, ${failed} failed out of ${POPULAR_STOCK_SYMBOLS.length} symbols.`);
    } else {
        const content = await fetchStockData(arg);
        await storeInSupabase(content, arg);
    }
};

main();
