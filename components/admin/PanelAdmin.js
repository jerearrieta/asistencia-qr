"use client";

import { useState } from "react";
import AdminCarreras from "./AdminCarreras";
import AdminMaterias from "./AdminMaterias";
import AdminComisiones from "./AdminComisiones";
import AdminUsuarios from "./AdminUsuarios";
import AdminPadron from "./AdminPadron";

const PESTANAS = [
  ["comisiones", "Comisiones"],
  ["padron", "Padrón"],
  ["usuarios", "Usuarios"],
  ["materias", "Materias"],
  ["carreras", "Carreras"],
];

export default function PanelAdmin(props) {
  const [pestana, setPestana] = useState("comisiones");

  return (
    <div>
      <div className="pestanas">
        {PESTANAS.map(([id, texto]) => (
          <button
            key={id}
            className={pestana === id ? "activa" : ""}
            onClick={() => setPestana(id)}
          >
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
