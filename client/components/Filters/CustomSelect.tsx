"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
  color?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const CustomSelect = ({ options, value, onChange, placeholder = "Select...", className = "" }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`customSelect ${className}`} ref={dropdownRef}>
      <button 
        type="button"
        className={`customSelect__trigger ${isOpen ? "customSelect__trigger--active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="customSelect__value">
          {selectedOption?.color && (
            <span 
              className="customSelect__dot" 
              style={{ backgroundColor: selectedOption.color }} 
            />
          )}
          <span className="customSelect__text">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <svg className={`customSelect__arrow ${isOpen ? "customSelect__arrow--open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 9l6 6 6-6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="customSelect__menu animate-scaleIn">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`customSelect__option ${opt.value === value ? "customSelect__option--selected" : ""}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.color && (
                <span 
                  className="customSelect__dot" 
                  style={{ backgroundColor: opt.color }} 
                />
              )}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
