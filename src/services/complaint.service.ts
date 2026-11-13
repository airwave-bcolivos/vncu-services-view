
export interface ComplaintPayload {
    titulo: string;
    descripcion: string;
}

export const complaintService = {
    createComplaint: async (data: ComplaintPayload): Promise<void> => {
        const token = localStorage.getItem("vncu_token");

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error("No se pudo registrar el reclamo.");
        }
    },
};
