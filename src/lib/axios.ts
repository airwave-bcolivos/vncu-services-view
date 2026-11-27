import axios from "axios";

export function sessionHeaders() {
  const token = typeof window === "undefined" ? null : localStorage.getItem("vncu_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = axios.create({
  baseURL: "http://localhost:8080", 
  headers: {
    "Content-Type": "application/json",
  },
});
