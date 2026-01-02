import axios from 'axios';

const api = axios.create({
  baseURL: '/services-service/api',
});

export async function fetchServices() {
  const { data } = await api.get('/services');
  return data;
}

export async function createService(payload) {
  const { data } = await api.post('/services', payload);
  return data;
}

export async function deleteService(id) {
  await api.delete(`/services/${id}`);
}
