import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
});

export const fetchMetadata = async () => {
  const response = await apiClient.get('/meta');
  return response.data;
};

export const fetchUsers = async (start: number, limit: number) => {
  const response = await apiClient.get<string[]>(
    `/users?start=${start}&limit=${limit}`
    
  );
  console.log(response.data);
  return response.data;
};