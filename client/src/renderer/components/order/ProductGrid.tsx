import React from "react";
import { Product } from "@/types/Menu";
import { UnifiedCard } from "../ui/UnifiedCard";

interface ProductGridProps {
  products: Product[] | null;
  onProductSelect: (product: Product) => void;
  isLoading?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onProductSelect,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Products</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Products</h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🍽️</div>
          <p>No products available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Products</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="transform transition-all duration-200"
          >
            <UnifiedCard
              data={{
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                color: product.color,
                isAvailable: product.isAvailable,
              }}
              type="product"
              onClick={() => onProductSelect(product)}
              onEdit={() => {}} // No edit functionality in order context
              showActions={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
