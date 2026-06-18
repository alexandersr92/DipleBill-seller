import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Icons } from '@/components/ui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VisuallyHidden from '@/components/ui/visually-hidden';
import { SupplierForm } from '../forms/supplier';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ContactForm } from '../forms/contact';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/hooks/use-toast';
import { getSupplier, getSuppliers, updateSupplier } from '../../services/supplierThunks';
import { createContact, deleteContact, updateContact } from '../../services/contactThunks';
import { SupplierByIdResponse } from '../../helpers/interfaces';

type EditDialogProps = {
  supplier: SupplierData;
};

export const EditDialog = ({ supplier }: EditDialogProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [fullSupplierData, setFullSupplierData] = useState<SupplierByIdResponse | null>(null);
  const [contacts, setContacts] = useState<ContactForm[]>([]);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const { pagination } = useAppSelector((state) => state.supplierSlice);

  console.log(contacts);

  useEffect(() => {
    fetchSupplierData();
  }, [supplier]);

  useEffect(() => {
    refreshSuppliersList();
  }, []);

  const handleAddContact = async (contact: ContactForm) => {
    try {
      const newContact = await dispatch(
        createContact({ supplierId: supplier.id, contact })
      ).unwrap();
      setContacts((prevContacts) => [
        ...prevContacts,
        {
          ...newContact,
          notes: newContact.notes || ''
        }
      ]);
      setFullSupplierData((prevData) => {
        if (prevData) {
          return {
            ...prevData,
            contacts: [
              ...prevData.contacts,
              {
                ...newContact,
                notes: newContact.notes || ''
              }
            ],
            contact_count: prevData.contacts.length + 1
          };
        }
        return prevData;
      });
      toast({
        title: 'Contacto agregado exitosamente!',
        variant: 'success'
      });
    } catch (error) {
      console.log(error);

      toast({
        title: 'UPS!, Ha ocurrido un error al agregar el contacto!',
        variant: 'error'
      });
    }
  };

  const handleUpdatSupplier = useCallback(
    async (data: SupplierForm) => {
      const supplierData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        notes: data.notes
      };
      try {
        await dispatch(updateSupplier({ id: supplier.id, data: supplierData })).unwrap();

        toast({
          title: 'Proveedor actualizado exitosamente!',
          variant: 'success'
        });
      } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

        toast({
          title: 'UPS!, Ha ocurrido un error al actualizar el proveedor!',
          description: errorMessage,
          variant: 'error'
        });
      }
    },
    [dispatch, toast, supplier.id]
  );

  const fetchSupplierData = async () => {
    try {
      if (!supplier.id) return;
      const data = await dispatch(getSupplier(supplier.id)).unwrap();
      setFullSupplierData(data);
      setContacts(data.contacts || []);
    } catch (error) {
      console.log(error);

      toast({
        title: 'UPS!, Ha ocurrido un error al obtener los datos del proveedor!',
        variant: 'error'
      });
    }
  };

  const refreshSuppliersList = () => {
    dispatch(
      getSuppliers({
        per_page: pagination.itemsPerPage,
        sort: 'name',
        order: 'asc',
        search: '',
        search_by: 'name',
        page: pagination.currentPage
      })
    );
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await dispatch(deleteContact({ contactId: id, supplierId: supplier.id })).unwrap();
      setContacts((prevContacts) => prevContacts.filter((contact) => contact.id !== id));
      setFullSupplierData((prevData) => {
        if (prevData) {
          return {
            ...prevData,
            contacts: prevData.contacts.filter((contact) => contact.id !== id),
            contact_count: prevData.contacts.length - 1
          };
        }
        return prevData;
      });

      toast({
        title: 'Contacto eliminado exitosamente!',
        variant: 'success'
      });
    } catch (error) {
      console.log(error);

      toast({
        title: 'UPS!, Ha ocurrido un error al eliminar el contacto!',
        variant: 'error'
      });
    }
  };

  const handleEditContact = (contactId: string) => {
    const contactToEdit = fullSupplierData?.contacts.find((contact) => contact.id === contactId);
    if (contactToEdit) {
      setEditingContactId(contactId);
    }
  };

  const handleUpdateContact = async (contact: ContactForm) => {
    try {
      const updatedContact = await dispatch(
        updateContact({ supplierId: supplier.id, contact })
      ).unwrap();

      setContacts((prevContacts) =>
        prevContacts.map((c) => (c.id === updatedContact.id ? updatedContact : c))
      );
      setFullSupplierData((prevData) => {
        if (prevData) {
          return {
            ...prevData,
            contacts: prevData.contacts.map((c) =>
              c.id === updatedContact.id ? updatedContact : c
            )
          };
        }
        return prevData;
      });

      setEditingContactId(null);
      toast({
        title: '¡Contacto actualizado exitosamente!',
        variant: 'success'
      });
    } catch (error) {
      console.log(error);
      toast({
        title: '¡UPS! Ha ocurrido un error al actualizar el contacto',
        variant: 'error'
      });
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <VisuallyHidden>
        <DialogHeader>
          <DialogTitle>Actualizar proveedor</DialogTitle>
        </DialogHeader>
      </VisuallyHidden>

      <Tabs defaultValue="supplier" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="supplier">Proveedor</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
        </TabsList>
        <TabsContent value="supplier">
          <Card>
            <CardHeader>
              <CardTitle>Proveedores</CardTitle>
              <CardDescription>Actualiza los datos del proveedor</CardDescription>
            </CardHeader>
            <CardContent>
              <SupplierForm
                onSubmit={handleUpdatSupplier}
                isEdit={true}
                initialValues={fullSupplierData as SupplierFullData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader className="py-3 2xl:py-6">
              <CardTitle>Contactos</CardTitle>
              <CardDescription>
                {editingContactId
                  ? 'Edita el contacto seleccionado'
                  : 'Agrega nuevos contactos ligados al proveedor'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 2xl:gap-4">
              <ContactForm
                onAddContact={handleAddContact}
                onUpdateContact={handleUpdateContact}
                isEdit={!!editingContactId}
                initialValues={
                  fullSupplierData?.contacts.find((c) => c.id === editingContactId) || undefined
                }
              />

              <div className="flex flex-col">
                <Table>
                  <TableHeader className="bg-[#f9fafb]">
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
                <div className="max-h-[100px] 2xl:max-h-[200px] overflow-y-auto">
                  <Table>
                    <TableBody>
                      {[...(fullSupplierData?.contacts || [])].map((contact, index) => (
                        <TableRow key={index}>
                          <TableCell>{contact.name}</TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>{contact.phone}</TableCell>
                          <TableCell>
                            <Button variant="ghost" onClick={() => handleEditContact(contact.id)}>
                              <Icons.pencil stroke="blue" />
                            </Button>
                            <Button variant="ghost" onClick={() => handleDeleteContact(contact.id)}>
                              <Icons.trash />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
