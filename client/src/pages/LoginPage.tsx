import { useAuth } from "@/_core/hooks/useAuth";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Link, Redirect, useLocation } from "wouter";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = trpc.auth.signIn.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      // El destino lo decide el servidor (getDashboardForRole), no el cliente.
      try {
        const access = await utils.access.me.fetch();
        setLocation(access.dashboard);
      } catch {
        // Cuenta sin perfil empresarial activo: la pantalla de destino explica el motivo.
        setLocation("/");
      }
    },
    onError: error => toast.error(error.message),
  });

  if (!loading && user) return <Redirect to="/" />;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    signIn.mutate({ email: email.trim(), password });
  };

  return (
    <AuthLayout
      title="PEOPLE AI"
      subtitle="Inicia sesion para acceder al centro de gestion de Talento Humano."
      footer={
        <>
          Aun no tienes cuenta?{" "}
          <Link href="/signup" className="font-medium text-blue-600 hover:underline">
            Registra tu empresa
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo corporativo</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="nombre@empresa.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contrasena</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={signIn.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition-all py-6 rounded-xl"
        >
          {signIn.isPending ? "Iniciando sesion..." : "Iniciar sesion"}
        </Button>
      </form>
    </AuthLayout>
  );
}
