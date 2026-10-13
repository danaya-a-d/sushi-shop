import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/product";

type ProductGridProps = {
  products: readonly Product[];
  className?: string;
};

export function ProductGrid({ products, className = "" }: ProductGridProps) {
  return (
    <ul className={`grid grid-cols-2 gap-x-5 gap-y-[30px] md:gap-x-[30px] md:gap-y-[50px] lg:grid-cols-4 ${className}`}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
