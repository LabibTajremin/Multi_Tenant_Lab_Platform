import { ACCENT_COLORS } from '@/lib/theme';

/**
 * The radio input is visually hidden (sr-only) in favor of the swatch label,
 * so the "selected" state has to be drawn on the label itself — a plain
 * static border on every swatch (the original bug) meant there was no way
 * to tell which color was actually chosen. has-[:checked]: styles the label
 * from its own descendant's state, no JS required.
 */
export default function AccentColorPicker({ defaultValue, name = 'primaryColor' }: { defaultValue?: string; name?: string }) {
  return (
    <div className="mt-2 flex flex-wrap gap-3">
      {ACCENT_COLORS.map((color) => (
        <label
          key={color.value}
          className="group flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm transition-all duration-150 has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50 has-[:checked]:ring-2 has-[:checked]:ring-slate-900 dark:has-[:checked]:border-slate-100 dark:has-[:checked]:bg-slate-700 dark:has-[:checked]:ring-slate-100"
        >
          <input
            type="radio"
            name={name}
            value={color.value}
            defaultChecked={color.value === defaultValue}
            className="sr-only"
          />
          <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color.swatch }} aria-hidden />
          {color.label}
          <svg
            viewBox="0 0 24 24"
            className="hidden h-4 w-4 text-slate-900 group-has-[:checked]:block dark:text-slate-100"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </label>
      ))}
    </div>
  );
}
