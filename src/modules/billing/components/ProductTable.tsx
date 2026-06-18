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
import { IInvoiceProduct, SELL_TYPES } from '../types';
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
}

const ProductTable = ({ sellType, productSearchRef }: IProductTableProps) => {
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
    <>
      <div className="flex justify-between items-center">
        <div className="w-1/3">
          <CustomSearchInputSuggetions
            placeholder="Buscar productos"
            tabIndex={7}
            inputRef={productSearchRef}
            onProductAdded={setPendingFocusProductId}
          />
        </div>
        <div className="w-1/4 flex items-center justify-end">
          <Button
            type="button"
            tabIndex={-1}
            onClick={handleDeleteSelectedProducts}
            className="bg-secondary text-foreground hover:bg-primary focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue hover:text-secondary transition-colors duration-300 ease-in-out"
            variant={'ghost'}>
            Eliminar seleccionados
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-inherit">
              <TableHead className="w-[50px]">
                <Checkbox
                  className="focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
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
              <TableHead className="text-[#71717A] py-4 w-[150px]">Código de barra</TableHead>
              <TableHead className="text-[#71717A] py-4 w-[180px]">SKU</TableHead>
              <TableHead className="text-[#71717A] py-4 w-[200px]">Producto</TableHead>
              <TableHead className="w-[200px] text-[#71717A] text-center py-4">Cantidad</TableHead>
              <TableHead className="w-[150px] text-[#71717A] text-center py-4">Precio</TableHead>
              <TableHead className="w-[150px] text-[#71717A] text-center py-4">Subtotal</TableHead>
              <TableHead className="text-[#71717A] text-center py-4">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsSelected.map((product) => (
              <TableRow className="hover:bg-transparent" key={product.temp_id}>
                <TableCell className="py-1">
                  <Checkbox
                    className="focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                    checked={selectProducts.includes(product.temp_id ?? '')}
                    onCheckedChange={() => handleCheckboxChange(product.temp_id ?? '')}
                  />
                </TableCell>
                <TableCell className="py-1 text-ellipsis">{product.barcode}</TableCell>
                <TableCell className="py-1">{product.sku}</TableCell>
                <TableCell className="py-1">{product.name}</TableCell>
                <TableCell className="text-center py-1">
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
                </TableCell>
                <TableCell className="py-1">
                  <Input
                    type="text"
                    ref={(node) => {
                      priceInputRefs.current[product.temp_id ?? ''] = node;
                    }}
                    className="bg-background shadow-none text-center h-8 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                    value={product.price}
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
                </TableCell>
                <TableCell className="py-1">
                  <Input
                    type="text"
                    ref={(node) => {
                      totalInputRefs.current[product.temp_id ?? ''] = node;
                    }}
                    className="bg-background shadow-none text-center h-8  focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
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
                </TableCell>
                <TableCell className="text-center py-1">
                  <Button
                    type="button"
                    onClick={() => handleDeleteAddedProduct(product.temp_id ?? '')}
                    variant={'ghost'}
                    className="hover:bg-red-500 hover:text-white text-red-500 w-8 h-8 p-0 rounded-full">
                    <Trash strokeWidth="1.5" className="w-5 h-5" />
                  </Button>

                  {product.quantity > 1 && (
                    <Button
                      type="button"
                      onClick={() => dispatch(duplicateProduct(product.temp_id ?? ''))}
                      variant={'ghost'}
                      className="hover:bg-blue-500 hover:text-white text-bluebg-blue-500 w-8 h-8 p-0 rounded-full">
                      <Copy strokeWidth="1.5" className="w-5 h-5" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between mt-4">
        <div className="w-4/5">
          <span className="text-sm text-[#71717A] block">
            {' '}
            {selectProducts.length} de {productsSelected.length} (seleccionados).
          </span>
        </div>

        <div className="w-2/5 [&_*]:border-none [&_tr]:hover:bg-inherit">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="text-left font-bold w-1/2">Productos Totales </TableCell>
                <TableCell className="text-right font-bold">{orderSummary.totalQuantity}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left w-1/2">Tipo de venta </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide bg-sale-accent-soft text-sale-accent-text border border-sale-accent-border">
                    {sellType === 'credito' ? 'Crédito' : 'Contado'}
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left w-1/2">Subtotal </TableCell>
                <TableCell className="text-right">
                  {currencyFormatter({ currency: 'NIO', value: orderSummary.total })}
                </TableCell>
              </TableRow>
              {sellType === SELL_TYPES.CREDITO && (
                <TableRow>
                  <TableCell className="text-left w-1/2">Abono Incial </TableCell>
                  <TableCell className="text-right">
                    <Input
                      min={0}
                      step={0.01}
                      type="number"
                      data-enter-next="#product-search"
                      className="pr-0 focus:pr-3 h-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-none w-1/2 float-right shadow-none text-right focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                      value={orderSummary?.init_payment?.toString() ?? 0}
                      onChange={handleInitPaymentChange}
                    />
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="text-left w-1/2">
                  Descuento
                  <span className="ml-2 text-sm">(C$ / {discount.percentage} %)</span>
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    min={0}
                    step={0.01}
                    type="number"
                    data-enter-next="#product-search"
                    className="pr-0 focus:pr-3 h-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-none w-1/2 float-right shadow-none text-right focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                    value={discountInput}
                    onChange={handleDiscountChange}
                  />
                  {discountError && <p className="text-xs text-red-500 mt-1">{discountError}</p>}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="text-left w-1/2">
                  <span className="text-lg font-bold">Total </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-lg font-bold">
                    {currencyFormatter({ currency: 'NIO', value: orderSummary.grandTotal })}
                  </span>
                </TableCell>
              </TableRow>
              {/* <TableRow>
                <TableCell className="text-left w-1/2">
                  <span className="text-lg font-bold">Saldo pendiente </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-lg font-bold">
                    {currencyFormatter({ currency: 'NIO', value: orderSummary.grandTotal })}
                  </span>
                </TableCell>
              </TableRow> */}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default ProductTable;
