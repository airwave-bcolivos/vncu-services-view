
"use client";

import { useMemo, useState } from "react";
import Header from "@/components/header/header";

type Oferta = {
    id: number;
    titulo: string;
    descripcion: string;
    presupuesto: number;
    oficio: string;
};

const categorias = [
    { nombre: "Todos", icono: "▦" },
    { nombre: "Electricidad", icono: "⚡" },
    { nombre: "Gasfitería", icono: "🔧" },
    { nombre: "Carpintería", icono: "🪚" },
    { nombre: "Pintura", icono: "🎨" },
    { nombre: "Albañilería", icono: "🧱" },
    { nombre: "Limpieza", icono: "✦" },
];

const servicios = [
    {
        id: 1,
        titulo: "Instalaciones eléctricas",
        oficio: "Electricidad",
        descripcion: "Instalación, mantenimiento y reparación de conexiones eléctricas.",
        precio: "Desde S/ 80",
        icono: "⚡",
    },
    {
        id: 2,
        titulo: "Servicios de gasfitería",
        oficio: "Gasfitería",
        descripcion: "Reparación de tuberías, grifos, fugas y sistemas de agua.",
        precio: "Desde S/ 60",
        icono: "🔧",
    },
    {
        id: 3,
        titulo: "Trabajos de carpintería",
        oficio: "Carpintería",
        descripcion: "Fabricación, instalación y reparación de muebles.",
        precio: "Desde S/ 100",
        icono: "🪚",
    },
    {
        id: 4,
        titulo: "Pintura de interiores",
        oficio: "Pintura",
        descripcion: "Renovación de paredes, techos y diferentes ambientes.",
        precio: "Desde S/ 150",
        icono: "🎨",
    },
    {
        id: 5,
        titulo: "Trabajos de albañilería",
        oficio: "Albañilería",
        descripcion: "Construcción, remodelación y reparación de estructuras.",
        precio: "Desde S/ 120",
        icono: "🧱",
    },
    {
        id: 6,
        titulo: "Servicios de limpieza",
        oficio: "Limpieza",
        descripcion: "Limpieza y mantenimiento de espacios del hogar.",
        precio: "Desde S/ 70",
        icono: "✦",
    },
];

