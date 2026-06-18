import { boolean, object, string, number } from 'yup';

export const billingSchema = object({
  client_name: string().default('EVENTUAL').nullable(),
  seller_id: string().nullable(),
  client_id: string().nullable(),
  isCredit: boolean().nullable(),
  payment_method: string().nullable(),
  payment_date: string().nullable(),
  init_payment: number().nullable(),
  invoice_date: string().nullable(),
  invoice_note: string().nullable(),
  invoice_expiration: string().nullable()
});
