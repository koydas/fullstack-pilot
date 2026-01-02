import axios from 'axios';

const api = axios.create({
  baseURL: '/dependancies-service/api',
});

export async function fetchDependancies(appId) {
  const { data } = await api.get('/dependancies', { params: { appId } });
  return data;
}

export async function createDependancy(payload, appId) {
  const { data } = await api.post('/dependancies', { ...payload, appId });
  return data;
}

export async function deleteDependancy(id, appId) {
  await api.delete(`/dependancies/${id}`, { params: { appId } });
}
