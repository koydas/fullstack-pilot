import axios from 'axios';

const api = axios.create({
  baseURL: '/services-service/api',
});

export async function fetchServices(appId) {
  const { data } = await api.get('/services', { params: { appId } });
  return data;
}

export async function createService(payload, appId) {
  const { data } = await api.post('/services', { ...payload, appId });
  return data;
}

export async function deleteService(id, appId) {
  await api.delete(`/services/${id}`, { params: { appId } });
}
