import { createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { cancelInvoiceById, createBillingApi, getInvoices, replaceInvoiceApi } from './billingApi';
import {
  IGetInvoiceResponse,
  IGetSingleInvoiceResponse,
  IInvoices,
  IReplaceInvoiceResponse,
  IInvoice
} from '@diplebill/core';
import { IMetaRequestParams } from '@diplebill/core';

export const createBilling = createAsyncThunk<IGetSingleInvoiceResponse, IInvoices>(
  'billing/createBilling',
  async (billing, { rejectWithValue }) => {
    try {
      if (!navigator.onLine) {
        const fakeId = uuidv4();
        
        const newInvoice = {
           ...billing,
           id: fakeId,
           invoice_number: `OFF-${fakeId.substring(0, 6).toUpperCase()}`
        };

        await db.sync_queue.add({
           id: uuidv4(),
           action: 'CREATE_INVOICE',
           payload: newInvoice,
           status: 'pending',
           created_at: Date.now()
        });

        // Reduce stock in local Dexie cache
        if (billing.products && Array.isArray(billing.products)) {
           await db.transaction('rw', db.products, async () => {
              for (const item of billing.products) {
                 const prodId = (item as any).product_id;
                 if (!prodId) continue;
                 const localProd = await db.products.get(prodId);
                 if (localProd && typeof localProd.quantity === 'number') {
                     localProd.quantity = Math.max(0, localProd.quantity - ((item as any).quantity || 1));
                     await db.products.put(localProd);
                 }
              }
           });
        }

        return {
           data: newInvoice,
           message: 'Factura guardada offline'
        } as unknown as IGetSingleInvoiceResponse;
      }

      const data = await createBillingApi(billing);
      return data;
    } catch (error) {
      console.error('Error adding invoice:', error);
      return rejectWithValue(error);
    }
  }
);

export const getAllInvoices = createAsyncThunk<IGetInvoiceResponse, IMetaRequestParams>(
  'billing/getAllInvoices',
  async (params, { rejectWithValue }) => {
    try {
      const data = await getInvoices(params);
      return data;
    } catch (error) {
      console.error('Error getting all invoices from billing module:', error);
      return rejectWithValue(error);
    }
  }
);

export const cancelInvoice = createAsyncThunk<void, string>(
  'billing/cancelInvoice',
  async (id, { rejectWithValue }) => {
    if (!id) return rejectWithValue("The id isn't provided!");

    try {
      const data = await cancelInvoiceById(id);
      return data;
    } catch (error) {
      console.error('Error deleting client:', error);
      return rejectWithValue(error);
    }
  }
);

export const replaceInvoice = createAsyncThunk<
  IReplaceInvoiceResponse,
  { id: string; billing: IInvoice }
>('billing/replaceInvoice', async ({ id, billing }, { rejectWithValue }) => {
  try {
    const data = await replaceInvoiceApi(id, billing);
    return data;
  } catch (error) {
    console.error('Error replacing invoice:', error);
    return rejectWithValue(error);
  }
});
