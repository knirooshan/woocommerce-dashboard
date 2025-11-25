import { useState, useRef } from "react";
import { Upload, X, Loader } from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";

const MediaUpload = ({ onUploadComplete }) => {
  const { user } = useSelector((state) => state.auth);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const response = await axios.post(
        "http://localhost:5000/api/media/upload",
        formData,
        config
      );
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? "border-blue-500 bg-blue-500/10"
          : "border-slate-700 hover:border-slate-600 bg-slate-900/50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*"
      />

      {isUploading ? (
        <div className="flex flex-col items-center justify-center text-slate-400">
          <Loader className="h-10 w-10 animate-spin mb-2" />
          <p>Uploading...</p>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-10 w-10 text-slate-400 mb-2" />
          <p className="text-slate-300 font-medium mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-slate-500 text-sm">SVG, PNG, JPG or GIF</p>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
