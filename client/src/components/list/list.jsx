function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function List({ apps, onRemove, showEmpty = true }) {
  return (
    <div className="apps-list" aria-live="polite">
      {apps.length === 0 && showEmpty && <p>No apps yet.</p>}

      {apps.map((app) => (
        <article key={app._id} className="app-item">
          <div className="app-meta">
            <span className="app-name">{app.name}</span>
            <span className="app-date">Created {formatDate(app.createdAt)}</span>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onRemove(app)}
          >
            Remove app
          </button>
        </article>
      ))}
    </div>
  );
}
