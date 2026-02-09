import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OllamaEmbeddings } from '@langchain/ollama';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const main = async () => {
    const query = process.argv[2] || 'MSFT news';
    console.log(`Searching for: "${query}"`);

    const embeddings = new OllamaEmbeddings({
        model: "nomic-embed-text",
        baseUrl: "http://127.0.0.1:11434",
    });

    const queryEmbedding = await embeddings.embedQuery(query);

    const { data: results, error } = await client.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.1,
        match_count: 3,
        filter: {}
    });

    if (error) {
        console.error('RPC Error:', error);
    } else if (!results || results.length === 0) {
        console.log('No results found.');
    } else {
        results.forEach((doc: any, i: number) => {
            console.log(`\n--- Result ${i + 1} ---`);
            console.log(doc.content);
            console.log('------------------');
        });
    }
};

main();
