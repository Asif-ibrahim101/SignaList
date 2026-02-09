import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const main = async () => {
    console.log('Testing Supabase RPC match_documents...');

    // Mock embedding (zeros)
    const embedding = new Array(768).fill(0.1);

    try {
        console.log('Attempt 1: Calling with filter...');
        const { data, error } = await client.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.1,
            match_count: 2,
            filter: {}
        });
        if (error) console.error('Attempt 1 Error:', error);
        else console.log('Attempt 1 Success:', data?.length, 'results');
    } catch (e) {
        console.error('Attempt 1 Exception:', e);
    }

    try {
        console.log('\nAttempt 2: Calling WITHOUT filter...');
        const { data, error } = await client.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.1,
            match_count: 2
        });
        if (error) console.error('Attempt 2 Error:', error);
        else console.log('Attempt 2 Success:', data?.length, 'results');
    } catch (e) {
        console.error('Attempt 2 Exception:', e);
    }
};

main();
