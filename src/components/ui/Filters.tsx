import { SearchIcon } from 'lucide-react';
import { CalendarRangePicker } from './CalendarRangePicker';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Button } from './button';
import { Cross2Icon } from '@radix-ui/react-icons';

interface CustomFilterOption {
  value: string;
  label: string;
}

interface CustomFilterProps {
  options: CustomFilterOption[];
  selectedValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface FiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  dateRange?: { start?: Date; end?: Date };
  onDateRangeChange?: (range: { start?: Date; end?: Date }) => void;
  searchPlaceholder?: string;
  customFilter?: CustomFilterProps[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const Filters = ({
  searchValue,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  searchPlaceholder = 'Buscar...',
  customFilter,
  onClearFilters,
  hasActiveFilters
}: FiltersProps) => {
  return (
    <div className="w-full py-[14px] flex items-center justify-between">
      <div className="w-5/6 flex items-center gap-2">
        {/* Campo de búsqueda */}
        <div className="w-80 relative">
          <SearchIcon className="w-5 h-5 text-gray-500 absolute left-2 top-1/2 transform -translate-y-1/2" />
          <Input
            className="pl-8 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>

        {/* Selector de rango de fechas */}
        {onDateRangeChange && (
          <div className="w-fit flex gap-2 items-center relative">
            <CalendarRangePicker
              dateRange={{ from: dateRange?.start, to: dateRange?.end }}
              onDateRangeChange={(range: any) => {
                onDateRangeChange({
                  start: range?.from,
                  end: range?.to
                });
              }}
            />
          </div>
        )}

        {customFilter?.map((filter, i) => (
          <div
            key={`${filter.selectedValue}-${i}`}
            className="w-fit flex gap-2 items-center relative"
          >
            <Select value={filter.selectedValue} onValueChange={filter.onChange}>
              <SelectTrigger className="w-[180px] min-h-[40px]">
                <SelectValue placeholder={filter.placeholder || 'Seleccionar...'} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {hasActiveFilters && (
          <div className="w-fit flex gap-2 items-center relative">
            <Button
              variant="secondary"
              onClick={onClearFilters}
              className="border-dashed border bg-transparent"
            >
              <Cross2Icon className="h-4 w-4" />
              Limpiar
            </Button>
          </div>
        )}
      </div>

      <div className="w-1/6 flex items-center justify-end">
        {/* Espacio para futuros filtros adicionales */}
      </div>
    </div>
  );
};

export default Filters;
