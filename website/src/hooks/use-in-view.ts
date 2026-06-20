import { useEffect, useState, type Ref } from "react";

type UseInViewOptions = {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
};

export const useInView = ({
  threshold = 0.15,
  rootMargin = "0px 0px -8% 0px",
  once = true,
}: UseInViewOptions = {}) => {
  const [node, setNode] = useState<Element | null>(null);
  const [inView, setInView] = useState(false);

  const ref: Ref<Element> = (element) => {
    setNode(element);
  };

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, threshold, rootMargin, once]);

  return { ref, inView };
};
