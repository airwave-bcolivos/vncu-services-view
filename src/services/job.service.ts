import { api } from "@/lib/axios";

export interface JobPayload {
    clientId: string;
    title: string;
    specialty: string;
    description: string;
    maxBudget: number;
    ubigeoDistrictId: string;
    specificAddress: string;
    latitude: number | null;
    longitude: number | null;
}

export interface JobResponse {
    id: string;
    clientId: string;
    title: string;
    specialty: string;
    description: string;
    maxBudget: number;
    status: string;
    ubigeoDistrictId: string;
    latitude: number;
    longitude: number;
    createdAt: string;
}

export const jobService = {
    createJob: async (payload: JobPayload): Promise<JobResponse> => {
        const response = await api.post("/api/v1/jobs", payload);
        return response.data;
    },
};