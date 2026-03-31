import { Types } from 'mongoose';

import { getAppModel } from '../models/app.js';

const APP_SERVICE_ERROR_STATUS_BY_CODE = {
  validation: 400,
  not_found: 404,
};

export class AppServiceError extends Error {
  constructor(message, code = 'internal') {
    super(message);
    this.name = 'AppServiceError';
    this.code = code;
    this.status = APP_SERVICE_ERROR_STATUS_BY_CODE[code] ?? 500;
  }
}

function resolveAppModel(appModel) {
  return appModel ?? getAppModel();
}

function isValidObjectId(id) {
  return Types.ObjectId.isValid(id);
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
    throw new AppServiceError('App name is required.', 'validation');
  }

  const App = resolveAppModel(appModel);
  return App.create({ name: trimmedName });
}

export async function deleteApp(id, appModel) {
  if (!isValidObjectId(id)) {
    throw new AppServiceError('Invalid app id.', 'validation');
  }

  const App = resolveAppModel(appModel);
  const deletedApp = await App.findByIdAndDelete(id);

  if (!deletedApp) {
    throw new AppServiceError('App not found.', 'not_found');
  }

  return deletedApp;
}
