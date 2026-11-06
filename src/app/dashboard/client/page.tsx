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

// Oficios mapeados con los valores que espera el backend en 'specialty'
const OFICIOS_DISPONIBLES = [
    { id: "Electricidad", label: "Electricidad", value: "ELECTRICISTA", icon: "⚡" },
    { id: "Gasfitería", label: "Gasfitería", value: "GASFITERO", icon: "🚰" },
    { id: "Pintura", label: "Pintura", value: "PINTURA", icon: "🎨" },
    { id: "Albañilería", label: "Albañilería", value: "MAESTRO_DE_OBRAS", icon: "🧱" },
    { id: "Limpieza", label: "Limpieza", value: "LIMPIEZA", icon: "🧹" },
    { id: "Electrodomésticos", label: "Rep. Electrodomésticos", value: "TECNICO_ELECTRODOMESTICOS", icon: "🔧" },
];

const FILTROS_INICIALES = {
    createdFrom: "", createdTo: "", specialty: "", minBudget: "", maxBudget: "",
    status: "", sortBy: "createdAt", sortDirection: "DESC" as "ASC" | "DESC", size: "10",
};

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

    // Estado del formulario
    const [form, setForm] = useState({
        titulo: "",
        descripcion: "",
        direccion: "",
        ubigeoDistrictId: "",
        presupuestoMaximo: "",
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

    // Cargar distritos al montar
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
            minBudget: filtros.minBudget === "" ? undefined : Number(filtros.minBudget),
            maxBudget: filtros.maxBudget === "" ? undefined : Number(filtros.maxBudget),
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

        if (name === "presupuestoMaximo") {
            const valorLimpio = value.replace(/[^0-9.]/g, "");
            const partes = valorLimpio.split(".");
            const valorFinal = partes.length > 2 ? partes[0] + "." + partes.slice(1).join("") : valorLimpio;

            setForm({ ...form, presupuestoMaximo: valorFinal });
            return;
        }

        setForm({ ...form, [name]: value });
    };

    const handleSelectOficio = (oficioValue: string) => {
        setForm((prev) => ({ ...prev, oficio: oficioValue }));
    };

    // Crear o Editar publicación llamando al servicio real
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!form.presupuestoMaximo || form.presupuestoMaximo.trim() === "" || Number(form.presupuestoMaximo) <= 0) {
            setErrorMessage("Error: Debe ingresar un valor válido para el Presupuesto Máximo.");
            return;
        }

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
            maxBudget: Number(form.presupuestoMaximo),
            ubigeoDistrictId: form.ubigeoDistrictId,
            specificAddress: form.direccion.trim(),
            latitude: -12.046374, // Puedes enlazar geolocalización real o dejar nulo si prefieres
            longitude: -77.042754,
        };

        try {
            if (modoEdicion && ofertaSeleccionada) {
                // Aquí puedes agregar tu lógica de actualización si el backend la soporta (ej. PUT /api/v1/jobs/{id})
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
            presupuestoMaximo: "",
            oficio: "ELECTRICISTA",
        });
    };

    const formatearSoles = (monto: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 2,
        }).format(monto);
    };

    return (
        <main className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-600">
            <Header />

            {/* BANNER SUPERIOR DE COLOR AZUL VINCU */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white py-12 px-6 shadow-md relative overflow-hidden transition-all duration-500">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2 max-w-xl animate-fade-in">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs font-semibold backdrop-blur-md shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
                            Portal de Solicitudes - Cliente
                        </span>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            ¿Qué necesitas reparar hoy?
                        </h1>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            Publica tu requerimiento de forma sencilla y recibe cotizaciones de profesionales calificados cerca de ti.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-5 py-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center min-w-[110px] transform hover:scale-105 transition-all duration-300 shadow-sm">
                            <span className="block text-2xl font-black text-white">{total}</span>
                            <span className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">Resultados</span>
                        </div>
                        <div className="px-5 py-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center min-w-[110px] transform hover:scale-105 transition-all duration-300 shadow-sm">
                            <span className="block text-2xl font-black text-blue-300">
                                {ofertas.filter((o) => o.estado === "ACTIVA").length}
                            </span>
                            <span className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">Activas en esta página</span>
                        </div>
                    </div>
                </div>
            </div>

            <section className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-10 space-y-10">
                {errorMessage && (
                    <div className="p-4 rounded-2xl text-xs font-semibold bg-red-50 text-red-600 border border-red-100 text-center animate-bounce">
                        {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div className="p-4 rounded-2xl text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 text-center transition-all duration-300">
                        {successMessage}
                    </div>
                )}

                {/* FORMULARIO DE CREACIÓN */}
                <div className="bg-white rounded-3xl border border-gray-200/70 shadow-sm p-6 md:p-10 space-y-8 transition-all duration-300 hover:shadow-md">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">Crear nueva solicitud</h2>
                        <p className="text-xs text-gray-400 mt-1">Completa los campos principales de tu requerimiento.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Especialidad Requerida *
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                {OFICIOS_DISPONIBLES.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelectOficio(item.value)}
                                        className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all duration-300 transform hover:-translate-y-1 ${
                                            form.oficio === item.value
                                                ? "border-blue-600 bg-blue-50/70 text-blue-600 font-bold shadow-md ring-2 ring-blue-600/10 scale-[1.02]"
                                                : "border-gray-200/80 hover:border-blue-200 text-gray-600 hover:bg-gray-50/80"
                                        }`}
                                    >
                                        <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{item.icon}</span>
                                        <span className="text-xs">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Título de la Solicitud *
                                    </label>
                                    <span className={`text-[11px] font-medium ${form.titulo.length >= MAX_TITULO_LENGTH ? "text-red-500 font-bold" : "text-gray-400"}`}>
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
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all duration-300 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Presupuesto Máximo *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                                        S/
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        name="presupuestoMaximo"
                                        value={form.presupuestoMaximo}
                                        onChange={handleChange}
                                        placeholder="150.00"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all duration-300 outline-none font-medium"
                                    />
                                </div>
                                {form.presupuestoMaximo && !isNaN(Number(form.presupuestoMaximo)) && (
                                    <p className="text-[11px] text-blue-600 font-semibold pl-1">
                                        Formato visual: {formatearSoles(Number(form.presupuestoMaximo))}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Dirección Exacta del Servicio *
                                </label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={form.direccion}
                                    onChange={handleChange}
                                    placeholder="Ej. Av. Los Ingenieros 245"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all duration-300 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Distrito *
                                </label>
                                <select
                                    name="ubigeoDistrictId"
                                    value={form.ubigeoDistrictId}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all duration-300 outline-none"
                                >
                                    <option value="" disabled>Selecciona un distrito</option>
                                    {distritos.map((dist) => (
                                        <option key={dist.id} value={dist.id}>
                                            {dist.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Descripción Detallada *
                                </label>
                                <span className={`text-[11px] font-medium ${form.descripcion.length >= MAX_DESCRIPCION_LENGTH ? "text-red-500 font-bold" : "text-gray-400"}`}>
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
                                className="w-full min-h-[120px] max-h-[250px] p-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all duration-300 outline-none resize-y"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !clientId}
                            className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 text-sm disabled:opacity-50"
                        >
                            {isLoading ? "Publicando..." : "Publicar Solicitud"}
                        </button>
                    </form>
                </div>

                {/* VISTA DE SOLICITUDES CREADAS */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-gray-900">Tus Solicitudes Creadas</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Administra tu lista de requerimientos y consulta las ofertas recibidas.</p>
                        </div>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full self-start sm:self-auto">
                            {ofertas.length} de {total} requerimientos
                        </span>
                    </div>

                    <form onSubmit={aplicarFiltros} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-gray-200/70 shadow-sm">
                        {([
                            ["createdFrom", "Creada desde", "date"],
                            ["createdTo", "Creada hasta", "date"],
                            ["minBudget", "Presupuesto mínimo (S/)", "number"],
                            ["maxBudget", "Presupuesto máximo (S/)", "number"],
                        ] as const).map(([name, label, type]) => (
                            <label key={name} className="text-xs font-semibold text-gray-600 space-y-2">
                                <span>{label}</span>
                                <input type={type} value={filtros[name]} min={type === "number" ? (name === "maxBudget" ? filtros.minBudget || "0" : "0") : name === "createdTo" ? filtros.createdFrom : undefined} step={type === "number" ? "0.01" : undefined}
                                    onChange={(e) => setFiltros((prev) => ({ ...prev, [name]: e.target.value }))}
                                    className="block w-full p-2 border border-gray-200 rounded-xl" />
                            </label>
                        ))}
                        <label className="text-xs font-semibold text-gray-600 space-y-2">
                            <span>Oficio</span>
                            <select value={filtros.specialty} onChange={(e) => setFiltros((prev) => ({ ...prev, specialty: e.target.value }))} className="block w-full p-2 border border-gray-200 rounded-xl">
                                <option value="">Todos</option>
                                {OFICIOS_DISPONIBLES.map((oficio) => <option key={oficio.value} value={oficio.value}>{oficio.label}</option>)}
                            </select>
                        </label>
                        <label className="text-xs font-semibold text-gray-600 space-y-2">
                            <span>Estado (opcional)</span>
                            <select value={filtros.status} onChange={(e) => setFiltros((prev) => ({ ...prev, status: e.target.value }))} className="block w-full p-2 border border-gray-200 rounded-xl">
                                <option value="">Todos</option>
                                <option value="OPEN">Publicada</option>
                                <option value="IN_PROGRESS">En progreso</option>
                                <option value="COMPLETED">Completada</option>
                                <option value="CANCELED">Cancelada</option>
                            </select>
                        </label>
                        <label className="text-xs font-semibold text-gray-600 space-y-2">
                            <span>Ordenar por</span>
                            <select value={filtros.sortBy} onChange={(e) => setFiltros((prev) => ({ ...prev, sortBy: e.target.value }))} className="block w-full p-2 border border-gray-200 rounded-xl">
                                <option value="createdAt">Fecha de creación</option>
                                <option value="maxBudget">Presupuesto máximo</option>
                            </select>
                        </label>
                        <label className="text-xs font-semibold text-gray-600 space-y-2">
                            <span>Dirección del orden</span>
                            <select value={filtros.sortDirection} onChange={(e) => setFiltros((prev) => ({ ...prev, sortDirection: e.target.value as "ASC" | "DESC" }))} className="block w-full p-2 border border-gray-200 rounded-xl">
                                <option value="DESC">Descendente</option><option value="ASC">Ascendente</option>
                            </select>
                        </label>
                        <label className="text-xs font-semibold text-gray-600 space-y-2">
                            <span>Solicitudes por página</span>
                            <select value={filtros.size} onChange={(e) => setFiltros((prev) => ({ ...prev, size: e.target.value }))} className="block w-full p-2 border border-gray-200 rounded-xl">
                                {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                            </select>
                        </label>
                        <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">Aplicar filtros</button>
                            <button type="button" onClick={() => { setFiltros(FILTROS_INICIALES); setConsulta({ clientId, sortBy: "createdAt", sortDirection: "DESC", page: 0, size: 10 }); }} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">Limpiar filtros</button>
                        </div>
                    </form>

                    {cargandoLista ? <p role="status" className="text-sm text-gray-500">Cargando solicitudes...</p> : errorLista ? (
                        <div role="alert" className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                            {errorLista}
                            <button type="button" onClick={() => setRecarga((prev) => prev + 1)} className="ml-3 underline">Reintentar</button>
                        </div>
                    ) : ofertas.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-200/70 p-12 text-center space-y-3 transition-all duration-300">
                            <p className="text-gray-300 text-4xl">📂</p>
                            <p className="text-sm font-semibold text-gray-600">No se encontraron solicitudes</p>
                            <p className="text-xs text-gray-400">Intenta cambiar los filtros o publica un nuevo requerimiento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {ofertas.map((item) => (
                                <div
                                    key={item.id}
                                    className="group bg-white rounded-3xl border border-gray-200/70 p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                                >
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                                                {item.specialty}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                item.estado === "ACTIVA"
                                                    ? "bg-emerald-50 text-emerald-600"
                                                    : item.estado === "EN_PROCESO"
                                                        ? "bg-amber-50 text-amber-600"
                                                        : "bg-gray-100 text-gray-500"
                                            }`}>
                                                {item.estado}
                                            </span>
                                            <span className="text-xs text-gray-400">Creado el {item.fechaCreacion}</span>
                                        </div>

                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <span>📍</span>
                                                <span className="font-medium text-gray-600">{[item.specificAddress, item.nombreDistrito ?? distritos.find((distrito) => distrito.id === item.ubigeoDistrictId)?.name].filter(Boolean).join(", ") || "Distrito no disponible"}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-blue-600 font-semibold">
                                                <span>💬</span>
                                                <span>{item.propuestasCount} propuestas</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex md:flex-col justify-between md:items-end w-full md:w-auto border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 gap-4">
                                        <div className="text-left md:text-right">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">
                                                Presupuesto Máximo
                                            </span>
                                            <span className="text-xl font-black text-gray-900">
                                                {formatearSoles(item.maxBudget)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => abrirDetalle(item)}
                                                className="px-4 py-2 bg-gray-100 hover:bg-blue-600 text-gray-700 hover:text-white text-xs font-bold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm"
                                            >
                                                Ver
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleEliminar(item.id)}
                                                disabled={eliminandoId !== null}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 transform hover:scale-110 text-xs disabled:opacity-50"
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
                    <div className="flex items-center justify-between gap-3 text-xs">
                        <button type="button" disabled={cargandoLista || consulta.page === 0} onClick={() => setConsulta((prev) => ({ ...prev, page: prev.page - 1 }))} className="px-4 py-2 bg-white border rounded-xl disabled:opacity-40">Anterior</button>
                        <span>Página {totalPaginas === 0 ? 0 : consulta.page + 1} de {totalPaginas}</span>
                        <button type="button" disabled={cargandoLista || consulta.page + 1 >= totalPaginas} onClick={() => setConsulta((prev) => ({ ...prev, page: prev.page + 1 }))} className="px-4 py-2 bg-white border rounded-xl disabled:opacity-40">Siguiente</button>
                    </div>
                </div>
            </section>

            {/* MODAL DETALLE */}
            {ofertaSeleccionada && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100 animate-scale-up max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <h3 className="text-lg font-bold text-gray-900">Detalles del Requerimiento</h3>
                            <button
                                type="button"
                                onClick={cerrarModal}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center text-xs transition-colors duration-200"
                            >
                                ✕
                            </button>
                        </div>

                        {cargandoDetalle ? (
                            <p role="status" className="text-sm text-gray-500">Cargando detalle...</p>
                        ) : errorDetalle ? (
                            <div role="alert" className="text-sm text-red-600">
                                {errorDetalle}
                                <button type="button" onClick={() => setRecargaDetalle((prev) => prev + 1)} className="ml-3 underline">Reintentar</button>
                            </div>
                        ) : detalle && (
                        <div className="space-y-6 transition-all duration-300">
                            <div>
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                                    {detalle.specialty}
                                </span>
                                <h4 className="text-xl font-bold text-gray-900 mt-2">
                                    {detalle.title}
                                </h4>
                            </div>

                            <div className="bg-gray-50/80 p-4 rounded-2xl space-y-2 text-xs border border-gray-100">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Estado:</span>
                                    <span className="font-bold text-emerald-600">{({ OPEN: "Publicada", IN_PROGRESS: "En progreso", COMPLETED: "Completada", CANCELED: "Cancelada" }[detalle.status] ?? detalle.status)}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-400">Cliente:</span>
                                    <span className="font-semibold text-gray-800 text-right">{detalle.clientName}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-400">Profesional asignado:</span>
                                    <span className="font-semibold text-gray-800 text-right">{detalle.technicianName || "Sin asignar"}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-400">Ubicación:</span>
                                    <span className="font-semibold text-gray-800 text-right">{[detalle.ubigeoDistrictName, detalle.ubigeoProvinceName, detalle.ubigeoDepartmentName].filter(Boolean).join(", ") || "No disponible"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Dirección:</span>
                                    <span className="font-semibold text-gray-800">{detalle.specificAddress || "No disponible"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Presupuesto Máximo:</span>
                                    <span className="font-bold text-blue-600">{formatearSoles(detalle.maxBudget)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Fecha de Creación:</span>
                                    <span className="font-semibold text-gray-800">{new Date(detalle.createdAt).toLocaleString("es-PE")}</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Descripción</span>
                                <p className="text-xs text-gray-600 leading-relaxed bg-white border border-gray-100 p-4 rounded-2xl whitespace-pre-wrap">
                                    {detalle.description || "No disponible"}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleEliminar(ofertaSeleccionada.id)}
                                    disabled={eliminandoId !== null}
                                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-xs transition-all duration-300 disabled:opacity-50"
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
