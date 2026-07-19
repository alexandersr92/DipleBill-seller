import { Navigate } from 'react-router';
import LoginForm from '../components/LoginForm';
import { useValidateToken } from '../hooks/useValidateToken';
import LoginSkeleton from '../components/LoginSkeleton';
import { BrandMark, BrandLogo } from '@/components/BrandLogo';
export default function Login() {
  const isAuthenticated = useValidateToken();

  if (isAuthenticated === null) {
    return <LoginSkeleton />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <div className="md:hidden">
        <img
          src="/examples/authentication-light.png"
          width={1280}
          height={843}
          alt="Authentication"
          className="block dark:hidden"
        />
        <img
          src="/examples/authentication-dark.png"
          width={1280}
          height={843}
          alt="Authentication"
          className="hidden dark:block"
        />
      </div>
      <div className="container relative hidden min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="relative z-20 flex h-full flex-col items-center justify-center gap-4">
            <BrandMark size={120} />
            <span className="text-3xl font-bold tracking-tight">
              <span className="text-[#8FB2F9]">Diple</span>
              <span className="text-[#B39DF2]">Bill</span>
            </span>
            <p className="text-sm text-zinc-400">Punto de Venta</p>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <BrandLogo size={34} className="mx-auto mb-2 lg:hidden" />
              <h1 className="text-2xl font-semibold tracking-tight">Acceso al Sistema</h1>
              <p className="text-sm text-muted-foreground">
                Ingresa tu correo y contraseña para acceder al sistema.
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </>
  );
}
