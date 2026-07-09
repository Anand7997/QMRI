import axios from "axios";
import { applyRequestInterceptor } from "./interceptors/requestInterceptor";
import { applyResponseInterceptor } from "./interceptors/responseInterceptor";

export const axiosClient = axios.create({
  baseURL: "/api/v1",
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

applyRequestInterceptor(axiosClient);
applyResponseInterceptor(axiosClient);
