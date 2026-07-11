import React, { InputHTMLAttributes, useEffect, useState } from 'react';
// import { useAppDispatch } from '@/store/hooks';
// import { decrementProductQty, incrementProductQty } from '../slices/billingSlice';

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
    <div className="relative flex justify-center items-center m-auto max-w-[9rem]">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className={`${
          value <= min
            ? 'hover:bg-background opacity-40 cursor-not-allowed'
            : 'hover:bg-secondary hover:border-primary'
        } bg-background w-1/3 flex items-center justify-center border border-input rounded-s-sm p-[0.9rem] focus:outline-none`}
        aria-label="Decrement value"
      >
        <svg
          className="w-2 h-2 text-primary"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 18 2"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M1 1h16"
          />
        </svg>
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
        className="border-x-0 p-2 bg-background border-input text-center border text-primary text-sm flex-1 block min-w-[8ch] max-w-full focus:ring-secondary focus:ring-2 focus:outline-none"
        placeholder={String(min)}
        required
        {...props}
      />
      <button
        type="button"
        onClick={handleIncrement}
        className="bg-background hover:bg-secondary border border-input p-[0.9rem] hover:border-primary w-1/3 flex items-center justify-center rounded-e-sm focus:outline-none"
        aria-label="Increment value"
      >
        <svg
          className="w-2 h-2 text-primary"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 18 18"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 1v16M1 9h16"
          />
        </svg>
      </button>
    </div>
  );
};

export default CustomInputNumber;
