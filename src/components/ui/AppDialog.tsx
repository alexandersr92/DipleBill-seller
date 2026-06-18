import { AppDialogProps } from '@/modules/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './dialog';

const AppDialog = ({
  children,
  trigger,
  title,
  description = '',
  className = 'sm:max-w-[825px]',
  open,
  onOpenChange,
  ...props
}: AppDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogTrigger asChild>{trigger && trigger}</DialogTrigger>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default AppDialog;
