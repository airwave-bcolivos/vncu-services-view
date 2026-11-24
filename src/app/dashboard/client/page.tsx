"use client";

import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from "react";
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

type DashboardTab = "PUBLICATIONS" | "ACCEPTED";

type AcceptedClientJob = {
    id: string;
    title: string;
    specialty: string;
    description: string;
    technicianName: string;
    districtName: string;
    specificAddress?: string;
    createdAt: string;
    status: "IN_PROGRESS" | "COMPLETED";
};

type RatingForm = {
    rating: number;
    comment: string;
};

const INITIAL_RATING: RatingForm = {
    rating: 0,
    comment: "",
};

const OFICIOS_DISPONIBLES = [
    { id: "Electricidad", label: "Electricidad", value: "ELECTRICISTA", icon: "⚡" },
    { id: "Gasfitería", label: "Gasfitería", value: "GASFITERO", icon: "🚰" },
    { id: "Pintura", label: "Pintura", value: "PINTURA", icon: "🎨" },
    { id: "Albañilería", label: "Albañilería", value: "MAESTRO_DE_OBRAS", icon: "🧱" },
    { id: "Limpieza", label: "Limpieza", value: "LIMPIEZA", icon: "🧹" },
    { id: "Electrodomésticos", label: "Rep. Electrodomésticos", value: "TECNICO_ELECTRODOMESTICOS", icon: "🔧" },
];

const FILTROS_INICIALES = {
    createdFrom: "",
    createdTo: "",
    specialty: "",
    status: "",
    sortBy: "createdAt",
    sortDirection: "DESC" as "ASC" | "DESC",
    size: "10",
};

const inputClass =
    "w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:bg-gray-800";

const filterInputClass =
    "block w-full rounded-xl border border-gray-200 bg-white p-2 text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

