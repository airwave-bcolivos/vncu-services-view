"use client";

import { useState } from "react";
import Link from "next/link";
// Importamos el componente que acabamos de crear
import RegisterForm from "@/components/auth/RegisterForm";
import Header from "@/components/header/header";

type Role = "CLIENT" | "TECHNICIAN" | null;

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  // VISTA 1: Selección de Rol
  if (!selectedRole) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <section className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Únete a Vincu</h1>
          <p className="text-gray-600 mb-8">¿Cómo deseas usar la plataforma?</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={() => setSelectedRole("CLIENT")}
              className="flex flex-col items-center p-8 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all"
            >
              <span className="text-4xl mb-4">🏠</span>
              <h2 className="text-xl font-semibold text-gray-800">Busco un Maestro</h2>
              <p className="text-sm text-gray-500 mt-2">Necesito reparar algo en mi hogar o empresa.</p>
            </button>

            <button
              onClick={() => setSelectedRole("TECHNICIAN")}
              className="flex flex-col items-center p-8 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all"
            >
              <span className="text-4xl mb-4">🔧</span>
              <h2 className="text-xl font-semibold text-gray-800">Soy Maestro Técnico</h2>
              <p className="text-sm text-gray-500 mt-2">Quiero ofrecer mis servicios y conseguir trabajos.</p>
            </button>
          </div>

          <div className="mt-8 text-sm text-gray-600">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-8 my-8">
        
        <button 
          onClick={() => setSelectedRole(null)}
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          &larr; Volver a selección de cuenta
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">
          Registro de {selectedRole === "CLIENT" ? "Cliente" : "Maestro Técnico"}
        </h1>

        {/* Aquí llamamos al componente y le pasamos el rol que el usuario seleccionó */}
        <RegisterForm role={selectedRole} />

      </div>
    </main>
  );
}