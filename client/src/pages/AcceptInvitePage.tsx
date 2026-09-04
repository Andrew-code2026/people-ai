import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";
import { ROLE_LABELS } from "../../../server/authorization";

const MIN_PASSWORD_LENGTH = 8;

function Aviso({
  titulo,
  detalle,
  accion,
}: {
  titulo: string;
  detalle: string;
  accion?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <ShieldCheck className="h-10 w-10 text-slate-400" />
          <div>
            <h1 className="text-xl font-semibold">{titulo}</h1>
            <p className="mt-2 text-sm text-slate-500">{detalle}</p>
          </div>
          {accion}
        </CardContent>
      </Card>
    </main>
  );
}

export default function AcceptInvitePage() {
  const [, params] = useRoute("/invitacion/:token");
  const token = params?.token || "";
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // `enabled` replica el minimo que exige zod en el servidor, para no disparar una
  // peticion que fallaria la validacion.
  const invite = trpc.auth.invitePreview.useQuery({ token }, { enabled: token.length >= 20, retry: false });

  const accept = trpc.auth.acceptInvite.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      try {
        const access = await utils.access.me.fetch();
        setLocation(access.dashboard);
      } catch {
        setLocation("/");
      }
    },
    onError: error => toast.error(error.message),
  });

  // Orden: primero cargando, luego los estados terminales. Al reves habia que
  // escribir "no cargando y sin datos" y quedaba una comprobacion inalcanzable.
  if (token.length >= 20 && invite.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <p className="text-sm text-slate-500">Cargando invitacion...</p>
      </main>
    );
  }

  // Un fallo del servidor no es lo mismo que una invitacion muerta: la consulta no
  // reintenta, asi que sin distinguirlos una caida momentanea de la base hacia que
  // un enlace perfectamente valido pareciera caducado para siempre.
  if (invite.error) {
    return (
      <Aviso
        titulo="No pudimos comprobar la invitacion"
        detalle="Hubo un problema al contactar con el servidor. El enlace puede seguir siendo valido."
        accion={
          <Button variant="outline" onClick={() => invite.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        }
      />
    );
  }

  if (!token || !invite.data) {
    return (
      <Aviso
        titulo="Esta invitacion ya no esta disponible"
        detalle="Pide a la persona que te invito que genere una nueva."
      />
    );
  }

  const { email, companyName, role, userExists } = invite.data;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    accept.mutate({ token, password, name: userExists ? undefined : name.trim() });
  };

  return (
    <AuthLayout
      title={`Unirte a ${companyName}`}
      subtitle={
        userExists
          ? `Ya tienes una cuenta con ${email}. Confirma tu contrasena para unirte como ${ROLE_LABELS[role]}.`
          : `Has sido invitado como ${ROLE_LABELS[role]}. Crea tu cuenta para ${email}.`
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Solo en cuentas nuevas: si ya existe, conserva el nombre que tuviera. */}
        {!userExists && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Tu nombre</Label>
            <Input
              id="name"
              autoComplete="name"
              required
              maxLength={160}
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Maria Gonzalez"
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{userExists ? "Tu contrasena actual" : "Crea tu contrasena"}</Label>
          <Input
            id="password"
            type="password"
            autoComplete={userExists ? "current-password" : "new-password"}
            required
            minLength={userExists ? 1 : MIN_PASSWORD_LENGTH}
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
          {!userExists && (
            <p className="text-xs text-slate-500">Minimo {MIN_PASSWORD_LENGTH} caracteres.</p>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={accept.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition-all py-6 rounded-xl"
        >
          {accept.isPending ? "Uniendote..." : "Unirme a la empresa"}
        </Button>
      </form>
    </AuthLayout>
  );
}
