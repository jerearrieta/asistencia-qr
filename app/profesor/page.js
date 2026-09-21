import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PanelProfesor from "@/components/PanelProfesor";

export const dynamic = "force-dynamic";

export default async function ProfesorPage() {
  const { data: cursos } = await supabaseAdmin
    .from("cursos")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: clases } = await supabaseAdmin
    .from("clases")
    .select("*, cursos(nombre)")
    .order("fecha", { ascending: false })
    .limit(30);

  return (
    <div>
      <h1>Panel del profesor</h1>
      <PanelProfesor cursosIniciales={cursos || []} clasesIniciales={clases || []} />
    </div>
  );
}
