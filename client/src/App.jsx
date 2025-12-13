import { useEffect, useState } from 'react';
import Card from './components/card/card.jsx';
import AppModal from './components/app-modal/app-modal.jsx';
import DeleteAppModal from './components/app-modal/delete-app-modal.jsx';
import CreationApp from './components/creation-app/creation-app.jsx';
import AppHeader from './components/header/header.jsx';
import List from './components/list/list.jsx';
import { AppShell, GlobalStyle } from './App.styles.js';
import { createApp, deleteApp, fetchApps } from './services/apps/apps-service.jsx';

export default function App() {
  const [apps, setApps] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [appToDelete, setAppToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  function openApp(app) {
    setSelectedApp(app);
  }

  function closeApp() {
    setSelectedApp(null);
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

  function requestAppRemoval(app) {
    setAppToDelete(app);
  }

  function closeDeleteModal() {
    if (isDeleting) return;
    setAppToDelete(null);
  }

  async function confirmRemoveApp() {
    if (!appToDelete) return;

    try {
      setIsDeleting(true);
      await deleteApp(appToDelete._id);
      setApps((prev) => prev.filter((item) => item._id !== appToDelete._id));
      setError('');
      setAppToDelete(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not remove app');
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    loadApps();
  }, []);

  return (
    <>
      <GlobalStyle />
      <AppShell>
        <AppHeader />

        <Card>
          <CreationApp
            name={name}
            onNameChange={(event) => setName(event.target.value)}
            onSubmit={addApp}
            loading={loading}
            error={error}
          />

          <List
            apps={apps}
            onRemove={requestAppRemoval}
            showEmpty={!loading}
            onSelect={openApp}
          />
        </Card>

        {selectedApp && <AppModal app={selectedApp} onClose={closeApp} />}
        {appToDelete && (
          <DeleteAppModal
            app={appToDelete}
            onCancel={closeDeleteModal}
            onConfirm={confirmRemoveApp}
            loading={isDeleting}
          />
        )}
      </AppShell>
    </>
  );
}
