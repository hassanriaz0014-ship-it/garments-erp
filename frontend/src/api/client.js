import axios from 'axios';

// Your backend server address
// If testing on phone, replace localhost with your PC's IP address
// To find your IP: open command prompt and type ipconfig
const BASE_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const client = axios.create({
  baseURL: BASE_URL,
});

// This runs before every request
// It automatically adds the token to every request header
client.interceptors.request.use(async (config) => {
  const token = global.userToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;