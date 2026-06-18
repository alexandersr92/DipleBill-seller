import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ContactForm } from '../../forms/contact';
import { AddContactDynamicTable } from '../../dynamic-table/add-contact';

type AddContactTabProps = {
  onAddContact: (contact: ContactForm) => void;
  contacts: ContactForm[];
};

export const AddContactTab = ({ onAddContact, contacts }: AddContactTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contactos</CardTitle>
        <CardDescription>Agrega nuevos contactos ligados al proveedor</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ContactForm onAddContact={onAddContact} isEdit={false} />

        <AddContactDynamicTable contacts={contacts} />
      </CardContent>
    </Card>
  );
};
