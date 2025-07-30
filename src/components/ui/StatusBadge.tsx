interface StatusBadgeProps {
  status: string;
  className?: string;
}

const getStatusStyles = (status: string): string => {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "bg-green-100 text-green-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "REJECTED":
    case "DENIED":
      return "bg-red-100 text-red-800";
    case "ACTIVE":
      return "bg-blue-100 text-blue-800";
    case "INACTIVE":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const StatusBadge = ({ status, className = "" }: StatusBadgeProps) => {
  const statusStyles = getStatusStyles(status);
  
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
