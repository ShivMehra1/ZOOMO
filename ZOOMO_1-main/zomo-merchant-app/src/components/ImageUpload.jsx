import { useRef, useState } from "react";
import api from "../services/api";

// ✅ FIX: this component used to only do `URL.createObjectURL(file)` —
// a preview link that exists ONLY in your own browser tab and is never
// sent anywhere. That's why the image looked fine to you but never
// showed up on the customer site: no bytes were ever uploaded.
//
// Now it immediately uploads the file to the backend (which forwards it
// to Cloudinary) and stores the real, permanent URL it gets back.
//
// `folder` should be "restaurants" or "dishes" so images are organized
// in Cloudinary and the backend can apply sensible size limits.
export default function ImageUpload({ image, setImage, folder = "restaurants" }) {
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    setError("");

    // Show an instant local preview while the real upload happens in the background
    const localPreview = URL.createObjectURL(file);
    setImage({ preview: localPreview, uploading: true });

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(
        `/upload/image?folder=${folder}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const uploadedUrl = res.data?.url;
      if (!uploadedUrl) throw new Error("No URL returned from upload");

      // ✅ This is the real, permanent Cloudinary URL — safe to save to the DB
      // and safe to show on the customer app.
      setImage({ url: uploadedUrl, preview: uploadedUrl, uploading: false });
    } catch (err) {
      console.error("Image upload failed:", err);
      setError(
        err.response?.data?.message || "Upload failed. Please try again."
      );
      setImage(null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {image ? (
        <div className="relative w-32 h-32">
          <img src={image.preview} alt="Preview" className="w-full h-full object-cover rounded-2xl border border-z-line" />
          {(image.uploading || uploading) && (
            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
              <span className="text-white text-xs font-bold">Uploading...</span>
            </div>
          )}
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-1 right-1 bg-z-ink/70 text-white text-[11px] font-bold px-2 py-1 rounded-full"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="border border-dashed border-z-line rounded-2xl w-32 h-32 flex items-center justify-center text-sm text-z-sub hover:border-z-primary hover:text-z-primary transition"
        >
          Upload
        </button>
      )}

      {error && <p className="text-xs text-z-danger">{error}</p>}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  );
}
