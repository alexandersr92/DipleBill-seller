import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { verifyOwnerPassword } from '../services/authService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';

interface OwnerPasswordConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
}

export default function OwnerPasswordConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Confirmar Autorización',
  description = 'Se requiere la contraseña del propietario para realizar esta acción.'
}: OwnerPasswordConfirmDialogProps) {
  const ownerEmail = useAppSelector((state) => state.userSlice.email);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage('La contraseña es requerida');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const isValid = await verifyOwnerPassword(ownerEmail, password);
      if (isValid) {
        setPassword('');
        onOpenChange(false);
        await onConfirm();
      } else {
        setErrorMessage('Contraseña incorrecta, intente de nuevo');
      }
    } catch (error) {
      setErrorMessage('Error al verificar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setErrorMessage(null);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) handleClose();
        else onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="owner-password">Contraseña del Administrador ({ownerEmail})</Label>
            <Input
              id="owner-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive text-center font-medium bg-destructive/15 p-2 rounded border border-destructive/20">
              {errorMessage}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Anular'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
