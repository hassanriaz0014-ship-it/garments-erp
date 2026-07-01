import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: BASE_URL,
});

client.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token') || global.userToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;