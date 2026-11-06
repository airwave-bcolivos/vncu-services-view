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
}

interface ClientProfileResponse {
    userId: string;
    names: string;
    lastname: string;
    secondLastname?: string | null;
    fullLastname: string;
    email: string;
    phoneNumber?: string | null;
    address?: string | null;
    documentTypeCode: string;
    documentType: string;
    documentId: string;
}

const mapProfile = (data: ClientProfileResponse): UserProfile => {
    return {
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
    };
};

export const userService = {
    getProfile: async (): Promise<UserProfile> => {
        const userId = localStorage.getItem("vncu_user_id")?.trim();
        if (!userId) {
            throw new Error("No se encontró el cliente de la sesión. Inicia sesión nuevamente.");
        }
        const { data } = await api.get<ClientProfileResponse>(`/api/v1/clients/${encodeURIComponent(userId)}`, {
            headers: { Accept: "application/json" },
        });
        return mapProfile(data);
    },

    updateProfile: async (data: UserProfile): Promise<UserProfile> => {
        const userId = localStorage.getItem("vncu_user_id")?.trim();
        if (!userId) throw new Error("No se encontro el cliente de la sesion.");
        const payload = {
            names: data.nombre?.trim(),
            lastname: data.apellido?.trim(),
            secondLastname: data.apellidoMaterno?.trim() || null,
            email: data.email.trim(),
            phoneNumber: data.telefono?.trim() || null,
            address: data.direccion?.trim() || null,
            documentTypeCode: data.codigoTipoDocumento,
            documentId: data.numeroDocumento?.trim(),
        };
        const response = await api.put<ClientProfileResponse>(`/api/v1/clients/${encodeURIComponent(userId)}`, payload, {
            headers: { Accept: "application/json" },
        });
        return mapProfile(response.data);
    },
};
