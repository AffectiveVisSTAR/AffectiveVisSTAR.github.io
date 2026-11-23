import { useState } from "react";

// Which colored panels are folded into a narrow strip. Resets on page reload.
export default function useCollapsedPanels() {
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(() => new Set());

  function togglePanel(id: string) {
    setCollapsedPanels((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return { collapsedPanels, togglePanel };
}
