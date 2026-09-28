import { useEffect, useRef, useState } from 'react';
import type { IScannerControls } from '@zxing/browser';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface CameraBarcodeScannerProps {
  onDetected: (barcode: string) => void;
}

const cameraErrorMessage = (error: unknown) => {
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Permite el acceso a la cámara en los ajustes del navegador y vuelve a intentarlo.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No se encontró una cámara disponible en este dispositivo.';
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return 'No se pudo abrir la cámara. Cierra otras aplicaciones que la estén usando e inténtalo de nuevo.';
  }
  return 'No se pudo iniciar el lector. Inténtalo de nuevo o escribe el código en el buscador.';
};

function CameraPreview({ onDetected }: CameraBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let disposed = false;
    let detected = false;
    let stream: MediaStream | undefined;
    let controls: IScannerControls | undefined;
    const stop = () => {
      controls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };

    setError(null);
    setLoading(true);

    const start = async () => {
      try {
        if (!window.isSecureContext) {
          setError('Abre DipleBill mediante HTTPS para poder usar la cámara.');
          setLoading(false);
          return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          setError(
            'Este navegador no permite usar la cámara. Abre DipleBill en Safari actualizado.'
          );
          setLoading(false);
          return;
        }

        // El decodificador se carga solo al abrir la cámara; no depende de BarcodeDetector.
        const { BrowserMultiFormatOneDReader } = await import('@zxing/browser');
        if (disposed) return;
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        if (disposed) {
          stop();
          return;
        }

        const reader = new BrowserMultiFormatOneDReader(undefined, {
          delayBetweenScanAttempts: 150,
          delayBetweenScanSuccess: 500
        });
        controls = await reader.decodeFromStream(stream, video, (result, _error, scanner) => {
          const barcode = result?.getText().trim();
          if (disposed || detected || !barcode) return;
          detected = true;
          scanner.stop();
          stop();
          onDetectedRef.current(barcode);
        });
        if (disposed || detected) {
          stop();
          return;
        }
        setLoading(false);
      } catch (cause) {
        stop();
        if (!disposed) {
          setError(cameraErrorMessage(cause));
          setLoading(false);
        }
      }
    };

    void start();
    return () => {
      disposed = true;
      stop();
    };
  }, [attempt]);

  return (
    <>
      <div className="relative overflow-hidden rounded-lg border bg-muted">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label="Vista previa de la cámara para leer códigos de barras"
          className="aspect-video max-h-[50dvh] w-full object-contain"
        />
        {!error && (
          <div className="pointer-events-none absolute inset-x-[10%] inset-y-[25%] rounded-lg border-2 border-primary" />
        )}
      </div>
      {loading && (
        <p
          role="status"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Abriendo cámara…
        </p>
      )}
      {error ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Button type="button" variant="outline" onClick={() => setAttempt((value) => value + 1)}>
            Reintentar
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Centra el código completo, con buena luz. Acerca o aleja el producto hasta que se vea
          nítido.
        </p>
      )}
    </>
  );
}

export default function CameraBarcodeScanner({ onDetected }: CameraBarcodeScannerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeWhenHidden = () => {
      if (document.hidden) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('visibilitychange', closeWhenHidden);
    window.addEventListener('pagehide', close);
    return () => {
      document.removeEventListener('visibilitychange', closeWhenHidden);
      window.removeEventListener('pagehide', close);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        className="h-11 w-11 shrink-0 text-primary"
        aria-label="Escanear código de barras con la cámara"
        title="Escanear código de barras"
        onClick={() => setOpen(true)}>
        <Camera className="h-5 w-5" />
      </Button>
      <DialogContent
        className="w-[calc(100%-2rem)] max-h-[90dvh] overflow-y-auto rounded-lg"
        onKeyDown={(event) => event.stopPropagation()}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}>
        <DialogHeader>
          <DialogTitle>Escanear código de barras</DialogTitle>
          <DialogDescription>
            Apunta la cámara trasera al código del producto. Al leerlo, verás las coincidencias en
            el buscador.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CameraPreview
            onDetected={(barcode) => {
              setOpen(false);
              onDetected(barcode);
            }}
          />
        )}
        <Button type="button" variant="outline" className="min-h-11" onClick={() => setOpen(false)}>
          Cerrar cámara
        </Button>
      </DialogContent>
    </Dialog>
  );
}
