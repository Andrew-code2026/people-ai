import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

/** Puerta de acceso explicita, declarada en App.tsx.
 *
 *  La proteccion vivia implicita dentro de DashboardLayout, asi que App.tsx no
 *  dejaba ver que rutas eran publicas. Con esto la respuesta esta en el propio
 *  arbol de rutas. La comprobacion que conserva DashboardLayout no es un duplicado:
 *  ese componente lee `user` para pintar el avatar y necesita garantizar su propia
 *  precondicion. */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <Redirect to="/login" />;

  return <>{children}</>;
}
