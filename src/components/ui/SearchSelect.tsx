import { Popover } from '@radix-ui/react-popover';
import { PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { ChevronsUpDown, Check, Plus } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from './command';
import { cn } from '../../lib/utils';
import { KeyboardEvent, Ref, useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';

interface ISearchSelectProps {
  items: any[];
  selectedItem: string;
  onSelect: (item: any) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  field?: any;
  getCallback?: (searchTerm: string) => void;
  addRecord?: (value: string) => Promise<any>;
  debounceMs?: number;
  id?: string;
  triggerRef?: Ref<HTMLButtonElement>;
  onAfterSelect?: () => void;
}

export default function SearchSelect({
  items,
  selectedItem,
  onSelect,
  placeholder = 'Seleccionar una opción',
  searchPlaceholder = 'Buscar...',
  field,
  getCallback,
  addRecord,
  debounceMs = 300,
  id,
  triggerRef,
  onAfterSelect
}: ISearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const internalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  const debouncedCallback = useRef(
    debounce((value: string, cb: (v: string) => void) => cb(value), debounceMs)
  ).current;

  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (getCallback) {
        debouncedCallback(value, getCallback);
      }
    },
    [getCallback, debouncedCallback]
  );

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      commandInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open]);

  const handleSelectItem = (item: any) => {
    onSelect(item);
    setSearchTerm('');
    setOpen(false);
    onAfterSelect?.();
  };

  const handleAddRecord = async (term: string): Promise<void> => {
    if (addRecord) {
      try {
        await addRecord(term);
        setSearchTerm('');
        setOpen(false);
        onAfterSelect?.();
      } catch (err) {
        // Silently catch client validation cancellation/rejection to keep the popover open for edits
      }
    }
  };

  const openForKeyboard = (initialValue = '') => {
    handleSearch(initialValue);
    setOpen(true);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === 'ArrowDown' || event.key === ' ') {
      event.preventDefault();
      openForKeyboard();
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    const isPrintableKey =
      event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey;

    if (isPrintableKey) {
      event.preventDefault();
      openForKeyboard(event.key);
    }
  };

  const handleSearchInputKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      internalTriggerRef.current?.focus();
      return;
    }

    if (event.key === 'Enter' && addRecord && !filteredItems.length && searchTerm.trim()) {
      event.preventDefault();
      await handleAddRecord(searchTerm.trim());
    }
  };

  const setTriggerRef = (node: HTMLButtonElement | null) => {
    internalTriggerRef.current = node;

    if (!triggerRef) return;

    if (typeof triggerRef === 'function') {
      triggerRef(node);
    } else {
      (triggerRef as { current: HTMLButtonElement | null }).current = node;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={setTriggerRef}
          type="button"
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          data-enter-behavior="native"
          onKeyDown={handleTriggerKeyDown}
          className="w-full justify-between font-normal">
          {selectedItem || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[40vw] p-0">
        <Command>
          <CommandInput
            ref={commandInputRef}
            value={searchTerm}
            onValueChange={(e) => handleSearch(e)}
            onKeyDown={handleSearchInputKeyDown}
            placeholder={searchPlaceholder}
          />
          <CommandList>
            <CommandEmpty>No se encontraron resultados con "{searchTerm}"</CommandEmpty>
            {addRecord && !filteredItems.length && searchTerm && (
              <Button
                type="button"
                onClick={() => handleAddRecord(searchTerm)}
                size="sm"
                className="w-fit flex mb-6 mx-auto items-center justify-center">
                <Plus className="mr-2 h-4 w-4" />
                Agregar "{searchTerm}"
              </Button>
            )}
            <CommandGroup>
              {filteredItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => handleSelectItem(item)}
                  className={cn(
                    'flex items-center justify-between px-4 py-2',
                    item.id === field.value && 'bg-theme_blue text-white'
                  )}>
                  <span>{item.name}</span>
                  {item.id === field.value && <Check className="h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
