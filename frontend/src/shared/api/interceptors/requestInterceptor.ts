import type { AxiosInstance } from "axios";
import { authStorage } from "shared/auth/authStorage";

export function applyRequestInterceptor(client: AxiosInstance) {
  client.interceptors.request.use((config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}
