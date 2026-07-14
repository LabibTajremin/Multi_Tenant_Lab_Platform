export default function CardCarousel({ children }: { children: React.ReactNode }) {
  return (
    // overflow-x-auto with no overflow-y set gets its used value coerced to
    // "auto" too (per the CSS overflow spec), which clips a hovered card's
    // lift/shadow at the container's top edge — pt-3 gives that headroom so
    // nothing gets cut off, matching pb-3 already there for the same reason
    // below the cards.
    <div className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-3 pt-3">
      {children}
    </div>
  );
}
