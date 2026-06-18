import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Icons } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';

import { SupplierDialogContent } from '../supplier-dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../../components/ui/select';

type SupplierHeaderProps = {
  onSubmitSupplier: (data: SupplierForm) => Promise<void>;
  onAddContact: (contact: ContactForm) => void;
  contacts: ContactForm[];
  filter: string;
  setFilter: (filter: string) => void;
  setIsActive: () => void;
};

export const SupplierHeader = ({
  onSubmitSupplier,
  onAddContact,
  contacts,
  filter,
  setFilter,
  setIsActive
}: SupplierHeaderProps) => {
  return (
    <div className="bg-transparent px-[18px] py-[14px] border border-secondary rounded-md flex items-center justify-between">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-1">
            <Icons.plus /> Nuevo
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] !p-9">
          <SupplierDialogContent
            onSubmitSupplier={onSubmitSupplier}
            onAddContact={onAddContact}
            contacts={contacts}
          />
        </DialogContent>
      </Dialog>

      <Input
        placeholder="Filtrar por nombre..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="ml-4 max-w-sm"
      />

      <Select onValueChange={() => setIsActive()}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Proveedores Activos" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="active">Proveedores Activos</SelectItem>
            <SelectItem value="cancelled">Proveedores Inactivos</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
