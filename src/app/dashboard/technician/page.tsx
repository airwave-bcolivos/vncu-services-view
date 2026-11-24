"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/header/header";
import { jobService, JobSummary, JobDetail } from "@/services/job.service";
import { reviewService, ClientReviewResponse } from "@/services/review.service";

type ProposalForm = {
    amount: string;
    estimatedTime: string;
    description: string;
};

type ProposalJob = JobSummary | JobDetail;

type AcceptedJob = {
    id: string;
    title: string;
    specialty: string;
    description: string;
    clientName: string;
    districtName: string;
    specificAddress?: string;
    acceptedAt: string;
    amount: number;
    estimatedTime: string;
    status: "PENDING" | "COMPLETED";
};

type RatingForm = {
    rating: number;
    comment: string;
};

const initialProposal: ProposalForm = {
    amount: "",
    estimatedTime: "",
    description: "",
};

const initialRating: RatingForm = {
    rating: 0,
    comment: "",
};

type DashboardTab = "AVAILABLE" | "ACCEPTED";

export default function TechnicianDashboard() {
    // TRABAJOS DISPONIBLES
    const [jobs, setJobs] = useState<JobSummary[]>([]);
    const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState("");

    // TRABAJOS ACEPTADOS
    const [acceptedJobs, setAcceptedJobs] = useState<AcceptedJob[]>([]);
    const [acceptedLoading, setAcceptedLoading] = useState(false);
    const [acceptedError, setAcceptedError] = useState("");

    // PESTAÑAS
    const [activeTab, setActiveTab] = useState<DashboardTab>("AVAILABLE");

    // PROPUESTAS
    const [proposalJob, setProposalJob] = useState<ProposalJob | null>(null);
    const [proposalForm, setProposalForm] = useState<ProposalForm>(initialProposal);
    const [proposalFeedback, setProposalFeedback] = useState("");
    const [proposalError, setProposalError] = useState("");
    const [proposalSubmitting, setProposalSubmitting] = useState(false);

    // CALIFICACIÓN DEL CLIENTE
    const [ratingJob, setRatingJob] = useState<AcceptedJob | null>(null);
    const [ratingForm, setRatingForm] = useState<RatingForm>(initialRating);
    const [ratingError, setRatingError] = useState("");
    const [ratingFeedback, setRatingFeedback] = useState("");
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingLoading, setRatingLoading] = useState(false);
    const [existingReview, setExistingReview] = useState<ClientReviewResponse | null>(null);

    // FILTROS
    const [search, setSearch] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [districtId, setDistrictId] = useState("");
    const [minRating, setMinRating] = useState("");
    const [sortBy] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [districtOptions, setDistrictOptions] = useState<{ id: string; name: string }[]>([]);
    const [specialtyOptions, setSpecialtyOptions] = useState<string[]>([]);

    const size = 9;

    const inputClass =
        "w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-900";

    // CARGAR TRABAJOS DISPONIBLES
    const loadJobs = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setError("");

            const response = await jobService.getOpenJobs({
                specialty: specialty || undefined,
                districtId: districtId || undefined,
                minRating: minRating ? Number(minRating) : undefined,
                sortBy,
                sortDirection,
                page,
                size,
            }, signal);

            if (!signal?.aborted) {
                setJobs(response.content);
                setTotalPages(response.totalPages);
                setTotalElements(response.totalElements);

                setSpecialtyOptions((previous) =>
                    Array.from(new Set([
                        ...previous,
                        ...response.content.map((job) => job.specialty).filter(Boolean),
                    ]))
                );

                setDistrictOptions((previous) => {
                    const options = [...previous];

                    response.content.forEach((job) => {
                        if (
                            job.ubigeoDistrictId &&
                            job.ubigeoDistrictName &&
                            !options.some((item) => item.id === job.ubigeoDistrictId)
                        ) {
                            options.push({
                                id: job.ubigeoDistrictId,
                                name: job.ubigeoDistrictName,
                            });
                        }
                    });

                    return options;
                });
            }
        } catch (err) {
            if (!signal?.aborted) {
                console.error("Error al cargar trabajos:", err);
                setError("No se pudieron cargar los trabajos disponibles.");
            }
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [specialty, districtId, minRating, sortBy, sortDirection, page]);

    useEffect(() => {
        const controller = new AbortController();
        loadJobs(controller.signal);
        return () => controller.abort();
    }, [loadJobs]);

    // CARGAR TRABAJOS ACEPTADOS
    const loadAcceptedJobs = useCallback(async () => {
        try {
            setAcceptedLoading(true);
            setAcceptedError("");

            /*
             * PENDIENTE DE BACKEND:
             *
             * Aquí se conectará el servicio que consulte los trabajos
             * cuya propuesta fue aceptada por el cliente.
             *
             * Ejemplo futuro:
             * const response = await proposalService.getAcceptedByTechnician(technicianId);
             * setAcceptedJobs(response);
             *
             * Por ahora no se cargan datos ficticios.
             */
            setAcceptedJobs([]);
        } catch (err) {
            console.error("Error al cargar trabajos aceptados:", err);
            setAcceptedError("No se pudieron cargar tus trabajos aceptados.");
        } finally {
            setAcceptedLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "ACCEPTED") {
            loadAcceptedJobs();
        }
    }, [activeTab, loadAcceptedJobs]);

    // FILTRAR TRABAJOS DISPONIBLES
    const filteredJobs = useMemo(() => {
        const value = search.toLowerCase().trim();
        if (!value) return jobs;

        return jobs.filter((job) =>
            job.title.toLowerCase().includes(value) ||
            (job.description || "").toLowerCase().includes(value) ||
            job.specialty.toLowerCase().includes(value) ||
            (job.ubigeoDistrictName || "").toLowerCase().includes(value)
        );
    }, [jobs, search]);

    // FILTRAR TRABAJOS ACEPTADOS
    const filteredAcceptedJobs = useMemo(() => {
        const value = search.toLowerCase().trim();
        if (!value) return acceptedJobs;

        return acceptedJobs.filter((job) =>
            job.title.toLowerCase().includes(value) ||
            job.specialty.toLowerCase().includes(value) ||
            job.clientName.toLowerCase().includes(value) ||
            job.districtName.toLowerCase().includes(value)
        );
    }, [acceptedJobs, search]);

    const clearFilters = () => {
        setSearch("");
        setSpecialty("");
        setDistrictId("");
        setMinRating("");
        setSortDirection("DESC");
        setPage(0);
    };

    const hasActiveFilters = Boolean(
        search || specialty || districtId || minRating || sortDirection !== "DESC"
    );

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("es-PE", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    // DETALLES DEL TRABAJO
    const openJobDetail = async (id: string) => {
        try {
            const viewerId = localStorage.getItem("vncu_user_id");

            if (!viewerId) {
                setError("No se encontró la sesión del técnico.");
                return;
            }

            setDetailLoading(true);
            setSelectedJob(null);

            const detail = await jobService.getJobDetail(id, viewerId);
            setSelectedJob(detail);
        } catch (err) {
            console.error("Error al consultar el trabajo:", err);
            setError("No se pudieron cargar los detalles del trabajo.");
        } finally {
            setDetailLoading(false);
        }
    };

    // ABRIR FORMULARIO DE PROPUESTA
    const openProposal = (job: ProposalJob) => {
        setSelectedJob(null);
        setProposalJob(job);
        setProposalForm(initialProposal);
        setProposalFeedback("");
        setProposalError("");
    };

    const closeProposal = () => {
        if (proposalSubmitting) return;
        setProposalJob(null);
        setProposalForm(initialProposal);
        setProposalFeedback("");
        setProposalError("");
    };

    // ENVIAR PROPUESTA
    const handleProposalSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProposalError("");
        setProposalFeedback("");

        const technicianId = localStorage.getItem("vncu_user_id");

        if (!technicianId) {
            setProposalError("No se encontró la sesión del técnico. Inicia sesión nuevamente.");
            return;
        }

        const amount = Number(proposalForm.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            setProposalError("Ingresa un monto válido mayor a cero.");
            return;
        }

        if (!proposalForm.estimatedTime.trim() || !proposalForm.description.trim()) {
            setProposalError("Completa todos los campos para continuar.");
            return;
        }

        if (proposalForm.description.trim().length < 20) {
            setProposalError("La descripción debe tener al menos 20 caracteres.");
            return;
        }

        if (!proposalJob) return;

        setProposalSubmitting(true);

        try {
            const payload = {
                jobId: proposalJob.id,
                technicianId,
                amount,
                estimatedTime: proposalForm.estimatedTime.trim(),
                description: proposalForm.description.trim(),
            };

            /*
             * PENDIENTE DE BACKEND:
             *
             * Aquí se conectará el endpoint de creación de propuestas.
             *
             * Ejemplo futuro:
             * await proposalService.createProposal(payload);
             */

            console.log("Propuesta preparada para conectar:", payload);

            setProposalFeedback(
                "El formulario está validado. La conexión con el servicio para enviar la propuesta está pendiente."
            );
        } catch (err) {
            console.error("Error al preparar la propuesta:", err);
            setProposalError("No se pudo preparar la propuesta. Inténtalo nuevamente.");
        } finally {
            setProposalSubmitting(false);
        }
    };

    // ABRIR CALIFICACIÓN Y CONSULTAR SI YA EXISTE UNA RESEÑA
    const openRating = async (job: AcceptedJob) => {
        if (job.status === "COMPLETED") return;

        setRatingJob(job);
        setRatingForm(initialRating);
        setRatingError("");
        setRatingFeedback("");
        setExistingReview(null);
        setRatingLoading(true);

        try {
            const review = await reviewService.getClientReviewByJobOffer(job.id);

            setExistingReview(review);
            setRatingForm({
                rating: review.rating,
                comment: review.comment || "",
            });
        } catch (err) {
            const status = (err as { response?: { status?: number } }).response?.status;

            if (status === 404) {
                // No existe una calificación previa.
                setExistingReview(null);
                setRatingForm(initialRating);
            } else {
                console.error("Error al consultar la calificación anterior:", err);
                setRatingError(
                    "No se pudo consultar la calificación anterior. Inténtalo nuevamente."
                );
            }
        } finally {
            setRatingLoading(false);
        }
    };

    // CERRAR MODAL DE CALIFICACIÓN
    const closeRating = () => {
        if (ratingSubmitting || ratingLoading) return;

        setRatingJob(null);
        setRatingForm(initialRating);
        setRatingError("");
        setRatingFeedback("");
        setExistingReview(null);
    };

    // ENVIAR CALIFICACIÓN AL CLIENTE
    const handleRatingSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setRatingError("");
        setRatingFeedback("");

        if (!ratingJob) return;

        if (existingReview) {
            setRatingError("Este trabajo ya cuenta con una calificación registrada.");
            return;
        }

        const technicianId = localStorage.getItem("vncu_user_id");

        if (!technicianId) {
            setRatingError("No se encontró la sesión del técnico.");
            return;
        }

        if (ratingForm.rating < 1 || ratingForm.rating > 5) {
            setRatingError("Selecciona una calificación de 1 a 5 estrellas.");
            return;
        }

        setRatingSubmitting(true);

        try {
            const review = await reviewService.createClientReview(ratingJob.id, {
                rating: ratingForm.rating,
                comment: ratingForm.comment.trim() || undefined,
            });

            setExistingReview(review);
            setRatingForm({
                rating: review.rating,
                comment: review.comment || "",
            });

            setRatingFeedback(
                "Tu calificación se registró correctamente. Ya no podrás modificarla."
            );
        } catch (err) {
            const status = (err as { response?: { status?: number } }).response?.status;

            console.error("Error al registrar la calificación:", err);

            if (status === 409) {
                setRatingError(
                    "Ya existe una calificación para este trabajo. Se consultará la información registrada."
                );

                try {
                    const review = await reviewService.getClientReviewByJobOffer(ratingJob.id);

                    setExistingReview(review);
                    setRatingForm({
                        rating: review.rating,
                        comment: review.comment || "",
                    });
                } catch (reviewError) {
                    console.error("Error al recuperar la calificación existente:", reviewError);
                }
            } else {
                setRatingError(
                    "No se pudo registrar la calificación. Verifica tu conexión e inténtalo nuevamente."
                );
            }
        } finally {
            setRatingSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
            <Header />

            {/* BANNER SUPERIOR */}
            <div className="relative mb-8 overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-12 text-white shadow-md">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />

                <div className="relative z-10 mx-auto flex max-w-5xl flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="max-w-xl space-y-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-blue-100 shadow-sm backdrop-blur-md">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-300" />
                            Portal de Oportunidades - Técnico
                        </span>

                        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                            {activeTab === "AVAILABLE"
                                ? "Encuentra trabajos disponibles"
                                : "Gestiona tus trabajos aceptados"}
                        </h1>

                        <p className="text-sm leading-relaxed text-blue-100">
                            {activeTab === "AVAILABLE"
                                ? "Explora las solicitudes publicadas por clientes y ofrece tus servicios profesionales."
                                : "Consulta los trabajos que los clientes aceptaron y gestiona su finalización."}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-[110px] rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-center shadow-sm backdrop-blur-md">
                            <span className="block text-2xl font-black text-white">
                                {activeTab === "AVAILABLE" ? totalElements : acceptedJobs.length}
                            </span>
                            <span className="text-[11px] font-medium uppercase tracking-wider text-blue-200">
                                {activeTab === "AVAILABLE" ? "Resultados" : "Aceptados"}
                            </span>
                        </div>

                        <div className="min-w-[110px] rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-center shadow-sm backdrop-blur-md">
                            <span className="block text-2xl font-black text-blue-300">
                                {activeTab === "AVAILABLE"
                                    ? jobs.filter((job) => job.status === "OPEN").length
                                    : acceptedJobs.filter((job) => job.status === "PENDING").length}
                            </span>
                            <span className="text-[11px] font-medium uppercase tracking-wider text-blue-200">
                                {activeTab === "AVAILABLE" ? "Disponibles" : "Pendientes"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                {/* PESTAÑAS PRINCIPALES */}
                <section className="mb-8">
                    <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:flex-row dark:border-gray-800 dark:bg-gray-900">
                        <button
                            onClick={() => {
                                setActiveTab("AVAILABLE");
                                setSearch("");
                            }}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition ${
                                activeTab === "AVAILABLE"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            }`}
                        >
                            <span>🔎</span>
                            Trabajos disponibles
                            <span className={`rounded-full px-2 py-0.5 text-xs ${
                                activeTab === "AVAILABLE"
                                    ? "bg-white/20 text-white"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                            }`}>
                                {totalElements}
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                setActiveTab("ACCEPTED");
                                setSearch("");
                            }}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition ${
                                activeTab === "ACCEPTED"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            }`}
                        >
                            <span>📋</span>
                            Trabajos aceptados
                            <span className={`rounded-full px-2 py-0.5 text-xs ${
                                activeTab === "ACCEPTED"
                                    ? "bg-white/20 text-white"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                            }`}>
                                {acceptedJobs.length}
                            </span>
                        </button>
                    </div>
                </section>

                {/* CONTENIDO: TRABAJOS DISPONIBLES */}
                {activeTab === "AVAILABLE" && (
                    <>
                        {/* BÚSQUEDA Y FILTROS */}
                        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <div className="mb-5">
                                <h2 className="text-lg font-bold">Buscar trabajos</h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Utiliza los filtros para encontrar oportunidades que se adapten a tus preferencias.
                                </p>
                            </div>

                            <div className="mb-5">
                                <label className="mb-2 block text-sm font-medium">
                                    Buscar por palabra clave
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Buscar por título, oficio o distrito..."
                                        className={`${inputClass} pl-12`}
                                    />
                                </div>
                            </div>

                            <div className="mb-5">
                                <div className="mb-3 flex items-center gap-2">
                                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M4 5h16M7 12h10m-7 7h4" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <h3 className="font-semibold">Filtros avanzados</h3>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Especialidad</label>
                                        <select
                                            value={specialty}
                                            onChange={(e) => {
                                                setSpecialty(e.target.value);
                                                setPage(0);
                                            }}
                                            className={inputClass}
                                        >
                                            <option value="">Todas las especialidades</option>
                                            {specialtyOptions.map((item) => (
                                                <option key={item} value={item}>{item}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Localidad (distrito)</label>
                                        <select
                                            value={districtId}
                                            onChange={(e) => {
                                                setDistrictId(e.target.value);
                                                setPage(0);
                                            }}
                                            className={inputClass}
                                        >
                                            <option value="">Todos los distritos</option>
                                            {districtOptions.map((district) => (
                                                <option key={district.id} value={district.id}>{district.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Calificación mínima</label>
                                        <select
                                            value={minRating}
                                            onChange={(e) => {
                                                setMinRating(e.target.value);
                                                setPage(0);
                                            }}
                                            className={inputClass}
                                        >
                                            <option value="">Todas las calificaciones</option>
                                            <option value="1">1 estrella o más</option>
                                            <option value="2">2 estrellas o más</option>
                                            <option value="3">3 estrellas o más</option>
                                            <option value="4">4 estrellas o más</option>
                                            <option value="5">5 estrellas</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Ordenar por</label>
                                        <select
                                            value={sortDirection}
                                            onChange={(e) => {
                                                setSortDirection(e.target.value as "ASC" | "DESC");
                                                setPage(0);
                                            }}
                                            className={inputClass}
                                        >
                                            <option value="DESC">Más recientes</option>
                                            <option value="ASC">Más antiguos</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Los resultados se actualizan automáticamente al cambiar los filtros.
                                </p>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    disabled={!hasActiveFilters}
                                    className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        </section>

                        {/* LISTADO DE TRABAJOS DISPONIBLES */}
                        <section>
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-bold">Trabajos disponibles</h2>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {loading
                                            ? "Cargando trabajos..."
                                            : `${filteredJobs.length} resultados en esta página de ${totalElements} trabajos`}
                                    </p>
                                </div>

                                <button
                                    onClick={() => loadJobs()}
                                    disabled={loading}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                    ↻ Actualizar
                                </button>
                            </div>

                            {error && (
                                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                                    {error}
                                </div>
                            )}

                            {loading ? (
                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {[1, 2, 3, 4, 5, 6].map((item) => (
                                        <div key={item} className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
                                    ))}
                                </div>
                            ) : filteredJobs.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
                                    <div className="mb-4 text-4xl">🔎</div>
                                    <h3 className="text-lg font-semibold">No hay trabajos disponibles</h3>
                                    <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 dark:text-gray-400">
                                        {specialty
                                            ? `Por el momento no hay ofertas disponibles para la especialidad ${specialty}.`
                                            : districtId
                                                ? `No encontramos trabajos disponibles en ${districtOptions.find((item) => item.id === districtId)?.name || "el distrito seleccionado"}.`
                                                : minRating
                                                    ? `No encontramos trabajos que cumplan con la calificación mínima de ${minRating} estrellas.`
                                                    : search
                                                        ? "No encontramos trabajos que coincidan con tu búsqueda."
                                                        : "Por el momento no hay ofertas de trabajo disponibles. Intenta nuevamente más tarde."}
                                    </p>
                                    {hasActiveFilters && (
                                        <button onClick={clearFilters} className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                                            Limpiar filtros
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {filteredJobs.map((job) => (
                                        <article
                                            key={job.id}
                                            className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                                        >
                                            <div className="mb-4 flex items-start justify-between gap-3">
                                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                    {job.specialty}
                                                </span>
                                                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                                                    Disponible
                                                </span>
                                            </div>

                                            <h3 className="mb-2 text-lg font-bold">{job.title}</h3>
                                            <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                                {job.description || "El cliente no agregó una descripción."}
                                            </p>

                                            <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                                                <div className="flex items-center justify-between gap-2 text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400">Ubicación</span>
                                                    <span className="text-right font-medium">{job.ubigeoDistrictName || "Distrito no disponible"}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400">Publicado</span>
                                                    <span className="font-medium">{formatDate(job.createdAt)}</span>
                                                </div>
                                            </div>

                                            <div className="mt-5 grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => openJobDetail(job.id)}
                                                    className="rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                                                >
                                                    Ver detalles
                                                </button>
                                                <button
                                                    onClick={() => openProposal(job)}
                                                    className="rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                                                >
                                                    Hacer propuesta
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}

                            {!loading && totalPages > 1 && (
                                <div className="mt-8 flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setPage((current) => Math.max(0, current - 1))}
                                        disabled={page === 0}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
                                    >
                                        Anterior
                                    </button>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Página {page + 1} de {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* CONTENIDO: TRABAJOS ACEPTADOS */}
                {activeTab === "ACCEPTED" && (
                    <section>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold">Trabajos aceptados</h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Aquí aparecerán los trabajos cuyas propuestas fueron aceptadas por los clientes.
                                </p>
                            </div>

                            <button
                                onClick={loadAcceptedJobs}
                                disabled={acceptedLoading}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                                ↻ Actualizar
                            </button>
                        </div>

                        {/* SUBPESTAÑAS / ESTADOS */}
                        <div className="mb-6 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                            Trabajos pendientes
                                        </p>
                                        <p className="mt-1 text-2xl font-extrabold text-blue-900 dark:text-blue-100">
                                            {acceptedJobs.filter((job) => job.status === "PENDING").length}
                                        </p>
                                    </div>
                                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl dark:bg-blue-900/50">
                                        📋
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-blue-700/80 dark:text-blue-300/80">
                                    Servicios que todavía debes realizar o finalizar.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900/60 dark:bg-green-950/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                                            Trabajos finalizados
                                        </p>
                                        <p className="mt-1 text-2xl font-extrabold text-green-900 dark:text-green-100">
                                            {acceptedJobs.filter((job) => job.status === "COMPLETED").length}
                                        </p>
                                    </div>
                                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl dark:bg-green-900/50">
                                        ✓
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-green-700/80 dark:text-green-300/80">
                                    Servicios que ya fueron marcados como finalizados.
                                </p>
                            </div>
                        </div>

                        {/* BUSCADOR DE TRABAJOS ACEPTADOS */}
                        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <label className="mb-2 block text-sm font-medium">
                                Buscar entre tus trabajos
                            </label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por trabajo, cliente o distrito..."
                                className={inputClass}
                            />
                        </div>

                        {acceptedError && (
                            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                                {acceptedError}
                            </div>
                        )}

                        {acceptedLoading ? (
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
                                ))}
                            </div>
                        ) : filteredAcceptedJobs.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
                                <div className="mb-4 text-5xl">📋</div>
                                <h3 className="text-lg font-bold">Todavía no tienes trabajos aceptados</h3>
                                <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                    Cuando un cliente acepte una de tus propuestas, el trabajo aparecerá aquí. Podrás consultar sus detalles, gestionar su finalización y calificar al cliente.
                                </p>
                                <button
                                    onClick={() => setActiveTab("AVAILABLE")}
                                    className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                    Explorar trabajos disponibles
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredAcceptedJobs.map((job) => (
                                    <article
                                        key={job.id}
                                        className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                                    >
                                        <div className="mb-4 flex items-start justify-between gap-3">
                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                {job.specialty}
                                            </span>

                                            {job.status === "PENDING" ? (
                                                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                    Pendiente
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                                                    Finalizado
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="mb-2 text-lg font-bold">{job.title}</h3>
                                        <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                            {job.description || "Sin descripción disponible."}
                                        </p>

                                        <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                                            <div className="flex items-center justify-between gap-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Cliente</span>
                                                <span className="text-right font-medium">{job.clientName}</span>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Ubicación</span>
                                                <span className="text-right font-medium">{job.districtName}</span>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Monto acordado</span>
                                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                    S/ {job.amount.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Tiempo estimado</span>
                                                <span className="text-right font-medium">{job.estimatedTime}</span>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Aceptado el</span>
                                                <span className="font-medium">{formatDate(job.acceptedAt)}</span>
                                            </div>
                                        </div>

                                        {job.specificAddress && (
                                            <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800">
                                                <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                    Dirección del servicio
                                                </p>
                                                <p>{job.specificAddress}</p>
                                            </div>
                                        )}

                                        <div className="mt-5">
                                            {job.status === "PENDING" ? (
                                                <button
                                                    onClick={() => openRating(job)}
                                                    className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                                >
                                                    Marcar como finalizado
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-300">
                                                    <span>✓</span>
                                                    Trabajo finalizado
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </main>

            {/* MODAL DE DETALLES */}
            {(detailLoading || selectedJob) && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={() => {
                        if (!detailLoading) setSelectedJob(null);
                    }}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {detailLoading ? (
                            <div className="py-12 text-center">
                                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                                <p className="text-gray-500 dark:text-gray-400">Cargando detalles del trabajo...</p>
                            </div>
                        ) : selectedJob && (
                            <>
                                <div className="mb-6 flex items-start justify-between gap-4">
                                    <div>
                                        <span className="mb-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                            {selectedJob.specialty}
                                        </span>
                                        <h2 className="text-2xl font-bold">{selectedJob.title}</h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedJob(null)}
                                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        aria-label="Cerrar detalles"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <h3 className="mb-2 font-semibold">Descripción del trabajo</h3>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                            {selectedJob.description}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 font-semibold">Información del cliente</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedJob.clientName}</p>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 font-semibold">Ubicación</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {[
                                                selectedJob.ubigeoDistrictName,
                                                selectedJob.ubigeoProvinceName,
                                                selectedJob.ubigeoDepartmentName,
                                            ].filter(Boolean).join(", ")}
                                        </p>
                                        {selectedJob.specificAddress && (
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                Dirección: {selectedJob.specificAddress}
                                            </p>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de publicación</p>
                                        <p className="mt-1 text-sm font-medium">{formatDate(selectedJob.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                                    <button
                                        onClick={() => setSelectedJob(null)}
                                        className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        onClick={() => openProposal(selectedJob)}
                                        className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        Hacer una propuesta
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL PARA HACER PROPUESTA */}
            {proposalJob && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={closeProposal}
                >
                    <div
                        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-gray-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-7 text-white">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_50%)]" />
                            <div className="relative flex items-start justify-between gap-4">
                                <div>
                                    <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
                                        Nueva propuesta
                                    </span>
                                    <h2 className="text-2xl font-extrabold">Presenta tu oferta al cliente</h2>
                                    <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-100">
                                        Indica el costo de tu visita y diagnóstico, el tiempo estimado y cómo realizarás la revisión inicial.
                                    </p>
                                </div>
                                <button
                                    onClick={closeProposal}
                                    disabled={proposalSubmitting}
                                    className="rounded-xl border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-50"
                                    aria-label="Cerrar propuesta"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleProposalSubmit} className="space-y-6 p-6">
                            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                    Trabajo seleccionado
                                </p>
                                <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                                    {proposalJob.title}
                                </h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {proposalJob.specialty}
                                    {proposalJob.ubigeoDistrictName ? ` · ${proposalJob.ubigeoDistrictName}` : ""}
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    ¿Cuánto cobrarás por la visita y el diagnóstico? <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">S/</span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        value={proposalForm.amount}
                                        onChange={(e) => setProposalForm({ ...proposalForm, amount: e.target.value })}
                                        placeholder="Ej. 150.00"
                                        className={`${inputClass} pl-12`}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Este precio corresponde únicamente a la visita, revisión y diagnóstico inicial. Si se requiere una reparación, el costo se acordará directamente entre el técnico y el cliente.
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    Tiempo estimado para la visita y el diagnóstico <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={100}
                                    value={proposalForm.estimatedTime}
                                    onChange={(e) => setProposalForm({ ...proposalForm, estimatedTime: e.target.value })}
                                    placeholder="Ej. 2 días, 5 horas o 1 semana"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <label className="text-sm font-semibold">
                                        Detalles de tu propuesta <span className="text-red-500">*</span>
                                    </label>
                                    <span className="text-xs text-gray-400">
                                        {proposalForm.description.length}/1000
                                    </span>
                                </div>
                                <textarea
                                    required
                                    minLength={20}
                                    maxLength={1000}
                                    rows={5}
                                    value={proposalForm.description}
                                    onChange={(e) => setProposalForm({ ...proposalForm, description: e.target.value })}
                                    placeholder="Explica brevemente cómo realizarás la visita, qué aspectos revisarás y qué incluye el diagnóstico inicial..."
                                    className={`${inputClass} resize-none`}
                                />
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Una buena descripción ayudará al cliente a conocer mejor tu servicio.
                                </p>
                            </div>

                            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                                <span className="text-lg">💡</span>
                                <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                                    El monto indicado corresponde únicamente a la visita y al diagnóstico. Los costos de reparaciones, repuestos o materiales adicionales se acordarán directamente entre el técnico y el cliente.
                                </p>
                            </div>

                            {proposalError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                                    {proposalError}
                                </div>
                            )}

                            {proposalFeedback && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                                    {proposalFeedback}
                                </div>
                            )}

                            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={closeProposal}
                                    disabled={proposalSubmitting}
                                    className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={proposalSubmitting}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {proposalSubmitting ? "Preparando..." : "Enviar propuesta"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PARA FINALIZAR Y CALIFICAR AL CLIENTE */}
            {ratingJob && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={closeRating}
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
                                        Califica al cliente
                                    </h2>
                                    <p className="mt-2 text-sm leading-relaxed text-blue-100">
                                        Comparte tu experiencia con el cliente y registra tu calificación.
                                    </p>
                                </div>
                                <button
                                    onClick={closeRating}
                                    disabled={ratingSubmitting || ratingLoading}
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
                                    Trabajo que vas a finalizar
                                </p>
                                <h3 className="mt-1 text-lg font-bold">{ratingJob.title}</h3>
                                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
                                    <span>Cliente: {ratingJob.clientName}</span>
                                    <span>{ratingJob.specialty}</span>
                                </div>
                            </div>

                            {/* ESTADO DE CONSULTA */}
                            {ratingLoading ? (
                                <div className="flex items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                    Consultando si ya registraste una calificación...
                                </div>
                            ) : (
                                <>
                                    {/* CALIFICACIÓN */}
                                    <div className="text-center">
                                        <h3 className="text-base font-bold">
                                            {existingReview
                                                ? "Tu calificación registrada"
                                                : "¿Cómo fue tu experiencia con este cliente?"}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {existingReview
                                                ? "Esta calificación ya fue registrada y no se puede modificar."
                                                : "Selecciona de 1 a 5 estrellas."}
                                        </p>

                                        <div className="mt-5 flex justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    disabled={!!existingReview}
                                                    onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                                                    className={`text-4xl transition ${
                                                        existingReview
                                                            ? "cursor-not-allowed"
                                                            : "hover:scale-110"
                                                    } ${
                                                        ratingForm.rating >= star
                                                            ? "text-amber-400"
                                                            : "text-gray-300 dark:text-gray-600"
                                                    }`}
                                                    aria-label={`${star} estrellas`}
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
                                            <label className="text-sm font-semibold">
                                                Comentario sobre el cliente
                                            </label>
                                            <span className="text-xs text-gray-400">
                                                {ratingForm.comment.length}/500
                                            </span>
                                        </div>
                                        <textarea
                                            rows={4}
                                            maxLength={500}
                                            value={ratingForm.comment}
                                            disabled={!!existingReview}
                                            onChange={(e) => setRatingForm({
                                                ...ratingForm,
                                                comment: e.target.value,
                                            })}
                                            placeholder="Cuéntanos cómo fue la comunicación, coordinación y experiencia durante el servicio. (Opcional)"
                                            className={`${inputClass} resize-none disabled:cursor-not-allowed disabled:opacity-70`}
                                        />
                                        {existingReview && (
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                El comentario corresponde a tu calificación anterior y no puede editarse.
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* AVISO */}
                            <div className={`flex gap-3 rounded-xl border p-4 ${
                                existingReview
                                    ? "border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/30"
                                    : "border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/30"
                            }`}>
                                <span className="text-lg">{existingReview ? "✓" : "ℹ️"}</span>
                                <p className={`text-xs leading-relaxed ${
                                    existingReview
                                        ? "text-green-800 dark:text-green-300"
                                        : "text-blue-800 dark:text-blue-300"
                                }`}>
                                    {existingReview
                                        ? "Ya registraste una calificación para este trabajo. La información se muestra en modo de solo lectura."
                                        : "Al enviar tu calificación, se guardará en el sistema. La finalización del trabajo requiere además la actualización de su estado desde el backend."}
                                </p>
                            </div>

                            {ratingError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                                    {ratingError}
                                </div>
                            )}

                            {ratingFeedback && (
                                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                                    {ratingFeedback}
                                </div>
                            )}

                            {/* BOTONES */}
                            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={closeRating}
                                    disabled={ratingSubmitting || ratingLoading}
                                    className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                    Cerrar
                                </button>

                                {!existingReview && (
                                    <button
                                        type="submit"
                                        disabled={ratingSubmitting || ratingLoading}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {ratingSubmitting ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Registrando...
                                            </>
                                        ) : (
                                            "Enviar calificación"
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}