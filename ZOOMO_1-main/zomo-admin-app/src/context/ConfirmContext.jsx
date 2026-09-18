import { createContext, useCallback, useContext, useRef, useState } from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((opts) => {
    const spec = typeof opts === "string" ? { body: opts } : opts || {};
    return new Promise((resolve) => {
      resolver.current = resolve;
      setDialog({
        title: spec.title || "Are you sure?",
        body: spec.body || "This cannot be undone.",
        confirmLabel: spec.confirmLabel || "Confirm",
        danger: spec.danger !== false,
      });
    });
  }, []);

  function settle(ok) {
    resolver.current?.(ok);
    resolver.current = null;
    setDialog(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-z-ink/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card bg-z-surface p-6 shadow-card">
            <h3 className="text-lg font-bold text-z-ink">{dialog.title}</h3>
            <p className="mt-2 text-sm leading-6 text-z-sub">{dialog.body}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => settle(false)} className="btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => settle(true)}
                className={dialog.danger ? "btn-danger" : "btn-primary"}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