export default function ClientDashboardPage() {
    const [activeTab, setActiveTab] = useState<DashboardTab>("PUBLICATIONS");

    const [isLoading, setIsLoading] = useState(false);
    const [eliminandoId, setEliminandoId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [distritos, setDistritos] = useState<DistritoDto[]>([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    const MAX_TITULO_LENGTH = 150;
    const MAX_DESCRIPCION_LENGTH = 500;

    const [filtros, setFiltros] = useState(FILTROS_INICIALES);
    const [clientId, setClientId] = useState("");

    const [consulta, setConsulta] = useState<JobFilters>({
        clientId: "",
        sortBy: "createdAt",
        sortDirection: "DESC",
        page: 0,
        size: 10,
    });

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

    // PROPUESTAS RECIBIDAS
    const [ofertaPropuestas, setOfertaPropuestas] = useState<Oferta | null>(null);
    const [mostrarPropuestas, setMostrarPropuestas] = useState(false);

    // TRABAJOS ACEPTADOS
    const [trabajosAceptados, setTrabajosAceptados] = useState<AcceptedClientJob[]>([]);
    const [cargandoAceptados, setCargandoAceptados] = useState(false);
    const [errorAceptados, setErrorAceptados] = useState<string | null>(null);
    const [busquedaAceptados, setBusquedaAceptados] = useState("");

    // CALIFICACIÓN DEL TÉCNICO
    const [trabajoCalificar, setTrabajoCalificar] = useState<AcceptedClientJob | null>(null);
    const [ratingForm, setRatingForm] = useState<RatingForm>(INITIAL_RATING);
    const [ratingError, setRatingError] = useState("");
    const [ratingFeedback, setRatingFeedback] = useState("");
    const [ratingSubmitting, setRatingSubmitting] = useState(false);

    // CARGAR IDENTIFICADOR DEL CLIENTE
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

    // CARGAR DISTRITOS
    useEffect(() => {
        const cargarDistritos = async () => {
            try {
                const data = await ubigeoService.getDistricts();
                setDistritos(data);

                if (data.length > 0) {
                    setForm((prev) => ({
                        ...prev,
                        ubigeoDistrictId: data[0].id,
                    }));
                }
            } catch (error) {
                console.error("Error al cargar los distritos:", error);
                setErrorMessage("No se pudieron cargar los distritos del sistema.");
            }
        };

        void cargarDistritos();
    }, []);

    // CARGAR PUBLICACIONES DEL CLIENTE
    useEffect(() => {
        if (!consulta.clientId) return;

        const controller = new AbortController();

        const cargarSolicitudes = async () => {
            setCargandoLista(true);
            setErrorLista(null);

            try {
                const data = await jobService.getJobs(consulta, controller.signal);

                if (controller.signal.aborted) return;

                setOfertas(
                    data.content.map((job) => ({
                        ...job,
                        clientId: consulta.clientId,
                        description: job.description ?? "",
                        specificAddress: job.specificAddress ?? "",
                        latitude: null,
                        longitude: null,
                        nombreDistrito: job.ubigeoDistrictName,
                        fechaCreacion: new Date(job.createdAt).toLocaleDateString("es-PE"),
                        estado:
                            job.status === "OPEN"
                                ? "ACTIVA"
                                : job.status === "IN_PROGRESS"
                                    ? "EN PROCESO"
                                    : job.status === "COMPLETED"
                                        ? "COMPLETADA"
                                        : job.status,
                        propuestasCount: job.propuestasCount ?? 0,
                    }))
                );

                setTotal(data.totalElements);
                setTotalPaginas(data.totalPages);
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Error al cargar publicaciones:", error);
                    setErrorLista("No se pudieron cargar las solicitudes. Intenta nuevamente.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setCargandoLista(false);
                }
            }
        };

        void cargarSolicitudes();

        return () => controller.abort();
    }, [consulta, recarga]);

    // CARGAR DETALLE DE UNA PUBLICACIÓN
    const detalleId = ofertaSeleccionada?.id;

    useEffect(() => {
        if (!detalleId || !clientId) return;

        const controller = new AbortController();

        const cargarDetalle = async () => {
            setCargandoDetalle(true);
            setErrorDetalle(null);
            setDetalle(null);

            try {
                const data = await jobService.getJobDetail(
                    detalleId,
                    clientId,
                    controller.signal
                );

                if (!controller.signal.aborted) {
                    setDetalle(data);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Error al cargar detalle:", error);
                    setErrorDetalle("No se pudo cargar el detalle del requerimiento.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setCargandoDetalle(false);
                }
            }
        };

        void cargarDetalle();

        return () => controller.abort();
    }, [detalleId, clientId, recargaDetalle]);

    // CARGAR TRABAJOS ACEPTADOS
    const cargarTrabajosAceptados = useCallback(async () => {
        if (!clientId) return;

        try {
            setCargandoAceptados(true);
            setErrorAceptados(null);

            /*
             * Se consultan las publicaciones que ya tienen un técnico asignado.
             * IN_PROGRESS: propuesta aceptada y servicio en ejecución.
             * COMPLETED: técnico marcó el servicio como finalizado.
             *
             * El backend debe actualizar el estado de la publicación
             * cuando el cliente acepta una propuesta y cuando el técnico
             * finaliza el trabajo.
             */
            const [enProceso, completados] = await Promise.all([
                jobService.getJobs({
                    clientId,
                    status: "IN_PROGRESS",
                    sortBy: "createdAt",
                    sortDirection: "DESC",
                    page: 0,
                    size: 50,
                }),
                jobService.getJobs({
                    clientId,
                    status: "COMPLETED",
                    sortBy: "createdAt",
                    sortDirection: "DESC",
                    page: 0,
                    size: 50,
                }),
            ]);

            // Unificar los resultados y evitar publicaciones duplicadas.
            const publicaciones = [
                ...enProceso.content,
                ...completados.content,
            ];

            const publicacionesUnicas = Array.from(
                new Map(publicaciones.map((job) => [job.id, job])).values()
            );

            // Consultar el detalle para obtener el nombre del técnico asignado.
            const detalles = await Promise.all(
                publicacionesUnicas.map(async (job) => {
                    try {
                        return await jobService.getJobDetail(job.id, clientId);
                    } catch (error) {
                        console.error(
                            `No se pudo consultar el detalle del trabajo ${job.id}:`,
                            error
                        );
                        return null;
                    }
                })
            );

            const trabajos: AcceptedClientJob[] = detalles
                .filter((job): job is JobDetail => job !== null)
                .map((job) => ({
                    id: job.id,
                    title: job.title,
                    specialty: job.specialty,
                    description: job.description ?? "",
                    technicianName: job.technicianName || "Técnico asignado",
                    districtName: job.ubigeoDistrictName || "Distrito no disponible",
                    specificAddress: job.specificAddress || "",
                    createdAt: job.createdAt,
                    status: job.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
                }));

            setTrabajosAceptados(trabajos);
        } catch (error) {
            console.error("Error al cargar trabajos aceptados:", error);
            setErrorAceptados(
                "No se pudieron cargar tus trabajos aceptados. Intenta nuevamente."
            );
        } finally {
            setCargandoAceptados(false);
        }
    }, [clientId]);

    // ACTUALIZAR AUTOMÁTICAMENTE AL ABRIR LA PESTAÑA
    useEffect(() => {
        if (activeTab === "ACCEPTED" && clientId) {
            void cargarTrabajosAceptados();
        }
    }, [activeTab, clientId, cargarTrabajosAceptados]);

    // FILTRAR TRABAJOS ACEPTADOS
    const trabajosAceptadosFiltrados = trabajosAceptados.filter((job) => {
        const texto = busquedaAceptados.toLowerCase().trim();

        if (!texto) return true;

        return (
            job.title.toLowerCase().includes(texto) ||
            job.specialty.toLowerCase().includes(texto) ||
            job.technicianName.toLowerCase().includes(texto) ||
            job.districtName.toLowerCase().includes(texto)
        );
    });

    // FECHAS
    const formatDate = (date: string) => {
        if (!date) return "No disponible";

        return new Date(date).toLocaleDateString("es-PE", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // APLICAR FILTROS
    const aplicarFiltros = (event: FormEvent<HTMLFormElement>) => {
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

    // SANITIZAR TEXTO
    const sanitizarTexto = (texto: string) => {
        return texto
            .replace(/<[^>]*>?/gm, "")
            .replace(/[<>{}[\]\\^`~|]/g, "");
    };

    // CAMBIOS DEL FORMULARIO
    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        if (name === "titulo") {
            const textoSanitizado = sanitizarTexto(value);

            if (textoSanitizado.length <= MAX_TITULO_LENGTH) {
                setForm((prev) => ({ ...prev, titulo: textoSanitizado }));
            }

            return;
        }

        if (name === "descripcion") {
            const textoSanitizado = sanitizarTexto(value);

            if (textoSanitizado.length <= MAX_DESCRIPCION_LENGTH) {
                setForm((prev) => ({ ...prev, descripcion: textoSanitizado }));
            }

            return;
        }

        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectOficio = (oficioValue: string) => {
        setForm((prev) => ({ ...prev, oficio: oficioValue }));
    };

    // REINICIAR FORMULARIO
    const resetForm = () => {
        setForm({
            titulo: "",
            descripcion: "",
            direccion: "",
            ubigeoDistrictId: distritos[0]?.id ?? "",
            oficio: "ELECTRICISTA",
        });
    };

    // CREAR PUBLICACIÓN
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!clientId) {
            setErrorMessage("No se encontró el cliente de la sesión. Inicia sesión nuevamente.");
            return;
        }

        if (
            !form.titulo.trim() ||
            !form.descripcion.trim() ||
            !form.direccion.trim() ||
            !form.ubigeoDistrictId
        ) {
            setErrorMessage("Completa todos los campos obligatorios.");
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
                setSuccessMessage(
                    "La edición de publicaciones todavía debe conectarse al servicio correspondiente."
                );
                cerrarModal();
            } else {
                await jobService.createJob(payload);

                setConsulta((prev) => ({ ...prev, page: 0 }));
                setRecarga((prev) => prev + 1);
                setSuccessMessage("¡Tu solicitud se ha publicado exitosamente!");

                resetForm();
                setMostrarFormulario(false);
            }
        } catch (error) {
            console.error("Error al procesar publicación:", error);
            setErrorMessage(
                "Ocurrió un error al procesar la solicitud con el servidor. Inténtalo de nuevo."
            );
        } finally {
            setIsLoading(false);
        }
    };

    // ELIMINAR PUBLICACIÓN
    const handleEliminar = async (id: string) => {
        if (eliminandoId || !confirm("¿Deseas eliminar este requerimiento?")) return;

        setEliminandoId(id);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await jobService.deleteJob(id);

            if (ofertaSeleccionada?.id === id) {
                cerrarModal();
            }

            if (ofertaPropuestas?.id === id) {
                cerrarPropuestas();
            }

            setConsulta((prev) => ({
                ...prev,
                page: ofertas.length === 1 ? Math.max(0, prev.page - 1) : prev.page,
            }));

            setRecarga((prev) => prev + 1);
            setSuccessMessage("Publicación eliminada correctamente.");
        } catch (error) {
            console.error("Error al eliminar publicación:", error);
            setErrorMessage("No se pudo eliminar la publicación.");
        } finally {
            setEliminandoId(null);
        }
    };

    // ABRIR DETALLE
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

    // ABRIR Y CERRAR PROPUESTAS
    const abrirPropuestas = (oferta: Oferta) => {
        setOfertaPropuestas(oferta);
        setMostrarPropuestas(true);
    };

    const cerrarPropuestas = () => {
        setMostrarPropuestas(false);
        setOfertaPropuestas(null);
    };

    // ABRIR MODAL DE CALIFICACIÓN
    const abrirCalificacion = (job: AcceptedClientJob) => {
        if (job.status !== "COMPLETED") return;

        setTrabajoCalificar(job);
        setRatingForm(INITIAL_RATING);
        setRatingError("");
        setRatingFeedback("");
    };

    // CERRAR MODAL DE CALIFICACIÓN
    const cerrarCalificacion = () => {
        if (ratingSubmitting) return;

        setTrabajoCalificar(null);
        setRatingForm(INITIAL_RATING);
        setRatingError("");
        setRatingFeedback("");
    };

    // CALIFICAR TÉCNICO
    const handleRatingSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setRatingError("");
        setRatingFeedback("");

        if (!clientId) {
            setRatingError("No se encontró la sesión del cliente. Inicia sesión nuevamente.");
            return;
        }

        if (!trabajoCalificar) return;

        if (trabajoCalificar.status !== "COMPLETED") {
            setRatingError("Solo puedes calificar al técnico cuando el trabajo esté finalizado.");
            return;
        }

        if (ratingForm.rating < 1 || ratingForm.rating > 5) {
            setRatingError("Selecciona una calificación de 1 a 5 estrellas.");
            return;
        }

        setRatingSubmitting(true);

        try {
            const payload = {
                jobId: trabajoCalificar.id,
                clientId,
                rating: ratingForm.rating,
                comment: ratingForm.comment.trim(),
            };

            /*
             * PENDIENTE DE BACKEND:
             *
             * Aquí se conectará el servicio para registrar la calificación
             * del cliente hacia el técnico.
             *
             * Ejemplo futuro:
             * await ratingService.rateTechnician(payload);
             *
             * No se marca la calificación como guardada porque todavía
             * no existe la conexión con el endpoint correspondiente.
             */

            console.log("Calificación preparada para conectar:", payload);

            setRatingFeedback(
                "La calificación está validada. Para guardarla definitivamente, falta conectar el servicio de calificaciones del backend."
            );
        } catch (error) {
            console.error("Error al preparar la calificación:", error);
            setRatingError("No se pudo preparar la calificación. Inténtalo nuevamente.");
        } finally {
            setRatingSubmitting(false);
        }
    };

    const trabajosEnProceso = trabajosAceptados.filter(
        (job) => job.status === "IN_PROGRESS"
    ).length;

    const trabajosCompletados = trabajosAceptados.filter(
        (job) => job.status === "COMPLETED"
    ).length;

    return (
        <main className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-gray-900 transition-colors duration-300 selection:bg-blue-100 selection:text-blue-600 dark:bg-gray-950 dark:text-gray-100 dark:selection:bg-blue-900 dark:selection:text-blue-200">
            <Header />

            {/* BANNER SUPERIOR */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-12 text-white shadow-md">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />

                <div className="relative z-10 mx-auto flex max-w-5xl flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="max-w-xl space-y-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-blue-100 shadow-sm backdrop-blur-md">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-300" />
                            Portal de Solicitudes - Cliente
                        </span>

                        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                            {activeTab === "PUBLICATIONS"
                                ? "¿Qué necesitas reparar hoy?"
                                : "Seguimiento de tus trabajos"}
                        </h1>

                        <p className="text-sm leading-relaxed text-blue-100">
                            {activeTab === "PUBLICATIONS"
                                ? "Publica tu requerimiento, revisa las propuestas y encuentra profesionales para tus servicios."
                                : "Consulta los trabajos que tienen un técnico asignado y revisa el avance de cada servicio."}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-[110px] rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-center shadow-sm backdrop-blur-md">
                            <span className="block text-2xl font-black text-white">
                                {activeTab === "PUBLICATIONS" ? total : trabajosAceptados.length}
                            </span>
                            <span className="text-[11px] font-medium uppercase tracking-wider text-blue-200">
                                {activeTab === "PUBLICATIONS" ? "Publicaciones" : "Aceptados"}
                            </span>
                        </div>

                        <div className="min-w-[110px] rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-center shadow-sm backdrop-blur-md">
                            <span className="block text-2xl font-black text-blue-300">
                                {activeTab === "PUBLICATIONS"
                                    ? ofertas.filter((o) => o.estado === "ACTIVA").length
                                    : trabajosEnProceso}
                            </span>
                            <span className="text-[11px] font-medium uppercase tracking-wider text-blue-200">
                                {activeTab === "PUBLICATIONS" ? "Activas en esta página" : "En proceso"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <section className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-8 md:py-10">

                {/* PESTAÑAS DEL PANEL */}
                <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("PUBLICATIONS");
                            setErrorMessage(null);
                            setSuccessMessage(null);
                        }}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition ${
                            activeTab === "PUBLICATIONS"
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                    >
                        <span>📋</span>
                        Mis publicaciones
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                            activeTab === "PUBLICATIONS"
                                ? "bg-white/20 text-white"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}>
                            {total}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("ACCEPTED");
                            setErrorMessage(null);
                            setSuccessMessage(null);
                        }}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition ${
                            activeTab === "ACCEPTED"
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                    >
                        <span>🛠️</span>
                        Trabajos aceptados
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                            activeTab === "ACCEPTED"
                                ? "bg-white/20 text-white"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}>
                            {trabajosAceptados.length}
                        </span>
                    </button>
                </div>

                {/* MENSAJES GENERALES */}
                {errorMessage && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-xs font-semibold text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-xs font-semibold text-emerald-600 transition-all duration-300 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {successMessage}
                    </div>
                )}

                {/* ========================================= */}
                {/* PESTAÑA: MIS PUBLICACIONES */}
                {/* ========================================= */}
                {activeTab === "PUBLICATIONS" && (
                    <div className="space-y-6">

                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-lg dark:bg-blue-950/60">
                                        📋
                                    </span>
                                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        Tus Solicitudes Creadas
                                    </h2>
                                </div>

                                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                    Administra tus requerimientos y consulta las propuestas recibidas.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
                                    {ofertas.length} de {total} requerimientos
                                </span>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMostrarFormulario((prev) => !prev);
                                        setErrorMessage(null);
                                        setSuccessMessage(null);
                                    }}
                                    className={`flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95 ${
                                        mostrarFormulario
                                            ? "border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                            : "bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30"
                                    }`}
                                >
                                    <span className="text-lg leading-none">
                                        {mostrarFormulario ? "✕" : "+"}
                                    </span>
                                    {mostrarFormulario ? "Cerrar formulario" : "Crear publicación"}
                                </button>
                            </div>
                        </div>

                        {/* FORMULARIO DESPLEGABLE */}
                        {mostrarFormulario && (
                            <div className="animate-fade-in space-y-8 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition-all duration-300 dark:border-blue-900/50 dark:bg-gray-900 md:p-10">

                                <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5 dark:border-gray-800">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl dark:bg-blue-950/60">
                                            ✨
                                        </span>
                                        <div>
                                            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                                Crear nueva solicitud
                                            </h2>
                                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                Completa los campos principales de tu requerimiento.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">

                                    {/* ESPECIALIDADES */}
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
                                                    <span className="text-2xl">{item.icon}</span>
                                                    <span className="text-xs">{item.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* TÍTULO */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Título de la Solicitud *
                                                </label>

                                                <span className={`text-[11px] font-medium ${
                                                    form.titulo.length >= MAX_TITULO_LENGTH
                                                        ? "font-bold text-red-500"
                                                        : "text-gray-400 dark:text-gray-500"
                                                }`}>
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

                                    {/* DIRECCIÓN Y DISTRITO */}
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
                                                <option value="" disabled>
                                                    Selecciona un distrito
                                                </option>
                                                {distritos.map((dist) => (
                                                    <option key={dist.id} value={dist.id}>
                                                        {dist.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* DESCRIPCIÓN */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Descripción Detallada *
                                            </label>

                                            <span className={`text-[11px] font-medium ${
                                                form.descripcion.length >= MAX_DESCRIPCION_LENGTH
                                                    ? "font-bold text-red-500"
                                                    : "text-gray-400 dark:text-gray-500"
                                            }`}>
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

                                    {/* ACCIONES */}
                                    <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                resetForm();
                                                setMostrarFormulario(false);
                                            }}
                                            className="rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={isLoading || !clientId}
                                            className="rounded-2xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-95 disabled:opacity-50"
                                        >
                                            {isLoading ? "Publicando..." : "Publicar Solicitud"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* FILTROS */}
                        <form
                            onSubmit={aplicarFiltros}
                            className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {([
                                ["createdFrom", "Creada desde", "date"],
                                ["createdTo", "Creada hasta", "date"],
                            ] as const).map(([name, label, type]) => (
                                <label
                                    key={name}
                                    className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300"
                                >
                                    <span>{label}</span>
                                    <input
                                        type={type}
                                        value={filtros[name]}
                                        min={name === "createdTo" ? filtros.createdFrom : undefined}
                                        onChange={(e) =>
                                            setFiltros((prev) => ({
                                                ...prev,
                                                [name]: e.target.value,
                                            }))
                                        }
                                        className={filterInputClass}
                                    />
                                </label>
                            ))}

                            <label className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                <span>Oficio</span>
                                <select
                                    value={filtros.specialty}
                                    onChange={(e) =>
                                        setFiltros((prev) => ({
                                            ...prev,
                                            specialty: e.target.value,
                                        }))
                                    }
                                    className={filterInputClass}
                                >
                                    <option value="">Todos</option>
                                    {OFICIOS_DISPONIBLES.map((oficio) => (
                                        <option key={oficio.value} value={oficio.value}>
                                            {oficio.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                <span>Estado</span>
                                <select
                                    value={filtros.status}
                                    onChange={(e) =>
                                        setFiltros((prev) => ({
                                            ...prev,
                                            status: e.target.value,
                                        }))
                                    }
                                    className={filterInputClass}
                                >
                                    <option value="">Todos</option>
                                    <option value="OPEN">Publicada</option>
                                    <option value="IN_PROGRESS">En progreso</option>
                                    <option value="COMPLETED">Completada</option>
                                    <option value="CANCELED">Cancelada</option>
                                </select>
                            </label>

                            <label className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                <span>Ordenar por</span>
                                <select
                                    value={filtros.sortBy}
                                    onChange={(e) =>
                                        setFiltros((prev) => ({
                                            ...prev,
                                            sortBy: e.target.value,
                                        }))
                                    }
                                    className={filterInputClass}
                                >
                                    <option value="createdAt">Fecha de creación</option>
                                </select>
                            </label>

                            <label className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                <span>Dirección del orden</span>
                                <select
                                    value={filtros.sortDirection}
                                    onChange={(e) =>
                                        setFiltros((prev) => ({
                                            ...prev,
                                            sortDirection: e.target.value as "ASC" | "DESC",
                                        }))
                                    }
                                    className={filterInputClass}
                                >
                                    <option value="DESC">Descendente</option>
                                    <option value="ASC">Ascendente</option>
                                </select>
                            </label>

                            <label className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                <span>Solicitudes por página</span>
                                <select
                                    value={filtros.size}
                                    onChange={(e) =>
                                        setFiltros((prev) => ({
                                            ...prev,
                                            size: e.target.value,
                                        }))
                                    }
                                    className={filterInputClass}
                                >
                                    {[10, 20, 50].map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
                                <button
                                    type="submit"
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                                >
                                    Aplicar filtros
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setFiltros(FILTROS_INICIALES);
                                        setConsulta({
                                            clientId,
                                            sortBy: "createdAt",
                                            sortDirection: "DESC",
                                            page: 0,
                                            size: 10,
                                        });
                                    }}
                                    className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        </form>

                        {/* LISTADO DE PUBLICACIONES */}
                        {cargandoLista ? (
                            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
                                <p role="status" className="text-sm text-gray-500 dark:text-gray-400">
                                    Cargando solicitudes...
                                </p>
                            </div>
                        ) : errorLista ? (
                            <div
                                role="alert"
                                className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300"
                            >
                                {errorLista}
                                <button
                                    type="button"
                                    onClick={() => setRecarga((prev) => prev + 1)}
                                    className="ml-3 underline"
                                >
                                    Reintentar
                                </button>
                            </div>
                        ) : ofertas.length === 0 ? (
                            <div className="space-y-3 rounded-3xl border border-gray-200/70 bg-white p-12 text-center transition-all duration-300 dark:border-gray-800 dark:bg-gray-900">
                                <p className="text-4xl text-gray-300 dark:text-gray-600">📂</p>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    No se encontraron solicitudes
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Intenta cambiar los filtros o publica un nuevo requerimiento.
                                </p>

                                {!mostrarFormulario && (
                                    <button
                                        type="button"
                                        onClick={() => setMostrarFormulario(true)}
                                        className="mt-3 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                                    >
                                        + Crear mi primera publicación
                                    </button>
                                )}
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
                                                        : item.estado === "EN PROCESO"
                                                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"
                                                            : item.estado === "COMPLETADA"
                                                                ? "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                                                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                                }`}>
                                                    {item.estado}
                                                </span>

                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    Creado el {item.fechaCreacion}
                                                </span>
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
                                                        {[
                                                            item.specificAddress,
                                                            item.nombreDistrito ??
                                                            distritos.find(
                                                                (distrito) =>
                                                                    distrito.id === item.ubigeoDistrictId
                                                            )?.name,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(", ") || "Distrito no disponible"}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                                                    <span>💬</span>
                                                    <span>{item.propuestasCount} propuestas</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BOTONES */}
                                        <div className="flex w-full flex-col gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 md:w-auto md:items-end md:border-t-0 md:pt-0">
                                            <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => abrirDetalle(item)}
                                                    className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition-all duration-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 md:flex-none"
                                                >
                                                    Ver detalles
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => abrirPropuestas(item)}
                                                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 md:flex-none"
                                                >
                                                    💬 Ver propuestas ({item.propuestasCount})
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleEliminar(item.id)}
                                                    disabled={eliminandoId !== null}
                                                    className="rounded-xl p-2.5 text-xs text-gray-400 transition-all duration-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-gray-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
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
                                onClick={() =>
                                    setConsulta((prev) => ({
                                        ...prev,
                                        page: prev.page - 1,
                                    }))
                                }
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                Anterior
                            </button>

                            <span>
                                Página {totalPaginas === 0 ? 0 : consulta.page + 1} de {totalPaginas}
                            </span>

                            <button
                                type="button"
                                disabled={cargandoLista || consulta.page + 1 >= totalPaginas}
                                onClick={() =>
                                    setConsulta((prev) => ({
                                        ...prev,
                                        page: prev.page + 1,
                                    }))
                                }
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================= */}
                {/* PESTAÑA: TRABAJOS ACEPTADOS */}
                {/* ========================================= */}
                {activeTab === "ACCEPTED" && (
                    <div className="space-y-6">

                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-lg dark:bg-blue-950/60">
                                        🛠️
                                    </span>
                                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        Trabajos aceptados
                                    </h2>
                                </div>

                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Aquí puedes revisar el avance de los servicios que ya tienen un técnico asignado.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => void cargarTrabajosAceptados()}
                                disabled={cargandoAceptados}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                {cargandoAceptados ? "Actualizando..." : "↻ Actualizar"}
                            </button>
                        </div>

                        {/* RESUMEN DE ESTADOS */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                            En proceso
                                        </p>
                                        <p className="mt-1 text-2xl font-extrabold text-blue-900 dark:text-blue-100">
                                            {trabajosEnProceso}
                                        </p>
                                    </div>
                                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl dark:bg-blue-900/50">
                                        🔧
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-blue-700/80 dark:text-blue-300/80">
                                    Servicios que están siendo realizados por un técnico.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900/60 dark:bg-green-950/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                                            Finalizados
                                        </p>
                                        <p className="mt-1 text-2xl font-extrabold text-green-900 dark:text-green-100">
                                            {trabajosCompletados}
                                        </p>
                                    </div>
                                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl dark:bg-green-900/50">
                                        ✓
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-green-700/80 dark:text-green-300/80">
                                    Servicios que el técnico ya marcó como finalizados.
                                </p>
                            </div>
                        </div>

                        {/* BUSCADOR */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Buscar entre tus trabajos
                            </label>
                            <input
                                type="text"
                                value={busquedaAceptados}
                                onChange={(e) => setBusquedaAceptados(e.target.value)}
                                placeholder="Buscar por publicación, técnico, oficio o distrito..."
                                className={inputClass}
                            />
                        </div>

                        {/* ERROR */}
                        {errorAceptados && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                                {errorAceptados}
                                <button
                                    type="button"
                                    onClick={() => void cargarTrabajosAceptados()}
                                    className="ml-2 font-semibold underline"
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}

                        {/* CARGANDO */}
                        {cargandoAceptados ? (
                            <div className="grid gap-5 sm:grid-cols-2">
                                {[1, 2].map((item) => (
                                    <div
                                        key={item}
                                        className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                                    />
                                ))}
                            </div>
                        ) : trabajosAceptadosFiltrados.length === 0 ? (
                            /* SIN TRABAJOS */
                            <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
                                <div className="mb-4 text-5xl">📋</div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {busquedaAceptados
                                        ? "No se encontraron resultados"
                                        : "Todavía no tienes trabajos aceptados"}
                                </h3>
                                <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                    {busquedaAceptados
                                        ? "No encontramos trabajos que coincidan con tu búsqueda."
                                        : "Cuando aceptes una propuesta y la publicación pase a estado En progreso, el trabajo aparecerá aquí. Podrás consultar al técnico asignado y revisar el avance del servicio."}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab("PUBLICATIONS")}
                                    className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                    Volver a mis publicaciones
                                </button>
                            </div>
                        ) : (
                            /* LISTADO DE TRABAJOS ACEPTADOS */
                            <div className="grid gap-5 sm:grid-cols-2">
                                {trabajosAceptadosFiltrados.map((job) => (
                                    <article
                                        key={job.id}
                                        className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                                    >
                                        {/* CABECERA DE LA TARJETA */}
                                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                {job.specialty}
                                            </span>

                                            {job.status === "IN_PROGRESS" ? (
                                                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                    En proceso
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                                                    Finalizado
                                                </span>
                                            )}
                                        </div>

                                        {/* INFORMACIÓN DEL TRABAJO */}
                                        <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                                            {job.title}
                                        </h3>

                                        <p className="mb-5 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                            {job.description || "Sin descripción disponible."}
                                        </p>

                                        {/* DATOS DEL TÉCNICO */}
                                        <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg dark:bg-blue-900/50">
                                                    👨‍🔧
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                                        Técnico asignado
                                                    </p>
                                                    <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                                                        {job.technicianName}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-3 text-sm dark:border-gray-700">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Ubicación
                                                </span>
                                                <span className="text-right font-medium text-gray-800 dark:text-gray-200">
                                                    {job.districtName}
                                                </span>
                                            </div>

                                            {job.specificAddress && (
                                                <div className="flex items-start justify-between gap-3 text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        Dirección
                                                    </span>
                                                    <span className="max-w-[60%] text-right font-medium text-gray-800 dark:text-gray-200">
                                                        {job.specificAddress}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Publicado el
                                                </span>
                                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                                    {formatDate(job.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* SEGUIMIENTO DEL TRABAJO */}
                                        <div className="mt-5 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                                            <div className="mb-4 flex items-center justify-between gap-2">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                                    Seguimiento del servicio
                                                </h4>
                                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                    {job.status === "COMPLETED" ? "100%" : "En ejecución"}
                                                </span>
                                            </div>

                                            <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        job.status === "COMPLETED"
                                                            ? "w-full bg-green-500"
                                                            : "w-2/3 bg-blue-600"
                                                    }`}
                                                />
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div>
                                                    <span className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                                        ✓
                                                    </span>
                                                    <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                                                        Aceptado
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                        job.status === "IN_PROGRESS" || job.status === "COMPLETED"
                                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                                            : "bg-gray-100 text-gray-400 dark:bg-gray-700"
                                                    }`}>
                                                        {job.status === "IN_PROGRESS" || job.status === "COMPLETED"
                                                            ? "✓"
                                                            : "2"}
                                                    </span>
                                                    <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                                                        En ejecución
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                        job.status === "COMPLETED"
                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                                                            : "bg-gray-100 text-gray-400 dark:bg-gray-700"
                                                    }`}>
                                                        {job.status === "COMPLETED" ? "✓" : "3"}
                                                    </span>
                                                    <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                                                        Finalizado
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ACCIÓN SEGÚN ESTADO */}
                                        <div className="mt-5">
                                            {job.status === "IN_PROGRESS" ? (
                                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-lg">🔧</span>
                                                        <div>
                                                            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                                                                Servicio en desarrollo
                                                            </p>
                                                            <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                                                                El técnico todavía está realizando el trabajo. Podrás calificarlo cuando marque el servicio como finalizado.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => abrirCalificacion(job)}
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                                >
                                                    <span>⭐</span>
                                                    Calificar técnico
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* ========================================= */}
            {/* MODAL: DETALLE DE PUBLICACIÓN */}
            {/* ========================================= */}
            {ofertaSeleccionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm transition-all duration-300">
                    <div className="max-h-[90vh] w-full max-w-lg transform space-y-6 overflow-y-auto rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl transition-all duration-300 dark:border-gray-700 dark:bg-gray-900">

                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Detalles del Requerimiento
                            </h3>

                            <button
                                type="button"
                                onClick={cerrarModal}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {cargandoDetalle ? (
                            <p role="status" className="text-sm text-gray-500 dark:text-gray-400">
                                Cargando detalle...
                            </p>
                        ) : errorDetalle ? (
                            <div role="alert" className="text-sm text-red-600 dark:text-red-400">
                                {errorDetalle}
                                <button
                                    type="button"
                                    onClick={() => setRecargaDetalle((prev) => prev + 1)}
                                    className="ml-3 underline"
                                >
                                    Reintentar
                                </button>
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
                                        <span className="text-gray-400 dark:text-gray-500">
                                            Estado:
                                        </span>
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                            {({
                                                OPEN: "Publicada",
                                                IN_PROGRESS: "En progreso",
                                                COMPLETED: "Completada",
                                                CANCELED: "Cancelada",
                                            } as Record<string, string>)[detalle.status] ?? detalle.status}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400 dark:text-gray-500">
                                            Cliente:
                                        </span>
                                        <span className="text-right font-semibold text-gray-800 dark:text-gray-200">
                                            {detalle.clientName}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400 dark:text-gray-500">
                                            Profesional asignado:
                                        </span>
                                        <span className="text-right font-semibold text-gray-800 dark:text-gray-200">
                                            {detalle.technicianName || "Sin asignar"}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400 dark:text-gray-500">
                                            Ubicación:
                                        </span>
                                        <span className="text-right font-semibold text-gray-800 dark:text-gray-200">
                                            {[
                                                detalle.ubigeoDistrictName,
                                                detalle.ubigeoProvinceName,
                                                detalle.ubigeoDepartmentName,
                                            ].filter(Boolean).join(", ") || "No disponible"}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400 dark:text-gray-500">
                                            Dirección:
                                        </span>
                                        <span className="text-right font-semibold text-gray-800 dark:text-gray-200">
                                            {detalle.specificAddress || "No disponible"}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400 dark:text-gray-500">
                                            Fecha de creación:
                                        </span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                                            {new Date(detalle.createdAt).toLocaleString("es-PE")}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                        Descripción
                                    </span>

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
                                        {eliminandoId === ofertaSeleccionada.id
                                            ? "Eliminando..."
                                            : "Eliminar Requerimiento"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* MODAL: PROPUESTAS RECIBIDAS */}
            {/* ========================================= */}
            {mostrarPropuestas && ofertaPropuestas && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm animate-fade-in"
                    onClick={cerrarPropuestas}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gray-100 bg-white shadow-2xl animate-scale-up dark:border-gray-700 dark:bg-gray-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between border-b border-gray-100 p-6 dark:border-gray-800">
                            <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-950/60">
                                    💬
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Propuestas recibidas
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Revisa las propuestas para tu solicitud.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={cerrarPropuestas}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-500 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-5 dark:border-gray-800 dark:bg-gray-800/40">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                        Solicitud
                                    </span>
                                    <h4 className="mt-1 text-base font-bold text-gray-900 dark:text-white">
                                        {ofertaPropuestas.title}
                                    </h4>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        {ofertaPropuestas.specialty}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-blue-100 bg-white px-5 py-3 text-center dark:border-blue-900 dark:bg-gray-900">
                                    <span className="block text-2xl font-black text-blue-600 dark:text-blue-400">
                                        {ofertaPropuestas.propuestasCount}
                                    </span>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                        Propuestas
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {ofertaPropuestas.propuestasCount === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-gray-700">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl dark:bg-gray-800">
                                        📭
                                    </div>

                                    <h4 className="text-base font-bold text-gray-800 dark:text-white">
                                        Todavía no tienes propuestas
                                    </h4>

                                    <p className="mt-2 max-w-sm text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                        Cuando los profesionales revisen tu solicitud y envíen sus cotizaciones, aparecerán aquí.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 dark:border-blue-900/50 dark:bg-blue-950/20">
                                        <div className="flex items-start gap-3">
                                            <span className="text-xl">📨</span>
                                            <div>
                                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">
                                                    Tienes {ofertaPropuestas.propuestasCount} propuestas recibidas
                                                </h4>
                                                <p className="mt-1 text-xs leading-relaxed text-blue-700/80 dark:text-blue-300/70">
                                                    Para mostrar las cotizaciones completas y permitir que aceptes una propuesta, todavía falta conectar el servicio de propuestas del backend.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800">
                                        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                                            Una vez conectado ese servicio, al aceptar una propuesta la publicación deberá pasar a estado <strong>IN_PROGRESS</strong>. Automáticamente aparecerá en la pestaña de trabajos aceptados.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end border-t border-gray-100 p-6 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={cerrarPropuestas}
                                className="rounded-xl bg-gray-100 px-6 py-3 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* MODAL: CALIFICAR TÉCNICO */}
            {/* ========================================= */}
            {trabajoCalificar && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={cerrarCalificacion}
                >
                    <div
                        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-gray-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* CABECERA */}
                        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-7 text-white">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_50%)]" />

                            <div className="relative flex items-start justify-between gap-4">
                                <div>
                                    <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
                                        Finalización del servicio
                                    </span>

                                    <h2 className="text-2xl font-extrabold">
                                        Califica al técnico
                                    </h2>

                                    <p className="mt-2 text-sm leading-relaxed text-blue-100">
                                        El servicio fue marcado como finalizado. Comparte tu experiencia con el profesional.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={cerrarCalificacion}
                                    disabled={ratingSubmitting}
                                    className="rounded-xl border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-50"
                                    aria-label="Cerrar calificación"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleRatingSubmit} className="space-y-6 p-6">

                            {/* RESUMEN DEL TRABAJO */}
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/60">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Trabajo finalizado
                                </p>

                                <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                                    {trabajoCalificar.title}
                                </h3>

                                <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                    <p>
                                        <strong>Técnico:</strong> {trabajoCalificar.technicianName}
                                    </p>
                                    <p>
                                        <strong>Especialidad:</strong> {trabajoCalificar.specialty}
                                    </p>
                                    <p>
                                        <strong>Distrito:</strong> {trabajoCalificar.districtName}
                                    </p>
                                </div>
                            </div>

                            {/* ESTRELLAS */}
                            <div className="text-center">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    ¿Cómo fue tu experiencia con el técnico?
                                </h3>

                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Selecciona una calificación de 1 a 5 estrellas.
                                </p>

                                <div className="mt-5 flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() =>
                                                setRatingForm((prev) => ({
                                                    ...prev,
                                                    rating: star,
                                                }))
                                            }
                                            className={`text-4xl transition hover:scale-110 ${
                                                ratingForm.rating >= star
                                                    ? "text-amber-400"
                                                    : "text-gray-300 dark:text-gray-600"
                                            }`}
                                            aria-label={`Calificar con ${star} estrellas`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>

                                <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    {ratingForm.rating === 1 && "Muy mala experiencia"}
                                    {ratingForm.rating === 2 && "Mala experiencia"}
                                    {ratingForm.rating === 3 && "Experiencia regular"}
                                    {ratingForm.rating === 4 && "Buena experiencia"}
                                    {ratingForm.rating === 5 && "Excelente experiencia"}
                                    {ratingForm.rating === 0 && "Aún no has seleccionado una calificación"}
                                </p>
                            </div>

                            {/* COMENTARIO */}
                            <div>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <label className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Comentario sobre el técnico
                                    </label>

                                    <span className="text-xs text-gray-400">
                                        {ratingForm.comment.length}/500
                                    </span>
                                </div>

                                <textarea
                                    rows={4}
                                    maxLength={500}
                                    value={ratingForm.comment}
                                    onChange={(e) =>
                                        setRatingForm((prev) => ({
                                            ...prev,
                                            comment: e.target.value,
                                        }))
                                    }
                                    placeholder="Cuéntanos cómo fue el servicio, la puntualidad, la comunicación y el resultado del trabajo. (Opcional)"
                                    className={`${inputClass} resize-none`}
                                />
                            </div>

                            {/* AVISO */}
                            <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
                                <span className="text-lg">ℹ️</span>
                                <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                                    Tu calificación se podrá guardar cuando esté conectado el servicio de calificaciones del backend.
                                </p>
                            </div>

                            {ratingError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                                    {ratingError}
                                </div>
                            )}

                            {ratingFeedback && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                                    {ratingFeedback}
                                </div>
                            )}

                            {/* BOTONES */}
                            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={cerrarCalificacion}
                                    disabled={ratingSubmitting}
                                    className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                    Cerrar
                                </button>

                                <button
                                    type="submit"
                                    disabled={ratingSubmitting}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {ratingSubmitting ? "Procesando..." : "Enviar calificación"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}