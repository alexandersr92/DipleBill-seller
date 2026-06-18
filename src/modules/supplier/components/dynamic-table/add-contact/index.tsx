import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

type AddContactDynamicTableProps = {
  contacts: ContactForm[];
};

export const AddContactDynamicTable = ({ contacts }: AddContactDynamicTableProps) => {
  return (
    <Table>
      <TableHeader className="bg-[#f9fafb]">
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Teléfono</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact, index) => (
          <TableRow key={index}>
            <TableCell>{contact.name}</TableCell>
            <TableCell>{contact.email}</TableCell>
            <TableCell>{contact.phone}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
