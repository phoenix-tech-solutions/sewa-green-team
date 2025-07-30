import { Copy } from "lucide-react";

interface CopyButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  title?: string;
  ariaLabel?: string;
}

const CopyButton = ({
  onClick,
  children,
  variant = "primary",
  className = "",
  title,
  ariaLabel,
}: CopyButtonProps) => {
  const baseClasses = "flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105";
  
  const variantClasses = {
    primary: "bg-[#8a9663] hover:bg-[#7a8757] text-white",
    secondary: "bg-[#c27d50] hover:bg-[#a46336] text-white",
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
    >
      {children} <Copy size={16} />
    </button>
  );
};

export default CopyButton;
