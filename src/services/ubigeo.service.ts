import { api } from "@/lib/axios";

export interface DistritoDto {
    id: string;
    name: string;
    provinceId: string;
}

export const ubigeoService = {
    getDistricts: async (): Promise<DistritoDto[]> => {
        const response = await api.get("/api/v1/ubigeo/districts");
        return response.data;
    },
};