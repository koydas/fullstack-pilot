import { useEffect, useState } from 'react';

const STORAGE_KEY = 'fsp-services';

const defaultServices = [
  { name: 'auth-service', type: 'backend', dependsOn: [] },
  { name: 'ui-dashboard', type: 'frontend', dependsOn: ['auth-service'] },
  { name: 'db-core', type: 'database', dependsOn: [] },
];

export function useServices() {
  const [services, setServices] = useState([]);

  // Init
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setServices(JSON.parse(stored));
    } else {
      setServices(defaultServices);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultServices));
    }
  }, []);

  // Auto-persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  }, [services]);

  const addService = (s) => setServices((prev) => [...prev, s]);
  const resetServices = () => {
    setServices(defaultServices);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultServices));
  };

  return { services, addService, resetServices };
}