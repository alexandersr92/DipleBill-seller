import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import VisuallyHidden from '@/components/ui/visually-hidden';
import { DialogTitle } from '@radix-ui/react-dialog';

import { DialogHeader } from '@/components/ui/dialog';
import { AddSupplierTab } from '../tabs/add-supplier/inedx';
import { AddContactTab } from '../tabs/add-contact';

type SupplierDialogContentProps = {
  onSubmitSupplier: (data: SupplierForm) => Promise<void>;
  onAddContact: (contact: ContactForm) => void;
  contacts: ContactForm[];
};

export const SupplierDialogContent = ({
  onSubmitSupplier,
  onAddContact,
  contacts
}: SupplierDialogContentProps) => {
  return (
    <>
      <VisuallyHidden>
        <DialogHeader>
          <DialogTitle>Nuevo proveedor</DialogTitle>
        </DialogHeader>
      </VisuallyHidden>

      <Tabs defaultValue="supplier" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="supplier">Proveedor</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
        </TabsList>
        <TabsContent value="supplier">
          <AddSupplierTab onSubmitSupplier={onSubmitSupplier} />
        </TabsContent>

        <TabsContent value="contacts">
          <AddContactTab onAddContact={onAddContact} contacts={contacts} />
        </TabsContent>
      </Tabs>
    </>
  );
};
