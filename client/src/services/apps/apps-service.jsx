import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export async function fetchApps() {
  const { data } = await api.get('/apps');
  return data;
}

export async function createApp(name) {
  const { data } = await api.post('/apps', { name });
  return data;
}

export async function deleteApp(id) {
  await api.delete(`/apps/${id}`);
}
