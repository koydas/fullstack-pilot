import axios from 'axios';

const api = axios.create({
  baseURL: '/dependancies-service/api',
});

export async function fetchDependancies() {
  const { data } = await api.get('/dependancies');
  return data;
}

export async function createDependancy(payload) {
  const { data } = await api.post('/dependancies', payload);
  return data;
}

export async function deleteDependancy(id) {
  await api.delete(`/dependancies/${id}`);
}
