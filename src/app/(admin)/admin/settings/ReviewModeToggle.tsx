'use client';

import { useTransition } from 'react';
import { toggleReviewModeAction } from './actions';

export default function ReviewModeToggle({ enabled }: { enabled: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={enabled}
        disabled={isPending}
        onChange={(e) => startTransition(() => toggleReviewModeAction(e.target.checked))}
        className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
      />
      <span className="text-sm text-slate-700">
        Require Admin approval before Editor content goes live
      </span>
    </label>
  );
}
