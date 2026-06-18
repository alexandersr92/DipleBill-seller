import { Loader2Icon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import { getBillingProductsSearchApi } from '@/modules/billing/services/billingApi';
import { IComprasProduct } from '../types/compras.types';

interface ISearchInputProps {
  inventoryId?: string;
  placeholder: string;
  onAdd: (product: IComprasProduct) => void;
  tabIndex?: number;
  searchBy?: 'name' | 'sku' | 'barcode';
}

export default function PurchaseSearchInput({
  inventoryId,
  placeholder,
  onAdd,
  tabIndex,
  searchBy = 'sku'
}: ISearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prevIndex) => (prevIndex < results.length - 1 ? prevIndex + 1 : prevIndex));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : -1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      const product = results[activeIndex];
      handleResultClick(product);
    }
  };

  const handleResultClick = (product: any) => {
    const mapped: IComprasProduct = {
      product_id: Number(product.product_id ?? product.id),
      sku: product.sku ?? '',
      product_name: product.name ?? product.product ?? '',
      barcode: product.barcode ?? '',
      price: Number(product.price ?? product.cost ?? 0),
      quantity: 1,
      cost: Number(product.cost ?? product.price ?? 0)
    };
    onAdd(mapped);
    setResults([]);
    setSearchTerm('');
    setActiveIndex(-1);
  };

  const debouncedFetch = useRef(
    debounce(async (value: string, currentInventoryId?: string) => {
      if (!currentInventoryId) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      if (value.length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      try {
        const data = await getBillingProductsSearchApi({
          page: 1,
          perPage: 20,
          search: value,
          search_by: searchBy,
          inventoryId: currentInventoryId
        });

        const list = data?.data ?? data;
        setResults(Array.isArray(list) ? list : []);
      } catch (error: unknown) {
        if (!axios.isCancel(error)) {
          console.error('Error fetching inventory products:', error);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300)
  ).current;

  useEffect(() => {
    const value = searchTerm.trim();
    if (value.length >= 2) {
      setIsLoading(true);
    }
    debouncedFetch(value, inventoryId);
  }, [searchTerm, inventoryId, searchBy]);

  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, []);

  const shouldShowResults = searchTerm.trim().length >= 2 && !!inventoryId;
  const noResults = !isLoading && shouldShowResults && results.length === 0;
  const hasVisibleResults = results.length > 0 && !isLoading;

  return (
    <div className="relative w-full max-w-md">
      <div className="flex flex-col space-y-2 group">
        <div className="w-full relative flex items-center">
          <Search className="text-foreground absolute left-2 w-5 h-5" />
          <Input
            tabIndex={tabIndex}
            id="purchase-product-search"
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-controls="purchase-search-results"
            aria-expanded={results.length > 0}
            className="pl-8 text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
            disabled={!inventoryId}
          />
        </div>

        <ul
          id="purchase-search-results"
          role="listbox"
          aria-labelledby="suggestions-label"
          className={`${shouldShowResults ? 'block' : 'hidden'} absolute p-2 z-50 w-full mt-1 bg-background border border-secondary rounded-md shadow-lg max-h-60 overflow-auto top-full
            overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300
            dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500`}>
          {isLoading && (
            <div className="py-4">
              <Loader2Icon className="animate-spin mx-auto text-theme_blue" />
            </div>
          )}

          {noResults && (
            <p className="font-medium text-sm text-center py-4">
              No se han encontrado coincidencias: <strong>{searchTerm}</strong>
            </p>
          )}

          {hasVisibleResults &&
            results.map((product: any, index: number) => (
              <li
                key={`${product.id}-${product.product_id}-${index}`}
                id={`purchase-search-result-${product.id ?? product.product_id}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`p-2 cursor-pointer flex flex-col items-start ${
                  product.quantity === 0 ? 'text-red-500' : 'text-foreground'
                } ${index === activeIndex ? 'bg-blue-100' : 'hover:bg-secondary'}`}
                onClick={() => handleResultClick(product)}>
                <div className="flex justify-between w-full">
                  <span className="font-medium text-sm">{product.name}</span>
                  <span className="text-xs">({product.quantity})</span>
                </div>
                <div className="flex justify-between w-full mt-1 text-muted-foreground">
                  <span className="text-xs">{product.sku}</span>
                  <span className="text-xs">{product.inventory_name}</span>
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
