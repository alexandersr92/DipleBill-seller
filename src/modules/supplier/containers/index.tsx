import { Columns } from '../components/columns';
import { useEffect, useState } from 'react';
import { DataTable } from '@/components/ui/data-table';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/hooks/use-toast';
import { useCallback } from 'react';
import { createSupplier, getSuppliers } from '../services/supplierThunks';
import { SupplierHeader } from '../components/supplier-header';

export default function Supplier() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { suppliers, isLoading, error, pagination } = useAppSelector(
    (state) => state.supplierSlice
  );
  const [filter, setFilter] = useState('');
  const [contacts, setContacts] = useState<ContactForm[]>([]);
  const [activeSuppliers, setActiveSupplier] = useState<SupplierData[]>([]);
  const [inactiveSupplier, setInactiveSupplier] = useState<SupplierData[]>([]);
  const [isActive, setIsActive] = useState(true);
  const store = useAppSelector((state) => state.storeSlice.store);

  useEffect(() => {
    if (!store) return;

    dispatch(
      getSuppliers({
        per_page: pagination.itemsPerPage,
        sort: 'name',
        order: 'asc',
        search: filter,
        search_by: 'name',
        page: pagination.currentPage,
        store_id: store?.id
      })
    );
  }, [filter, pagination.itemsPerPage, store?.id]);

  useEffect(() => {
    if (!suppliers) return;
    const activeSuppliers = suppliers.filter((supplier) => supplier.status === 'active');
    const inactiveSuppliers = suppliers.filter((supplier) => supplier.status === 'inactive');
    setActiveSupplier(activeSuppliers);
    setInactiveSupplier(inactiveSuppliers);
  }, [suppliers]);

  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      dispatch(
        getSuppliers({
          per_page: pageSize,
          sort: 'name',
          order: 'asc',
          search: filter,
          search_by: 'name',
          page: page,
          store_id: store?.id
        })
      );
    },
    [filter]
  );

  const handleAddContact = useCallback((contact: ContactForm) => {
    setContacts((prevContacts) => [...prevContacts, contact]);
  }, []);

  const handleSubmitSupplier = useCallback(
    async (data: SupplierForm) => {
      try {
        const formattedContacts = contacts.map((contact) => ({
          ...contact,
          notes: contact.notes || ''
        }));
        await dispatch(
          createSupplier({
            ...data,
            notes: data.notes || '',
            contacts: formattedContacts
          })
        ).unwrap();
        setContacts([]);
        toast({
          title: 'Proveedor creado exitosamente!',
          variant: 'success'
        });
      } catch (error) {
        if (import.meta.env.DEV) console.error(error);
        toast({
          title: 'UPS!, Ha ocurrido un error al agregar el proveedor!',
          variant: 'error'
        });
      }
    },
    [dispatch, contacts, toast]
  );

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <SupplierHeader
        onSubmitSupplier={handleSubmitSupplier}
        onAddContact={handleAddContact}
        contacts={contacts}
        filter={filter}
        setFilter={setFilter}
        setIsActive={() => setIsActive((prev) => !prev)}
      />

      <div>
        <DataTable
          searchBy="name"
          columns={Columns}
          data={isActive ? activeSuppliers : inactiveSupplier}
          filter={filter}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
