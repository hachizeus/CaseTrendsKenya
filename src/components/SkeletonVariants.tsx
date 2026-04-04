import { Skeleton } from "@/components/ui/skeleton";

// Product Card Skeleton
export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      <Skeleton className="w-full h-40" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

// Product Grid Skeleton (4 columns)
export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array(8).fill(null).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Category Section Skeleton
export function CategorySectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <ProductGridSkeleton />
    </div>
  );
}

// Product Details Skeleton (for ProductPage)
export function ProductDetailsSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-6 lg:gap-12">
      <div className="space-y-4">
        <Skeleton className="w-full h-96" />
        <div className="flex gap-2">
          {Array(4).fill(null).map((_, i) => (
            <Skeleton key={i} className="w-20 h-20" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="space-y-2 pt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="pt-6 space-y-3">
          {Array(4).fill(null).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex gap-4 p-4 border-b border-border">
      {Array(columns).fill(null).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-0 border border-border rounded-lg overflow-hidden bg-white">
      {Array(rows).fill(null).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-white border border-border rounded-lg">
      <Skeleton className="w-16 h-16 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-8 w-20 flex-shrink-0" />
    </div>
  );
}

// Form Skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-4">
      {Array(5).fill(null).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// Hero Banner Skeleton
export function HeroBannerSkeleton() {
  return <Skeleton className="w-full h-96 rounded-lg" />;
}
