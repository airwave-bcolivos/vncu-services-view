import { api } from "../lib/axios";

export interface UserProfile {
    id?: string;
    nombre?: string;
    apellido?: string;
    apellidoMaterno?: string;
    email: string;
    telefono?: string;
    direccion?: string;
    tipoDocumento?: string;
    codigoTipoDocumento?: string;
    numeroDocumento?: string;
    especialidad?: string;
    descripcion?: string;
    averageRating?: number | null;
    ratingCount?: number;
}

interface BaseProfileResponse {
    userId: string;
    names: string;
    lastname: string;
    secondLastname?: string | null;
    fullLastname: string;
    email: string;
    documentTypeCode: string;
    documentType: string;
    documentId: string;
}

interface ClientProfileResponse extends BaseProfileResponse {
    phoneNumber?: string | null;
    address?: string | null;
}

const mapClientProfile = (data: ClientProfileResponse): UserProfile => ({
    id: data.userId,
    nombre: data.names,
    apellido: data.lastname,
    apellidoMaterno: data.secondLastname ?? "",
    email: data.email,
    telefono: data.phoneNumber ?? "",
    direccion: data.address ?? "",
    tipoDocumento: data.documentType,
    codigoTipoDocumento: data.documentTypeCode,
    numeroDocumento: data.documentId,
});

const getTechnicianFallbackProfile = (userId: string): UserProfile => ({
    id: userId,
    nombre: localStorage.getItem("vncu_names")?.trim() ?? "",
    apellido: localStorage.getItem("vncu_lastname")?.trim() ?? "",
    apellidoMaterno: localStorage.getItem("vncu_second_lastname")?.trim() ?? "",
    email: localStorage.getItem("vncu_email")?.trim() ?? "",
    tipoDocumento: localStorage.getItem("vncu_doc_type")?.trim() ?? "",
    codigoTipoDocumento: localStorage.getItem("vncu_doc_type_code")?.trim() ?? "",
    numeroDocumento: localStorage.getItem("vncu_doc_id")?.trim() ?? "",
    especialidad: localStorage.getItem("vncu_specialty")?.trim() ?? "",
    descripcion: localStorage.getItem("vncu_bio")?.trim() ?? "",
    averageRating: null,
    ratingCount: 0,
});

const getSession = () => {
    const userId = localStorage.getItem("vncu_user_id")?.trim();
    const role = localStorage.getItem("vncu_role")?.trim();

    if (!userId) {
        throw new Error("No se encontró el usuario de la sesión. Inicia sesión nuevamente.");
    }

    if (role !== "CLIENT" && role !== "TECHNICIAN") {
        throw new Error("No se pudo identificar el tipo de usuario.");
    }

    return { userId, role };
};

export const userService = {
    getProfile: async (): Promise<UserProfile> => {
        const { userId, role } = getSession();

        if (role === "CLIENT") {
            const { data } = await api.get<ClientProfileResponse>(
                `/api/v1/clients/${encodeURIComponent(userId)}`,
                { headers: { Accept: "application/json" } }
            );

            return mapClientProfile(data);
        }

        // Temporalmente sin GET /api/v1/technicians/{userId} porque el endpoint aún no existe en backend
        return getTechnicianFallbackProfile(userId);
    },

    updateProfile: async (data: UserProfile): Promise<UserProfile> => {
        const { userId, role } = getSession();

        const commonPayload = {
            names: data.nombre?.trim(),
            lastname: data.apellido?.trim(),
            secondLastname: data.apellidoMaterno?.trim() || null,
            email: data.email.trim(),
            documentTypeCode: data.codigoTipoDocumento,
            documentId: data.numeroDocumento?.trim(),
        };

        if (role === "CLIENT") {
            const payload = {
                ...commonPayload,
                phoneNumber: data.telefono?.trim() || null,
                address: data.direccion?.trim() || null,
            };

            const response = await api.put<ClientProfileResponse>(
                `/api/v1/clients/${encodeURIComponent(userId)}`,
                payload,
                { headers: { Accept: "application/json" } }
            );

            return mapClientProfile(response.data);
        }

        // Temporalmente sin PUT /api/v1/technicians/{userId} porque el endpoint aún no existe en backend
        return {
            ...data,
            id: userId,
        };
    },
};