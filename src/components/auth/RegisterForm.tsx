"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation"; // Importamos el enrutador de Next.js
import { authService } from "../../services/auth.service";
import { RegisterClientPayload, RegisterTechnicianPayload } from "../../types/auth";

interface RegisterFormProps {
  role: "CLIENT" | "TECHNICIAN";
}

export default function RegisterForm({ role }: RegisterFormProps) {
  const router = useRouter(); // Inicializamos el enrutador
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const { 
    register, 
    handleSubmit, 
    watch, 
    reset,
    formState: { errors } 
  } = useForm<any>({
    mode: "onChange"
  });

  const selectedDocumentType = watch("documentTypeCode");
  const passwordValue = watch("password");

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setMessage(null);

    const { confirmPassword, ...backendData } = data;

    try {
      if (role === "CLIENT") {
        const payload: RegisterClientPayload = { ...backendData };
        await authService.registerClient(payload);
      } else {
        const payload: RegisterTechnicianPayload = { ...backendData };
        await authService.registerTechnician(payload);
      }
      
      setMessage({ type: "success", text: "¡Registro exitoso! Redirigiendo al inicio de sesión..." });
      reset();

      // Esperamos 1.5 segundos para que el usuario lea el mensaje y luego redirigimos a /login
      setTimeout(() => {
        router.push("/login");
      }, 1500);

    } catch (error: any) {
      console.error(error);
      setMessage({ type: "error", text: "Hubo un error al registrar. Verifica los datos o tu conexión al servidor." });
      setIsLoading(false);
    }
  };

  const onError = () => {
    setMessage({ type: "error", text: "Por favor, completa todas las casillas requeridas correctamente." });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4 text-left">
      
      {/* MENSAJE GLOBAL */}
      {message && (
        <div className={`p-3 rounded mb-4 text-sm font-semibold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* 1. CAMPOS COMPARTIDOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
          <input 
            {...register("names", { required: "Los nombres son obligatorios" })} 
            type="text" 
            className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${errors.names ? 'border-red-500' : 'border-gray-300'}`} 
          />
          {errors.names && <p className="text-red-500 text-xs mt-1">{errors.names.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno *</label>
          <input 
            {...register("lastname", { required: "El apellido paterno es obligatorio" })} 
            type="text" 
            className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${errors.lastname ? 'border-red-500' : 'border-gray-300'}`} 
          />
          {errors.lastname && <p className="text-red-500 text-xs mt-1">{errors.lastname.message as string}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno *</label>
        <input 
          {...register("secondLastname", { required: "El apellido materno es obligatorio" })} 
          type="text" 
          className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${errors.secondLastname ? 'border-red-500' : 'border-gray-300'}`} 
        />
        {errors.secondLastname && <p className="text-red-500 text-xs mt-1">{errors.secondLastname.message as string}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento *</label>
          <select 
            {...register("documentTypeCode", { required: "Selecciona el tipo de documento" })} 
            className={`w-full p-2 border rounded bg-white focus:ring-blue-500 focus:border-blue-500 ${errors.documentTypeCode ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Seleccione...</option>
            <option value="DNI">DNI</option>
            <option value="CE">Carnet de Extranjería</option>
          </select>
          {errors.documentTypeCode && <p className="text-red-500 text-xs mt-1">{errors.documentTypeCode.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento *</label>
          <input 
            {...register("documentId", { 
              required: "El número de documento es obligatorio",
              validate: (value) => {
                if (selectedDocumentType === "DNI") {
                  return /^[0-9]{8}$/.test(value) || "El DNI debe tener exactamente 8 números";
                }
                return true;
              }
            })} 
            type="text" 
            className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${errors.documentId ? 'border-red-500' : 'border-gray-300'}`} 
          />
          {errors.documentId && <p className="text-red-500 text-xs mt-1">{errors.documentId.message as string}</p>}
        </div>
      </div>

      {/* 2. CAMPOS EXCLUSIVOS DE CLIENTE */}
      {role === "CLIENT" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Móvil *</label>
          <input 
            {...register("phoneNumber", { 
              required: "El teléfono móvil es obligatorio",
              pattern: {
                value: /^[0-9]{9}$/,
                message: "El teléfono debe tener 9 dígitos"
              }
            })} 
            type="tel" 
            className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`} 
          />
          {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message as string}</p>}
        </div>
      )}

      {/* 3. CAMPOS EXCLUSIVOS DE TÉCNICO */}
      {role === "TECHNICIAN" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad Principal *</label>
            <select 
              {...register("specialty", { required: "Debes seleccionar una especialidad" })} 
              className={`w-full p-2 border rounded bg-white focus:ring-blue-500 focus:border-blue-500 ${errors.specialty ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Seleccione especialidad...</option>
              <option value="GASFITERO">Gasfitero</option>
              <option value="ELECTRICISTA">Electricista</option>
              <option value="PINTURA">Pintura</option>
              <option value="MAESTRO_DE_OBRAS">Maestro de Obras</option>
              <option value="TECNICO_ELECTRODOMESTICOS">Técnico de Electrodomésticos</option>
              <option value="LIMPIEZA">Limpieza</option>
            </select>
            {errors.specialty && <p className="text-red-500 text-xs mt-1">{errors.specialty.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Breve Descripción *</label>
            <textarea 
              {...register("bioDescription", { required: "La descripción de experiencia es obligatoria" })} 
              rows={3} 
              className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${errors.bioDescription ? 'border-red-500' : 'border-gray-300'}`} 
              placeholder="Ej: Experto en limpieza..."
            ></textarea>
            {errors.bioDescription && <p className="text-red-500 text-xs mt-1">{errors.bioDescription.message as string}</p>}
          </div>
        </>
      )}

      {/* 4. DATOS DE ACCESO */}
      <hr className="my-6 border-gray-200" />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
        <input 
          {...register("email", { 
            required: "El email es obligatorio",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Formato de correo inválido (ejemplo@correo.com)"
            }
          })} 
          type="email" 
          className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} 
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
          <input 
            {...register("password", { 
              required: "La contraseña es obligatoria",
              minLength: { value: 6, message: "Debe tener al menos 6 caracteres" }
            })} 
            type="password" 
            className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`} 
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña *</label>
          <input 
            {...register("confirmPassword", { 
              required: "Debes confirmar tu contraseña",
              validate: (value) => value === passwordValue || "Las contraseñas no coinciden"
            })} 
            type="password" 
            className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`} 
          />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message as string}</p>}
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors disabled:bg-blue-400"
      >
        {isLoading ? "Enviando al servidor..." : "Crear mi cuenta"}
      </button>
    </form>
  );
}