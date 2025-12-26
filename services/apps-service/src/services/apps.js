import express from 'express';
import { AppServiceError, createApp, deleteApp, listApps } from './appsService.js';

const router = express.Router();

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    if (error instanceof AppServiceError && error.status) {
      return res.status(error.status).json({ error: error.message });
    }

    next(error);
  }
};

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const apps = await listApps();
    res.json(apps);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const appRecord = await createApp(req.body);
    res.status(201).json(appRecord);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await deleteApp(id);
    res.status(204).send();
  })
);

export default router;
