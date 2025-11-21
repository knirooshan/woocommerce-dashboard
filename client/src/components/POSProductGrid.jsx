import { Search } from "lucide-react";

const POSProductGrid = ({ products, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-white shadow-sm mb-4 rounded-lg">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
        {filteredProducts.map((product) => (
          <div
            key={product._id}
            onClick={() => onAddToCart(product)}
            className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-transparent hover:border-blue-300 flex flex-col"
          >
            <div className="h-32 bg-gray-100 rounded mb-3 flex items-center justify-center overflow-hidden">
              {product.images && product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-xs">No Image</span>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 flex-1">
              {product.name}
            </h3>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold text-blue-600">${product.price}</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  product.stockQuantity > 0
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {product.stockQuantity || 0}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from "react";
export default POSProductGrid;
