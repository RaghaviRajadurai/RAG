import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8001",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;

