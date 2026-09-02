import { CornerDownLeft, Loader2Icon, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChangeEvent, KeyboardEvent, RefObject, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { IInvoiceProduct } from '@diplebill/core';
import { addProductsToBilling } from '../slices/billingSlice';
import { getBillingProductsApi } from '../services/billingApi';
import { searchProductsOffline } from '@/modules/offline/productSearch';
import { store } from '@/store/store';
import axios from 'axios';
import { debounce } from 'lodash';
import { useToast } from '@/components/hooks/use-toast';

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
  const { toast } = useToast();
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
    const cleanPrice = product.price ? parseFloat(product.price.toString()) : 0;
    dispatch(
      addProductsToBilling({
        ...product,
        price: cleanPrice,
        quantity: 1,
        total: cleanPrice,
        tax: 0,
        grand_total: cleanPrice,
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

  const handleClearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setActiveIndex(-1);
    inputRef?.current?.focus();
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
        const hasNoPrice =
          product.price === null ||
          product.price === undefined ||
          String(product.price) === '' ||
          isNaN(Number(product.price));
        if (hasNoPrice) {
          toast({
            title: `El producto "${product.name}" no tiene precio configurado en el inventario "${product.inventory_name}" y no se puede facturar.`,
            variant: 'error'
          });
          return;
        }
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
    const hasNoPrice =
      product.price === null ||
      product.price === undefined ||
      String(product.price) === '' ||
      isNaN(Number(product.price));
    if (hasNoPrice) {
      toast({
        title: `El producto "${product.name}" no tiene precio configurado en el inventario "${product.inventory_name}" y no se puede facturar.`,
        variant: 'error'
      });
      return;
    }
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

      // Leer conectividad en tiempo de llamada: el closure del debounce no ve props frescas.
      const isOnline = store.getState().offlineSlice.isOnline;

      if (!isOnline && storeId) {
        try {
          const localResults = await searchProductsOffline(storeId, value);
          setResults(localResults);
        } finally {
          setIsLoading(false);
        }
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
          // La red cayó a mitad de búsqueda: responder desde el catálogo cacheado.
          if (axios.isAxiosError(error) && !error.response && storeId) {
            const localResults = await searchProductsOffline(storeId, value);
            setResults(localResults);
          }
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
    <div className="relative w-full">
      <div className="flex flex-col group">
        <div className="w-full relative flex items-center rounded-lg border-2 border-border/80 bg-background shadow-xs hover:border-muted-foreground/40 focus-within:border-sale-accent focus-within:ring-2 focus-within:ring-sale-accent/15 transition-all duration-200">
          <div className="pl-3 pr-1 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-sale-accent transition-colors">
            <Search className="w-4 h-4 shrink-0" />
          </div>

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
            className="h-9 sm:h-9.5 border-0 bg-transparent px-2 text-xs sm:text-sm text-foreground font-medium placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          <div className="flex items-center gap-1.5 pr-2.5 shrink-0">
            {isLoading && (
              <Loader2Icon className="animate-spin w-3.5 h-3.5 text-sale-accent shrink-0" />
            )}

            {searchTerm && !isLoading && (
              <button
                type="button"
                tabIndex={-1}
                onClick={handleClearSearch}
                className="h-5 w-5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                title="Limpiar búsqueda">
                <X className="w-3 h-3" />
              </button>
            )}

            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono font-bold text-muted-foreground bg-muted/80 border border-border rounded shadow-xs select-none">
              F1
            </kbd>
          </div>
        </div>

        {shouldShowResults && (
          <div
            id="search-results"
            className="absolute z-50 w-full mt-2 bg-popover text-popover-foreground border border-border/80 rounded-xl shadow-2xl overflow-hidden top-full animate-in fade-in-0 zoom-in-95 duration-100">
            {isLoading && (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2Icon className="animate-spin w-6 h-6 text-sale-accent" />
                <span className="text-xs font-medium">Buscando productos...</span>
              </div>
            )}

            {noResults && (
              <div className="py-6 px-4 text-center">
                <p className="font-semibold text-sm text-foreground">
                  No se encontraron productos
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  No hay coincidencias para <strong className="text-foreground">&quot;{searchTerm}&quot;</strong>
                </p>
              </div>
            )}

            {hasVisibleResults && (
              <>
                <div className="px-3.5 py-2 border-b bg-muted/40 flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Resultados ({results.length})</span>
                  <span>Stock / Precio</span>
                </div>

                <ul
                  ref={resultsListRef}
                  role="listbox"
                  aria-labelledby="suggestions-label"
                  className="p-1.5 max-h-72 overflow-y-auto divide-y divide-border/40
                    [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
                  {results.map((product, index) => {
                    const hasNoPrice =
                      product.price === null ||
                      product.price === undefined ||
                      String(product.price) === '' ||
                      isNaN(Number(product.price));
                    const isSelected = index === activeIndex;

                    return (
                      <li
                        key={product.id}
                        id={`search-result-${product.id}`}
                        data-result-index={index}
                        role="option"
                        aria-selected={isSelected}
                        className={`p-2.5 sm:p-3 rounded-lg flex items-center justify-between gap-3 transition-colors duration-150 select-none ${
                          hasNoPrice
                            ? 'opacity-60 cursor-not-allowed bg-transparent'
                            : isSelected
                              ? 'bg-sale-accent/10 border-l-4 border-sale-accent pl-2 text-foreground font-medium cursor-pointer'
                              : 'hover:bg-muted/60 text-foreground cursor-pointer'
                        }`}
                        onClick={() => handleResultClick(product)}>
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-sm font-bold truncate">{product.name}</span>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            {product.sku && (
                              <span className="font-mono bg-muted px-1.5 py-0.2 rounded text-[11px]">
                                {product.sku}
                              </span>
                            )}
                            <span className="truncate text-[11px]">{product.inventory_name}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 gap-1">
                          {hasNoPrice ? (
                            <span className="text-[10px] bg-destructive/15 text-destructive border border-destructive/20 px-1.5 py-0.5 rounded font-bold">
                              Sin Precio
                            </span>
                          ) : (
                            <span className="text-sm font-extrabold text-sale-accent font-mono">
                              ${parseFloat(product.price?.toString() || '0').toFixed(2)}
                            </span>
                          )}

                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                              product.quantity === 0
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : 'bg-primary/10 text-primary border-primary/20'
                            }`}>
                            {product.quantity === 0
                              ? 'Agotado (0)'
                              : `Stock: ${product.quantity}`}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="px-3 py-1.5 border-t bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-background border rounded font-mono text-[10px]">↑↓</kbd>
                    Navegar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background border rounded font-mono text-[10px] flex items-center gap-0.5">
                      <CornerDownLeft className="w-2.5 h-2.5" /> Enter
                    </kbd>
                    Agregar a venta
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-background border rounded font-mono text-[10px]">Esc</kbd>
                    Cerrar
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

