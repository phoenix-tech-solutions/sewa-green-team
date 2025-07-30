import { useState } from "react";

/**
 * Custom hook for managing modal state
 * @param initialOpen - Initial open state of the modal
 * @returns Object with modal state and control functions
 */
export const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen(prev => !prev);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
};
