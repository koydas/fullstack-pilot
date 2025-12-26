import { getAppModel } from '../models/app.js';

export class AppServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'AppServiceError';
    this.status = status;
  }
}

function resolveAppModel(appModel) {
  return appModel ?? getAppModel();
}

export function createAppsService(appModel) {
  return {
    listApps: () => listApps(appModel),
    createApp: (payload) => createApp(payload, appModel),
    deleteApp: (id) => deleteApp(id, appModel),
  };
}

export async function listApps(appModel) {
  const App = resolveAppModel(appModel);
  return App.find({}, null, { sort: { createdAt: -1 } });
}

export async function createApp({ name }, appModel) {
  const trimmedName = name?.trim();
  if (!trimmedName) {
    throw new AppServiceError('App name is required.', 400);
  }

  const App = resolveAppModel(appModel);
  return App.create({ name: trimmedName });
}

export async function deleteApp(id, appModel) {
  const App = resolveAppModel(appModel);
  const deletedApp = await App.findByIdAndDelete(id);

  if (!deletedApp) {
    throw new AppServiceError('App not found.', 404);
  }

  return deletedApp;
}
