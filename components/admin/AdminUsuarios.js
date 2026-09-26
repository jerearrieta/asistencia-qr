"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { llamarApi } from "./api";
import { ROLES, capitalizar } from "@/lib/constantes";

const VACIO = { id: null, dni: "", nombre: "", rol: "profesor", carreraId: "" };

export default function AdminUsuarios({ carreras }) {
  const router = useRouter();
  const [rol, setRol] = useState("profesor");
  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState(VACIO);
  const [mensaje, setMensaje] = useState(null);

  const cargar = useCallback(async () => {
    const params = new URLSearchParams({ rol, q: busqueda });
    const { ok, data } = await llamarApi(`/api/admin/usuarios?${params}`);
    if (ok) {
      setUsuarios(data.usuarios);
      setTotal(data.total);
    }
  }, [rol, busqueda]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  async function guardar(e) {
    e.preventDefault();
    setMensaje(null);
    const { ok, data } = form.id
      ? await llamarApi(`/api/admin/usuarios/${form.id}`, "PATCH", form)
      : await llamarApi("/api/admin/usuarios", "POST", form);
    if (!ok) {
      setMensaje({ ok: false, texto: data.error || "Ocurrió un error" });
      return;
    }
    setMensaje({
      ok: true,
      texto: form.id
        ? "Usuario actualizado"
        : `Usuario creado. Entra con DNI ${form.dni} y contraseña ${form.dni}.`,
    });
    setForm({ ...VACIO, rol: form.rol });
    cargar();
    router.refresh(); // actualiza la lista de profesores en Comisiones
  }

  async function restablecer(u) {
    if (!window.confirm(`¿Restablecer la contraseña de ${u.nombre}? Pasará a ser su DNI.`)) return;
    const { ok, data } = await llamarApi(`/api/admin/usuarios/${u.id}`, "PATCH", {
      restablecerPassword: true,
    });
    setMensaje(
      ok
        ? { ok: true, texto: `La contraseña de ${u.nombre} ahora es ${u.dni}` }
        : { ok: false, texto: data.error }
    );
  }

  async function eliminar(u) {
    if (!window.confirm(`¿Eliminar a ${u.nombre} (${u.dni})?`)) return;
    const { ok, data } = await llamarApi(`/api/admin/usuarios/${u.id}`, "DELETE");
    if (!ok) setMensaje({ ok: false, texto: data.error });
    cargar();
    router.refresh();
  }

  return (
    <div>
      <div className="card">
        <h3>{form.id ? "Editar usuario" : "Nuevo usuario"}</h3>
        <form onSubmit={guardar}>
          <div className="grilla-form">
            <label>
              DNI
              <input
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                inputMode="numeric"
                disabled={!!form.id}
                required
              />
            </label>
            <label>
              Nombre y apellido
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </label>
            <label>
              Rol
              <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {capitalizar(r)}
                  </option>
                ))}
              </select>
            </label>
            {form.rol === "alumno" && (
              <label>
                Carrera
                <select
                  value={form.carreraId || ""}
                  onChange={(e) => setForm({ ...form, carreraId: e.target.value })}
                >
                  <option value="">Sin carrera</option>
                  {carreras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {!form.id && (
            <p className="texto-suave">La contraseña inicial es el DNI.</p>
          )}
          <div className="acciones">
            <button className="btn">{form.id ? "Guardar cambios" : "Crear usuario"}</button>
            {form.id && (
              <button type="button" className="btn secondary" onClick={() => setForm(VACIO)}>
                Cancelar
              </button>
            )}
          </div>
          {mensaje && (
            <p className={mensaje.ok ? "mensaje-ok" : "mensaje-error"}>{mensaje.texto}</p>
          )}
        </form>
      </div>

      <div className="card">
        <div className="acciones" style={{ marginBottom: 8 }}>
          <select style={{ width: "auto", margin: 0 }} value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="">Todos los roles</option>
            <option value="director">Directores</option>
            <option value="profesor">Profesores</option>
            <option value="alumno">Alumnos</option>
          </select>
          <input
            style={{ flex: 1, margin: 0, minWidth: 180 }}
            placeholder="Buscar por DNI o nombre"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <p className="texto-suave">
          {total > usuarios.length
            ? `Mostrando ${usuarios.length} de ${total}. Usá el buscador para encontrar a alguien.`
            : `${total} usuarios`}
        </p>
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Carrera</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.dni}</td>
                  <td>{u.nombre}</td>
                  <td>{capitalizar(u.rol)}</td>
                  <td>{u.carreras?.nombre || "-"}</td>
                  <td>
                    <div className="acciones" style={{ flexWrap: "nowrap" }}>
                      <button
                        className="btn secondary chico"
                        onClick={() => {
                          setMensaje(null);
                          setForm({
                            id: u.id,
                            dni: u.dni,
                            nombre: u.nombre,
                            rol: u.rol,
                            carreraId: u.carrera_id || "",
                          });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Editar
                      </button>
                      <button className="btn secondary chico" onClick={() => restablecer(u)}>
                        Restablecer clave
                      </button>
                      <button className="btn danger chico" onClick={() => eliminar(u)}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
