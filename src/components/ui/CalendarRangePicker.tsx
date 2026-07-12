import * as React from 'react';
import { addDays, format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { Calendar } from './calendar';
import { es } from 'date-fns/locale';

interface CalendarRangePickerProps {
  className?: string;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  initialRange?: DateRange;
}

export function CalendarRangePicker({
  className,
  dateRange,
  onDateRangeChange,
  initialRange
}: CalendarRangePickerProps) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(
    initialRange || {
      from: new Date(),
      to: addDays(new Date(), 31)
    }
  );

  const selectedDate = dateRange !== undefined ? dateRange : internalDate;

  const handleDateChange = (range: DateRange | undefined) => {
    if (onDateRangeChange) {
      onDateRangeChange(range);
    } else {
      setInternalDate(range);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[260px] justify-start text-left font-normal capitalize',
              !selectedDate?.from && 'text-muted-foreground'
            )}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate?.from ? (
              selectedDate.to ? (
                <>
                  {format(selectedDate.from, 'LLL dd, y', { locale: es })} -{' '}
                  {format(selectedDate.to, 'LLL dd, y', { locale: es })}
                </>
              ) : (
                format(selectedDate.from, 'LLL dd, y', { locale: es })
              )
            ) : (
              <span className="normal-case">Selecciona una fecha</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            className="capitalize"
            locale={es}
            initialFocus
            mode="range"
            defaultMonth={selectedDate?.from}
            selected={selectedDate}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
