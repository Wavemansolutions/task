'use client';

import { useEffect } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('TASK_MONEY_PAGE_ERROR', error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <FiAlertTriangle className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-slate-950">This page could not load</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Task Money could not retrieve this page. Reload it, and check the Vercel runtime log if the problem continues.
        </p>
        {error.digest ? <p className="mt-3 text-xs text-slate-400">Error reference: {error.digest}</p> : null}
        <button onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700">
          <FiRefreshCw /> Reload page
        </button>
      </section>
    </main>
  );
}
