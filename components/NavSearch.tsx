'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';

const NavSearch = () => {
  const router = useRouter();
  const [symbol, setSymbol] = useState('');

  const handleSubmit = () => {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) return;
    router.push(`/app/signals/${encodeURIComponent(normalized)}`);
    setSymbol('');
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        list="nav-symbols"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
        }}
        className="h-8 w-28 rounded-md border border-border bg-card px-2 text-sm text-foreground placeholder:text-muted-foreground"
        placeholder="Search symbol"
      />
      <datalist id="nav-symbols">
        {POPULAR_STOCK_SYMBOLS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <button
        type="button"
        onClick={handleSubmit}
        className="inline-flex items-center gap-1 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1.5 text-xs font-medium text-yellow-500 transition-colors hover:bg-yellow-500/20"
      >
        Go
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
      </button>
    </div>
  );
};

export default NavSearch;
