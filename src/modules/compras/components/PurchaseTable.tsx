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
import { useEffect, useState } from 'react';
import { Trash } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Input } from '@/components/ui/input';

import CustomInputNumber from '../../billing/components/CustomInputNumber';
import { SELL_TYPES } from '../../billing/types';
import {
  deleteSelectedProduct,
  deleteSelectedProducts,
  updateInvoice
} from '../../billing/slices/billingSlice';

interface IOrderSummary {
  totalQuantity: number;
  total: number;
  totalDiscount: number;
  init_payment?: number;
  grandTotal: number;
}

interface IProduct {
  product_id: number | null;
  sku: string | null;
  name: string | null;
  barcode: string | null;
  price: number | null;
  quantity: number | null;
  cost: number | null;
  discount?: number;
  tax?: number;
  total?: number;
  grand_total?: number;
}

interface IProductTableProps {
  sellType: string;
  validProducts: IProduct[]; // Nueva prop para los productos existentes
}

const PurchaseTable = ({ sellType }: IProductTableProps) => {
  const productsSelected = useAppSelector((state) => state.billingSlice.productsSelected);
  const dispatch = useAppDispatch();

  const [selectProducts, setSelectProducts] = useState<string[]>([]);
  // const [discount, setDiscount] = useState({
  //   percentage: 0,
  //   fixed: 0
  // });

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
        ? prevSelected.filter((id) => id !== productId)
        : [...prevSelected, productId]
    );
  };

  const handleSelectAll = () => {
    setSelectProducts(
      selectProducts.length === productsSelected.length
        ? []
        : productsSelected.map((product) => product.product_id.toString())
    );
  };

  const handleDeleteSelectedProducts = () => {
    dispatch(deleteSelectedProducts(selectProducts));
    orderSummary.totalDiscount = 0;
    // setDiscount({
    //   fixed: 0,
    //   percentage: 0
    // });
    setSelectProducts([]);
  };

  const handleDeleteAddedProduct = (id: string) => {
    dispatch(deleteSelectedProduct(id));
  };

  // const getAllProducts = async () => {
  //   try {
  //     if (storeId) {
  //       dispatch(getProductsFromBilling({ page: 1, perPage: 9999, storeId: storeId }));
  //     }
  //   } catch (error) {
  //     console.error('Error fetching products from billing module:', error);
  //   }
  // };

  useEffect(() => {
    if (!productsSelected.length) {
      return setOrderSummary({
        totalQuantity: 0,
        total: 0,
        totalDiscount: 0,
        init_payment: 0,
        grandTotal: 0
      });
    }

    // const updatedProducts = productsSelected.map((product) => ({
    //   product_id: product.product_id,
    //   sku: product.sku ?? '',
    //   name: product.name ?? '',
    //   barcode: product.barcode ?? '',
    //   price: product.price,
    //   quantity: product.quantity,
    //   cost: product.cost,
    //   discount: product.discount || 0,
    //   tax: product.tax || 0,
    //   total: product.price * product.quantity,
    //   grand_total: product.price * product.quantity - (product.discount || 0) + (product.tax || 0)
    // }));

    // dispatch(updateInvoice({ products: updatedProducts }));

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
    setOrderSummary((prevOrderSummary) => {
      return {
        ...prevOrderSummary,
        grandTotal: prevOrderSummary.total - prevOrderSummary.totalDiscount,
        init_payment: sellType === SELL_TYPES.CREDITO ? prevOrderSummary.init_payment : 0
      };
    });
  }, [sellType]);

  //   const handleInputChange = (id: string, field: keyof IInvoiceProduct, value: number) => {
  // dispatch(updateProductField({ id, field, value }));
  //   };

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

  // const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (productsSelected.length === 0) return;

  //   const value = e.target.value.trim() ? parseFloat(e.target.value.trim()) : 0;
  //   setOrderSummary((prevOrderSummary) => {
  //     const { discount, percentage, fixed } = calculateTotalDiscount(
  //       value.toString(),
  //       prevOrderSummary.total
  //     );
  //     const grandTotal = Math.max(
  //       prevOrderSummary.total - (prevOrderSummary.init_payment ?? 0) - discount,
  //       0
  //     );

  //     setDiscount({ percentage, fixed });

  //     return {
  //       ...prevOrderSummary,
  //       totalDiscount: discount,
  //       grandTotal
  //     };
  //   });
  // };

  // const handleInitPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (productsSelected.length === 0) return;

  //   const value = e.target.value.trim();

  //   setOrderSummary((prevOrderSummary) => {
  //     const initPayment = value ? parseFloat(value) : 0;
  //     const grandTotal = Math.max(prevOrderSummary.total - initPayment - discount.fixed, 0);

  //     return {
  //       ...prevOrderSummary,
  //       init_payment: initPayment,
  //       grandTotal
  //     };
  //   });
  // };

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="w-1/3">
          {/* <CustomSearchInputSuggetions
            placeholder="Buscar productos"
            tabIndex={7}
            onFocusCb={getAllProducts}
          /> */}
        </div>
        <div className="w-1/4 flex items-center justify-end">
          <Button
            type="button"
            tabIndex={-1}
            onClick={handleDeleteSelectedProducts}
            className="bg-[#f4f4f5] text-black hover:bg-primary focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue hover:text-white transition-colors duration-300 ease-in-out"
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
              <TableHead className="text-[#71717A] py-4">Código de barra</TableHead>
              <TableHead className="text-[#71717A] py-4">Producto</TableHead>
              <TableHead className="w-[200px] text-[#71717A] text-center py-4">Cantidad</TableHead>
              <TableHead className="w-[150px] text-[#71717A] text-center py-4">Precio</TableHead>
              <TableHead className="w-[150px] text-[#71717A] text-center py-4">Subtotal</TableHead>
              <TableHead className="text-[#71717A] text-center py-4">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Mostrar productos seleccionados */}
            {productsSelected.map((product) => (
              <TableRow className="hover:bg-transparent" key={product.product_id}>
                <TableCell className="py-1">
                  <Checkbox
                    className="focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                    checked={selectProducts.includes(product.product_id?.toString())}
                    onCheckedChange={() =>
                      handleCheckboxChange(product.product_id?.toString() || '')
                    }
                  />
                </TableCell>
                <TableCell className="py-1">{product.barcode}</TableCell>
                <TableCell className="py-1">{product.name}</TableCell>
                <TableCell className="text-center py-1">
                  <CustomInputNumber
                    productId={product.product_id?.toString() || ''}
                    min={1}
                    defaultValue={product.quantity || 0}
                    // onQtyChange={(newQty) =>
                    //   handleInputChange(product.product_id?.toString() || '', 'quantity', newQty)
                    // }
                  />
                </TableCell>
                <TableCell className="py-1">
                  <Input
                    type="text"
                    className="bg-gray-50 shadow-none text-center h-8 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                    value={product.price || ''}
                    // onChange={(e) =>
                    //   handleInputChange(
                    //     product.product_id?.toString() || '',
                    //     'price',
                    //     parseFloat(e.target.value) || 0
                    //   )
                    // }
                  />
                </TableCell>
                <TableCell className="py-1">
                  <Input
                    type="text"
                    className="bg-gray-50 shadow-none text-center h-8 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                    value={product.total || ''}
                    // onChange={(e) =>
                    //   handleInputChange(
                    //     product.product_id?.toString() || '',
                    //     'total',
                    //     parseFloat(e.target.value) || 0
                    //   )
                    // }
                  />
                </TableCell>
                <TableCell className="text-center py-1">
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => handleDeleteAddedProduct(product.product_id?.toString() || '')}>
                    <Trash />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default PurchaseTable;
