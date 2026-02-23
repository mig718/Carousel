import React, { useState, useRef, useEffect } from 'react';
import './SearchableSelect.css';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  label,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const selectedLabel = options.find((opt) => opt.value === value)?.label || '';

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchText('');
  };

  return (
    <div className="searchable-select-container" ref={containerRef}>
      {label && (
        <label className="searchable-select-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className="searchable-select-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="searchable-select-input"
          placeholder={value ? selectedLabel : placeholder}
          value={isOpen ? searchText : selectedLabel}
          onChange={(e) => setSearchText(e.target.value)}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
        />
        {isOpen && (
          <div className="searchable-select-dropdown">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`searchable-select-option ${opt.value === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="searchable-select-no-options">No matching options</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;
