import { Plus, X } from 'lucide-react';
import { Control, Controller, FieldError, FieldValues, Path } from 'react-hook-form';
import { Input } from './input';
import { cn } from '../../lib/utils';
import { Label } from './label';
import { useEffect, useState } from 'react';

interface IImageUploadProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  accept?: string;
  error?: FieldError;
  setLogoState?: (file: File | null) => void;
  image?: string | File | null;
}

const isPreviewableImageSrc = (value: string) =>
  value.startsWith('data:image/') ||
  value.startsWith('http://') ||
  value.startsWith('https://') ||
  value.startsWith('blob:');

export default function ImageUpload<T extends FieldValues>({
  name,
  control,
  label,
  accept = '.png,.jpg,.svg,.jpeg',
  error,
  setLogoState,
  image
}: IImageUploadProps<T>) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setFileName(null);
      setPreviewUrl(null);
      return;
    }
    if (Object.prototype.toString.call(image) === '[object File]') {
      const file = image as File;
      setFileName(file.name);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
    if (typeof image === 'string') {
      setFileName(image.split('/').pop() || 'imagen');
      setPreviewUrl(isPreviewableImageSrc(image) ? image : null);
    }
  }, [image]);

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={name as string} className="mb-2 block">
          {label}
        </Label>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div
            className={cn(
              'relative flex flex-col items-center justify-center border-2 border-dashed border-secondary rounded-lg p-6 text-center cursor-pointer transition-all',
              'hover:border-secondary hover:bg-secondary hover:bg-opacity-50'
            )}
          >
            <Input
              id={name as string}
              type="file"
              accept={accept}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                const files = e.target.files;
                if (files?.length) {
                  const file = files[0];
                  setFileName(file.name);
                  const url = URL.createObjectURL(file);
                  setPreviewUrl(url);
                  field.onChange(file);
                  setLogoState?.(file);
                } else {
                  setFileName(null);
                  setPreviewUrl(null);
                  field.onChange(null);
                  setLogoState?.(null);
                }
              }}
              ref={field.ref}
            />

            {previewUrl && (
              <button
                type="button"
                onClick={() => {
                  setFileName(null);
                  setPreviewUrl(null);
                  field.onChange(null);
                  setLogoState?.(null);
                }}
                className="absolute top-2 right-2 bg-secondary hover:bg-secondary/80 rounded-full p-1 z-20"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            )}

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-32 object-contain mb-2"
                onError={() => setPreviewUrl(null)}
              />
            ) : (
              <Plus className="h-8 w-8 text-gray-400 mb-2" />
            )}

            <p className="max-w-full truncate text-sm text-gray-600">
              {fileName || 'Arrastra y suelta tu archivo aquí o haz clic para seleccionar'}
            </p>
          </div>
        )}
      />

      <div className="form-error-slot">
        {error && <p className="form-error">{error.message}</p>}
      </div>
    </div>
  );
}
