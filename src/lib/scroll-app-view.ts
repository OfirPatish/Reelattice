import type { AppView } from "@/lib/types";

export const scrollAppViewToTop = (view: AppView) => {
  const panel = document.querySelector(`[data-app-view="${view}"]`);
  if (!panel) return;

  panel.querySelectorAll<HTMLElement>("[data-scroll-root]").forEach((element) => {
    element.scrollTop = 0;
  });
};
