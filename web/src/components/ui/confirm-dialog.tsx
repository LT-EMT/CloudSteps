import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "antd";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  confirmVariant = "default",
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  confirmVariant?: "default" | "destructive";
  loading?: boolean;
}) {
  const [internalLoading, setInternalLoading] = React.useState(false);

  const isLoading = loading || internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isLoading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-slate-500 leading-relaxed">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 transition-all duration-200 hover:shadow-sm active:scale-[0.99]"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            loading={isLoading}
            className={
              "h-10 px-4 rounded-xl font-medium text-white transition-all duration-200 hover:shadow-md active:scale-[0.99] " +
              (confirmVariant === "destructive"
                ? "bg-[#FF6B6B] hover:bg-[#ff5252]"
                : "bg-[#4ECDC4] hover:bg-[#45b8b0]")
            }
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
