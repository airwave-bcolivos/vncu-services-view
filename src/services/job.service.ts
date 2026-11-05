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
    specificAddress: string;
    propuestasCount?: number;
}

export interface JobFilters {
    clientId: string;
    createdFrom?: string;
    createdTo?: string;
    specialty?: string;
    minBudget?: number;
    maxBudget?: number;
    status?: string;
    sortBy: string;
    sortDirection: "ASC" | "DESC";
    page: number;
    size: number;
}

export interface JobPage {
    content: JobSummary[];
    totalElements: number;
    totalPages: number;
}

export type JobSummary = Pick<JobResponse, "id" | "title" | "specialty" | "maxBudget" | "status" | "ubigeoDistrictId" | "createdAt"> & {
    ubigeoDistrictName?: string;
    description?: string;
    specificAddress?: string;
    propuestasCount?: number;
};

export const jobService = {
    getJobs: async (params: JobFilters, signal?: AbortSignal): Promise<JobPage> => {
        const response = await api.get<JobPage | JobSummary[]>("/api/v1/jobs", {
            params,
            signal,
            headers: { Accept: "application/json" },
        });
        if (Array.isArray(response.data)) {
            return { content: response.data, totalElements: response.data.length, totalPages: 1 };
        }
        return response.data;
    },
    createJob: async (payload: JobPayload): Promise<JobResponse> => {
        const response = await api.post("/api/v1/jobs", payload);
        return response.data;
    },
};
