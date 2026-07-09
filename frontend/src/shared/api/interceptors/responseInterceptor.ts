import type { AxiosError, AxiosInstance } from "axios";
import { authStorage } from "shared/auth/authStorage";

export function applyResponseInterceptor(client: AxiosInstance) {
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        const requestUrl = error.config?.url ?? "";
        const isAuthRequest = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");
        const onAuthPage = window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/admin/login");

        if (!isAuthRequest) {
          authStorage.clear();
        }

        if (!isAuthRequest && !onAuthPage) {
          window.location.assign("/login");
        }
      }
      return Promise.reject(error);
    },
  );
}