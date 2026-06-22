import type { AppConfirmVariant } from "@/components/ui/app-confirm-dialog";

export type ShowConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: AppConfirmVariant;
};

export type ShowConfirmFn = (options: ShowConfirmOptions) => Promise<boolean>;

let confirmHandler: ShowConfirmFn | null = null;

export const registerShowConfirm = (handler: ShowConfirmFn | null) => {
  confirmHandler = handler;
};

export const showConfirm = async (options: ShowConfirmOptions): Promise<boolean> => {
  if (!confirmHandler) {
    return window.confirm(`${options.title}\n\n${options.description}`);
  }

  return confirmHandler(options);
};
