export function claseEstaAbierta(clase) {
  return (
    clase?.estado === "abierta" &&
    new Date(clase.token_expira_en).getTime() > Date.now()
  );
}