import { unstable_noStore as noStore } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ClaseEnVivo from "@/components/ClaseEnVivo";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function ClasePage({ params }) {
  noStore();

  const { data: clase, error } = await supabaseAdmin
    .from("clases")
    .select("*, cursos(nombre)")
    .eq("id", params.id)
    .single();

  if (error || !clase) {
    return (
      <div>
        <p className="mensaje-error">No se encontró la clase.</p>
        <a href="/profesor">Volver</a>
      </div>
    );
  }

  return (
    <div>
      <p>
        <a href="/profesor">&larr; Volver al panel</a>
      </p>
      <h1>{clase.cursos?.nombre}</h1>
      <p>Mostrale esta pantalla o tu celular a los alumnos.</p>
      <ClaseEnVivo clase={clase} />
    </div>
  );
}