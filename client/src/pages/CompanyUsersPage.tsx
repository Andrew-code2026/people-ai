import DashboardLayout from "@/components/DashboardLayout";
import CopyableLink from "@/components/CopyableLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { AlertCircle, ArrowLeft, Link2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getDashboardForRole, ROLE_LABELS } from "../../../server/authorization";
import type { RoleKey } from "../../../drizzle/schema";

export default function CompanyUsersPage() {
  const [, setLocation] = useLocation();
  // Una sola suscripcion a access.me: `useCompanyId` hace exactamente esta misma
  // consulta, asi que usar ambos dejaba dos vistas de la misma entrada de cache y
  // dos convenciones de carga que el lector tenia que reconciliar.
  const access = trpc.access.me.useQuery(undefined, { retry: false });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleKey | "">("");
  const [link, setLink] = useState("");

  const companyId = access.data?.companyId ?? null;
  // Roles que este usuario puede conceder. El servidor lo vuelve a verificar.
  const invitableRoles = (access.data?.invitableRoles ?? []) as RoleKey[];
  const puedeInvitar = invitableRoles.length > 0;
  // SUPER_ADMIN no tiene empresa propia: puede conceder roles, pero no hay a que
  // empresa invitar desde aqui. Antes el formulario se veia completo y el boton
  // quedaba deshabilitado sin explicar por que.
  const sinEmpresa = Boolean(access.data) && companyId === null;

  const invite = trpc.company.invite.useMutation({
    onSuccess: data => {
      setLink(`${window.location.origin}/invitacion/${data.token}`);
      setEmail("");
      toast.success("Invitacion creada. Copia el enlace y compartelo.");
    },
    onError: error => toast.error(error.message),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!role || companyId === null) return;
    invite.mutate({ companyId, email: email.trim(), role });
  };

  const aviso = (titulo: string, detalle: string, conBoton = true) => (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">{titulo}</p>
            <p className="text-sm">{detalle}</p>
          </div>
        </div>
        {conBoton && access.data && (
          <Button variant="outline" onClick={() => setLocation(getDashboardForRole(access.data!.role))}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ir a mi dashboard
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Equipo</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Usuarios de la empresa</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Invita a alguien generando un enlace y compartelo por el medio que prefieras. El enlace
            caduca a los 7 dias.
          </p>
        </div>

        {/* Mismo criterio que RoleDashboard: si el rol no corresponde, se dice y se
            ofrece salida, en vez de mostrar un formulario que no va a funcionar. */}
        {access.data && !puedeInvitar &&
          aviso("Tu rol no puede invitar usuarios", `Tu acceso actual es ${ROLE_LABELS[access.data.role]}.`)}

        {sinEmpresa &&
          puedeInvitar &&
          aviso(
            "No hay una empresa activa",
            "Tu cuenta no esta asociada a una empresa concreta, asi que no hay a cual invitar desde esta pantalla.",
            false
          )}

        {puedeInvitar && !sinEmpresa && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserPlus className="h-4 w-4 text-blue-600" />
                Invitar a alguien
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Correo</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    maxLength={320}
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="persona@empresa.com"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select value={role} onValueChange={value => setRole(value as RoleKey)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Elige un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {invitableRoles.map(item => (
                        <SelectItem key={item} value={item}>
                          {ROLE_LABELS[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  disabled={invite.isPending || !role}
                  className="w-fit bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {invite.isPending ? "Creando..." : "Crear invitacion"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {link && (
          <Card className="border-blue-200 bg-blue-50/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-4 w-4 text-blue-600" />
                Enlace de invitacion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Copialo ahora: por seguridad no se vuelve a mostrar. Si lo pierdes, invita otra vez a
                ese mismo correo y el anterior quedara anulado.
              </p>
              <CopyableLink value={link} />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
