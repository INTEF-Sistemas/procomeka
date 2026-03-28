import { ModalFrame } from "./ModalFrame.tsx";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	message: string;
	confirmLabel: string;
	cancelLabel?: string;
	busy?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}

export function ConfirmDialog({
	open,
	title,
	message,
	confirmLabel,
	cancelLabel = "Cancelar",
	busy = false,
	onCancel,
	onConfirm,
}: ConfirmDialogProps) {
	if (!open) return null;

	return (
		<ModalFrame open={open} className="admin-confirm-dialog" titleId="confirm-dialog-title" onClose={onCancel}>
			<form
				method="dialog"
				onSubmit={(event) => {
					event.preventDefault();
					onConfirm();
				}}
			>
				<h2 id="confirm-dialog-title" className="sr-only">
					{title}
				</h2>
				<p>{message}</p>
				<div className="admin-dialog-actions">
					<button type="button" className="admin-btn" onClick={onCancel} disabled={busy}>
						{cancelLabel}
					</button>
					<button type="submit" className="admin-btn admin-btn--danger" disabled={busy}>
						{busy ? "Eliminando..." : confirmLabel}
					</button>
				</div>
			</form>
		</ModalFrame>
	);
}
