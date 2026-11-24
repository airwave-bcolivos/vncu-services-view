
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Header from "@/components/header/header";
import { userService, UserProfile } from "../../services/user.service";

type UserRole = "CLIENT" | "TECHNICIAN";

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [role, setRole] = useState<UserRole | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<UserProfile>({
        mode: "onChange",
    });

    const perfilData = watch();

    const esTecnico = role === "TECHNICIAN";
    const esCliente = role === "CLIENT";

    useEffect(() => {
        cargarPerfil();
    }, []);

    const cargarPerfil = async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const userRole = localStorage.getItem("vncu_role")?.trim();

            if (userRole !== "CLIENT" && userRole !== "TECHNICIAN") {
                throw new Error("No se pudo identificar el tipo de usuario.");
            }

            setRole(userRole);

            const data = await userService.getProfile();
            reset(data);
        } catch (error) {
            console.error(error);
            setErrorMessage("No se pudieron cargar tus datos personales.");
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: UserProfile) => {
        if (isSaving) return;

        setIsSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const updatedProfile = await userService.updateProfile(data);

            reset(updatedProfile);
            setSuccessMessage("¡Tus datos personales se han actualizado correctamente!");
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            setErrorMessage("Ocurrió un error al actualizar tus datos. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    const cancelarEdicion = () => {
        setIsEditing(false);
        setErrorMessage(null);
        cargarPerfil();
    };

    const inputClass = (hasError?: boolean) =>
        `w-full px-4 py-3 bg-gray-50/50 border rounded-2xl text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none ${
            hasError
                ? "border-red-500 dark:border-red-500"
                : "border-gray-200 dark:border-gray-700"
        }`;

    const viewClass =
        "mt-1 text-sm font-medium text-gray-900 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700";

    const labelClass =
        "block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500";

    return (
        <main className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100 selection:bg-blue-100 selection:text-blue-600 dark:selection:bg-blue-900 dark:selection:text-blue-100">
            <Header />

            {/* BANNER SUPERIOR */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white py-12 px-6 shadow-md relative overflow-hidden transition-all duration-500">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />

                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2 max-w-xl animate-fade-in">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs font-semibold backdrop-blur-md shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
                            Mi Cuenta - Vincu
                        </span>

                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            Bienvenido a tu Perfil
                        </h1>

                        <p className="text-blue-100 text-sm leading-relaxed">
                            Mantén tu información personal y datos de contacto siempre actualizados para una mejor experiencia.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-5 py-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center min-w-[140px] transform hover:scale-105 transition-all duration-300 shadow-sm">
                            <span className="block text-2xl font-black text-white">
                                {esTecnico ? "🛠️" : "👤"}
                            </span>
                            <span className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">
                                {esTecnico ? "Perfil Técnico" : "Perfil Cliente"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <section className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 md:py-10 space-y-6">
                <div className="bg-white rounded-3xl border border-gray-200/70 shadow-sm p-6 md:p-8 space-y-6 transition-all duration-300 dark:bg-gray-900 dark:border-gray-700 dark:shadow-black/20">

                    {/* ENCABEZADO */}
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4 dark:border-gray-700">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Mis Datos Personales
                            </h2>
                            <p className="text-xs text-gray-400 mt-1 dark:text-gray-400">
                                Consulta y gestiona tu información personal.
                            </p>
                        </div>

                        {!isEditing && !isLoading && perfilData.id && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSuccessMessage(null);
                                    setErrorMessage(null);
                                    setIsEditing(true);
                                }}
                                className="px-4 py-2 bg-blue-50 text-blue-600 font-semibold text-xs rounded-xl hover:bg-blue-100 transition-colors dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60"
                            >
                                ✏️ Editar Perfil
                            </button>
                        )}
                    </div>

                    {/* MENSAJES */}
                    {errorMessage && (
                        <div className="p-3 rounded-2xl text-xs font-semibold bg-red-50 text-red-600 border border-red-100 text-center dark:bg-red-950/40 dark:text-red-300 dark:border-red-900">
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-3 rounded-2xl text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 text-center dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
                            {successMessage}
                        </div>
                    )}

                    {/* CARGANDO */}
                    {isLoading ? (
                        <div className="py-12 text-center text-gray-500 font-medium text-sm dark:text-gray-400">
                            Cargando tu información...
                        </div>
                    ) : !perfilData.id ? (
                        <div className="text-center py-4">
                            <button
                                type="button"
                                onClick={cargarPerfil}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold dark:bg-blue-950/50 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* CALIFICACIÓN DEL TÉCNICO */}
                            {esTecnico && (
                                <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 dark:border-blue-900/50 dark:from-blue-950/40 dark:to-indigo-950/40">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                                                Mi reputación
                                            </span>

                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                                    {perfilData.averageRating != null
                                                        ? Number(perfilData.averageRating).toFixed(2)
                                                        : "—"}
                                                </span>

                                                <div>
                                                    <div className="flex text-yellow-400 text-lg">
                                                        {Array.from({ length: 5 }).map((_, index) => (
                                                            <span key={index}>
                                                                {perfilData.averageRating != null &&
                                                                index < Math.round(Number(perfilData.averageRating))
                                                                    ? "★"
                                                                    : "☆"}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {perfilData.ratingCount ?? 0}{" "}
                                                        {(perfilData.ratingCount ?? 0) === 1
                                                            ? "calificación"
                                                            : "calificaciones"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-4xl">⭐</div>
                                    </div>

                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                                        Tu calificación se calcula automáticamente según las valoraciones recibidas de los clientes.
                                    </p>
                                </div>
                            )}

                            {!isEditing ? (
                                /* VISTA DE INFORMACIÓN */
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelClass}>Nombres</label>
                                            <p className={viewClass}>
                                                {perfilData.nombre || "No especificado"}
                                            </p>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Apellidos</label>
                                            <p className={viewClass}>
                                                {[perfilData.apellido, perfilData.apellidoMaterno]
                                                    .filter(Boolean)
                                                    .join(" ") || "No especificado"}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Correo Electrónico</label>
                                        <p className={viewClass}>
                                            {perfilData.email || "No especificado"}
                                        </p>
                                    </div>

                                    {esCliente && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelClass}>Teléfono</label>
                                                <p className={viewClass}>
                                                    {perfilData.telefono || "No especificado"}
                                                </p>
                                            </div>

                                            <div>
                                                <label className={labelClass}>Dirección</label>
                                                <p className={viewClass}>
                                                    {perfilData.direccion || "No especificada"}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {esTecnico && (
                                        <>
                                            <div>
                                                <label className={labelClass}>Especialidad</label>
                                                <p className={viewClass}>
                                                    {perfilData.especialidad || "No especificada"}
                                                </p>
                                            </div>

                                            <div>
                                                <label className={labelClass}>Descripción profesional</label>
                                                <p className={`${viewClass} min-h-[90px] whitespace-pre-wrap`}>
                                                    {perfilData.descripcion || "Sin descripción profesional."}
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6 dark:border-gray-700">
                                        <div>
                                            <span className={labelClass}>Tipo de documento</span>
                                            <p className={viewClass}>
                                                {perfilData.tipoDocumento || perfilData.codigoTipoDocumento || "No especificado"}
                                            </p>
                                        </div>

                                        <div>
                                            <span className={labelClass}>Número de documento</span>
                                            <p className={viewClass}>
                                                {perfilData.numeroDocumento || "No especificado"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* FORMULARIO DE EDICIÓN */
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Nombres *
                                            </label>

                                            <input
                                                {...register("nombre", {
                                                    required: "El nombre es obligatorio",
                                                })}
                                                type="text"
                                                maxLength={150}
                                                className={inputClass(!!errors.nombre)}
                                            />

                                            {errors.nombre && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.nombre.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Apellido paterno *
                                            </label>

                                            <input
                                                {...register("apellido", {
                                                    required: "El apellido es obligatorio",
                                                })}
                                                type="text"
                                                maxLength={100}
                                                className={inputClass(!!errors.apellido)}
                                            />

                                            {errors.apellido && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.apellido.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Apellido materno
                                        </label>

                                        <input
                                            {...register("apellidoMaterno")}
                                            type="text"
                                            maxLength={100}
                                            className={inputClass()}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Correo Electrónico *
                                        </label>

                                        <input
                                            {...register("email", {
                                                required: "El correo es obligatorio",
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: "Formato de correo inválido",
                                                },
                                            })}
                                            type="email"
                                            maxLength={255}
                                            className={inputClass(!!errors.email)}
                                        />

                                        {errors.email && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.email.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* CAMPOS EXCLUSIVOS DEL CLIENTE */}
                                    {esCliente && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Teléfono
                                                </label>

                                                <input
                                                    {...register("telefono", {
                                                        pattern: {
                                                            value: /^\+?[0-9]{7,15}$/,
                                                            message: "Ingresa de 7 a 15 dígitos, con + opcional al inicio.",
                                                        },
                                                    })}
                                                    type="tel"
                                                    className={inputClass(!!errors.telefono)}
                                                />

                                                {errors.telefono && (
                                                    <p className="text-red-500 text-xs">
                                                        {errors.telefono.message}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Dirección
                                                </label>

                                                <input
                                                    {...register("direccion")}
                                                    type="text"
                                                    maxLength={255}
                                                    className={inputClass()}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* CAMPOS EXCLUSIVOS DEL TÉCNICO */}
                                    {esTecnico && (
                                        <>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Especialidad *
                                                </label>

                                                <input
                                                    {...register("especialidad", {
                                                        required: "La especialidad es obligatoria",
                                                    })}
                                                    type="text"
                                                    maxLength={100}
                                                    placeholder="Ej. Electricidad, gasfitería, carpintería..."
                                                    className={inputClass(!!errors.especialidad)}
                                                />

                                                {errors.especialidad && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {errors.especialidad.message}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Descripción profesional
                                                </label>

                                                <textarea
                                                    {...register("descripcion")}
                                                    maxLength={2000}
                                                    rows={5}
                                                    placeholder="Cuéntales a tus clientes sobre tu experiencia, servicios y habilidades..."
                                                    className={`${inputClass()} resize-none`}
                                                />

                                                <p className="text-xs text-gray-400 text-right">
                                                    Máximo 2000 caracteres
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* DOCUMENTOS */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Tipo de documento *
                                            </label>

                                            <input
                                                {...register("codigoTipoDocumento", {
                                                    required: "Ingresa el tipo de documento",
                                                    setValueAs: (value: string) => value.trim().toUpperCase(),
                                                })}
                                                type="text"
                                                placeholder="DNI"
                                                className={inputClass(!!errors.codigoTipoDocumento)}
                                            />

                                            {errors.codigoTipoDocumento && (
                                                <p className="text-red-500 text-xs">
                                                    {errors.codigoTipoDocumento.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Número de documento *
                                            </label>

                                            <input
                                                {...register("numeroDocumento", {
                                                    required: "Ingresa el número de documento",
                                                    pattern: {
                                                        value: /^[A-Za-z0-9]{8,12}$/,
                                                        message: "Ingresa entre 8 y 12 caracteres alfanuméricos.",
                                                    },
                                                })}
                                                maxLength={12}
                                                type="text"
                                                className={inputClass(!!errors.numeroDocumento)}
                                            />

                                            {errors.numeroDocumento && (
                                                <p className="text-red-500 text-xs">
                                                    {errors.numeroDocumento.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* BOTONES */}
                                    <div className="flex items-center gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow-md shadow-blue-600/20 text-xs disabled:opacity-50"
                                        >
                                            {isSaving ? "Guardando..." : "Guardar Cambios"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={cancelarEdicion}
                                            disabled={isSaving}
                                            className="px-5 py-3 border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all text-xs dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}
