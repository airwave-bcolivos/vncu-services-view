import { api } from "../lib/axios";

export interface UserProfile {
    id?: string;
    nombre?: string;
    apellido?: string;
    email: string;
    telefono?: string;
    distrito?: string;
}

export const userService = {
    getProfile: async (): Promise<UserProfile> => {
        // Si tu backend requiere el ID en la URL:
        const userId = localStorage.getItem("vncu_user_id");
        const response = await api.get(`/api/v1/users/${userId}`);

        // O si tu backend usa /me (y ya configuraste el interceptor del token arriba):
        // const response = await api.get("/api/v1/users/me");

        return response.data;
    },

    updateProfile: async (data: UserProfile): Promise<UserProfile> => {
        const userId = localStorage.getItem("vncu_user_id");
        const response = await api.put(`/api/v1/users/${userId}`, data);
        return response.data;
    },
};