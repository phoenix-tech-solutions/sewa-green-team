import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cardVariants } from "~/constants/animations";

interface ExpandableCardProps {
  id: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  expandedContent?: React.ReactNode;
  className?: string;
  expandButtonClassName?: string;
  expandedClassName?: string;
}

const ExpandableCard = ({
  id,
  isExpanded,
  onToggle,
  children,
  expandedContent,
  className = "",
  expandButtonClassName = "",
  expandedClassName = "",
}: ExpandableCardProps) => {
  return (
    <motion.div
      className={`p-4 sm:p-6 bg-gradient-to-r from-white to-[#f9f8f4] border border-[#cdd1bc] rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          {children}
        </div>
        <button
          type="button"
          onClick={() => onToggle(id)}
          className={`text-[#8a9663] hover:text-[#6b7547] p-2 rounded-full hover:bg-white/50 transition-all duration-200 ${expandButtonClassName}`}
          aria-label={isExpanded ? "Collapse details" : "Expand details"}
          title={isExpanded ? "Collapse details" : "Expand details"}
        >
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>
      
      {isExpanded && expandedContent && (
        <div className={`mt-6 p-4 bg-[#f4f3ec]/50 rounded-xl border border-[#cdd1bc]/30 ${expandedClassName}`}>
          {expandedContent}
        </div>
      )}
    </motion.div>
  );
};

export default ExpandableCard;
