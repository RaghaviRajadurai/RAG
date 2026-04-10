import { useEffect } from "react";

function usePageTitle(title) {
  useEffect(() => {
    if (!title) return;
    const original = document.title;
    document.title = `${title} • Secure Healthcare RAG`;
    return () => {
      document.title = original;
    };
  }, [title]);
}

export { usePageTitle };

