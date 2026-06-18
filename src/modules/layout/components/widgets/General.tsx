import { ComponentProps } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenCheck } from 'lucide-react';

type IGeneralProps = ComponentProps<'div'>;

const GeneralWidget: React.FC<IGeneralProps> = ({ className }) => {
  return (
    <Card className={className}>
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Detalle General</CardTitle>
          <div className="rounded-full bg-primary/10 p-2">
            <BookOpenCheck className="h-4 w-4 text-primary" />
          </div>
        </div>
        <CardDescription>Detalles generales</CardDescription>
      </CardHeader>
    </Card>
  );
};

export default GeneralWidget;
