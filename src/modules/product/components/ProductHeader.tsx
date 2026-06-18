import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useNavigate } from 'react-router';
// import AppSearchBar from '@/components/ui/AppSearchbar';
import { FilterIcon, SearchIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
// import { CreateProductRequest } from '../helpers/interfaces';

type ProductHeaderProps = {
  filter: string;
  setFilter: (filter: string) => void;
  onSortChange: (sort: string) => void;
};

export const ProductHeader = ({ filter, setFilter, onSortChange }: ProductHeaderProps) => {
  const navigate = useNavigate();

  const handleSortChange = (value: string) => {
    onSortChange(value);
  };

  return (
    <div className="bg-background py-[14px] flex items-center justify-between mb-4 border border-secondary rounded-md px-4">
      <div className="w-full max-w-sm relative mr-4">
        <div className="w-full relative">
          <SearchIcon className="w-5 h-5 text-gray-500 absolute left-2 top-1/2 transform -translate-y-1/2" />
          <Input
            className="pl-8"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar producto..."
          />
        </div>
      </div>

      <div className="w-full flex gap-2 items-center relative">
        <FilterIcon className="w-5 h-5 text-gray-500" />
        <span className="text-sm">Filtrar por:</span>
        <Select onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px] border border-primary">
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="price_desc">Precio Mayor</SelectItem>
              <SelectItem value="price_asc">Precio Menor</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Button className="flex items-center gap-1" onClick={() => navigate('/products/new')}>
          <Icons.plus /> Nuevo
        </Button>
      </div>
    </div>
  );
};
