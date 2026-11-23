import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, AlertCircle, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getReleases } from '../services/releaseService';
import { IProductRelease } from '../types/release.types';

export default function ReleasesPage() {
  const navigate = useNavigate();
  const [releases, setReleases] = useState<IProductRelease[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadReleases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getReleases(1, 20);
      setReleases(response.data || []);
    } catch {
      setError('No se pudieron cargar las novedades en este momento. Por favor, comprueba tu conexión.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReleases();
  }, [loadReleases]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const parseChanges = (body: string) => {
    return body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return line.slice(2).trim();
        }
        return line;
      });
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 space-y-6">
      {/* Botón Volver y Encabezado */}
      <div className="flex flex-col gap-3">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/venta')}
            className="gap-2 text-muted-foreground hover:text-foreground -ml-2 mb-1">
            <ArrowLeft className="h-4 w-4" />
            Volver al punto de venta
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Novedades del Sistema</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Conoce las últimas actualizaciones, mejoras y nuevas herramientas disponibles en DipleBill.
            </p>
          </div>
        </div>
      </div>

      {/* Estado de Carga */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-3 animate-pulse shadow-sm">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-6 w-2/3" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado de Error */}
      {!isLoading && error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground max-w-md">{error}</p>
          <Button variant="outline" size="sm" onClick={loadReleases} className="gap-2 mt-1">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Estado Vacío */}
      {!isLoading && !error && releases.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 flex flex-col items-center justify-center text-center gap-2">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
          <p className="text-base font-semibold">Todavía no hay novedades publicadas</p>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
            Las nuevas versiones y mejoras del sistema aparecerán aquí cuando estén disponibles.
          </p>
        </div>
      )}

      {/* Listado de Novedades */}
      {!isLoading && !error && releases.length > 0 && (
        <div className="space-y-5">
          {releases.map((release) => {
            const changes = parseChanges(release.body);
            return (
              <div
                key={release.id}
                className="rounded-xl border bg-card text-card-foreground p-5 sm:p-6 shadow-sm transition-shadow hover:shadow-md space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    v{release.version}
                  </span>
                  <span className="text-xs text-muted-foreground select-none">·</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(release.published_at || release.created_at)}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  {release.title}
                </h2>

                <ul className="space-y-2 pt-1 text-sm">
                  {changes.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="leading-relaxed text-foreground text-xs sm:text-sm">
                        {change}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
