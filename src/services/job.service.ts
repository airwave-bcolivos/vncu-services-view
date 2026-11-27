
import { api, sessionHeaders } from "@/lib/axios";
import { isAxiosError } from "axios";

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
    clientName: string | null;
    clientPhone: string | null;
    clientEmail: string | null;
    technicianId: string | null;
    technicianName: string | null;
    ubigeoDistrictName: string;
    ubigeoProvinceName: string;
    ubigeoDepartmentName: string;
    specificAddress: string | null;
    latitude: number | null;
    longitude: number | null;
    updatedAt: string;
    diagnosticOfferSubmitted: boolean;
}

export interface DiagnosticOfferPayload {
    diagnosticPrice: number;
    description: string;
}

export type DiagnosticOfferStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface DiagnosticOffer extends DiagnosticOfferPayload {
    id: string;
    technicianName: string;
    technicianAverageRating: number | null;
    technicianRatingCount: number | null;
    status: DiagnosticOfferStatus;
    createdAt: string;
}

export type PendingDiagnosticJob = Pick<JobDetail, "id" | "title" | "specialty" | "description" | "createdAt">;

export interface JobPage<T = JobSummary> {
    content: T[];
    totalElements: number;
    totalPages: number;
}

export type JobSummary = Pick<JobResponse, "id" | "title" | "specialty" | "maxBudget" | "status" | "ubigeoDistrictId" | "createdAt"> & {
    ubigeoDistrictName?: string;
    description?: string;
    specificAddress?: string;
    propuestasCount?: number | null;
};

function jobPath(id: string) {
    return `/api/v1/jobs/${encodeURIComponent(id)}`;
}

export function jobErrorMessage(error: unknown, fallback: string, conflict?: string) {
    if (!isAxiosError(error)) return fallback;
    switch (error.response?.status) {
        case 401:
            return "Tu sesión expiró. Vuelve a iniciar sesión.";
        case 403:
            return "Tu cuenta no tiene permiso para realizar esta acción.";
        case 409:
            return conflict ?? fallback;
        default:
            return fallback;
    }
}

export const jobService = {
    getJobDetail: async (id: string, signal?: AbortSignal): Promise<JobDetail> => {
        const { data } = await api.get<JobDetail>(jobPath(id), {
            signal,
            headers: sessionHeaders(),
        });
        return data;
    },

    deleteJob: async (id: string): Promise<void> => {
        await api.delete(jobPath(id), { headers: sessionHeaders() });
    },

    completeJob: async (id: string): Promise<void> => {
        await api.patch(`${jobPath(id)}/complete`, undefined, { headers: sessionHeaders() });
    },

    createDiagnosticOffer: async (id: string, payload: DiagnosticOfferPayload): Promise<void> => {
        await api.post(`${jobPath(id)}/diagnostic-offers`, payload, { headers: sessionHeaders() });
    },

    getDiagnosticOffers: async (id: string, signal?: AbortSignal): Promise<DiagnosticOffer[]> => {
        const { data } = await api.get<DiagnosticOffer[]>(`${jobPath(id)}/diagnostic-offers`, {
            signal,
            headers: sessionHeaders(),
        });
        return data;
    },

    acceptDiagnosticOffer: async (id: string, offerId: string): Promise<void> => {
        await api.patch(
            `${jobPath(id)}/diagnostic-offers/${encodeURIComponent(offerId)}/accept`,
            undefined,
            { headers: sessionHeaders() },
        );
    },

    getPendingDiagnosticJobs: async (page: number): Promise<JobPage<PendingDiagnosticJob>> => {
        const { data } = await api.get<JobPage<PendingDiagnosticJob>>("/api/v1/jobs/diagnostic-offers/mine", {
            params: { page },
            headers: sessionHeaders(),
        });
        return data;
    },

    getAssignedJobs: async (technicianId: string, page: number, signal?: AbortSignal): Promise<JobPage> => {
        const { data } = await api.get<JobPage>("/api/v1/jobs/assigned", {
            params: { technicianId, page, size: 50 },
            signal,
            headers: sessionHeaders(),
        });
        return data;
    },

    getJobs: async (params: JobFilters, signal?: AbortSignal): Promise<JobPage> => {
        const response = await api.get<JobPage | JobSummary[]>("/api/v1/jobs", {
            params,
            signal,
            headers: { Accept: "application/json" },
        });

        if (Array.isArray(response.data)) {
            return {
                content: response.data,
                totalElements: response.data.length,
                totalPages: 1,
            };
        }

        return response.data;
    },


    getOpenJobs: async (
        params?: {
            specialty?: string;
            districtId?: string;
            minRating?: number;
            page?: number;
            size?: number;
        },
        signal?: AbortSignal
    ): Promise<JobPage> => {
        const response = await api.get<JobPage | JobSummary[]>(
            "/api/v1/jobs/open",
            {
                params,
                signal,
                headers: {
                    Accept: "application/json",
                },
            }
        );

        if (Array.isArray(response.data)) {
            return {
                content: response.data,
                totalElements: response.data.length,
                totalPages: 1,
            };
        }

        return response.data;
    },


    createJob: async (payload: JobPayload): Promise<JobResponse> => {
        const response = await api.post("/api/v1/jobs", payload);
        return response.data;
    },
};
