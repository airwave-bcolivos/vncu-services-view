
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Header from "@/components/header/header";
import { complaintService } from "../../services/complaint.service";

type ComplaintType = "QUEJA" | "RECLAMO" | null;

interface ComplaintForm {
    title: string;
    description: string;
}

export default function ComplaintsPage() {
    const [selectedType, setSelectedType] = useState<ComplaintType>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm<ComplaintForm>({
        mode: "onChange",
        defaultValues: {
            title: "",
            description: ""
        }
    });

    const description = watch("description", "");

    const onSubmit = async (data: ComplaintForm) => {
        if (isSaving || !selectedType) return;

        setIsSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const userId = localStorage.getItem("vncu_user_id")?.trim();

            if (!userId) {
                throw new Error(
                    "No se pudo identificar al usuario. Inicia sesión nuevamente."
                );
            }

            await complaintService.createComplaint({
                userId,
                title: data.title.trim(),
                description: data.description.trim()
            });

            setSuccessMessage(
                `¡Tu ${selectedType === "QUEJA" ? "queja" : "reclamo"} ha sido enviado correctamente! Nuestro equipo de soporte revisará tu solicitud.`
            );

            reset();
        } catch (error) {
            console.error("Error al registrar la solicitud:", error);

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Ocurrió un error al enviar tu solicitud. Inténtalo nuevamente."
            );
        } finally {
            setIsSaving(false);
        }
    };

    // VISTA 1: SELECCIÓN DEL TIPO DE SOLICITUD
    if (!selectedType) {
        return (
            <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
                <Header />

                <section className="flex flex-1 items-center justify-center p-6">
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-8 text-center dark:bg-gray-900 dark:border dark:border-gray-700">

                        <div className="text-5xl mb-5">🎧</div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
                            Atención al Cliente
                        </h1>

                        <p className="text-gray-600 mb-8 dark:text-gray-400">
                            ¿Qué tipo de solicitud deseas presentar?
                            Selecciona una opción para continuar.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                            {/* QUEJA */}
                            <button
                                onClick={() => {
                                    setSelectedType("QUEJA");
                                    setErrorMessage(null);
                                    setSuccessMessage(null);
                                }}
                                className="flex flex-col items-center p-8 border-2 border-gray-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-950/40"
                            >
                                <span className="text-5xl mb-4">💬</span>

                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                    Presentar una Queja
                                </h2>

                                <p className="text-sm text-gray-500 mt-3 dark:text-gray-400">
                                    Comunica tu inconformidad sobre la atención o experiencia recibida en Vincu.
                                </p>
                            </button>

                            {/* RECLAMO */}
                            <button
                                onClick={() => {
                                    setSelectedType("RECLAMO");
                                    setErrorMessage(null);
                                    setSuccessMessage(null);
                                }}
                                className="flex flex-col items-center p-8 border-2 border-gray-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-950/40"
                            >
                                <span className="text-5xl mb-4">📋</span>

                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                    Presentar un Reclamo
                                </h2>

                                <p className="text-sm text-gray-500 mt-3 dark:text-gray-400">
                                    Informa sobre un problema relacionado con el servicio recibido y solicita una solución.
                                </p>
                            </button>

                        </div>

                        <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Nuestro equipo de atención al cliente revisará tu solicitud y trabajará para brindarte una respuesta.
                            </p>
                        </div>

                    </div>
                </section>
            </main>
        );
    }

    // VISTA 2: FORMULARIO DE QUEJA O RECLAMO
    return (
        <main className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100">
            <Header />

            {/* BANNER SUPERIOR */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white py-12 px-6 shadow-md relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />

                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">

                    <div className="space-y-2 max-w-xl">

                        <button
                            onClick={() => {
                                setSelectedType(null);
                                setErrorMessage(null);
                                setSuccessMessage(null);
                                reset();
                            }}
                            className="text-sm text-blue-100 hover:text-white hover:underline mb-3"
                        >
                            ← Volver a seleccionar
                        </button>

                        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs font-semibold">
                            Atención al Cliente - Vincu
                        </span>

                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            {selectedType === "QUEJA" ? "Presentar una Queja" : "Presentar un Reclamo"}
                        </h1>

                        <p className="text-blue-100 text-sm leading-relaxed">
                            {selectedType === "QUEJA"
                                ? "Cuéntanos qué aspecto de nuestro servicio no cumplió con tus expectativas. Queremos mejorar tu experiencia."
                                : "Describe el inconveniente que has experimentado con nuestro servicio para que podamos brindarte una solución."
                            }
                        </p>
                    </div>

                    <div className="px-5 py-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center min-w-[140px]">
                        <span className="block text-3xl mb-1">
                            {selectedType === "QUEJA" ? "💬" : "📋"}
                        </span>
                        <span className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">
                            {selectedType === "QUEJA" ? "Tipo: Queja" : "Tipo: Reclamo"}
                        </span>
                    </div>

                </div>
            </div>

            {/* FORMULARIO */}
            <section className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 md:py-10">

                <div className="bg-white rounded-3xl border border-gray-200/70 shadow-sm p-6 md:p-8 space-y-6 dark:bg-gray-900 dark:border-gray-700">

                    <div className="border-b border-gray-100 pb-4 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Datos de tu {selectedType === "QUEJA" ? "queja" : "reclamo"}
                        </h2>

                        <p className="text-xs text-gray-400 mt-1 dark:text-gray-400">
                            Completa los siguientes campos para registrar tu solicitud.
                        </p>
                    </div>

                    {/* MENSAJES */}
                    {errorMessage && (
                        <div className="p-3 rounded-2xl text-xs font-semibold bg-red-50 text-red-600 border border-red-100 text-center dark:bg-red-950/40 dark:text-red-300 dark:border-red-900">
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-4 rounded-2xl text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 text-center dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        {/* TÍTULO */}
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Título de la {selectedType === "QUEJA" ? "queja" : "reclamación"} *
                            </label>

                            <input
                                {...register("title", {
                                    required: "El título es obligatorio.",
                                    minLength: {
                                        value: 5,
                                        message: "El título debe tener al menos 5 caracteres."
                                    },
                                    maxLength: {
                                        value: 150,
                                        message: "El título no puede superar los 150 caracteres."
                                    },
                                    validate: value =>
                                        value.trim().length >= 5 ||
                                        "El título debe tener al menos 5 caracteres."
                                })}
                                type="text"
                                maxLength={150}
                                placeholder="Ej. Problema con el servicio recibido"
                                className={`w-full px-4 py-3 bg-gray-50/50 border rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none ${
                                    errors.title
                                        ? "border-red-500 dark:border-red-500"
                                        : "border-gray-200 dark:border-gray-700"
                                }`}
                            />

                            {errors.title && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.title.message}
                                </p>
                            )}
                        </div>

                        {/* DESCRIPCIÓN */}
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Descripción de la {selectedType === "QUEJA" ? "queja" : "reclamación"} *
                            </label>

                            <textarea
                                {...register("description", {
                                    required: "La descripción es obligatoria.",
                                    minLength: {
                                        value: 10,
                                        message: "Describe tu problema con al menos 10 caracteres."
                                    },
                                    maxLength: {
                                        value: 300,
                                        message: "La descripción no puede superar los 300 caracteres."
                                    },
                                    validate: value =>
                                        value.trim().length >= 10 ||
                                        "Describe tu problema con al menos 10 caracteres."
                                })}
                                rows={5}
                                maxLength={300}
                                placeholder="Describe detalladamente el inconveniente que has experimentado..."
                                className={`w-full px-4 py-3 bg-gray-50/50 border rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none resize-none ${
                                    errors.description
                                        ? "border-red-500 dark:border-red-500"
                                        : "border-gray-200 dark:border-gray-700"
                                }`}
                            />

                            <div className="flex justify-between items-center">
                                {errors.description ? (
                                    <p className="text-red-500 text-xs">
                                        {errors.description.message}
                                    </p>
                                ) : (
                                    <p className="text-gray-400 text-xs dark:text-gray-500">
                                        Máximo 300 caracteres.
                                    </p>
                                )}

                                <span className={`text-xs font-semibold ${
                                    description.length >= 300
                                        ? "text-red-500"
                                        : "text-gray-400 dark:text-gray-500"
                                }`}>
                                    {description.length}/300
                                </span>
                            </div>
                        </div>

                        {/* BOTÓN */}
                        <div className="pt-3">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md shadow-blue-600/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving
                                    ? "Enviando solicitud..."
                                    : `Enviar ${selectedType === "QUEJA" ? "Queja" : "Reclamo"}`
                                }
                            </button>

                            <p className="text-center text-[11px] text-gray-400 mt-4 dark:text-gray-500">
                                Tu solicitud será enviada al equipo de administración de Vincu.
                            </p>
                        </div>

                    </form>
                </div>
            </section>
        </main>
    );
}
