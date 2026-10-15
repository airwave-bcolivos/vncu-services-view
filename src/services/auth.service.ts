import { api } from "../lib/axios";
import { RegisterClientPayload, RegisterTechnicianPayload } from "../types/auth";

export const authService = {
  registerClient: async (data: RegisterClientPayload) => {
    const response = await api.post("/api/v1/users/register/client", data);
    return response.data;
  },

  registerTechnician: async (data: RegisterTechnicianPayload) => {
    const response = await api.post("/api/v1/users/register/technician", data);
    return response.data;
  },
};