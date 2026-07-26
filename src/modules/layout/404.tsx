import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-black text-muted-foreground">404</p>
      <h5 className="text-lg font-semibold text-foreground">Página no encontrada</h5>
      <p className="max-w-xs text-sm text-muted-foreground">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Ir al inicio
      </Link>
    </div>
  );
};

export default NotFound;
