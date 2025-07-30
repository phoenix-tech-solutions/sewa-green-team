interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
  ariaLabel?: string;
}

const FilterSelect = ({
  id,
  label,
  value,
  onChange,
  options,
  className = "",
  ariaLabel,
}: FilterSelectProps) => {
  return (
    <div className="flex flex-col items-start gap-2">
      <label htmlFor={id} className="font-semibold text-[#6b7547]">
        {label}:
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`border border-[#cdd1bc] rounded-lg px-3 py-2 w-40 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-[#8a9663] focus:border-[#8a9663] text-[#6b7547] font-medium ${className}`}
        aria-label={ariaLabel || `Filter by ${label.toLowerCase()}`}
      >
        {options.map((option: string) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterSelect;
