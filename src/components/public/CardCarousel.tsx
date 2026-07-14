export default function CardCarousel({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2">
      {children}
    </div>
  );
}
