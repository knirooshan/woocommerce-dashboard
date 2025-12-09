import React, { useRef } from "react";
import { Calendar } from "lucide-react";

const DateInput = ({
  id,
  name,
  label,
  value,
  onChange,
  required,
  min,
  max,
}) => {
  const inputRef = useRef(null);

  const focusInput = () => {
    if (inputRef.current)
      inputRef.current.showPicker
        ? inputRef.current.showPicker()
        : inputRef.current.focus();
  };

  return (
    <div>
      {label && (
        <label
          htmlFor={id || name}
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id || name}
          name={name}
          type="date"
          value={value}
          onChange={onChange}
          required={required}
          min={min}
          max={max}
          className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 pr-10 text-white focus:outline-none focus:border-blue-500"
        />

        <button
          type="button"
          onClick={focusInput}
          aria-label="Open calendar"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
        >
          <Calendar className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default DateInput;
