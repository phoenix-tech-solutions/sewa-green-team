import { useState } from "react";

/**
 * Custom hook for managing expandable items
 * @param initialExpandedId - Optional initial expanded item ID
 * @returns Object with expandedId, toggleExpand function, and utility functions
 */
export const useExpandable = (initialExpandedId: string | null = null) => {
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const isExpanded = (id: string) => expandedId === id;

  const collapseAll = () => setExpandedId(null);

  const expandItem = (id: string) => setExpandedId(id);

  return {
    expandedId,
    toggleExpand,
    isExpanded,
    collapseAll,
    expandItem,
  };
};
