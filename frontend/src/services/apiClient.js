import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000",
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

