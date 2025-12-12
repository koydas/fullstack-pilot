import { useEffect, useState } from 'react';
import List from './components/list/list.jsx';
import AppHeader from './components/header/header.jsx';
import Card from './components/card/card.jsx';
import { createApp, deleteApp, fetchApps } from './services/apps/apps-service.jsx';

export default function App() {
  const [apps, setApps] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadApps() {
    try {
      setLoading(true);
      const data = await fetchApps();
      setApps(data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not load apps');
    } finally {
      setLoading(false);
    }
  }

  async function addApp(event) {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      const data = await createApp(name.trim());
      setApps((prev) => [data, ...prev]);
      setName('');
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not create app');
    } finally {
      setLoading(false);
    }
  }

  async function removeApp(app) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${app.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteApp(app._id);
      setApps((prev) => prev.filter((item) => item._id !== app._id));
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not remove app');
    }
  }

  useEffect(() => {
    loadApps();
  }, []);

  return (
    <div className="app-shell">
      <AppHeader />

      <Card>
        <form className="form-row" onSubmit={addApp}>
          <input
            type="text"
            name="appName"
            placeholder="Enter an app name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={loading}
            aria-label="App name"
          />
          <button type="submit" disabled={loading || !name.trim()}>
            Add app
          </button>
        </form>

        {error && <p className="status-text">{error}</p>}

        <List apps={apps} onRemove={removeApp} showEmpty={!loading} />
      </Card>
    </div>
  );
}
