
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header/header";
import { ubigeoService, DistritoDto } from "../../../services/ubigeo.service";
import { jobService, JobPayload, JobFilters, JobDetail } from "../../../services/job.service";

export interface Oferta extends JobPayload {
    id: string;
    fechaCreacion: string;
    estado: string;
    propuestasCount: number;
    nombreDistrito?: string;
}

const OFICIOS_DISPONIBLES = [
    { id: "Electricidad", label: "Electricidad", value: "ELECTRICISTA", icon: "⚡" },
    { id: "Gasfitería", label: "Gasfitería", value: "GASFITERO", icon: "🚰" },
    { id: "Pintura", label: "Pintura", value: "PINTURA", icon: "🎨" },
    { id: "Albañilería", label: "Albañilería", value: "MAESTRO_DE_OBRAS", icon: "🧱" },
    { id: "Limpieza", label: "Limpieza", value: "LIMPIEZA", icon: "🧹" },
    { id: "Electrodomésticos", label: "Rep. Electrodomésticos", value: "TECNICO_ELECTRODOMESTICOS", icon: "🔧" },
];

const FILTROS_INICIALES = {
    createdFrom: "", createdTo: "", specialty: "",
    status: "", sortBy: "createdAt", sortDirection: "DESC" as "ASC" | "DESC", size: "10",
};

const inputClass = "w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:bg-gray-800";
const filterInputClass = "block w-full rounded-xl border border-gray-200 bg-white p-2 text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

