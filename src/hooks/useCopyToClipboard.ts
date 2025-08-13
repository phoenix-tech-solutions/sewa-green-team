import { useState } from "react";

/**
 * Custom hook for copying text to clipboard with feedback
 * @param successMessage - Message to show on successful copy
 * @param errorMessage - Message to show on copy error
 * @returns Object with copyToClipboard function, copied state, and error state
 */
export const useCopyToClipboard = (
  successMessage = "Copied to clipboard!",
  errorMessage = "Failed to copy to clipboard"
) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError(null);
      
      // Show success message
      if (successMessage) {
        alert(successMessage);
      }
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError(errorMessage);
      setCopied(false);
      
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        
        setCopied(true);
        setError(null);
        if (successMessage) {
          alert(successMessage);
        }
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Failed to copy text: ", fallbackErr);
        if (errorMessage) {
          alert(errorMessage);
        }
      }
    }
  };

  return {
    copyToClipboard,
    copied,
    error,
  };
};
