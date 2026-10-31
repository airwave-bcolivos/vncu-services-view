"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
            <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
                <Link href="/" onClick={closeMenu} className="flex items-center gap-3" aria-label="Vincu - Inicio">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/20">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                    </div>
                    <div>
                        <span className="block text-[25px] font-extrabold leading-none text-gray-900">Vincu<span className="text-blue-600">.</span></span>
                        <span className="mt-1 block text-[10px] tracking-[0.16em] text-gray-500">CONECTAMOS SOLUCIONES</span>
                    </div>
                </Link>

                <div className="hidden items-center gap-3 md:flex">
                    <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700">Iniciar sesión</Link>
                    <Link href="/register" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700">Registrarse</Link>
                </div>

                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={menuOpen}
                    aria-controls="mobile-menu"
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 md:hidden ${
                        menuOpen ? "border-blue-600 bg-blue-600 text-white shadow-lg" : "border-blue-100 bg-blue-50 text-blue-700 shadow-sm hover:border-blue-300"
                    }`}
                >
          <span className="relative flex h-6 w-6 items-center justify-center">
            <span className={`absolute h-0.5 w-5 rounded-full transition-transform duration-300 ${menuOpen ? "rotate-45 bg-white" : "-translate-y-[6px] bg-current"}`} />
            <span className={`absolute h-0.5 w-3 rounded-full transition-opacity duration-200 ${menuOpen ? "opacity-0" : "translate-x-1 bg-current"}`} />
            <span className={`absolute h-0.5 w-5 rounded-full transition-transform duration-300 ${menuOpen ? "-rotate-45 bg-white" : "translate-y-[6px] bg-current"}`} />
          </span>
                </button>
            </nav>

            <div id="mobile-menu" aria-hidden={!menuOpen} className={`grid overflow-hidden transition-all duration-300 md:hidden ${menuOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"}`}>
                <div className="min-h-0 overflow-hidden">
                    <div className="border-t border-blue-100 bg-gradient-to-b from-blue-50 to-white px-5 py-4 sm:px-8">
                        <div className="mx-auto max-w-7xl rounded-2xl border border-gray-100 bg-white p-3 shadow-lg shadow-blue-900/5">
                            <p className="px-3 pb-3 pt-2 text-xs font-bold uppercase tracking-widest text-gray-400">Tu espacio en Vincu</p>

                            <Link href="/login" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1} className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-blue-50">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
                </span>
                                <span className="flex-1"><strong className="block text-sm text-gray-800">Iniciar sesión</strong><small className="text-gray-500">Accede a tu cuenta</small></span>
                                <span className="text-lg text-gray-400 transition-transform group-hover:translate-x-1">›</span>
                            </Link>

                            <Link href="/register" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1} className="group mt-2 flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-3 text-white shadow-md shadow-blue-600/20 transition hover:shadow-lg">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="10" cy="7" r="4" /><path d="M3 21v-2a7 7 0 0 1 11-5.74M19 8v6M22 11h-6" /></svg></span>
                                <span className="flex-1"><strong className="block text-sm">Crear cuenta</strong><small className="text-blue-100">Únete a la comunidad</small></span>
                                <span className="text-lg transition-transform group-hover:translate-x-1">›</span>
                            </Link>

                            <p className="mt-3 border-t border-gray-100 pt-3 text-center text-[10px] tracking-wider text-gray-400">VINCULAMOS PERSONAS Y SOLUCIONES</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}