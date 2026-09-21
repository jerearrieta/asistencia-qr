import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ClaseEnVivo from "@/components/ClaseEnVivo";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClasePage({ params }) {
  const { data: clase, error } = await supabaseAdmin
    .from("clases")
    .select("*, cursos(nombre)")
    .eq("id", params.id)
    .single();

  if (error || !clase) {
    return (
      <div>
        <p className="mensaje-error">No se encontró la clase.</p>
        <Link href="/profesor">Volver</Link>
      </div>
    );
  }

  return (
    <div>
      <p>
        <Link href="/profesor">&larr; Volver al panel</Link>
      </p>
      <h1>{clase.cursos?.nombre}</h1>
      <p>Mostrale esta pantalla o tu celular a los alumnos.</p>
      <ClaseEnVivo clase={clase} />
    </div>
  );
}
