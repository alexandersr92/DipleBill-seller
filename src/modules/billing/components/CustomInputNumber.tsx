import React, { InputHTMLAttributes, useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface CustomInputNumberProps extends InputHTMLAttributes<HTMLInputElement> {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onQtyChange?: (value: number) => void;
  onEnter?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
  productId: string;
}

const CustomInputNumber: React.FC<CustomInputNumberProps> = ({
  min = 1,
  max = 99999,
  step = 1,
  defaultValue = 1,
  onQtyChange = () => {},
  onEnter,
  inputRef,
  // productId se desestructura para que no llegue al <input> como atributo DOM
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  productId,
  ...props
}) => {
  const [value, setValue] = useState<number>(defaultValue);
  const [displayValue, setDisplayValue] = useState<string>(String(defaultValue));

  useEffect(() => {
    setValue(defaultValue);
    setDisplayValue(String(defaultValue));
  }, [defaultValue]);

  const commit = (newValue: number) => {
    const clamped = Math.max(min, Math.min(max, newValue));
    setValue(clamped);
    setDisplayValue(String(clamped));
    onQtyChange(clamped);
  };

  const handleIncrement = () => commit(value + step);

  const handleDecrement = () => commit(value - step);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);

    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      setValue(clamped);
      onQtyChange(clamped);
    }
  };

  const handleBlur = () => commit(value);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      handleIncrement();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      handleDecrement();
      return;
    }

    if (e.key === 'Enter') {
      if (e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();
      commit(value);
      onEnter?.();
    }
  };

  const setInputRef = (node: HTMLInputElement | null) => {
    if (!inputRef) return;

    if (typeof inputRef === 'function') {
      inputRef(node);
    } else {
      (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    }
  };

  return (
    <div className="inline-flex items-stretch h-7.5 w-24 rounded-md border border-input bg-background shadow-xs overflow-hidden focus-within:border-sale-accent focus-within:ring-1 focus-within:ring-sale-accent transition-all">
      <button
        type="button"
        tabIndex={-1}
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-7 flex items-center justify-center border-r border-input bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 select-none"
        aria-label="Disminuir cantidad">
        <Minus className="w-3 h-3 text-foreground" />
      </button>

      <input
        ref={setInputRef}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onFocus={(e) => e.target.select()}
        aria-describedby="helper-text-explanation"
        className="w-full bg-transparent text-center text-xs sm:text-sm font-bold text-foreground focus:outline-none px-0.5 min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        placeholder={String(min)}
        required
        {...props}
      />

      <button
        type="button"
        tabIndex={-1}
        onClick={handleIncrement}
        className="w-7 flex items-center justify-center border-l border-input bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 select-none"
        aria-label="Aumentar cantidad">
        <Plus className="w-3 h-3 text-foreground" />
      </button>
    </div>
  );
};

export default CustomInputNumber;
