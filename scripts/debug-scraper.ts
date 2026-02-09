import YahooFinance from 'yahoo-finance2';

const main = async () => {
    const symbol = process.argv[2] || 'AAPL';
    console.log(`Debug fetch: ${symbol}...`);

    const yf = new YahooFinance();

    try {
        const quote = await yf.quote(symbol);
        console.log('\n--- Quote Data ---');
        console.log(JSON.stringify(quote, null, 2));

        const summary = await yf.quoteSummary(symbol, {
            modules: [
                'summaryProfile',
                'financialData',
                'defaultKeyStatistics',
                'recommendationTrend',
                'earnings',
                'earningsTrend',
                'calendarEvents',
            ],
        });
        console.log('\n--- Summary Data ---');
        console.log(JSON.stringify(summary, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
};

main();
