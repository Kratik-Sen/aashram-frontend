import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

const ConfirmDialog = ({ open, title = "Confirm action", message, confirmLabel = "Confirm", loading, onConfirm, onClose }) => (
  <Modal
    open={open}
    title={title}
    onClose={onClose}
    size="max-w-md"
    footer={
      <>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Working..." : confirmLabel}
        </button>
      </>
    }
  >
    <div className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="text-sm leading-6 text-slate-600">{message}</p>
    </div>
  </Modal>
);

export default ConfirmDialog;
