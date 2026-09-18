import { useRef, useState } from "react";
import { FiEdit2, FiX } from "react-icons/fi";
import { mediaUrl } from "../lib/media";
import { uploadImage } from "../services/adminApi";

export default function PhotoPicker({ url, folder = "restaurants", onUploaded, label = "Photo" }) {
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { url: next } = await uploadImage(file, folder);
      onUploaded(next);
      setOpen(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not upload that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="relative block">
        {url ? (
          <img src={mediaUrl(url)} alt="" className="size-16 rounded-xl object-cover border border-z-line" />
        ) : (
          <div className="size-16 rounded-xl border border-dashed border-z-line bg-z-page grid place-items-center text-[10px] text-z-muted">
            {label}
          </div>
        )}
        <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-z-primary text-white shadow-card">
          <FiEdit2 size={11} />
        </span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-z-ink/50 p-4">
          <div className="w-full max-w-lg rounded-card bg-z-surface p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-z-ink">{label}</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-z-muted hover:text-z-ink">
                <FiX size={18} />
              </button>
            </div>
            {url ? (
              <img src={mediaUrl(url)} alt="" className="mb-4 max-h-80 w-full rounded-2xl object-cover" />
            ) : (
              <div className="mb-4 grid h-48 place-items-center rounded-2xl bg-z-page text-sm text-z-muted">No photo yet</div>
            )}
            {error && <p className="mb-3 text-sm text-z-danger">{error}</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="btn-primary w-full"
            >
              {busy ? "Uploading…" : "Choose a photo"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
