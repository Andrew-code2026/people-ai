import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";
import { ROLE_LABELS } from "../../../server/authorization";

const MIN_PASSWORD_LENGTH = 8;

export default function AcceptInvitePage() {
  const [, params] = useRoute("/invitacion/:token");
  const token = params?.token || "";
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
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

  // Un solo estado de error para inexistente, caducada y revocada: el servidor
  // devuelve null en los tres casos y no conviene distinguirlos.
  if (!token || invite.error || (!invite.isLoading && !invite.data)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <ShieldCheck className="mx-auto h-10 w-10 text-slate-400" />
            <h1 className="mt-4 text-xl font-semibold">Esta invitacion ya no esta disponible</h1>
            <p className="mt-2 text-sm text-slate-500">
              Pide a la persona que te invito que genere una nueva.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (invite.isLoading || !invite.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <p className="text-sm text-slate-500">Cargando invitacion...</p>
      </main>
    );
  }

  const { email, companyName, role, userExists } = invite.data;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    accept.mutate({ token, password });
  };

  return (
    <AuthLayout
      title={`Unirte a ${companyName}`}
      subtitle={
        userExists
          ? `Ya tienes una cuenta con ${email}. Confirma tu contrasena para unirte como ${ROLE_LABELS[role]}.`
          : `Has sido invitado como ${ROLE_LABELS[role]}. Crea una contrasena para ${email}.`
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
