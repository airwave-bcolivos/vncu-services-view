"use client";

import { useEffect, useRef, useState } from "react";
import { DiagnosticOffer, DiagnosticOfferStatus, jobErrorMessage, jobService } from "@/services/job.service";

const statusLabels: Record<DiagnosticOfferStatus, string> = {
    PENDING: "Pendiente",
    ACCEPTED: "Aceptada",
    REJECTED: "Rechazada",
};

const soles = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

interface Props {
    jobId: string;
    isOpen: boolean;
    focusOnMount?: boolean;
    onAccepted: () => void;
}

export default function DiagnosticOffersTable({ jobId, isOpen, focusOnMount, onAccepted }: Props) {
    const sectionRef = useRef<HTMLElement>(null);
    const [offers, setOffers] = useState<DiagnosticOffer[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [busyOffer, setBusyOffer] = useState<string | null>(null);
    const [reload, setReload] = useState(0);
    const canSelect = isOpen && !offers?.some((offer) => offer.status === "ACCEPTED");

    useEffect(() => {
        if (focusOnMount) sectionRef.current?.focus();
    }, [focusOnMount]);

    useEffect(() => {
        const controller = new AbortController();
        jobService.getDiagnosticOffers(jobId, controller.signal).then((data) => {
            if (!controller.signal.aborted) {
                setOffers(data);
                setLoadError(null);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                setLoadError(jobErrorMessage(error, "No se pudieron cargar las ofertas."));
            }
        });
        return () => controller.abort();
    }, [jobId, reload]);

    async function accept(offer: DiagnosticOffer) {
        if (!window.confirm(`¿Confirmas la selección de ${offer.technicianName} por ${soles.format(offer.diagnosticPrice)}?`)) return;
        setBusyOffer(offer.id);
        setActionError(null);
        try {
            await jobService.acceptDiagnosticOffer(jobId, offer.id);
            onAccepted();
        } catch (error) {
            setActionError(jobErrorMessage(error, "No se pudo seleccionar al técnico.", "La publicación o la oferta ya cambió de estado."));
            setReload((value) => value + 1);
        } finally {
            setBusyOffer(null);
        }
    }

    return (
        <section ref={sectionRef} tabIndex={-1} aria-label="Ofertas de diagnóstico" className="space-y-3">
            <h4 className="font-bold text-gray-900 dark:text-white">Ofertas de diagnóstico</h4>
            {loadError ? (
                <div role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {loadError}
                    <button type="button" className="ml-3 underline" onClick={() => {
                        setLoadError(null);
                        setReload((value) => value + 1);
                    }}>Reintentar</button>
                </div>
            ) : !offers && <p role="status" className="text-sm text-gray-500 dark:text-gray-400">Cargando ofertas…</p>}
            {actionError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{actionError}</p>}
            {offers?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Aún no has recibido ofertas.</p>}
            {offers && offers.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                            <tr>
                                <th scope="col" className="p-3">Técnico</th>
                                <th scope="col" className="p-3">Precio</th>
                                <th scope="col" className="p-3">Descripción</th>
                                <th scope="col" className="p-3">Fecha</th>
                                <th scope="col" className="p-3">Estado</th>
                                {canSelect && <th scope="col" className="p-3">Acción</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 dark:divide-gray-800 dark:text-gray-200">
                            {offers.map((offer) => (
                                <tr key={offer.id}>
                                    <td className="p-3">
                                        <p className="font-semibold">{offer.technicianName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {offer.technicianRatingCount && offer.technicianAverageRating !== null
                                                ? `${offer.technicianAverageRating}/5 (${offer.technicianRatingCount})`
                                                : "Sin calificaciones"}
                                        </p>
                                    </td>
                                    <td className="whitespace-nowrap p-3">{soles.format(offer.diagnosticPrice)}</td>
                                    <td className="min-w-36 whitespace-pre-wrap break-words p-3">{offer.description}</td>
                                    <td className="whitespace-nowrap p-3">{new Date(offer.createdAt).toLocaleDateString("es-PE")}</td>
                                    <td className={`p-3 ${offer.status === "ACCEPTED" ? "font-semibold text-emerald-700 dark:text-emerald-400" : ""}`}>
                                        {statusLabels[offer.status]}
                                    </td>
                                    {canSelect && (
                                        <td className="p-3">
                                            {offer.status === "PENDING" && (
                                                <button type="button" disabled={busyOffer !== null}
                                                    onClick={() => void accept(offer)}
                                                    className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                                                    {busyOffer === offer.id ? "Seleccionando…" : "Seleccionar"}
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
