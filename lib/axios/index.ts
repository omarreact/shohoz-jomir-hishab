import axios from "axios";
import { logger } from "@/lib/logger";

const axiosInstance = axios.create({
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Log outgoing requests
    logger.debug({ url: config.url, method: config.method }, "Axios Request");
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    logger.error(
      {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
      },
      "Axios Response Error"
    );
    return Promise.reject(error);
  }
);

export { axiosInstance as axios };
