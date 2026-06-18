import { Navigate } from 'react-router';
import { useAppSelector } from '../../../store/hooks';
import OrgForm from '../components/OrgForm';

export default function Organization() {
  const orgId = useAppSelector((state) => state.userSlice.orgId);

  if (orgId) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <div className="md:hidden">
        <div className="h-screen w-full bg-red-400 "></div>
      </div>
      <div className="container relative hidden min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background">
        <div className="relative hidden h-full flex-col bg-secondary p-10 dark:border-r lg:flex">
          <div className="absolute inset-0" />
          <div className="relative z-20 mt-auto"></div>
        </div>
        <div className="lg:p-8 ">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] ">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Registra tu Empresa</h1>
              <p className="text-sm text-muted-foreground">
                Ingesa los datos necesario para registrar tu empresa
              </p>
            </div>
            <OrgForm />
          </div>
        </div>
      </div>
    </>
  );
}
