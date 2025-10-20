export const Skeleton = ({ className = "", variant = "default" }) => {
  const baseClass = "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] rounded";

  const variants = {
    default: "h-4 w-full",
    text: "h-4 w-full",
    title: "h-8 w-3/4",
    avatar: "h-12 w-12 rounded-full",
    button: "h-10 w-24",
    card: "h-48 w-full",
    circle: "h-12 w-12 rounded-full",
  };

  return <div className={`${baseClass} ${variants[variant]} ${className}`} />;
};

export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-6" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-8" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#222] space-y-4">
      <Skeleton variant="title" />
      <Skeleton variant="text" />
      <Skeleton variant="text" className="w-2/3" />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="button" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
};

export const StatCardSkeleton = () => {
  return (
    <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#222] space-y-3">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
};

export const ListSkeleton = ({ items = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <Skeleton variant="circle" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
