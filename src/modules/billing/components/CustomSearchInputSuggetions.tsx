import { Loader2Icon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChangeEvent, KeyboardEvent, RefObject, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { IInvoiceProduct } from '@diplebill/core';
import { addProductsToBilling } from '../slices/billingSlice';
import { getBillingProductsApi } from '../services/billingApi';
import axios from 'axios';
import { debounce } from 'lodash';

interface ISearchInputProps {
  tabIndex?: number;
  placeholder: string;
  inputRef?: RefObject<HTMLInputElement>;
  onProductAdded?: (productId: string) => void;
}

export default function CustomSearchInputSuggetions({
  tabIndex,
  placeholder,
  inputRef,
  onProductAdded
}: ISearchInputProps) {
  const storeId =
    useAppSelector((state) => state.storeSlice.store?.id) ||
    localStorage.getItem('currentStoreId') ||
    undefined;

  const dispatch = useAppDispatch();
  const resultsListRef = useRef<HTMLUListElement | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<IInvoiceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const addProductToInvoice = (product: IInvoiceProduct) => {
    dispatch(
      addProductsToBilling({
        ...product,
        quantity: 1,
        total: product.price,
        tax: 0,
        grand_total: product.price,
        discount: 0
      })
    );

    onProductAdded?.(product.id);
    setSearchTerm('');
    setResults([]);
    setActiveIndex(-1);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      setActiveIndex((prevIndex) => (prevIndex < results.length - 1 ? prevIndex + 1 : prevIndex));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      setActiveIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : -1));
    } else if (event.key === 'Enter') {
      if (event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();

      const normalizedSearch = searchTerm.trim().toLowerCase();
      const exactMatch = results.find(
        (product) =>
          product.name.toLowerCase() === normalizedSearch ||
          product.sku.toLowerCase() === normalizedSearch ||
          product.barcode.toLowerCase() === normalizedSearch
      );

      const product =
        exactMatch ?? (activeIndex >= 0 ? results[activeIndex] : undefined) ?? results[0];

      if (product) {
        addProductToInvoice(product);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setResults([]);
      setActiveIndex(-1);
    }
  };

  const handleResultClick = (product: IInvoiceProduct) => {
    addProductToInvoice(product);
  };

  const debouncedFetch = useRef(
    debounce(async (value: string) => {
      setIsLoading(true);

      if (value.length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      try {
        const [nameResponse, skuResponse] = await Promise.all([
          getBillingProductsApi({
            search: value,
            storeId: storeId || '',
            search_by: 'name'
          }),
          getBillingProductsApi({
            search: value,
            storeId: storeId || '',
            search_by: 'sku'
          })
        ]);

        const nameResults = Array.isArray(nameResponse?.data) ? nameResponse.data : [];
        const skuResults = Array.isArray(skuResponse?.data) ? skuResponse.data : [];
        const combinedResults = [...nameResults, ...skuResults];
        const uniqueResults = Array.from(
          new Map(combinedResults.map((item) => [item.id || item.product_id, item])).values()
        );

        setResults(uniqueResults as IInvoiceProduct[]);
        setIsLoading(false);
      } catch (error: unknown) {
        if (!axios.isCancel(error)) {
          if (import.meta.env.DEV) console.error('Error fetching products:', error);
        }
        setIsLoading(false);
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

    debouncedFetch(value);
  }, [searchTerm, storeId]);

  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, []);

  useEffect(() => {
    if (activeIndex < 0 || !resultsListRef.current) return;

    const activeItem = resultsListRef.current.querySelector<HTMLElement>(
      `[data-result-index="${activeIndex}"]`
    );

    activeItem?.scrollIntoView({
      block: 'nearest'
    });
  }, [activeIndex]);

  const shouldShowResults = searchTerm.trim().length >= 2;
  const noResults = !isLoading && shouldShowResults && results.length === 0;
  const hasVisibleResults = results.length > 0 && !isLoading;

  return (
    <div className="relative w-full max-w-md">
      <div className="flex flex-col space-y-2 group">
        <div className="w-full relative flex items-center">
          <Search className="text-foreground absolute left-2 w-5 h-5" />
          <Input
            ref={inputRef}
            tabIndex={tabIndex}
            id="product-search"
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-controls="search-results"
            aria-expanded={results.length > 0}
            data-enter-behavior="native"
            className="pl-8 text-foreground focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
          />
        </div>

        <ul
          ref={resultsListRef}
          id="search-results"
          role="listbox"
          aria-labelledby="suggestions-label"
          className={`${
            shouldShowResults ? 'block' : 'hidden'
          } absolute p-1.5 z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto top-full
            [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30
          `}>
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
            results.map((product, index) => (
              <li
                key={product.id}
                id={`search-result-${product.id}`}
                data-result-index={index}
                role="option"
                aria-selected={index === activeIndex}
                className={`p-2.5 cursor-pointer flex flex-col items-start rounded-md transition-colors duration-150 ${
                  product.quantity === 0
                    ? 'text-destructive font-semibold'
                    : index === activeIndex
                      ? 'text-accent-foreground font-semibold'
                      : 'text-foreground'
                } ${index === activeIndex ? 'bg-accent' : 'hover:bg-accent/40'}`}
                onClick={() => handleResultClick(product)}>
                <div className="flex justify-between w-full">
                  <span className="text-sm font-bold">{product.name}</span>
                  <span className="text-xs">({product.quantity})</span>
                </div>
                <div className="flex justify-between w-full mt-1 text-muted-foreground">
                  <span className="text-[11px]">{product.sku}</span>
                  <span className="text-[11px]">{product.inventory_name}</span>
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
