import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { es } from 'date-fns/locale';
import { useState } from 'react';

interface DatePickerProps {
  className?: string;
  disabled?: boolean;
  dateSelected?: boolean;
  value: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  tabIndex?: number;
  id?: string;
  buttonRef?: React.Ref<HTMLButtonElement>;
}

export function DatePicker({
  className = '',
  disabled = false,
  value,
  onChange,
  tabIndex,
  id,
  buttonRef
}: DatePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);

  const handleChange = (value: any) => {
    if (onChange) {
      onChange(value);
    }
    setCalendarOpen(false);
  };

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          type="button"
          id={id}
          tabIndex={tabIndex}
          disabled={disabled}
          variant={'outline'}
          data-enter-behavior="native"
          className={cn(
            'w-full justify-start text-left font-normal capitalize',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'MMMM d, yyyy', { locale: es }) : <span>Seleccionar</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(value) => handleChange(value)}
          required
        />
      </PopoverContent>
    </Popover>
  );
}
