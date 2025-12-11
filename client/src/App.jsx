import { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function App() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadProjects() {
    try {
      setLoading(true);
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not load projects');
    } finally {
      setLoading(false);
    }
  }

  async function addProject(event) {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      const { data } = await api.post('/projects', { name: name.trim() });
      setProjects((prev) => [data, ...prev]);
      setName('');
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not create project');
    } finally {
      setLoading(false);
    }
  }

  async function removeProject(id) {
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((project) => project._id !== id));
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not remove project');
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="app-shell">
      <header>
        <div className="logo" aria-hidden="true" />
        <div>
          <p style={{ margin: 0, color: '#475569' }}>FullStack Pilot</p>
          <h1>Project Manager</h1>
        </div>
      </header>

      <div className="card">
        <form className="form-row" onSubmit={addProject}>
          <input
            type="text"
            name="projectName"
            placeholder="Enter a project name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={loading}
            aria-label="Project name"
          />
          <button type="submit" disabled={loading || !name.trim()}>
            Add project
          </button>
        </form>

        {error && <p className="status-text">{error}</p>}

        <div className="projects-list" aria-live="polite">
          {projects.length === 0 && !loading && <p>No projects yet.</p>}

          {projects.map((project) => (
            <article key={project._id} className="project-item">
              <div className="project-meta">
                <span className="project-name">{project.name}</span>
                <span className="project-date">Created {formatDate(project.createdAt)}</span>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => removeProject(project._id)}
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
