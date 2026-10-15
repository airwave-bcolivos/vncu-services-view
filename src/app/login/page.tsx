"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "../../services/auth.service";
import { LoginPayload } from "../../types/auth";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginPayload>({
    mode: "onChange"
  });

  const onSubmit = async (data: LoginPayload) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Llamamos al backend
      const response = await authService.login(data);
      
      // 2. Guardamos los datos simulando una sesión
      localStorage.setItem("vncu_token", response.token);
      localStorage.setItem("vncu_role", response.role);

      // 3. Redirigimos según el rol
      if (response.role === "CLIENT") {
        router.push("/dashboard/client"); 
      } else {
        router.push("/dashboard/technician"); 
      }
      
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 401) {
        setErrorMessage("Correo o contraseña incorrectos.");
      } else {
        setErrorMessage("Ocurrió un error al intentar iniciar sesión. Intenta de nuevo.");
      }
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-extrabold text-blue-600 tracking-tight">
            Vincu
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-4">Iniciar Sesión</h1>
          <p className="text-sm text-gray-600 mt-2">Bienvenido de nuevo a la plataforma</p>
        </div>

        {/* MENSAJE DE ERROR */}
        {errorMessage && (
          <div className="p-3 rounded mb-6 text-sm font-semibold bg-red-100 text-red-700 text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              {...register("email", { 
                required: "El correo es obligatorio",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Formato de correo inválido"
                }
              })} 
              type="email" 
              className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} 
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              {...register("password", { required: "La contraseña es obligatoria" })} 
              type="password" 
              className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`} 
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors disabled:bg-blue-400 mt-4"
          >
            {isLoading ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600 border-t pt-6">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">
            Regístrate aquí
          </Link>
        </div>

      </div>
    </main>
  );
}