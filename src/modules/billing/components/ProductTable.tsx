import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { RefObject, useEffect, useRef, useState } from 'react';
import { calculateTotalDiscount, currencyFormatter } from '../helpers';
import { Copy, Trash } from 'lucide-react';
import CustomInputNumber from './CustomInputNumber';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { IInvoiceProduct } from '@diplebill/core';
import { SELL_TYPES } from '../types';
import CustomSearchInputSuggetions from './CustomSearchInputSuggetions';
import {
  deleteSelectedProduct,
  deleteSelectedProducts,
  duplicateProduct,
  updateInvoice,
  updateProductField
} from '../slices/billingSlice';
import { Input } from '@/components/ui/input';

interface IOrderSummary {
  totalQuantity: number;
  total: number;
  totalDiscount: number;
  init_payment?: number;
  grandTotal: number;
}

interface IProductTableProps {
  sellType: string;
  productSearchRef?: RefObject<HTMLInputElement>;
  headerContent?: React.ReactNode;
  children?: React.ReactNode;
}

const ProductTable = ({
  sellType,
  productSearchRef,
  headerContent,
  children
}: IProductTableProps) => {
  const productsSelected = useAppSelector((state) => state.billingSlice.productsSelected);
  const dispatch = useAppDispatch();
  const quantityInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const priceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const totalInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [selectProducts, setSelectProducts] = useState<string[]>([]);
  const [pendingFocusProductId, setPendingFocusProductId] = useState<string | null>(null);

  const [discount, setDiscount] = useState({
    percentage: 0,
    fixed: 0
  });
  const [discountInput, setDiscountInput] = useState('0');
  const [discountError, setDiscountError] = useState<string | null>(null);

  const [orderSummary, setOrderSummary] = useState<IOrderSummary>({
    totalQuantity: 0,
    total: 0,
    totalDiscount: 0,
    init_payment: 0,
    grandTotal: 0
  });

  const handleCheckboxChange = (productId: string) => {
    setSelectProducts((prevSelected) =>
      prevSelected.includes(productId)
        ? prevSelected.filter((temp_id) => temp_id !== productId)
        : [...prevSelected, productId]
    );
  };

  const handleSelectAll = () => {
    setSelectProducts(
      selectProducts.length === productsSelected.length
        ? []
        : productsSelected.map((product) => product.temp_id ?? '')
    );
  };

  const handleDeleteSelectedProducts = () => {
    dispatch(deleteSelectedProducts(selectProducts));
    orderSummary.totalDiscount = 0;
    setDiscount({
      fixed: 0,
      percentage: 0
    });
    setSelectProducts([]);
  };

  const handleDeleteAddedProduct = (id: string) => {
    dispatch(deleteSelectedProduct(id));
  };

  useEffect(() => {
    if (!productsSelected.length) {
      setDiscountInput('0');
      setDiscountError(null);
      return setOrderSummary({
        totalQuantity: 0,
        total: 0,
        totalDiscount: 0,
        init_payment: 0,
        grandTotal: 0
      });
    }

    const updatedProducts = productsSelected.map((product) => ({
      product_id: product.product_id,
      inventory_id: product.inventory_id ?? '',
      quantity: product.quantity,
      price: product.price,
      discount: product.discount || 0,
      tax: product.tax || 0,
      total: product.price * product.quantity,
      grand_total: product.price * product.quantity - (product.discount || 0) + (product.tax || 0)
    }));

    dispatch(updateInvoice({ products: updatedProducts }));

    updateOrderSummary();
  }, [productsSelected, dispatch]);

  useEffect(() => {
    dispatch(
      updateInvoice({
        grand_total: orderSummary.grandTotal,
        init_payment: orderSummary.init_payment,
        total: orderSummary.total,
        discount: orderSummary.totalDiscount
      })
    );
  }, [orderSummary]);

  useEffect(() => {
    if (!discountError) {
      setDiscountInput(orderSummary.totalDiscount.toString());
    }
  }, [orderSummary.totalDiscount, discountError]);

  useEffect(() => {
    setOrderSummary((prevOrderSummary) => {
      return {
        ...prevOrderSummary,
        grandTotal: prevOrderSummary.total - prevOrderSummary.totalDiscount,
        init_payment: sellType === SELL_TYPES.CREDITO ? prevOrderSummary.init_payment : 0
      };
    });
  }, [sellType]);

  const handleInputChange = (id: string, field: keyof IInvoiceProduct, value: number) => {
    dispatch(updateProductField({ id, field, value }));
  };

  const focusProductSearch = () => {
    productSearchRef?.current?.focus();
    productSearchRef?.current?.select();
  };

  const focusPriceInput = (tempId: string) => {
    const input = priceInputRefs.current[tempId];
    input?.focus();
    input?.select();
  };

  const focusTotalInput = (tempId: string) => {
    const input = totalInputRefs.current[tempId];
    input?.focus();
    input?.select();
  };

  const updateOrderSummary = () => {
    const summary = productsSelected.reduce(
      (acc, product) => ({
        totalQuantity: acc.totalQuantity + (product.quantity || 0),
        total: acc.total + (product.total || 0),
        grandTotal: acc.grandTotal + (product.grand_total || 0)
      }),
      { totalQuantity: 0, total: 0, grandTotal: 0 }
    );

    setOrderSummary((prevOrderSummary) => ({
      totalQuantity: summary.totalQuantity,
      total: summary.total,
      totalDiscount: prevOrderSummary.totalDiscount,
      grandTotal:
        summary.total - (prevOrderSummary.init_payment ?? 0) - prevOrderSummary.totalDiscount,
      init_payment: prevOrderSummary.init_payment
    }));
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (productsSelected.length === 0) return;

    const rawValue = e.target.value.trim();
    setDiscountInput(rawValue);

    if (!rawValue) {
      setDiscountError(null);
      setDiscount({
        percentage: 0,
        fixed: 0
      });
      setOrderSummary((prevOrderSummary) => ({
        ...prevOrderSummary,
        totalDiscount: 0,
        grandTotal: Math.max(prevOrderSummary.total - (prevOrderSummary.init_payment ?? 0), 0)
      }));
      return;
    }

    const value = parseFloat(rawValue);
    if (isNaN(value)) return;

    if (value > orderSummary.total) {
      setDiscountError('El descuento no puede ser mayor que el subtotal');
      return;
    }

    setDiscountError(null);
    setOrderSummary((prevOrderSummary) => {
      const { discount, percentage, fixed } = calculateTotalDiscount(
        value.toString(),
        prevOrderSummary.total
      );
      const grandTotal = Math.max(
        prevOrderSummary.total - (prevOrderSummary.init_payment ?? 0) - discount,
        0
      );

      setDiscount({ percentage, fixed });

      return {
        ...prevOrderSummary,
        totalDiscount: discount,
        grandTotal
      };
    });
  };

  const handleInitPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (productsSelected.length === 0) return;

    const value = e.target.value.trim();

    setOrderSummary((prevOrderSummary) => {
      const initPayment = value ? parseFloat(value) : 0;
      const grandTotal = Math.max(prevOrderSummary.total - initPayment - discount.fixed, 0);

      return {
        ...prevOrderSummary,
        init_payment: initPayment,
        grandTotal
      };
    });
  };

  useEffect(() => {
    if (!pendingFocusProductId) return;

    const targetProduct = [...productsSelected]
      .reverse()
      .find((product) => product.id === pendingFocusProductId);

    if (!targetProduct?.temp_id) return;

    const timer = window.setTimeout(() => {
      const input = quantityInputRefs.current[targetProduct.temp_id ?? ''];
      input?.focus();
      input?.select();
      setPendingFocusProductId(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pendingFocusProductId, productsSelected]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 lg:gap-4 lg:items-stretch flex-grow min-h-0 overflow-y-auto lg:overflow-hidden lg:h-full">
      {/* Columna Izquierda: Entradas generales + Tabla de productos (80% ancho) */}
      <div className="lg:col-span-4 flex flex-col gap-2.5 lg:h-full lg:overflow-hidden min-h-0">
        {/* Render general inputs */}
        {headerContent}

        {/* Card de la tabla de productos */}
        <div className="flex-grow overflow-hidden flex flex-col relative rounded-md shadow-xs p-3 border bg-card min-h-[45vh] lg:min-h-0 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-sale-accent-strong before:rounded-t-md">
          {/* Search header (Filtro / Eliminar seleccionados) */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 flex-shrink-0 mb-3">
            <div className="w-full sm:w-3/5 lg:w-1/2 xl:max-w-lg relative z-20">
              <CustomSearchInputSuggetions
                placeholder="Buscar por nombre, código de barras o SKU..."
                tabIndex={7}
                inputRef={productSearchRef}
                onProductAdded={setPendingFocusProductId}
              />
            </div>
            <div className="flex items-center justify-end gap-2 flex-shrink-0">
              {selectProducts.length > 0 && (
                <span className="text-xs text-muted-foreground font-medium mr-1">
                  {selectProducts.length} {selectProducts.length === 1 ? 'seleccionado' : 'seleccionados'}
                </span>
              )}
              <Button
                type="button"
                tabIndex={-1}
                disabled={selectProducts.length === 0}
                onClick={handleDeleteSelectedProducts}
                className="bg-secondary text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-sale-accent transition-colors duration-200 font-semibold text-xs h-9 px-3 disabled:opacity-40"
                variant={'ghost'}>
                Eliminar seleccionados
              </Button>
            </div>
          </div>

          {/* Contenedor con Scroll de la tabla de productos */}
          <div className="mt-1 flex-grow overflow-auto border rounded-md min-h-0 bg-background/30 shadow-inner">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10 shadow-xs border-b">
                <TableRow className="hover:bg-inherit">
                  <TableHead className="w-[40px] py-1.5 px-2 text-center h-8">
                    <Checkbox
                      className="focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-sale-accent"
                      onClick={handleSelectAll}
                      checked={
                        selectProducts.length === productsSelected.length &&
                        productsSelected.length !== 0
                          ? true
                          : selectProducts.length > 0
                            ? 'indeterminate'
                            : false
                      }
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground py-1.5 px-2 text-xs font-semibold uppercase tracking-wider w-[140px] h-8">
                    Código de barra
                  </TableHead>
                  <TableHead className="text-muted-foreground py-1.5 px-2 text-xs font-semibold uppercase tracking-wider w-[160px] h-8">
                    SKU
                  </TableHead>
                  <TableHead className="text-muted-foreground py-1.5 px-2 text-xs font-semibold uppercase tracking-wider min-w-[180px] h-8">
                    Producto
                  </TableHead>
                  <TableHead className="w-[160px] text-muted-foreground text-center py-1.5 px-2 text-xs font-semibold uppercase tracking-wider h-8">
                    Cantidad
                  </TableHead>
                  <TableHead className="w-[120px] text-muted-foreground text-center py-1.5 px-2 text-xs font-semibold uppercase tracking-wider h-8">
                    Precio
                  </TableHead>
                  <TableHead className="w-[120px] text-muted-foreground text-center py-1.5 px-2 text-xs font-semibold uppercase tracking-wider h-8">
                    Subtotal
                  </TableHead>
                  <TableHead className="text-muted-foreground text-center py-1.5 px-2 text-xs font-semibold uppercase tracking-wider w-[90px] h-8">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsSelected.map((product) => (
                  <TableRow className="hover:bg-muted/40 transition-colors" key={product.temp_id}>
                    <TableCell className="w-[40px] py-1 px-2 text-center">
                      <Checkbox
                        className="focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-sale-accent"
                        checked={selectProducts.includes(product.temp_id ?? '')}
                        onClick={() => handleCheckboxChange(product.temp_id ?? '')}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground py-1 px-2 text-xs">
                      {product.barcode || '--'}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground py-1 px-2 text-xs">
                      {product.sku || '--'}
                    </TableCell>
                    <TableCell className="py-1 px-2 text-xs">
                      <div className="font-semibold text-foreground leading-tight truncate max-w-[220px]">
                        {product.name}
                      </div>
                      {product.inventory_name && (
                        <div className="text-[10px] text-muted-foreground font-medium truncate">
                          {product.inventory_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-1 px-2 w-[160px]">
                      <div className="flex justify-center">
                        <CustomInputNumber
                          productId={product.temp_id ?? ''}
                          defaultValue={product.quantity}
                          inputRef={(node) => {
                            quantityInputRefs.current[product.temp_id ?? ''] = node;
                          }}
                          onQtyChange={(newQty) =>
                            handleInputChange(product.temp_id ?? '', 'quantity', newQty)
                          }
                          onEnter={() => focusPriceInput(product.temp_id ?? '')}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-1 px-2 w-[120px]">
                      <div className="flex justify-center">
                        <Input
                          tabIndex={-1}
                          type="number"
                          min={0}
                          step={0.01}
                          className="h-7.5 w-20 text-center focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-sale-accent font-medium text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-background/50 border border-input px-1 py-0.5"
                          value={product.price || ''}
                          ref={(node) => {
                            priceInputRefs.current[product.temp_id ?? ''] = node;
                          }}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (e.shiftKey) return;
                              e.preventDefault();
                              e.stopPropagation();
                              focusTotalInput(product.temp_id ?? '');
                            }
                          }}
                          onChange={(e) =>
                            handleInputChange(
                              product.temp_id ?? '',
                              'price',
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-1 px-2 w-[120px]">
                      <div className="flex justify-center">
                        <Input
                          tabIndex={-1}
                          type="number"
                          min={0}
                          step={0.01}
                          className="h-7.5 w-20 text-center focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-sale-accent font-medium text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-background/50 border border-input px-1 py-0.5"
                          ref={(node) => {
                            totalInputRefs.current[product.temp_id ?? ''] = node;
                          }}
                          value={product.total}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (e.shiftKey) return;
                              e.preventDefault();
                              e.stopPropagation();
                              focusProductSearch();
                            }
                          }}
                          onChange={(e) =>
                            handleInputChange(
                              product.temp_id ?? '',
                              'total',
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-1 px-2 flex gap-1 justify-center items-center">
                      <Button
                        type="button"
                        tabIndex={-1}
                        onClick={() => handleDeleteAddedProduct(product.temp_id ?? '')}
                        variant={'ghost'}
                        className="hover:bg-destructive hover:text-destructive-foreground text-destructive w-7 h-7 p-0 rounded-md transition-colors"
                        title="Eliminar fila">
                        <Trash strokeWidth="1.5" className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        tabIndex={-1}
                        onClick={() => dispatch(duplicateProduct(product.temp_id ?? ''))}
                        variant={'ghost'}
                        className="hover:bg-accent hover:text-foreground text-muted-foreground w-7 h-7 p-0 rounded-md transition-colors"
                        title="Duplicar">
                        <Copy strokeWidth="1.5" className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Fila de productos seleccionados al final del scrollable area */}
          <div className="flex-shrink-0 mt-2">
            <span className="text-xs text-[#71717A] block font-medium">
              {selectProducts.length} de {productsSelected.length} (seleccionados).
            </span>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Totales y Botones (Fijo/Sticky 20% ancho, 100% alto) */}
      <div className="lg:col-span-1 bg-card border border-border p-3.5 sm:p-4 rounded-lg flex flex-col justify-between lg:h-full overflow-y-auto before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-sale-accent-strong before:rounded-t-md relative shadow-xs">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground border-b pb-1.5 mb-2.5">
            Resumen de Venta
          </h3>

          <div className="[&_*]:border-none [&_tr]:hover:bg-inherit [&_td]:py-1 [&_td]:px-1.5">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="text-left font-bold text-xs">Productos Totales </TableCell>
                  <TableCell className="text-right font-black text-sm">
                    {orderSummary.totalQuantity}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left text-xs">Tipo de venta </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide bg-sale-accent-soft text-sale-accent-text border border-sale-accent-border">
                      {sellType === SELL_TYPES.CREDITO
                        ? 'Crédito'
                        : sellType === SELL_TYPES.PROFORMA
                        ? 'Proforma'
                        : 'Contado'}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left text-xs">Subtotal </TableCell>
                  <TableCell className="text-right font-bold text-sm">
                    {currencyFormatter({ currency: 'NIO', value: orderSummary.total })}
                  </TableCell>
                </TableRow>
                {sellType === SELL_TYPES.CREDITO && (
                  <TableRow>
                    <TableCell className="text-left text-xs">Abono Inicial </TableCell>
                    <TableCell className="text-right">
                      <Input
                        min={0}
                        step={0.01}
                        type="number"
                        data-enter-next="#product-search"
                        className="pr-0 focus:pr-3 h-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-none w-2/3 float-right shadow-none text-right focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue font-bold text-sm bg-transparent"
                        value={orderSummary?.init_payment?.toString() ?? 0}
                        onChange={handleInitPaymentChange}
                      />
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="text-left text-xs">
                    Descuento
                    <span className="ml-1 text-[10px] text-muted-foreground block">(C$ o %)</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      min={0}
                      step={0.01}
                      type="number"
                      data-enter-next="#product-search"
                      className="pr-0 focus:pr-3 h-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-none w-2/3 float-right shadow-none text-right focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue font-bold text-sm bg-transparent"
                      value={discountInput}
                      onChange={handleDiscountChange}
                    />
                    {discountError && (
                      <p className="text-[10px] text-red-500 mt-1 block">{discountError}</p>
                    )}
                  </TableCell>
                </TableRow>

                <TableRow className="border-t-2 border-slate-200 dark:border-slate-800">
                  <TableCell className="text-left">
                    <span className="text-base font-black uppercase text-foreground">Total</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-base font-black text-theme_blue">
                      {currencyFormatter({ currency: 'NIO', value: orderSummary.grandTotal })}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Botones de acción incrustados desde children */}
        {children}
      </div>
    </div>
  );
};

export default ProductTable;
