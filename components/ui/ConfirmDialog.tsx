import React from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    loading?: boolean;
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, description, loading }: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0f172a] border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl transform scale-100 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-white/70 mb-6 text-sm leading-relaxed">
                    {description}
                </p>

                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={onConfirm} disabled={loading} className="bg-red-600 hover:bg-red-500 border-red-500">
                        {loading ? "Saving..." : "Confirm Reset"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
