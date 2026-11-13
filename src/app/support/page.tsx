
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Header from "@/components/header/header";
import { complaintService, ComplaintPayload } from "../../services/complaint.service";

export default function ComplaintsPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<ComplaintPayload>({
        mode: "onChange",
    });

    const descripcion = watch("descripcion", "");

    const onSubmit = async (data: ComplaintPayload) => {
        if (isSaving) return;

        setIsSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await complaintService.createComplaint(data);

            setSuccessMessage("¡Tu reclamo ha sido enviado correctamente! Nuestro equipo de soporte lo revisará.");
            reset();
        } catch (error) {
            console.error(error);
            setErrorMessage("Ocurrió un error al enviar tu reclamo. Inténtalo nuevamente.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-600">
            <Header />

            {/* BANNER SUPERIOR */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white py-12 px-6 shadow-md relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />

                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2 max-w-xl">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs font-semibold backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
                            Atención al Cliente - Vincu
                        </span>

                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            Quejas y Reclamos
                        </h1>

                        <p className="text-blue-100 text-sm leading-relaxed">
                            Cuéntanos qué inconveniente has experimentado. Nuestro equipo de soporte
                            revisará tu solicitud para brindarte una solución.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-5 py-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center min-w-[140px] shadow-sm">
                            <span className="block text-2xl font-black">🎧</span>
                            <span className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">
                                Centro de Soporte
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FORMULARIO */}
            <section className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 md:py-10">
                <div className="bg-white rounded-3xl border border-gray-200/70 shadow-sm p-6 md:p-8 space-y-6">

                    <div className="border-b border-gray-100 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            Enviar un reclamo
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">
                            Completa los siguientes campos para registrar tu solicitud.
                        </p>
                    </div>

                    {/* MENSAJES */}
                    {errorMessage && (
                        <div className="p-3 rounded-2xl text-xs font-semibold bg-red-50 text-red-600 border border-red-100 text-center">
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-4 rounded-2xl text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 text-center">
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        {/* TÍTULO */}
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Título del reclamo *
                            </label>

                            <input
                                {...register("titulo", {
                                    required: "El título del reclamo es obligatorio.",
                                    minLength: {
                                        value: 5,
                                        message: "El título debe tener al menos 5 caracteres.",
                                    },
                                    maxLength: {
                                        value: 150,
                                        message: "El título no puede superar los 150 caracteres.",
                                    },
                                })}
                                type="text"
                                maxLength={150}
                                placeholder="Ej. Problema con el servicio recibido"
                                className={`w-full px-4 py-3 bg-gray-50/50 border rounded-2xl text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none ${
                                    errors.titulo ? "border-red-500" : "border-gray-200"
                                }`}
                            />

                            {errors.titulo && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.titulo.message}
                                </p>
                            )}
                        </div>

                        {/* DESCRIPCIÓN */}
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Descripción del reclamo *
                            </label>

                            <textarea
                                {...register("descripcion", {
                                    required: "La descripción del reclamo es obligatoria.",
                                    minLength: {
                                        value: 10,
                                        message: "Describe tu problema con al menos 10 caracteres.",
                                    },
                                    maxLength: {
                                        value: 300,
                                        message: "La descripción no puede superar los 300 caracteres.",
                                    },
                                })}
                                rows={5}
                                maxLength={300}
                                placeholder="Describe detalladamente el inconveniente que has experimentado..."
                                className={`w-full px-4 py-3 bg-gray-50/50 border rounded-2xl text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none resize-none ${
                                    errors.descripcion ? "border-red-500" : "border-gray-200"
                                }`}
                            />

                            <div className="flex justify-between items-center">
                                {errors.descripcion ? (
                                    <p className="text-red-500 text-xs">
                                        {errors.descripcion.message}
                                    </p>
                                ) : (
                                    <p className="text-gray-400 text-xs">
                                        Máximo 300 caracteres.
                                    </p>
                                )}

                                <span className={`text-xs font-semibold ${
                                    descripcion.length >= 300 ? "text-red-500" : "text-gray-400"
                                }`}>
                                    {descripcion.length}/300
                                </span>
                            </div>
                        </div>

                        {/* BOTÓN ENVIAR */}
                        <div className="pt-3">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md shadow-blue-600/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? "Enviando reclamo..." : "Enviar Reclamo"}
                            </button>

                            <p className="text-center text-[11px] text-gray-400 mt-4">
                                Tu solicitud será enviada al equipo de administración de Vincu.
                            </p>
                        </div>
                    </form>
                </div>
            </section>
        </main>
    );
}
