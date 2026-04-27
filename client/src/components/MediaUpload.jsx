import { useState, useRef } from "react";
import { Upload, X, Loader, AlertCircle } from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";
import { ENDPOINTS } from "../config/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const MediaUpload = ({ onUploadComplete }) => {
  const { user } = useSelector((state) => state.auth);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
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
    setUploadError(null);

    // Client-side validation
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError(
        "Unsupported file type. Please upload a JPEG, PNG, GIF, WebP, or SVG image.",
      );
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(
        `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`,
      );
      return;
    }

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
        ENDPOINTS.MEDIA_UPLOAD,
        formData,
        config,
      );
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      const msg =
        error.response?.data?.message ||
        (error.request
          ? "No response from server. Please check your connection."
          : error.message) ||
        "Upload failed. Please try again.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-3">
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
            <p className="text-slate-500 text-sm">
              JPEG, PNG, GIF, WebP or SVG &mdash; up to 10 MB
            </p>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{uploadError}</span>
          <button
            className="ml-auto text-red-400 hover:text-red-200 shrink-0"
            onClick={() => setUploadError(null)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
