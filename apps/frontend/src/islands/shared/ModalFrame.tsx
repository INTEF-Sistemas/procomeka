import { useEffect, type ReactNode } from "react";

interface ModalFrameProps {
	open: boolean;
	titleId: string;
	className: string;
	onClose: () => void;
	children: ReactNode;
}

export function ModalFrame({
	open,
	titleId,
	className,
	onClose,
	children,
}: ModalFrameProps) {
	useEffect(() => {
		if (!open) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		function handleEscape(event: KeyboardEvent) {
			if (event.key === "Escape") {
				onClose();
			}
		}

		window.addEventListener("keydown", handleEscape);

		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", handleEscape);
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className="admin-modal-overlay"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) {
					onClose();
				}
			}}
		>
			<div className={className} role="dialog" aria-modal="true" aria-labelledby={titleId}>
				{children}
			</div>
		</div>
	);
}
