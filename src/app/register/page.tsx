
"use client";

import { useState } from "react";
import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";
import Header from "@/components/header/header";

type Role = "CLIENT" | "TECHNICIAN" | null;

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  // VISTA 1: Selección de Rol
  if (!selectedRole) {
    return (
        <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
          <Header />
          <section className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-8 text-center dark:bg-gray-900 dark:border dark:border-gray-700">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
                Únete a Vincu
              </h1>
              <p className="text-gray-600 mb-8 dark:text-gray-400">
                ¿Cómo deseas usar la plataforma?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button
                    onClick={() => setSelectedRole("CLIENT")}
                    className="flex flex-col items-center p-8 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-950/40"
                >
                  <span className="text-4xl mb-4">🏠</span>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    Busco un Maestro
                  </h2>
                  <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">
                    Necesito reparar algo en mi hogar o empresa.
                  </p>
                </button>

                <button
                    onClick={() => setSelectedRole("TECHNICIAN")}
                    className="flex flex-col items-center p-8 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-950/40"
                >
                  <span className="text-4xl mb-4">🔧</span>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    Soy Maestro Técnico
                  </h2>
                  <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">
                    Quiero ofrecer mis servicios y conseguir trabajos.
                  </p>
                </button>
              </div>

              <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
                ¿Ya tienes una cuenta?{" "}
                <Link
                    href="/login"
                    className="text-blue-600 font-semibold hover:underline dark:text-blue-400"
                >
                  Inicia sesión aquí
                </Link>
              </div>
            </div>
          </section>
        </main>
    );
  }

  // VISTA 2: El Formulario
  return (
      <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />

        <section className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-8 my-8 dark:bg-gray-900 dark:border dark:border-gray-700">

            <button
                onClick={() => setSelectedRole(null)}
                className="text-sm text-blue-600 hover:underline mb-6 inline-block dark:text-blue-400"
            >
              &larr; Volver a selección de cuenta
            </button>

            <h1 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4 dark:text-white dark:border-gray-700">
              Registro de {selectedRole === "CLIENT" ? "Cliente" : "Maestro Técnico"}
            </h1>

            {/* Formulario de registro */}
            <RegisterForm role={selectedRole} />

          </div>
        </section>
      </main>
  );
}
