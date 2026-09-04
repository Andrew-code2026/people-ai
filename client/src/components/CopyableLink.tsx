import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

/** Campo de solo lectura con boton de copiar.
 *
 *  Extraido porque el mismo widget existia ya en el detalle de contratacion, donde
 *  el copiado no tenia `.catch()`: `navigator.clipboard` rechaza en origenes
 *  inseguros o si el permiso esta denegado, y sin manejarlo quedaba como promesa
 *  rechazada sin gestionar. Al compartirlo, ese arreglo llega a todos los usos en
 *  vez de quedarse en una copia. */
export default function CopyableLink({
  value,
  label = "Enlace copiado",
}: {
  value: string;
  label?: string;
}) {
  const copiar = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(label))
      .catch(() => toast.error("No se pudo copiar. Selecciona el texto y copialo a mano."));
  };

  return (
    <div className="flex gap-2">
      <input
        readOnly
        value={value}
        onFocus={event => event.currentTarget.select()}
        className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-xs"
      />
      <Button size="icon" variant="outline" onClick={copiar} aria-label="Copiar enlace">
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
