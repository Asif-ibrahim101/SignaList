import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const main = async () => {
    const { data, error } = await client
        .from('documents')
        .select('id, content, metadata')
        .limit(3);

    if (error) {
        console.error('Error:', error);
        return;
    }

    data.forEach((row) => {
        console.log(`\n--- Document ID: ${row.id} ---`);
        console.log(row.content);
        console.log('--- Metadata ---');
        console.log(row.metadata);
    });
};

main();
