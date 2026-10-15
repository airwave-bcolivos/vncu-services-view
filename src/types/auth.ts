// Campos compartidos entre ambos roles
export interface BaseRegisterPayload {
  email: string;
  password: string;
  names: string;
  lastname: string;
  secondLastname?: string;
  documentTypeCode: string;
  documentId: string;
}

// Payload específico para Cliente
export interface RegisterClientPayload extends BaseRegisterPayload {
  phoneNumber?: string;
}

// Payload específico para Técnico
export interface RegisterTechnicianPayload extends BaseRegisterPayload {
  specialty: string;
  bioDescription?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  email: string;
  role: string;
  token: string;
}