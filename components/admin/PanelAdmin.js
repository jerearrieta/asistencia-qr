"use client";

import { useState } from "react";
import { BookOpen, ClipboardList, GraduationCap, LayoutGrid, Users } from "lucide-react";
import AdminCarreras from "./AdminCarreras";
import AdminMaterias from "./AdminMaterias";
import AdminComisiones from "./AdminComisiones";
import AdminUsuarios from "./AdminUsuarios";
import AdminPadron from "./AdminPadron";

const PESTANAS = [
  ["comisiones", "Comisiones", LayoutGrid],
  ["padron", "Padrón", ClipboardList],
  ["usuarios", "Usuarios", Users],
  ["materias", "Materias", BookOpen],
  ["carreras", "Carreras", GraduationCap],
];

export default function PanelAdmin(props) {
  const [pestana, setPestana] = useState("comisiones");

  return (
    <div>
      <div className="pestanas" role="tablist">
        {PESTANAS.map(([id, texto, Icono]) => (
          <button
            key={id}
            role="tab"
            aria-selected={pestana === id}
            className={pestana === id ? "activa" : ""}
            onClick={() => setPestana(id)}
          >
            <Icono size={15} />
            {texto}
          </button>
        ))}
      </div>
      {pestana === "carreras" && <AdminCarreras {...props} />}
      {pestana === "materias" && <AdminMaterias {...props} />}
      {pestana === "comisiones" && <AdminComisiones {...props} />}
      {pestana === "usuarios" && <AdminUsuarios {...props} />}
      {pestana === "padron" && <AdminPadron {...props} />}
    </div>
  );
}
