import { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function App() {
  const [apps, setApps] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadApps() {
    try {
      setLoading(true);
      const { data } = await api.get('/apps');
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
      const { data } = await api.post('/apps', { name: name.trim() });
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
      await api.delete(`/apps/${app._id}`);
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
      <header>
        <div className="logo" aria-hidden="true" />
        <div>
          <p style={{ margin: 0, color: '#475569' }}>FullStack Pilot</p>
          <h1>App Manager</h1>
        </div>
      </header>

      <div className="card">
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

        <div className="apps-list" aria-live="polite">
          {apps.length === 0 && !loading && <p>No apps yet.</p>}

          {apps.map((app) => (
            <article key={app._id} className="app-item">
              <div className="app-meta">
                <span className="app-name">{app.name}</span>
                <span className="app-date">Created {formatDate(app.createdAt)}</span>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => removeApp(app)}
              >
                Remove app
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
