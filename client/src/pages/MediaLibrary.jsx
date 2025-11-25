import { useState } from "react";
import MediaGrid from "../components/MediaGrid";
import MediaUpload from "../components/MediaUpload";

const MediaLibrary = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Media Library</h1>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-lg font-medium text-white mb-4">
          Upload New Media
        </h2>
        <MediaUpload onUploadComplete={handleUploadComplete} />
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-lg font-medium text-white mb-4">Library</h2>
        <MediaGrid refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default MediaLibrary;