export default function ClientDashboardPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [eliminandoId, setEliminandoId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [distritos, setDistritos] = useState<DistritoDto[]>([]);

    const MAX_TITULO_LENGTH = 150;
    const MAX_DESCRIPCION_LENGTH = 500;

    const [filtros, setFiltros] = useState(FILTROS_INICIALES);
    const [clientId, setClientId] = useState("");
    const [consulta, setConsulta] = useState<JobFilters>({ clientId: "", sortBy: "createdAt", sortDirection: "DESC", page: 0, size: 10 });
    const [recarga, setRecarga] = useState(0);
    const [cargandoLista, setCargandoLista] = useState(true);
    const [errorLista, setErrorLista] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [ofertas, setOfertas] = useState<Oferta[]>([]);

    const [form, setForm] = useState({
        titulo: "",
        descripcion: "",
        direccion: "",
        ubigeoDistrictId: "",
        oficio: "ELECTRICISTA",
    });

    const [ofertaSeleccionada, setOfertaSeleccionada] = useState<Oferta | null>(null);
    const [detalle, setDetalle] = useState<JobDetail | null>(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [errorDetalle, setErrorDetalle] = useState<string | null>(null);
    const [recargaDetalle, setRecargaDetalle] = useState(0);
    const [modoEdicion, setModoEdicion] = useState(false);

    useEffect(() => {
        try {
            const storedClientId = localStorage.getItem("vncu_user_id")?.trim();
            if (!storedClientId) {
                setErrorLista("No se encontró el cliente de la sesión. Inicia sesión nuevamente.");
                setCargandoLista(false);
                return;
            }
            setClientId(storedClientId);
            setConsulta((prev) => ({ ...prev, clientId: storedClientId }));
        } catch {
            setErrorLista("No se pudo acceder a los datos de la sesión. Inicia sesión nuevamente.");
            setCargandoLista(false);
        }
    }, []);

    useEffect(() => {
        const cargarDistritos = async () => {
            try {
                const data = await ubigeoService.getDistricts();
                setDistritos(data);
                if (data.length > 0) {
                    setForm((prev) => ({ ...prev, ubigeoDistrictId: data[0].id }));
                }
            } catch (error) {
                console.error("Error al cargar los distritos:", error);
                setErrorMessage("No se pudieron cargar los distritos del sistema.");
            }
        };
        cargarDistritos();
    }, []);

    useEffect(() => {
        if (!consulta.clientId) return;
        const controller = new AbortController();

        const cargarSolicitudes = async () => {
            setCargandoLista(true);
            setErrorLista(null);
            try {
                const data = await jobService.getJobs(consulta, controller.signal);
                if (controller.signal.aborted) return;
                setOfertas(data.content.map((job) => ({
                    ...job,
                    clientId: consulta.clientId,
                    description: job.description ?? "",
                    specificAddress: job.specificAddress ?? "",
                    latitude: null,
                    longitude: null,
                    nombreDistrito: job.ubigeoDistrictName,
                    fechaCreacion: new Date(job.createdAt).toLocaleDateString("es-PE"),
                    estado: job.status === "OPEN" ? "ACTIVA" : job.status,
                    propuestasCount: job.propuestasCount ?? 0,
                })));
                setTotal(data.totalElements);
                setTotalPaginas(data.totalPages);
            } catch {
                if (!controller.signal.aborted) setErrorLista("No se pudieron cargar las solicitudes. Intenta nuevamente.");
            } finally {
                if (!controller.signal.aborted) setCargandoLista(false);
            }
        };

        void cargarSolicitudes();
        return () => controller.abort();
    }, [consulta, recarga]);

    const detalleId = ofertaSeleccionada?.id;

    useEffect(() => {
        if (!detalleId || !clientId) return;
        const controller = new AbortController();

        const cargarDetalle = async () => {
            setCargandoDetalle(true);
            setErrorDetalle(null);
            setDetalle(null);
            try {
                const data = await jobService.getJobDetail(detalleId, clientId, controller.signal);
                if (!controller.signal.aborted) setDetalle(data);
            } catch {
                if (!controller.signal.aborted) setErrorDetalle("No se pudo cargar el detalle del requerimiento.");
            } finally {
                if (!controller.signal.aborted) setCargandoDetalle(false);
            }
        };

        void cargarDetalle();
        return () => controller.abort();
    }, [detalleId, clientId, recargaDetalle]);

    const aplicarFiltros = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setConsulta({
            clientId,
            createdFrom: filtros.createdFrom || undefined,
            createdTo: filtros.createdTo || undefined,
            specialty: filtros.specialty || undefined,
            status: filtros.status || undefined,
            sortBy: filtros.sortBy,
            sortDirection: filtros.sortDirection,
            page: 0,
            size: Number(filtros.size),
        });
    };

    const sanitizarTexto = (texto: string) => {
        return texto
            .replace(/<[^>]*>?/gm, "")
            .replace(/[<>{}[\]\\^`~|]/g, "");
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        if (name === "titulo") {
            const textoSanitizado = sanitizarTexto(value);
            if (textoSanitizado.length <= MAX_TITULO_LENGTH) {
                setForm({ ...form, titulo: textoSanitizado });
            }
            return;
        }

        if (name === "descripcion") {
            const textoSanitizado = sanitizarTexto(value);
            if (textoSanitizado.length <= MAX_DESCRIPCION_LENGTH) {
                setForm({ ...form, descripcion: textoSanitizado });
            }
            return;
        }

        setForm({ ...form, [name]: value });
    };

    const handleSelectOficio = (oficioValue: string) => {
        setForm((prev) => ({ ...prev, oficio: oficioValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!clientId) {
            setErrorMessage("No se encontró el cliente de la sesión. Inicia sesión nuevamente.");
            return;
        }

        setIsLoading(true);

        const payload: JobPayload = {
            clientId,
            title: form.titulo.trim(),
            specialty: form.oficio,
            description: sanitizarTexto(form.descripcion.trim()),
            maxBudget: 2,
            ubigeoDistrictId: form.ubigeoDistrictId,
            specificAddress: form.direccion.trim(),
            latitude: -12.046374,
            longitude: -77.042754,
        };

        try {
            if (modoEdicion && ofertaSeleccionada) {
                setSuccessMessage("Solicitud actualizada correctamente.");
                cerrarModal();
            } else {
                await jobService.createJob(payload);
                setConsulta((prev) => ({ ...prev, page: 0 }));
                setRecarga((prev) => prev + 1);
                setSuccessMessage("¡Tu solicitud se ha publicado exitosamente!");
                resetForm();
            }
        } catch (error) {
            console.error(error);
            setErrorMessage("Ocurrió un error al procesar la solicitud con el servidor. Inténtalo de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEliminar = async (id: string) => {
        if (eliminandoId || !confirm("¿Deseas eliminar este requerimiento?")) return;

        setEliminandoId(id);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await jobService.deleteJob(id);
            if (ofertaSeleccionada?.id === id) cerrarModal();
            setConsulta((prev) => ({
                ...prev,
                page: ofertas.length === 1 ? Math.max(0, prev.page - 1) : prev.page,
            }));
            setRecarga((prev) => prev + 1);
            setSuccessMessage("Publicación eliminada correctamente.");
        } catch (error) {
            console.error(error);
            setErrorMessage("No se pudo eliminar la publicación.");
        } finally {
            setEliminandoId(null);
        }
    };

    const abrirDetalle = (oferta: Oferta) => {
        setOfertaSeleccionada(oferta);
        setModoEdicion(false);
        setDetalle(null);
        setErrorDetalle(null);
        setCargandoDetalle(true);
    };

    const cerrarModal = () => {
        setOfertaSeleccionada(null);
        setModoEdicion(false);
        resetForm();
    };

    const resetForm = () => {
        setForm({
            titulo: "",
            descripcion: "",
            direccion: "",
            ubigeoDistrictId: distritos[0]?.id ?? "",
            oficio: "ELECTRICISTA",
        });
    };

    return (
        <main className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-gray-900 transition-colors duration-300 selection:bg-blue-100 selection:text-blue-600 dark:bg-gray-950 dark:text-gray-100 dark:selection:bg-blue-900 dark:selection:text-blue-200">
            <Header />

            {/* BANNER SUPERIOR */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-12 text-white shadow-md">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
                <div className="relative z-10 mx-auto flex max-w-5xl flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="max-w-xl space-y-2 animate-fade-in">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-blue-100 shadow-sm backdrop-blur-md">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-300" />
                            Portal de Solicitudes - Cliente
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                            ¿Qué necesitas reparar hoy?
                        </h1>
                        <p className="text-sm leading-relaxed text-blue-100">
                            Publica tu requerimiento de forma sencilla y recibe cotizaciones de profesionales calificados cerca de ti.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="min-w-[110px] rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-center shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-105">
                            <span className="block text-2xl font-black text-white">{total}</span>
                            <span className="text-[11px] font-medium uppercase tracking-wider text-blue-200">Resultados</span>
                        </div>
                        <div className="min-w-[110px] rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-center shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-105">
                            <span className="block text-2xl font-black text-blue-300">
                                {ofertas.filter((o) => o.estado === "ACTIVA").length}
                            </span>
                            <span className="text-[11px] font-medium uppercase tracking-wider text-blue-200">Activas en esta página</span>
                        </div>
                    </div>
                </div>
            </div>

            <section className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-8 md:py-10">

                {/* MENSAJES */}
                {errorMessage && (
                    <div className="animate-bounce rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-xs font-semibold text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                        {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-xs font-semibold text-emerald-600 transition-all duration-300 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {successMessage}
                    </div>
                )}

                {/* FORMULARIO DE CREACIÓN */}
                <div className="space-y-8 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 md:p-10">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Crear nueva solicitud</h2>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Completa los campos principales de tu requerimiento.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Especialidad Requerida *
                            </label>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                                {OFICIOS_DISPONIBLES.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelectOficio(item.value)}
                                        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-3.5 text-center transition-all duration-300 hover:-translate-y-1 ${
                                            form.oficio === item.value
                                                ? "scale-[1.02] border-blue-600 bg-blue-50/70 font-bold text-blue-600 shadow-md ring-2 ring-blue-600/10 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-300"
                                                : "border-gray-200/80 text-gray-600 hover:border-blue-200 hover:bg-gray-50/80 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-800 dark:hover:bg-gray-800"
                                        }`}
                                    >
                                        <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{item.icon}</span>
                                        <span className="text-xs">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Título de la Solicitud *
                                    </label>
                                    <span className={`text-[11px] font-medium ${form.titulo.length >= MAX_TITULO_LENGTH ? "font-bold text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
                                        {form.titulo.length} / {MAX_TITULO_LENGTH}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    name="titulo"
                                    value={form.titulo}
                                    onChange={handleChange}
                                    placeholder="Ej. Reparación de fuga en baño"
                                    required
                                    className={inputClass}
                                />
                            </div>


                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Dirección Exacta del Servicio *
                                </label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={form.direccion}
                                    onChange={handleChange}
                                    placeholder="Ej. Av. Los Ingenieros 245"
                                    required
                                    className={inputClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Distrito *
                                </label>
                                <select
                                    name="ubigeoDistrictId"
                                    value={form.ubigeoDistrictId}
                                    onChange={handleChange}
                                    required
                                    className={inputClass}
                                >
                                    <option value="" disabled>Selecciona un distrito</option>
                                    {distritos.map((dist) => (
                                        <option key={dist.id} value={dist.id}>{dist.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Descripción Detallada *
                                </label>
                                <span className={`text-[11px] font-medium ${form.descripcion.length >= MAX_DESCRIPCION_LENGTH ? "font-bold text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
                                    {form.descripcion.length} / {MAX_DESCRIPCION_LENGTH} caracteres
                                </span>
                            </div>
                            <textarea
                                name="descripcion"
                                rows={5}
                                value={form.descripcion}
                                onChange={handleChange}
                                placeholder="Detalla qué problemas se presentan o qué trabajo específico requieres realizar..."
                                required
                                className={`${inputClass} min-h-[120px] max-h-[250px] resize-y p-4`}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !clientId}
                            className="w-full rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:scale-[1.02] hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-95 disabled:opacity-50 md:w-auto"
                        >
                            {isLoading ? "Publicando..." : "Publicar Solicitud"}
                        </button>
                    </form>
                </div>

                {/* SOLICITUDES CREADAS */}
                <div className="space-y-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Tus Solicitudes Creadas</h2>
                            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Administra tu lista de requerimientos y consulta las ofertas recibidas.</p>
                        </div>
                        <span className="self-start rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300 sm:self-auto">
                            {ofertas.length} de {total} requerimientos
                        </span>
                    </div>

                    {/* FILTROS */}
                    <form onSubmit={aplicarFiltros} className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-2 lg:grid-cols-3">
                        {([
                            ["createdFrom", "Creada desde", "date"],
                            ["createdTo", "Creada hasta", "date"],
                        ] as const).map(([name, label, type]) => (
                            <label key={name} className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                <span>{label}</span>
                                <input
                                    type={type}
                                    value={filtros[name]}
                                    min={name === "createdTo" ? filtros.createdFrom : undefined}
                                    onChange={(e) => setFiltros((prev) => ({ ...prev, [name]: e.target.value }))}
                                    className={filterInputClass}
                                />
                            </label>
                        ))}

                        <label className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                            <span>Oficio</span>
                            <select value={filtros.specialty} onChange={(e) => setFiltros((prev) => ({ ...prev, specialty: e.target.value }))} className={filterInputClass}>
                                <option value="">Todos</option>
                                {OFICIOS_DISPONIBLES.map((oficio) => <option key={oficio.value} value={oficio.value}>{oficio.label}</option>)}
                            </select>
                        </label>

                        <label className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                            <span>Estado (opcional)</span>
                            <select value={filtros.status} onChange={(e) => setFiltros((prev) => ({ ...prev, status: e.target.value }))} className={filterInputClass}>
                                <option value="">Todos</option>
                                <option value="OPEN">Publicada</option>
                                <option value="IN_PROGRESS">En progreso</option>
                                <option value="COMPLETED">Completada</option>
                                <option value="CANCELED">Cancelada</option>
                            </select>
                        </label>

                        <label className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                            <span>Ordenar por</span>
                            <select value={filtros.sortBy} onChange={(e) => setFiltros((prev) => ({ ...prev, sortBy: e.target.value }))} className={filterInputClass}>
                                <option value="createdAt">Fecha de creación</option>
                            </select>
                        </label>

                        <label className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                            <span>Dirección del orden</span>
                            <select value={filtros.sortDirection} onChange={(e) => setFiltros((prev) => ({ ...prev, sortDirection: e.target.value as "ASC" | "DESC" }))} className={filterInputClass}>
                                <option value="DESC">Descendente</option>
                                <option value="ASC">Ascendente</option>
                            </select>
                        </label>

                        <label className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                            <span>Solicitudes por página</span>
                            <select value={filtros.size} onChange={(e) => setFiltros((prev) => ({ ...prev, size: e.target.value }))} className={filterInputClass}>
                                {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                            </select>
                        </label>

                        <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
                            <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700">
                                Aplicar filtros
                            </button>
                            <button
                                type="button"
                                onClick={() => { setFiltros(FILTROS_INICIALES); setConsulta({ clientId, sortBy: "createdAt", sortDirection: "DESC", page: 0, size: 10 }); }}
                                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    </form>

                    {/* LISTADO */}
                    {cargandoLista ? (
                        <p role="status" className="text-sm text-gray-500 dark:text-gray-400">Cargando solicitudes...</p>
                    ) : errorLista ? (
                        <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
                            {errorLista}
                            <button type="button" onClick={() => setRecarga((prev) => prev + 1)} className="ml-3 underline">Reintentar</button>
                        </div>
                    ) : ofertas.length === 0 ? (
                        <div className="space-y-3 rounded-3xl border border-gray-200/70 bg-white p-12 text-center transition-all duration-300 dark:border-gray-800 dark:bg-gray-900">
                            <p className="text-4xl text-gray-300 dark:text-gray-600">📂</p>
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No se encontraron solicitudes</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Intenta cambiar los filtros o publica un nuevo requerimiento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {ofertas.map((item) => (
                                <div
                                    key={item.id}
                                    className="group flex transform flex-col items-start justify-between gap-6 rounded-3xl border border-gray-200/70 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700 md:flex-row md:items-center"
                                >
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-gray-800 dark:text-gray-300 dark:group-hover:bg-blue-950 dark:group-hover:text-blue-300">
                                                {item.specialty}
                                            </span>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                item.estado === "ACTIVA"
                                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
                                                    : item.estado === "EN_PROCESO"
                                                        ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"
                                                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                            }`}>
                                                {item.estado}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500">Creado el {item.fechaCreacion}</span>
                                        </div>

                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 transition-colors duration-200 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                                                {item.title}
                                            </h3>
                                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                                {item.description}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <span>📍</span>
                                                <span className="font-medium text-gray-600 dark:text-gray-300">
                                                    {[item.specificAddress, item.nombreDistrito ?? distritos.find((distrito) => distrito.id === item.ubigeoDistrictId)?.name].filter(Boolean).join(", ") || "Distrito no disponible"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                                                <span>💬</span>
                                                <span>{item.propuestasCount} propuestas</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex w-full justify-between gap-4 border-t border-gray-100 pt-4 dark:border-gray-800 md:w-auto md:flex-col md:items-end md:border-t-0 md:pt-0">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => abrirDetalle(item)}
                                                className="transform rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-blue-600 hover:text-white active:scale-95 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-blue-600"
                                            >
                                                Ver
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleEliminar(item.id)}
                                                disabled={eliminandoId !== null}
                                                className="transform rounded-xl p-2 text-xs text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-gray-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                                                title="Eliminar"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* PAGINACIÓN */}
                    <div className="flex items-center justify-between gap-3 text-xs text-gray-600 dark:text-gray-300">
                        <button
                            type="button"
                            disabled={cargandoLista || consulta.page === 0}
                            onClick={() => setConsulta((prev) => ({ ...prev, page: prev.page - 1 }))}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Anterior
                        </button>
                        <span>Página {totalPaginas === 0 ? 0 : consulta.page + 1} de {totalPaginas}</span>
                        <button
                            type="button"
                            disabled={cargandoLista || consulta.page + 1 >= totalPaginas}
                            onClick={() => setConsulta((prev) => ({ ...prev, page: prev.page + 1 }))}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </section>

            {/* MODAL DETALLE */}
            {ofertaSeleccionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm transition-all duration-300 animate-fade-in">
                    <div className="max-h-[90vh] w-full max-w-lg transform space-y-6 overflow-y-auto rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl transition-all duration-300 animate-scale-up dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detalles del Requerimiento</h3>
                            <button
                                type="button"
                                onClick={cerrarModal}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {cargandoDetalle ? (
                            <p role="status" className="text-sm text-gray-500 dark:text-gray-400">Cargando detalle...</p>
                        ) : errorDetalle ? (
                            <div role="alert" className="text-sm text-red-600 dark:text-red-400">
                                {errorDetalle}
                                <button type="button" onClick={() => setRecargaDetalle((prev) => prev + 1)} className="ml-3 underline">Reintentar</button>
                            </div>
                        ) : detalle && (
                            <div className="space-y-6 transition-all duration-300">
                                <div>
                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                                        {detalle.specialty}
                                    </span>
                                    <h4 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                                        {detalle.title}
                                    </h4>
                                </div>

                                <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 text-xs dark:border-gray-700 dark:bg-gray-800">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 dark:text-gray-500">Estado:</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {({ OPEN: "Publicada", IN_PROGRESS: "En progreso", COMPLETED: "Completada", CANCELED: "Cancelada" }[detalle.status] ?? detalle.status)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400 dark:text-gray-500">Cliente:</span>
                                        <span className="text-right font-semibold text-gray-800 dark:text-gray-200">{detalle.clientName}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400 dark:text-gray-500">Profesional asignado:</span>
                                        <span className="text-right font-semibold text-gray-800 dark:text-gray-200">{detalle.technicianName || "Sin asignar"}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400 dark:text-gray-500">Ubicación:</span>
                                        <span className="text-right font-semibold text-gray-800 dark:text-gray-200">{[detalle.ubigeoDistrictName, detalle.ubigeoProvinceName, detalle.ubigeoDepartmentName].filter(Boolean).join(", ") || "No disponible"}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400 dark:text-gray-500">Dirección:</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{detalle.specificAddress || "No disponible"}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400 dark:text-gray-500">Fecha de Creación:</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(detalle.createdAt).toLocaleString("es-PE")}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Descripción</span>
                                    <p className="whitespace-pre-wrap rounded-2xl border border-gray-100 bg-white p-4 text-xs leading-relaxed text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                        {detalle.description || "No disponible"}
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => handleEliminar(ofertaSeleccionada.id)}
                                        disabled={eliminandoId !== null}
                                        className="w-full rounded-2xl bg-red-50 py-3 text-xs font-bold text-red-600 transition-all duration-300 hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70"
                                    >
                                        {eliminandoId === ofertaSeleccionada.id ? "Eliminando..." : "Eliminar Requerimiento"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
