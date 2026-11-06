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

export interface JobDetail extends Omit<JobResponse, "specificAddress" | "latitude" | "longitude"> {
    clientName: string;
    technicianId: string | null;
    technicianName: string | null;
    ubigeoDistrictName: string;
    ubigeoProvinceName: string;
    ubigeoDepartmentName: string;
    specificAddress: string | null;
    latitude: number | null;
    longitude: number | null;
    updatedAt: string;
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
    getJobDetail: async (id: string, viewerId: string, signal?: AbortSignal): Promise<JobDetail> => {
        const { data } = await api.get<JobDetail>(`/api/v1/jobs/${encodeURIComponent(id)}`, {
            params: { viewerId },
            signal,
            headers: { Accept: "application/json" },
        });
        return data;
    },
    deleteJob: async (id: string): Promise<void> => {
        await api.delete(`/api/v1/jobs/${encodeURIComponent(id)}`);
    },
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
