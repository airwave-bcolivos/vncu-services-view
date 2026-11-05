
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const updateRole = () => {
            setRole(localStorage.getItem("vncu_role"));
        };

        updateRole();

        window.addEventListener("auth-change", updateRole);
        window.addEventListener("storage", updateRole);

        return () => {
            window.removeEventListener("auth-change", updateRole);
            window.removeEventListener("storage", updateRole);
        };
    }, []);

    const closeMenu = () => setMenuOpen(false);

    const logout = () => {
        localStorage.removeItem("vncu_token");
        localStorage.removeItem("vncu_role");
        setRole(null);
        closeMenu();
        window.dispatchEvent(new Event("auth-change"));
        router.push("/login");
    };

    const isClient = role === "CLIENT";
    const isTechnician = role === "TECHNICIAN";

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
            <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

                {/* LOGO */}
                <Link href="/" onClick={closeMenu} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/20">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                    </div>
                    <div>
                        <span className="block text-[25px] font-extrabold leading-none text-gray-900">
                            Vincu<span className="text-blue-600">.</span>
                        </span>
                        <span className="mt-1 block text-[10px] tracking-[0.16em] text-gray-500">
                            CONECTAMOS SOLUCIONES
                        </span>
                    </div>
                </Link>

                {/* ACCIONES DEL HEADER */}
                <div className="flex items-center gap-3">

                    {/* MENU DE ESCRITORIO SIN SESION */}
                    {!role && (
                        <div className="hidden items-center gap-3 md:flex">
                            <Link
                                href="/login"
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                            >
                                Iniciar sesión
                            </Link>

                            <Link
                                href="/register"
                                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700"
                            >
                                Registrarse
                            </Link>
                        </div>
                    )}

                    {/* BOTON HAMBURGUESA Y MENU */}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                            aria-expanded={menuOpen}
                            aria-controls="mobile-menu"
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${
                                menuOpen
                                    ? "border-blue-600 bg-blue-600 text-white shadow-lg"
                                    : "border-blue-100 bg-blue-50 text-blue-700 shadow-sm hover:border-blue-300"
                            } ${!role ? "md:hidden" : ""}`}
                        >
                            <span className="relative flex h-6 w-6 items-center justify-center">
                                <span className={`absolute h-0.5 w-5 rounded-full transition-transform duration-300 ${menuOpen ? "rotate-45 bg-white" : "-translate-y-[6px] bg-current"}`} />
                                <span className={`absolute h-0.5 w-3 rounded-full transition-opacity duration-200 ${menuOpen ? "opacity-0" : "translate-x-1 bg-current"}`} />
                                <span className={`absolute h-0.5 w-5 rounded-full transition-transform duration-300 ${menuOpen ? "-rotate-45 bg-white" : "translate-y-[6px] bg-current"}`} />
                            </span>
                        </button>

                        {/* MENU DESPLEGABLE DEBAJO DE LA HAMBURGUESA */}
                        <div
                            id="mobile-menu"
                            aria-hidden={!menuOpen}
                            className={`absolute right-0 top-full z-50 mt-3 w-72 origin-top-right transition-all duration-200 ${
                                menuOpen
                                    ? "visible translate-y-0 scale-100 opacity-100"
                                    : "invisible -translate-y-2 scale-95 opacity-0 pointer-events-none"
                            }`}
                        >
                            <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-xl shadow-blue-900/10">

                                <p className="px-3 pb-3 pt-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                                    {isClient ? "Espacio del cliente" : isTechnician ? "Espacio del técnico" : "Tu espacio en Vincu"}
                                </p>

                                {!role ? (
                                    <>
                                        <Link
                                            href="/login"
                                            onClick={closeMenu}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-blue-50"
                                        >
                                            <span className="text-sm font-semibold text-gray-800">
                                                Iniciar sesión
                                            </span>
                                        </Link>

                                        <Link
                                            href="/register"
                                            onClick={closeMenu}
                                            className="mt-1 flex items-center gap-3 rounded-xl bg-blue-600 px-3 py-3 text-white hover:bg-blue-700"
                                        >
                                            <span className="text-sm font-bold">
                                                Crear cuenta
                                            </span>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        {isClient && (
                                            <>
                                                <MenuLink
                                                    href="/dashboard/client"
                                                    title="Mis Publicaciones"
                                                    description="Administra tus publicaciones"
                                                    onClick={closeMenu}
                                                />
                                                <MenuLink
                                                    href="/profile"
                                                    title="Mi Perfil"
                                                    description="Tus datos personales"
                                                    onClick={closeMenu}
                                                />
                                            </>
                                        )}

                                        {isTechnician && (
                                            <>
                                                <MenuLink
                                                    href="/dashboard/technician/requests"
                                                    title="Solicitudes disponibles"
                                                    description="Consulta solicitudes de clientes"
                                                    onClick={closeMenu}
                                                />
                                                <MenuLink
                                                    href="/dashboard/technician/profile"
                                                    title="Mi perfil"
                                                    description="Tus datos personales"
                                                    onClick={closeMenu}
                                                />
                                            </>
                                        )}

                                        <div className="my-2 border-t border-gray-100" />

                                        <button
                                            onClick={logout}
                                            className="w-full rounded-xl bg-red-50 px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-100"
                                        >
                                            Cerrar sesión
                                        </button>
                                    </>
                                )}

                                <p className="mt-2 border-t border-gray-100 pt-3 text-center text-[9px] tracking-wider text-gray-400">
                                    VINCULAMOS PERSONAS Y SOLUCIONES
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}

function MenuLink({
                      href,
                      title,
                      description,
                      onClick
                  }: {
    href: string;
    title: string;
    description: string;
    onClick: () => void;
}) {
    const icons: Record<string, React.ReactNode> = {
        "Mis solicitudes": (
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        ),
        "Solicitudes disponibles": (
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        ),
        "Mi perfil": (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21a7 7 0 0 1 14 0" />
            </>
        ),
        "Mi Perfil": (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21a7 7 0 0 1 14 0" />
            </>
        )
    };

    return (
        <Link
            href={href}
            onClick={onClick}
            className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-blue-50"
        >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                >
                    {icons[title] || <circle cx="12" cy="12" r="8" />}
                </svg>
            </span>

            <span className="flex-1">
                <strong className="block text-sm text-gray-800">{title}</strong>
                <small className="text-gray-500">{description}</small>
            </span>

            <span className="text-lg text-gray-400 transition-transform group-hover:translate-x-1">
                ›
            </span>
        </Link>
    );
}