export default function ClientDashboard() {
    const [busqueda, setBusqueda] = useState("");
    const [categoria, setCategoria] = useState("Todos");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [form, setForm] = useState({
        titulo: "",
        descripcion: "",
        presupuesto: "",
        oficio: "",
    });

    const [ofertas, setOfertas] = useState<Oferta[]>([]);

    const filtrados = useMemo(() => {
        return servicios.filter((servicio) => {
            const coincideCategoria =
                categoria === "Todos" || servicio.oficio === categoria;

            const texto = `${servicio.titulo} ${servicio.oficio} ${servicio.descripcion}`.toLowerCase();
            const coincideBusqueda = texto.includes(busqueda.toLowerCase());

            return coincideCategoria && coincideBusqueda;
        });
    }, [busqueda, categoria]);

    const publicarOferta = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (
            !form.titulo.trim() ||
            !form.descripcion.trim() ||
            !form.presupuesto ||
            !form.oficio
        ) {
            setMensaje("Completa todos los campos obligatorios.");
            return;
        }

        if (Number(form.presupuesto) <= 0) {
            setMensaje("Ingresa un presupuesto válido.");
            return;
        }

        setOfertas((actuales) => [
            {
                id: Date.now(),
                ...form,
                presupuesto: Number(form.presupuesto),
            },
            ...actuales,
        ]);

        setForm({
            titulo: "",
            descripcion: "",
            presupuesto: "",
            oficio: "",
        });

        setMensaje("");
        setMostrarFormulario(false);
    };

    const abrirFormulario = () => {
        setMostrarFormulario(true);
        setMensaje("");
        setTimeout(() => {
            document.getElementById("formulario")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }, 100);
    };

    return (
        <main className="min-h-screen bg-gray-50">
            <Header />

            {/* BIENVENIDA Y BUSCADOR */}
            <section className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-14 md:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                PANEL DEL CLIENTE
              </span>

                            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                                Soluciones para tu hogar,{" "}
                                <span className="text-blue-600">a un clic.</span>
                            </h1>

                            <p className="mt-5 text-gray-500 text-base md:text-lg leading-relaxed max-w-xl">
                                Encuentra profesionales especializados, compara opciones
                                y consigue la ayuda que necesitas de manera sencilla.
                            </p>

                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={abrirFormulario}
                                    className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md shadow-blue-100 transition"
                                >
                                    + Publicar una oferta
                                </button>

                                <button
                                    onClick={() => document.getElementById("servicios")?.scrollIntoView({ behavior: "smooth" })}
                                    className="px-7 py-3.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition"
                                >
                                    Explorar servicios
                                </button>
                            </div>
                        </div>

                        {/* BUSCADOR DESTACADO */}
                        <div className="bg-blue-600 rounded-2xl p-7 md:p-9 shadow-xl shadow-blue-100">
              <span className="text-blue-100 text-sm font-semibold">
                ENCUENTRA LO QUE NECESITAS
              </span>

                            <h2 className="text-2xl md:text-3xl font-bold text-white mt-3">
                                ¿Qué servicio estás buscando?
                            </h2>

                            <p className="text-blue-100 text-sm mt-2 mb-7">
                                Busca entre nuestras especialidades disponibles.
                            </p>

                            <div className="bg-white rounded-xl p-2 flex items-center gap-2">
                                <span className="text-gray-400 text-xl pl-2">⌕</span>
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => {
                                        setBusqueda(e.target.value);
                                        document.getElementById("servicios")?.scrollIntoView({
                                            behavior: "smooth",
                                        });
                                    }}
                                    placeholder="Ej. Electricista, gasfitero..."
                                    className="min-w-0 flex-1 py-3 text-sm text-gray-800 outline-none"
                                />
                                <button
                                    onClick={() => document.getElementById("servicios")?.scrollIntoView({ behavior: "smooth" })}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 text-sm font-semibold transition"
                                >
                                    Buscar
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-5">
                                <span className="text-blue-100 text-xs">Popular:</span>
                                {["Electricidad", "Gasfitería", "Pintura"].map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => {
                                            setCategoria(item);
                                            setBusqueda("");
                                            document.getElementById("servicios")?.scrollIntoView({ behavior: "smooth" });
                                        }}
                                        className="text-xs text-white hover:underline"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ESTADÍSTICAS */}
            <section className="max-w-7xl mx-auto w-full px-6 pt-9">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl">
                            ▤
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Mis publicaciones</p>
                            <p className="text-2xl font-bold text-gray-900">{ofertas.length}</p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl">
                            ⌕
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Servicios disponibles</p>
                            <p className="text-2xl font-bold text-gray-900">{servicios.length}</p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl">
                            ✓
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ofertas creadas</p>
                            <p className="text-2xl font-bold text-gray-900">{ofertas.length}</p>
                        </div>
                    </div>

                </div>
            </section>

            {/* CATEGORÍAS */}
            <section className="max-w-7xl mx-auto w-full px-6 pt-14">
                <div className="mb-7">
          <span className="text-blue-600 text-xs font-bold tracking-wider">
            ESPECIALIDADES
          </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                        Explora por categorías
                    </h2>
                    <p className="text-gray-500 mt-2">
                        Selecciona el oficio que necesitas para encontrar servicios.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {categorias.map((item) => (
                        <button
                            key={item.nombre}
                            onClick={() => setCategoria(item.nombre)}
                            className={`rounded-xl border p-4 flex flex-col items-center gap-3 transition ${
                                categoria === item.nombre
                                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                                    : "bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                            }`}
                        >
                            <span className="text-2xl">{item.icono}</span>
                            <span className="text-xs sm:text-sm font-semibold text-center">
                {item.nombre}
              </span>
                        </button>
                    ))}
                </div>
            </section>

            {/* SERVICIOS */}
            <section id="servicios" className="max-w-7xl mx-auto w-full px-6 pt-16 scroll-mt-24">
                <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-7">
                    <div>
            <span className="text-blue-600 text-xs font-bold tracking-wider">
              DESCUBRE
            </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                            Servicios destacados
                        </h2>
                        <p className="text-gray-500 mt-2">
                            Conoce algunas de las especialidades que puedes solicitar.
                        </p>
                    </div>

                    <span className="text-sm text-gray-500">
            {filtrados.length} resultados
          </span>
                </div>

                {filtrados.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                        <p className="text-gray-700 font-semibold">
                            No encontramos servicios.
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                            Prueba con otra búsqueda o categoría.
                        </p>
                        <button
                            onClick={() => {
                                setBusqueda("");
                                setCategoria("Todos");
                            }}
                            className="text-blue-600 font-semibold text-sm mt-4 hover:underline"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtrados.map((servicio) => (
                            <article
                                key={servicio.id}
                                className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-3xl">
                                        {servicio.icono}
                                    </div>
                                    <span className="bg-gray-50 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full">
                    {servicio.oficio}
                  </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mt-5 group-hover:text-blue-600 transition">
                                    {servicio.titulo}
                                </h3>

                                <p className="text-sm text-gray-500 mt-2 leading-relaxed min-h-[48px]">
                                    {servicio.descripcion}
                                </p>

                                <div className="border-t border-gray-100 mt-5 pt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    {servicio.precio}
                  </span>
                                    <button
                                        onClick={abrirFormulario}
                                        className="text-sm font-bold text-blue-600 hover:text-blue-700"
                                    >
                                        Solicitar →
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* FORMULARIO */}
            {mostrarFormulario && (
                <section id="formulario" className="max-w-7xl mx-auto w-full px-6 pt-16 scroll-mt-24">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-blue-600 px-6 py-7 md:px-9">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                  <span className="text-blue-100 text-xs font-bold tracking-wider">
                    NUEVA SOLICITUD
                  </span>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mt-2">
                                        Publica tu oferta de trabajo
                                    </h2>
                                    <p className="text-blue-100 text-sm mt-2">
                                        Describe lo que necesitas y encuentra al profesional indicado.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setMostrarFormulario(false)}
                                    className="text-white text-2xl hover:text-blue-200"
                                    aria-label="Cerrar formulario"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <form onSubmit={publicarOferta} className="p-6 md:p-9 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Título de la oferta *
                                </label>
                                <input
                                    type="text"
                                    maxLength={100}
                                    value={form.titulo}
                                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                                    placeholder="Ej. Necesito reparar una instalación eléctrica"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Descripción del trabajo *
                                </label>
                                <textarea
                                    rows={5}
                                    value={form.descripcion}
                                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                    placeholder="Explica los detalles del trabajo que necesitas..."
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none resize-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Presupuesto máximo (S/) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={form.presupuesto}
                                        onChange={(e) => setForm({ ...form, presupuesto: e.target.value })}
                                        placeholder="Ej. 500"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Oficio requerido *
                                    </label>
                                    <select
                                        value={form.oficio}
                                        onChange={(e) => setForm({ ...form, oficio: e.target.value })}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">Selecciona un oficio</option>
                                        {categorias.filter((c) => c.nombre !== "Todos").map((c) => (
                                            <option key={c.nombre} value={c.nombre}>
                                                {c.nombre}
                                            </option>
                                        ))}
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                            </div>

                            {mensaje && (
                                <p className="bg-red-50 border border-red-100 text-red-600 rounded-lg p-4 text-sm">
                                    {mensaje}
                                </p>
                            )}

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100 pt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForm({ titulo: "", descripcion: "", presupuesto: "", oficio: "" });
                                        setMensaje("");
                                    }}
                                    className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                                >
                                    Limpiar
                                </button>

                                <button
                                    type="submit"
                                    className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition"
                                >
                                    Publicar oferta
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            )}

            {/* MIS PUBLICACIONES */}
            <section className="max-w-7xl mx-auto w-full px-6 py-16">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
                    <div>
            <span className="text-blue-600 text-xs font-bold tracking-wider">
              TU ACTIVIDAD
            </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                            Mis publicaciones
                        </h2>
                        <p className="text-gray-500 mt-2">
                            Consulta las ofertas de trabajo que has creado.
                        </p>
                    </div>

                    <button
                        onClick={abrirFormulario}
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                    >
                        + Nueva oferta
                    </button>
                </div>

                {ofertas.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto mb-4">
                            ▤
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">
                            Aún no tienes ofertas publicadas
                        </h3>
                        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                            Cuando publiques una solicitud, podrás visualizarla y
                            administrarla desde esta sección.
                        </p>
                        <button
                            onClick={abrirFormulario}
                            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                        >
                            Crear primera oferta
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {ofertas.map((oferta) => (
                            <article
                                key={oferta.id}
                                className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
                            >
                                <div className="min-w-0">
                  <span className="text-blue-600 text-xs font-bold">
                    {oferta.oficio}
                  </span>
                                    <h3 className="text-lg font-bold text-gray-900 mt-1">
                                        {oferta.titulo}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-2">
                                        {oferta.descripcion}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                  <span className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full font-semibold">
                    Registrada localmente
                  </span>
                                    <span className="font-bold text-gray-900">
                    S/ {oferta.presupuesto.toFixed(2)}
                  </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* FOOTER */}
            <footer className="bg-white border-t border-gray-200 py-8">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-xl font-extrabold text-blue-600">
            Vincu.
          </span>
                    <p className="text-sm text-gray-500">
                        Conectamos soluciones.
                    </p>
                    <p className="text-xs text-gray-400">
                        © 2026 Vincu. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </main>
    );
}
