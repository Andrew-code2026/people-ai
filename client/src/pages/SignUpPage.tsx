import { useAuth } from "@/_core/hooks/useAuth";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Link, Redirect, useLocation } from "wouter";

const MIN_PASSWORD_LENGTH = 8;

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const signUp = trpc.auth.signUp.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      // El alta siempre crea un perfil COMPANY_ADMIN, asi que el destino existe.
      try {
        const access = await utils.access.me.fetch();
        setLocation(access.dashboard);
      } catch {
        setLocation("/");
      }
    },
    onError: error => toast.error(error.message),
  });

  if (!loading && user) return <Redirect to="/" />;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Las contrasenas no coinciden.");
      return;
    }
    signUp.mutate({
      name: name.trim(),
      companyName: companyName.trim(),
      email: email.trim(),
      password,
    });
  };

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Registra tu empresa y quedaras como administrador. Al resto del equipo lo invitas despues."
      footer={
        <>
          Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Inicia sesion
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Tu nombre</Label>
          <Input
            id="name"
            autoComplete="name"
            required
            maxLength={160}
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Alexa Torres"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="companyName">Nombre de la empresa</Label>
          <Input
            id="companyName"
            autoComplete="organization"
            required
            maxLength={160}
            value={companyName}
            onChange={event => setCompanyName(event.target.value)}
            placeholder="Empresa SAS"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo corporativo</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
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
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
          <p className="text-xs text-slate-500">Minimo {MIN_PASSWORD_LENGTH} caracteres.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Repite la contrasena</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={signUp.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition-all py-6 rounded-xl"
        >
          {signUp.isPending ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>
    </AuthLayout>
  );
}
