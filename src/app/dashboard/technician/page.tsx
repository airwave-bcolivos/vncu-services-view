
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/header/header";
import {
    jobService,
    JobSummary,
    JobDetail,
    JobFilters
} from "@/services/job.service";

export default function TechnicianDashboard() {
    const [jobs, setJobs] = useState<JobSummary[]>([]);
    const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const size = 9;

    const loadJobs = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setError("");

            const response = await jobService.getOpenJobs({
                specialty: specialty || undefined,
                page,
                size: 10,
            }, signal);

            if (!signal?.aborted) {
                setJobs(response.content);
                setTotalPages(response.totalPages);
            }
        } catch (err) {
            if (!signal?.aborted) {
                console.error("Error al cargar trabajos:", err);
                setError("No se pudieron cargar los trabajos disponibles.");
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [specialty, sortBy, sortDirection, page]);

    useEffect(() => {
        const controller = new AbortController();
        loadJobs(controller.signal);
        return () => controller.abort();
    }, [loadJobs]);

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

    const specialties = useMemo(() => {
        return Array.from(new Set(jobs.map((job) => job.specialty)));
    }, [jobs]);

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

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("es-PE", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Encabezado */}
                <section className="mb-8">
                    <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                        PANEL DEL TÉCNICO
                    </p>

                    <h1 className="text-3xl font-bold tracking-tight">
                        Encuentra trabajos disponibles
                    </h1>

                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Explora las solicitudes publicadas por clientes y encuentra nuevas oportunidades.
                    </p>
                </section>

                {/* Buscador */}
                <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-3">
                            <label className="mb-2 block text-sm font-medium">
                                Buscar trabajos
                            </label>

                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle cx="11" cy="11" r="7" strokeWidth="2" />
                                        <path d="m16 16 4 4" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </span>

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por título, oficio o distrito..."
                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-blue-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Especialidad
                            </label>

                            <select
                                value={specialty}
                                onChange={(e) => {
                                    setSpecialty(e.target.value);
                                    setPage(0);
                                }}
                                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <option value="">Todas las especialidades</option>
                                {specialties.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Ordenar por
                            </label>

                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setPage(0);
                                }}
                                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <option value="createdAt">Fecha de publicación</option>

                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Dirección del orden
                            </label>

                            <select
                                value={sortDirection}
                                onChange={(e) => {
                                    setSortDirection(e.target.value as "ASC" | "DESC");
                                    setPage(0);
                                }}
                                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <option value="DESC">Mayor a menor / Más reciente</option>
                                <option value="ASC">Menor a mayor / Más antiguo</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Resultados */}
                <section>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold">
                                Trabajos disponibles
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {loading ? "Cargando..." : `${filteredJobs.length} trabajos en esta página`}
                            </p>
                        </div>

                        <button
                            onClick={() => loadJobs()}
                            disabled={loading}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                            Actualizar
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
                                <div
                                    key={item}
                                    className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                                />
                            ))}
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
                            <div className="mb-4 text-4xl">🔎</div>
                            <h3 className="text-lg font-semibold">
                                No encontramos trabajos
                            </h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Prueba cambiando los filtros o el término de búsqueda.
                            </p>
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

                                    <h3 className="mb-2 text-lg font-bold">
                                        {job.title}
                                    </h3>

                                    <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                        {job.description || "El cliente no agregó una descripción."}
                                    </p>

                                    <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">

                                        <div className="flex items-center justify-between gap-2 text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                Ubicación
                                            </span>
                                            <span className="text-right font-medium">
                                                {job.ubigeoDistrictName || "Distrito no disponible"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                Publicado
                                            </span>
                                            <span className="font-medium">
                                                {formatDate(job.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openJobDetail(job.id)}
                                        className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        Ver detalles
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}

                    {/* Paginación */}
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
            </main>

            {/* Modal de detalles */}
            {(detailLoading || selectedJob) && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => {
                        if (!detailLoading) setSelectedJob(null);
                    }}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {detailLoading ? (
                            <div className="py-12 text-center">
                                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    Cargando detalles del trabajo...
                                </p>
                            </div>
                        ) : selectedJob && (
                            <>
                                <div className="mb-6 flex items-start justify-between gap-4">
                                    <div>
                                        <span className="mb-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                            {selectedJob.specialty}
                                        </span>

                                        <h2 className="text-2xl font-bold">
                                            {selectedJob.title}
                                        </h2>
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
                                        <h3 className="mb-2 font-semibold">
                                            Descripción del trabajo
                                        </h3>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                            {selectedJob.description}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 font-semibold">
                                            Información del cliente
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {selectedJob.clientName}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 font-semibold">
                                            Ubicación
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {[
                                                selectedJob.ubigeoDistrictName,
                                                selectedJob.ubigeoProvinceName,
                                                selectedJob.ubigeoDepartmentName
                                            ].filter(Boolean).join(", ")}
                                        </p>

                                        {selectedJob.specificAddress && (
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                Dirección: {selectedJob.specificAddress}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2 dark:border-gray-800">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Fecha de publicación
                                            </p>
                                            <p className="mt-1 text-sm font-medium">
                                                {formatDate(selectedJob.createdAt)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Estado
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
                                                Disponible
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedJob(null)}
                                    className="mt-7 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                    Cerrar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
