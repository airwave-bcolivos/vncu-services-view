
import axios from "axios";

export interface ComplaintPayload {
    userId: string;
    title: string;
    description: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const complaintService = {
    createComplaint: async (data: ComplaintPayload): Promise<void> => {
        try {
            await axios.post(
                `${API_URL}/api/v1/complaints`,
                {
                    userId: data.userId,
                    title: data.title,
                    description: data.description,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    "No se pudo registrar el reclamo. Inténtalo nuevamente.";

                throw new Error(message);
            }

            throw new Error("Ocurrió un error inesperado al registrar el reclamo.");
        }
    },
};
