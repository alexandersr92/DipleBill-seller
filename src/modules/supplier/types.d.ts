type SupplierData = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: 'active' | 'inactive';
  contact_count: number;
  created_at: string;
  updated_at: string;
};

type SupplierFullData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  contacts: ContactFullData[];
  created_at: string;
  updated_at: string;
  contact_count: number;
  notes: string;
  status: 'active' | 'inactive';
  zip: string;
};

type ContactFullData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  supplier_id: string;
  created_at: string;
  updated_at: string;
};

type Suppliers = SupplierData[];

type SupplierFormProps = {
  onSubmit: (data: SupplierForm) => void;
};

type ContactForm = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
};

type SupplierForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  notes?: string;
  contacts?: ContactForm[];
};

type SupplierUpdateForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  notes?: string;
};
