import { useState, useEffect } from "react";
import { X } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import MediaLibraryModal from "./MediaLibraryModal";

const ProductForm = ({ product, onClose, onSave }) => {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    regularPrice: "",
    salePrice: "",
    costPrice: "",
    images: [],
    status: "publish",
    description: "",
    shortDescription: "",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        price: product.price || "",
        regularPrice: product.regularPrice || "",
        salePrice: product.salePrice || "",
        costPrice: product.costPrice || "",
        images: product.images || [],
        status: product.status || "publish",
        description: product.description || "",
        shortDescription: product.shortDescription || "",
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (media) => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, media.url],
    }));
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const processedData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      regularPrice: parseFloat(formData.regularPrice) || 0,
      salePrice: parseFloat(formData.salePrice) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
    };
    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-800 shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">
            {product ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                SKU
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Regular Price
              </label>
              <input
                type="number"
                name="regularPrice"
                value={formData.regularPrice}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Sale Price
              </label>
              <input
                type="number"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Price (Active)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Cost Price
            </label>
            <input
              type="number"
              name="costPrice"
              value={formData.costPrice}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Images
            </label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                {formData.images.map((url, index) => (
                  <div
                    key={index}
                    className="relative group w-24 h-24 border border-slate-700 rounded-md overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setShowMediaLibrary(true)}
                  className="w-24 h-24 border-2 border-dashed border-slate-700 rounded-md flex flex-col items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                >
                  <span className="text-2xl">+</span>
                  <span className="text-xs">Add Image</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="publish">Publish</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Short Description
            </label>
            <RichTextEditor
              value={formData.shortDescription}
              onChange={(val) =>
                setFormData({ ...formData, shortDescription: val })
              }
              placeholder="Brief summary of the product..."
              className="h-36"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(val) => setFormData({ ...formData, description: val })}
              placeholder="Detailed product description..."
              className="h-48"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 rounded-md text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>

      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleImageSelect}
      />
    </div>
  );
};

export default ProductForm;
