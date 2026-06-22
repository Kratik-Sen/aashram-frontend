import { X } from "lucide-react";

const Modal = ({ open, title, children, onClose, footer, size = "max-w-2xl" }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4">
      <div className={`max-h-[92vh] w-full overflow-hidden rounded-lg bg-white shadow-2xl ${size}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-8rem)] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
};

export default Modal;
