import { api } from "../lib/axios";

export interface PageResponse<T> {
    content: T[];
    page?: number;
    size?: number;
    totalElements?: number;
    totalPages?: number;
    last?: boolean;
}

export interface ClientReviewRequest {
    rating: number;
    comment?: string | null;
}

export interface ClientReviewResponse {
    id: string;
    jobOfferId: string;
    clientId?: string;
    technicianId?: string;
    rating: number;
    comment?: string | null;
    createdAt?: string;
}

export interface JobReviewRequest {
    rating: number;
    comment?: string | null;
}

export interface JobReviewResponse {
    id: string;
    jobOfferId: string;
    technicianId?: string;
    clientId?: string;
    rating: number;
    comment?: string | null;
    createdAt?: string;
}

export interface PaginationParams {
    page?: number;
    size?: number;
}

const jsonHeaders = {
    headers: {
        Accept: "application/json",
    },
};

export const reviewService = {
    // --- Reseñas hacia el cliente ---
    createClientReview: async (
        jobOfferId: string,
        payload: ClientReviewRequest
    ): Promise<ClientReviewResponse> => {
        const { data } = await api.post<ClientReviewResponse>(
            `/api/v1/client/${encodeURIComponent(jobOfferId)}/client-review`,
            payload,
            jsonHeaders
        );
        return data;
    },

    getClientReviewByJobOffer: async (
        jobOfferId: string
    ): Promise<ClientReviewResponse> => {
        const { data } = await api.get<ClientReviewResponse>(
            `/api/v1/client/${encodeURIComponent(jobOfferId)}/client-review`,
            jsonHeaders
        );
        return data;
    },

    getReviewsByClient: async (
        clientId: string,
        { page = 0, size = 10 }: PaginationParams = {}
    ): Promise<PageResponse<ClientReviewResponse>> => {
        const { data } = await api.get<PageResponse<ClientReviewResponse>>(
            `/api/v1/clients/${encodeURIComponent(clientId)}/reviews`,
            {
                ...jsonHeaders,
                params: { page, size },
            }
        );
        return data;
    },

    // --- Reseñas hacia el técnico / trabajo ---
    createJobReview: async (
        jobOfferId: string,
        payload: JobReviewRequest
    ): Promise<JobReviewResponse> => {
        const { data } = await api.post<JobReviewResponse>(
            `/api/v1/jobs/${encodeURIComponent(jobOfferId)}/review`,
            payload,
            jsonHeaders
        );
        return data;
    },

    getJobReviewByJobOffer: async (
        jobOfferId: string
    ): Promise<JobReviewResponse> => {
        const { data } = await api.get<JobReviewResponse>(
            `/api/v1/jobs/${encodeURIComponent(jobOfferId)}/review`,
            jsonHeaders
        );
        return data;
    },

    getReviewsByTechnician: async (
        technicianId: string,
        { page = 0, size = 10 }: PaginationParams = {}
    ): Promise<PageResponse<JobReviewResponse>> => {
        const { data } = await api.get<PageResponse<JobReviewResponse>>(
            `/api/v1/technicians/${encodeURIComponent(technicianId)}/reviews`,
            {
                ...jsonHeaders,
                params: { page, size },
            }
        );
        return data;
    },
};