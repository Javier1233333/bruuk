import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import './BruukSelect.css';

export type BruukSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type BruukSelectProps = {
  options: BruukSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
};

const nextEnabledIndex = (options: BruukSelectOption[], start: number, direction: 1 | -1) => {
  let index = start;
  for (let count = 0; count < options.length; count += 1) {
    index = (index + direction + options.length) % options.length;
    if (!options[index]?.disabled) return index;
  }
  return start;
};

export function BruukSelect({
  options,
  value,
  defaultValue,
  onChange,
  name,
  ariaLabel,
  disabled = false,
  className = '',
}: BruukSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [internalValue, setInternalValue] = useState(defaultValue ?? options.find((option) => !option.disabled)?.value ?? '');
  const [open, setOpen] = useState(false);
  const selectedValue = value ?? internalValue;
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selectedValue));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selectedOption = options.find((option) => option.value === selectedValue) ?? options[selectedIndex];

  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, []);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const choose = (option: BruukSelectOption) => {
    if (option.disabled) return;
    if (value === undefined) setInternalValue(option.value);
    onChange?.(option.value);
    setOpen(false);
  };

  const openMenu = () => {
    if (disabled) return;
    setActiveIndex(options[selectedIndex]?.disabled ? nextEnabledIndex(options, selectedIndex, 1) : selectedIndex);
    setOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) return openMenu();
      setActiveIndex((current) => nextEnabledIndex(options, current, event.key === 'ArrowDown' ? 1 : -1));
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const edge = event.key === 'Home' ? -1 : 0;
      setActiveIndex(nextEnabledIndex(options, edge, event.key === 'Home' ? 1 : -1));
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) openMenu();
      else choose(options[activeIndex]);
    }
  };

  return (
    <div className={`bruuk-select ${open ? 'is-open' : ''} ${className}`.trim()} ref={rootRef}>
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <button
        className="bruuk-select-trigger"
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        disabled={disabled}
        onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={handleKeyDown}
      >
        <span>{selectedOption?.label}</span>
        <i aria-hidden="true"><ChevronDown size={17} strokeWidth={2.5} /></i>
      </button>
      {open && (
        <div className="bruuk-select-menu" id={`${id}-listbox`} role="listbox" aria-label={ariaLabel}>
          <span className="bruuk-select-menu-kicker">/ ELIGE UNA OPCIÓN</span>
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === selectedValue}
              aria-disabled={option.disabled || undefined}
              disabled={option.disabled}
              className={`${option.value === selectedValue ? 'is-selected' : ''} ${index === activeIndex ? 'is-active' : ''}`.trim()}
              key={option.value}
              ref={(node) => { optionRefs.current[index] = node; }}
              onPointerMove={() => !option.disabled && setActiveIndex(index)}
              onClick={() => choose(option)}
            >
              <span>{option.label}</span>
              {option.value === selectedValue && <Check size={16} strokeWidth={3} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type BruukComboboxProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder: string;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  floatingLabel?: string;
  onFocus?: () => void;
};

export function BruukCombobox({ id, value, onChange, suggestions, placeholder, ariaLabel, disabled = false, className = '', inputClassName = '', floatingLabel, onFocus }: BruukComboboxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const filtered = useMemo(() => {
    const query = value.trim().toLocaleLowerCase('es');
    return suggestions.filter((suggestion) => !query || suggestion.toLocaleLowerCase('es').includes(query)).slice(0, 8);
  }, [suggestions, value]);

  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, []);

  const choose = (suggestion: string) => {
    onChange(suggestion);
    setOpen(false);
  };

  return (
    <div className={`bruuk-combobox ${floatingLabel ? 'has-floating-label' : ''} ${open && filtered.length ? 'is-open' : ''} ${className}`.trim()} ref={rootRef}>
      {floatingLabel && <span className="bruuk-combobox-floating-label" aria-hidden="true">{floatingLabel}</span>}
      <input
        id={id}
        className={inputClassName}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open && filtered.length > 0}
        aria-controls={`${id}-suggestions`}
        autoComplete="off"
        disabled={disabled}
        onFocus={() => { onFocus?.(); setOpen(true); }}
        onChange={(event) => { onChange(event.target.value); setActiveIndex(0); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (!filtered.length) return;
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) => (current + (event.key === 'ArrowDown' ? 1 : -1) + filtered.length) % filtered.length);
          }
          if (event.key === 'Enter' && open && filtered[activeIndex]) {
            event.preventDefault();
            choose(filtered[activeIndex]);
          }
        }}
      />
      {open && filtered.length > 0 && (
        <div className="bruuk-combobox-menu" id={`${id}-suggestions`} role="listbox" aria-label="Ciudades sugeridas">
          <span className="bruuk-select-menu-kicker">/ CIUDADES</span>
          {filtered.map((suggestion, index) => (
            <button
              type="button"
              role="option"
              aria-selected={suggestion === value}
              className={index === activeIndex ? 'is-active' : ''}
              key={suggestion}
              onPointerDown={(event) => event.preventDefault()}
              onPointerMove={() => setActiveIndex(index)}
              onClick={() => choose(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
