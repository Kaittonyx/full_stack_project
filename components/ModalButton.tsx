"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

export default function ModalButton({
                                        label,
                                        title,
                                        children,
                                        resetKey = "static",
                                        className = "btn btn-ghost btn-sm",
                                    }: {
    label: ReactNode;
    title: string;
    children: ReactNode;
    resetKey?: string;
    className?: string;
}) {
    const [openedFor, setOpenedFor] = useState<string | null>(null);
    const open = openedFor === resetKey;

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpenedFor(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    return (
        <>
            <button type="button" className={className} onClick={() => setOpenedFor(resetKey)}>
                {label}
            </button>

            {open && (
                <div className="modal-overlay" onClick={() => setOpenedFor(null)}>
                    <div
                        className="dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dialog-head">
                            <h2>{title}</h2>
                            <button
                                type="button"
                                className="dialog-close"
                                aria-label="Закрыть"
                                onClick={() => setOpenedFor(null)}
                            >
                                <X size={22} />
                            </button>
                        </div>
                        {children}
                    </div>
                </div>
            )}
        </>
    );
}