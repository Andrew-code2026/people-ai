import { Building2 } from "lucide-react";

/** Envoltura compartida por /login y /signup. Conserva el lenguaje visual de la
 *  tarjeta de acceso anterior para que el cambio de OAuth a credenciales propias
 *  no se note como un salto de estilo. */
export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4 py-10">
      <div className="flex flex-col gap-6 p-8 max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
        {footer ? <div className="text-center text-sm text-slate-500">{footer}</div> : null}
      </div>
    </div>
  );
}
