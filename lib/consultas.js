import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Supabase devuelve como máximo 1000 filas por consulta: esto pagina hasta
// traer todo. `armar` recibe el cliente y devuelve la consulta (sin range).
export async function traerTodo(armar, tamPagina = 1000) {
  const filas = [];
  for (let desde = 0; ; desde += tamPagina) {
    const { data, error } = await armar(supabaseAdmin).range(desde, desde + tamPagina - 1);
    if (error) throw new Error(error.message);
    filas.push(...data);
    if (data.length < tamPagina) return filas;
  }
}

// Trae una clase con los datos de su comisión, y verifica que el usuario
// pueda gestionarla (el director todas, el profesor solo las suyas).
export async function claseGestionable(claseId, sesion) {
  const { data: clase } = await supabaseAdmin
    .from("clases")
    .select("*")
    .eq("id", claseId)
    .maybeSingle();
  if (!clase) return { error: "No se encontró la clase", status: 404 };

  const { data: comision } = await supabaseAdmin
    .from("v_resumen_comision")
    .select("*")
    .eq("comision_id", clase.comision_id)
    .maybeSingle();

  if (sesion.rol !== "director" && comision?.profesor_id !== sesion.id) {
    return { error: "Esta clase no es de una comisión tuya", status: 403 };
  }
  return { clase, comision };
}
