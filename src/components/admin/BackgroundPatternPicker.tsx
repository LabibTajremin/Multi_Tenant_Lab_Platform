import { BACKGROUND_PATTERNS } from '@/lib/backgroundPattern';

export default function BackgroundPatternPicker({ defaultValue, name = 'backgroundPattern' }: { defaultValue?: string; name?: string }) {
  return (
    <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-5">
      {BACKGROUND_PATTERNS.map((pattern) => (
        <label
          key={pattern.value}
          className="group flex cursor-pointer flex-col items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 p-2 text-center text-xs transition-all duration-150 has-[:checked]:border-slate-900 has-[:checked]:ring-2 has-[:checked]:ring-slate-900 dark:has-[:checked]:border-slate-100 dark:has-[:checked]:ring-slate-100"
        >
          <input
            type="radio"
            name={name}
            value={pattern.value}
            defaultChecked={pattern.value === defaultValue}
            className="sr-only"
          />
          <span
            aria-hidden
            className={`bg-surface bg-pattern-${pattern.value} relative h-12 w-full rounded border border-slate-200 dark:border-slate-700`}
          >
            <svg
              viewBox="0 0 24 24"
              className="absolute inset-0 m-auto hidden h-4 w-4 text-slate-900 group-has-[:checked]:block dark:text-slate-100"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{pattern.label}</span>
        </label>
      ))}
    </div>
  );
}
