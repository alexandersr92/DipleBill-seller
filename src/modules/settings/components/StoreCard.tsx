import { ChevronRight, StoreIcon } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Icons } from '../../../components/ui/icons';
import { IStore } from '../../stores/slices/store.types';

interface IStoreCardProps {
  store: IStore;
  setStore: (store: IStore) => void;
}

export default function StoreCard({ store, setStore }: IStoreCardProps) {
  return (
    <Card
      key={store.id}
      className="min-h-40 h-48 max-w-60 min-w-40 flex flex-col justify-center items-center p-4 whitespace-nowrap">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2 gap-4">
        <StoreIcon className="h-6 w-6" />
        <CardTitle className="text-sm font-medium">{store.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground flex gap-1">
          <Icons.PinIcon />
          {store.address}
        </p>
      </CardContent>
      <CardFooter className="flex justify-center items-center">
        <Button
          variant="ghost"
          size="sm"
          className=" w-full text-sm flex justify-center items-center"
          onClick={() => setStore(store)}>
          Configuracion
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
