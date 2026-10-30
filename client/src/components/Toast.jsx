import React from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    error: <AlertCircle className="w-4 h-4 text-red flex-shrink-0" />,
    success: <CheckCircle className="w-4 h-4 text-green flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-cyan flex-shrink-0" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-line bg-[#131733]/95 backdrop-blur-md shadow-2xl text-xs max-w-md animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {icons[toast.type] || icons.info}
      <span className="text-text font-medium flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="text-muted hover:text-text transition-colors p-1"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
