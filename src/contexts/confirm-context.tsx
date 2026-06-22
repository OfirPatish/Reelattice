import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  AppConfirmDialog,
  type AppConfirmVariant,
} from "@/components/ui/app-confirm-dialog";
import { registerShowConfirm, type ShowConfirmOptions } from "@/lib/show-confirm";

type PendingConfirm = ShowConfirmOptions & {
  resolve: (accepted: boolean) => void;
};

type ConfirmContextValue = {
  showConfirm: (options: ShowConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const showConfirm = useCallback(
    (options: ShowConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...options, resolve });
      }),
    [],
  );

  useEffect(() => {
    registerShowConfirm(showConfirm);
    return () => registerShowConfirm(null);
  }, [showConfirm]);

  const handleClose = (accepted: boolean) => {
    pending?.resolve(accepted);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <AppConfirmDialog
        open={Boolean(pending)}
        title={pending?.title ?? ""}
        description={pending?.description ?? ""}
        confirmLabel={pending?.confirmLabel}
        cancelLabel={pending?.cancelLabel}
        variant={(pending?.variant ?? "default") as AppConfirmVariant}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }

  return context;
};
