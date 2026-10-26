type ProductGridSkeletonProps = {
  count?: number;
  className?: string;
};

/** Заглушка сетки на время загрузки: те же колонки и пропорции, что у ProductGrid. Данных не запрашивает. */
export function ProductGridSkeleton({ count = 8, className = "" }: ProductGridSkeletonProps) {
  return (
    <ul
      aria-hidden="true"
      className={`grid grid-cols-2 gap-x-5 gap-y-[30px] md:gap-x-[30px] md:gap-y-[50px] lg:grid-cols-4 ${className}`}
    >
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <div className="aspect-[300/230] animate-pulse rounded-[30px] bg-lime md:rounded-[100px]" />
          <div className="mt-3 h-5 w-3/4 animate-pulse rounded-full bg-lavender md:ml-3" />
          <div className="mt-2 h-10 animate-pulse rounded-[12px] bg-lavender/60 md:ml-3" />
          <div className="mt-3 h-8 animate-pulse rounded-full bg-lavender md:mt-5 md:ml-3 md:h-11" />
        </li>
      ))}
    </ul>
  );
}
