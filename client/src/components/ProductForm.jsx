import { useState, useEffect } from "react";
import { X, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import MediaLibraryModal from "./MediaLibraryModal";

const emptyVariant = () => ({
  title: "",
  sku: "",
  barcode: "",
  price: "",
  regularPrice: "",
  salePrice: "",
  stockQuantity: "",
  weight: "",
  length: "",
  height: "",
  width: "",
  hsCode: "",
  originCountry: "",
  material: "",
  allowBackorder: false,
  manageInventory: true,
  images: [],
  options: {},
});

const emptyOption = () => ({ title: "", values: "" }); // values as comma-separated string in UI

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const ProductForm = ({ product, onClose, onSave }) => {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [activeImageTarget, setActiveImageTarget] = useState("main"); // "main" | variantIndex
  const [showDimensions, setShowDimensions] = useState(false);
  const [showCustoms, setShowCustoms] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  // Track whether the user has manually typed in the handle field.
  // While false, handle stays in sync with the name automatically.
  const [handleEdited, setHandleEdited] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    handle: "",
    subtitle: "",
    sku: "",
    price: "",
    regularPrice: "",
    salePrice: "",
    costPrice: "",
    stockQuantity: "",
    thumbnail: "",
    images: [],
    status: "draft",
    discountable: true,
    isGiftcard: false,
    description: "",
    shortDescription: "",
    // Physical
    weight: "",
    length: "",
    height: "",
    width: "",
    // Customs
    hsCode: "",
    midCode: "",
    originCountry: "",
    material: "",
    // Organisation
    tags: "", // comma-separated in UI
    typeValue: "",
    collectionTitle: "",
    collectionHandle: "",
    // Variants & options
    options: [], // [{title, values}] where values is string in UI
    variants: [],
    metadata: "", // JSON string in UI
  });

  useEffect(() => {
    if (product) {
      // Existing product: treat the stored handle as manually set so we don't overwrite it
      setHandleEdited(true);
      setFormData({
        name: product.name || "",
        handle: product.handle || "",
        subtitle: product.subtitle || "",
        sku: product.sku || "",
        price: product.price ?? "",
        regularPrice: product.regularPrice ?? "",
        salePrice: product.salePrice ?? "",
        costPrice: product.costPrice ?? "",
        stockQuantity: product.stockQuantity ?? "",
        thumbnail: product.thumbnail || "",
        images: product.images || [],
        status: product.status || "draft",
        discountable: product.discountable !== false,
        isGiftcard: product.isGiftcard || false,
        description: product.description || "",
        shortDescription: product.shortDescription || "",
        weight: product.weight ?? "",
        length: product.length ?? "",
        height: product.height ?? "",
        width: product.width ?? "",
        hsCode: product.hsCode || "",
        midCode: product.midCode || "",
        originCountry: product.originCountry || "",
        material: product.material || "",
        tags: (product.tags || []).map((t) => t.value).join(", "),
        typeValue: product.type?.value || "",
        collectionTitle: product.collection?.title || "",
        collectionHandle: product.collection?.handle || "",
        options: (product.options || []).map((o) => ({
          title: o.title,
          values: (o.values || []).join(", "),
        })),
        variants: (product.variants || []).map((v) => ({
          ...v,
          price: v.price ?? "",
          regularPrice: v.regularPrice ?? "",
          salePrice: v.salePrice ?? "",
          stockQuantity: v.stockQuantity ?? "",
          weight: v.weight ?? "",
          length: v.length ?? "",
          height: v.height ?? "",
          width: v.width ?? "",
        })),
        metadata:
          product.metadata && Object.keys(product.metadata).length > 0
            ? JSON.stringify(product.metadata, null, 2)
            : "",
      });
      if (product.variants?.length) setShowVariants(true);
      if (product.options?.length) setShowOptions(true);
      if (product.weight || product.length || product.height || product.width)
        setShowDimensions(true);
      if (product.hsCode || product.originCountry || product.material)
        setShowCustoms(true);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      // Auto-sync handle from name while the user hasn't manually edited it
      if (name === "name" && !handleEdited) {
        updated.handle = slugify(value);
      }
      return updated;
    });
  };

  const handleHandleChange = (e) => {
    setHandleEdited(true);
    setFormData((prev) => ({ ...prev, handle: e.target.value }));
  };

  const handleHandleClear = () => {
    setHandleEdited(false);
    setFormData((prev) => ({ ...prev, handle: slugify(prev.name) }));
  };

  // ── Images ────────────────────────────────────────────────────────────────
  const handleImageSelect = (media) => {
    if (activeImageTarget === "main") {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, media.url],
      }));
    } else {
      const idx = activeImageTarget;
      setFormData((prev) => {
        const variants = [...prev.variants];
        variants[idx] = {
          ...variants[idx],
          images: [...(variants[idx].images || []), media.url],
        };
        return { ...prev, variants };
      });
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // ── Options ───────────────────────────────────────────────────────────────
  const addOption = () =>
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, emptyOption()],
    }));

  const removeOption = (i) =>
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, idx) => idx !== i),
    }));

  const updateOption = (i, field, val) =>
    setFormData((prev) => {
      const options = [...prev.options];
      options[i] = { ...options[i], [field]: val };
      return { ...prev, options };
    });

  // ── Variants ──────────────────────────────────────────────────────────────
  const addVariant = () =>
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, emptyVariant()],
    }));

  const removeVariant = (i) =>
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== i),
    }));

  const updateVariant = (i, field, val) =>
    setFormData((prev) => {
      const variants = [...prev.variants];
      variants[i] = { ...variants[i], [field]: val };
      return { ...prev, variants };
    });

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    const num = (v) =>
      v === "" || v === undefined ? undefined : parseFloat(v);

    // Parse metadata JSON
    let metadata = {};
    if (formData.metadata.trim()) {
      try {
        metadata = JSON.parse(formData.metadata);
      } catch {
        alert("Metadata is not valid JSON. Please fix before saving.");
        return;
      }
    }

    const processedData = {
      name: formData.name,
      handle: formData.handle || undefined,
      subtitle: formData.subtitle || undefined,
      sku: formData.sku || undefined,
      price: num(formData.price),
      regularPrice: num(formData.regularPrice),
      salePrice: num(formData.salePrice),
      costPrice: num(formData.costPrice),
      stockQuantity: num(formData.stockQuantity),
      thumbnail: formData.thumbnail || undefined,
      images: formData.images,
      status: formData.status,
      discountable: formData.discountable,
      isGiftcard: formData.isGiftcard,
      description: formData.description || undefined,
      shortDescription: formData.shortDescription || undefined,
      weight: num(formData.weight),
      length: num(formData.length),
      height: num(formData.height),
      width: num(formData.width),
      hsCode: formData.hsCode || undefined,
      midCode: formData.midCode || undefined,
      originCountry: formData.originCountry || undefined,
      material: formData.material || undefined,
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((v) => ({ value: v }))
        : [],
      type: formData.typeValue ? { value: formData.typeValue } : undefined,
      collection: formData.collectionTitle
        ? {
            title: formData.collectionTitle,
            handle: formData.collectionHandle || undefined,
          }
        : undefined,
      options: formData.options.map((o) => ({
        title: o.title,
        values: o.values
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      })),
      variants: formData.variants.map((v) => ({
        ...v,
        price: num(v.price),
        regularPrice: num(v.regularPrice),
        salePrice: num(v.salePrice),
        stockQuantity: num(v.stockQuantity),
        weight: num(v.weight),
        length: num(v.length),
        height: num(v.height),
        width: num(v.width),
      })),
      metadata,
    };

    onSave(processedData);
  };

  const inputClass =
    "w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";
  const sectionHeaderClass =
    "flex items-center justify-between w-full text-left text-slate-200 font-semibold py-2 border-b border-slate-700 mb-3";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-800 shadow-xl">
        {/* Header */}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ── Core Info ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Handle (URL slug)</label>
                <div className="relative">
                  <input
                    type="text"
                    name="handle"
                    value={formData.handle}
                    onChange={handleHandleChange}
                    placeholder="auto-generated-from-title"
                    className={inputClass}
                  />
                  {!handleEdited && formData.handle && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                      auto
                    </span>
                  )}
                  {handleEdited && (
                    <button
                      type="button"
                      onClick={handleHandleClear}
                      title="Reset to auto-generated"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Subtitle</label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="proposed">Proposed</option>
                  <option value="rejected">Rejected</option>
                  {/* legacy WooCommerce statuses */}
                  <option value="publish">Publish (WC)</option>
                  <option value="pending">Pending (WC)</option>
                  <option value="private">Private (WC)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="discountable"
                  checked={formData.discountable}
                  onChange={handleChange}
                  className="rounded"
                />
                Discountable
              </label>
              <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="isGiftcard"
                  checked={formData.isGiftcard}
                  onChange={handleChange}
                  className="rounded"
                />
                Gift Card
              </label>
            </div>
          </div>

          {/* ── Pricing ───────────────────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-slate-200 font-semibold border-b border-slate-700 pb-2">
              Pricing
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Regular Price</label>
                <input
                  type="number"
                  name="regularPrice"
                  value={formData.regularPrice}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Sale Price</label>
                <input
                  type="number"
                  name="salePrice"
                  value={formData.salePrice}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Price (active)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Cost Price</label>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Stock Quantity</label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* ── Images ───────────────────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-slate-200 font-semibold border-b border-slate-700 pb-2">
              Images
            </h3>
            <div>
              <label className={labelClass}>Thumbnail URL</label>
              <input
                type="text"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleChange}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
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
                onClick={() => {
                  setActiveImageTarget("main");
                  setShowMediaLibrary(true);
                }}
                className="w-24 h-24 border-2 border-dashed border-slate-700 rounded-md flex flex-col items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
              >
                <span className="text-2xl">+</span>
                <span className="text-xs">Add Image</span>
              </button>
            </div>
          </div>

          {/* ── Descriptions ─────────────────────────────────────────── */}
          <div className="space-y-4">
            <h3 className="text-slate-200 font-semibold border-b border-slate-700 pb-2">
              Descriptions
            </h3>
            <div>
              <label className={labelClass}>Short Description</label>
              <RichTextEditor
                value={formData.shortDescription}
                onChange={(val) =>
                  setFormData({ ...formData, shortDescription: val })
                }
                placeholder="Brief summary..."
                className="h-36"
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <RichTextEditor
                value={formData.description}
                onChange={(val) =>
                  setFormData({ ...formData, description: val })
                }
                placeholder="Detailed description..."
                className="h-48"
              />
            </div>
          </div>

          {/* ── Organisation ─────────────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-slate-200 font-semibold border-b border-slate-700 pb-2">
              Organisation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="handmade, eco, rattan"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Product Type</label>
                <input
                  type="text"
                  name="typeValue"
                  value={formData.typeValue}
                  onChange={handleChange}
                  placeholder="e.g. Home Decor"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Collection Title</label>
                <input
                  type="text"
                  name="collectionTitle"
                  value={formData.collectionTitle}
                  onChange={handleChange}
                  placeholder="Summer Collection"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Collection Handle</label>
                <input
                  type="text"
                  name="collectionHandle"
                  value={formData.collectionHandle}
                  onChange={handleChange}
                  placeholder="summer-collection"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* ── Dimensions (collapsible) ──────────────────────────────── */}
          <div>
            <button
              type="button"
              onClick={() => setShowDimensions((p) => !p)}
              className={sectionHeaderClass}
            >
              <span>Shipping Dimensions &amp; Weight</span>
              {showDimensions ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            {showDimensions && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>Weight (g)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Length (cm)</label>
                  <input
                    type="number"
                    name="length"
                    value={formData.length}
                    onChange={handleChange}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Width (cm)</label>
                  <input
                    type="number"
                    name="width"
                    value={formData.width}
                    onChange={handleChange}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Customs (collapsible) ─────────────────────────────────── */}
          <div>
            <button
              type="button"
              onClick={() => setShowCustoms((p) => !p)}
              className={sectionHeaderClass}
            >
              <span>Customs &amp; Material</span>
              {showCustoms ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            {showCustoms && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>HS Code</label>
                  <input
                    type="text"
                    name="hsCode"
                    value={formData.hsCode}
                    onChange={handleChange}
                    placeholder="e.g. 4602.11"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>MID Code</label>
                  <input
                    type="text"
                    name="midCode"
                    value={formData.midCode}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Origin Country</label>
                  <input
                    type="text"
                    name="originCountry"
                    value={formData.originCountry}
                    onChange={handleChange}
                    placeholder="LK"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Material</label>
                  <input
                    type="text"
                    name="material"
                    value={formData.material}
                    onChange={handleChange}
                    placeholder="Rattan, Bamboo"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Variant Options (collapsible) ─────────────────────────── */}
          <div>
            <button
              type="button"
              onClick={() => setShowOptions((p) => !p)}
              className={sectionHeaderClass}
            >
              <span>Variant Options (e.g. Color, Size)</span>
              {showOptions ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            {showOptions && (
              <div className="space-y-3">
                {formData.options.map((opt, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <label className={labelClass}>Option Name</label>
                      <input
                        type="text"
                        value={opt.title}
                        onChange={(e) =>
                          updateOption(i, "title", e.target.value)
                        }
                        placeholder="Color"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex-1">
                      <label className={labelClass}>
                        Values (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={opt.values}
                        onChange={(e) =>
                          updateOption(i, "values", e.target.value)
                        }
                        placeholder="Black, White, Natural"
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="mt-6 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Option
                </button>
              </div>
            )}
          </div>

          {/* ── Variants (collapsible) ────────────────────────────────── */}
          <div>
            <button
              type="button"
              onClick={() => setShowVariants((p) => !p)}
              className={sectionHeaderClass}
            >
              <span>Variants ({formData.variants.length})</span>
              {showVariants ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            {showVariants && (
              <div className="space-y-4">
                {formData.variants.map((v, i) => (
                  <div
                    key={i}
                    className="bg-slate-800 rounded-md p-4 space-y-3 border border-slate-700"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm font-medium">
                        Variant {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>Title *</label>
                        <input
                          type="text"
                          value={v.title}
                          onChange={(e) =>
                            updateVariant(i, "title", e.target.value)
                          }
                          placeholder="Black / M"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>SKU</label>
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) =>
                            updateVariant(i, "sku", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Barcode</label>
                        <input
                          type="text"
                          value={v.barcode}
                          onChange={(e) =>
                            updateVariant(i, "barcode", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className={labelClass}>Regular Price</label>
                        <input
                          type="number"
                          value={v.regularPrice}
                          onChange={(e) =>
                            updateVariant(i, "regularPrice", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Sale Price</label>
                        <input
                          type="number"
                          value={v.salePrice}
                          onChange={(e) =>
                            updateVariant(i, "salePrice", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Price (active)</label>
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) =>
                            updateVariant(i, "price", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Stock Qty</label>
                        <input
                          type="number"
                          value={v.stockQuantity}
                          onChange={(e) =>
                            updateVariant(i, "stockQuantity", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className={labelClass}>Weight (g)</label>
                        <input
                          type="number"
                          value={v.weight}
                          onChange={(e) =>
                            updateVariant(i, "weight", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Length (cm)</label>
                        <input
                          type="number"
                          value={v.length}
                          onChange={(e) =>
                            updateVariant(i, "length", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Height (cm)</label>
                        <input
                          type="number"
                          value={v.height}
                          onChange={(e) =>
                            updateVariant(i, "height", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Width (cm)</label>
                        <input
                          type="number"
                          value={v.width}
                          onChange={(e) =>
                            updateVariant(i, "width", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>Origin Country</label>
                        <input
                          type="text"
                          value={v.originCountry}
                          onChange={(e) =>
                            updateVariant(i, "originCountry", e.target.value)
                          }
                          placeholder="LK"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>HS Code</label>
                        <input
                          type="text"
                          value={v.hsCode}
                          onChange={(e) =>
                            updateVariant(i, "hsCode", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Material</label>
                        <input
                          type="text"
                          value={v.material}
                          onChange={(e) =>
                            updateVariant(i, "material", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={v.manageInventory}
                          onChange={(e) =>
                            updateVariant(
                              i,
                              "manageInventory",
                              e.target.checked,
                            )
                          }
                          className="rounded"
                        />
                        Manage Inventory
                      </label>
                      <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={v.allowBackorder}
                          onChange={(e) =>
                            updateVariant(i, "allowBackorder", e.target.checked)
                          }
                          className="rounded"
                        />
                        Allow Backorder
                      </label>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveImageTarget(i);
                          setShowMediaLibrary(true);
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Variant Image
                      </button>
                      {(v.images || []).length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {v.images.map((url, j) => (
                            <div
                              key={j}
                              className="relative w-16 h-16 border border-slate-700 rounded overflow-hidden group"
                            >
                              <img
                                src={url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const variants = [...formData.variants];
                                  variants[i].images = variants[
                                    i
                                  ].images.filter((_, k) => k !== j);
                                  setFormData((p) => ({ ...p, variants }));
                                }}
                                className="absolute top-0 right-0 bg-red-600 text-white p-0.5 opacity-0 group-hover:opacity-100"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Variant
                </button>
              </div>
            )}
          </div>

          {/* ── Metadata ─────────────────────────────────────────────── */}
          <div>
            <label className={labelClass}>Metadata (JSON, optional)</label>
            <textarea
              name="metadata"
              value={formData.metadata}
              onChange={handleChange}
              rows={3}
              placeholder={'{\n  "custom_key": "value"\n}'}
              className={`${inputClass} font-mono text-xs`}
            />
          </div>

          {/* ── Actions ──────────────────────────────────────────────── */}
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
