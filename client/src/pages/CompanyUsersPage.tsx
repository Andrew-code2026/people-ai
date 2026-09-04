import DashboardLayout from "@/components/DashboardLayout";
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
import { useCompanyId } from "@/hooks/useCompanyId";
import { trpc } from "@/lib/trpc";
import { Copy, Link2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ROLE_LABELS } from "../../../server/authorization";
import type { RoleKey } from "../../../drizzle/schema";

export default function CompanyUsersPage() {
  const { companyId, ready } = useCompanyId();
  const access = trpc.access.me.useQuery(undefined, { retry: false });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleKey | "">("");
  const [link, setLink] = useState("");

  // Roles que este usuario puede conceder. El servidor lo vuelve a verificar.
  const invitableRoles = (access.data?.invitableRoles ?? []) as RoleKey[];

  const invite = trpc.company.invite.useMutation({
    onSuccess: data => {
      setLink(`${window.location.origin}/invitacion/${data.token}`);
      setEmail("");
      toast.success("Invitacion creada. Copia el enlace y compartelo.");
    },
    onError: error => toast.error(error.message),
  });

  const copiar = () => {
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success("Enlace copiado"))
      // El portapapeles falla en origenes inseguros o si el permiso esta denegado;
      // sin este catch quedaria como promesa rechazada sin gestionar.
      .catch(() => toast.error("No se pudo copiar. Selecciona el texto y copialo a mano."));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!role) {
      toast.error("Elige un rol para la invitacion.");
      return;
    }
    invite.mutate({ companyId, email: email.trim(), role });
  };

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
                {access.data && invitableRoles.length === 0 && (
                  <p className="text-xs text-amber-700">
                    Tu rol actual no puede invitar a nadie.
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={!ready || invite.isPending || invitableRoles.length === 0}
                className="w-fit bg-blue-600 hover:bg-blue-700 text-white"
              >
                {invite.isPending ? "Creando..." : "Crear invitacion"}
              </Button>
            </form>
          </CardContent>
        </Card>

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
              <div className="flex gap-2">
                <input
                  readOnly
                  value={link}
                  onFocus={event => event.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-xs"
                />
                <Button size="icon" variant="outline" onClick={copiar} aria-label="Copiar enlace">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
