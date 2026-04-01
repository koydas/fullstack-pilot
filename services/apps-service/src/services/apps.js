import express from 'express';
import { AppServiceError, createApp, deleteApp, listApps } from './appsService.js';

const router = express.Router();
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    if (error instanceof AppServiceError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }

    next(error);
  }
};

function parsePositiveInteger(rawValue, fieldName) {
  if (rawValue == null) {
    return null;
  }

  if (typeof rawValue !== 'string' || !/^\d+$/.test(rawValue)) {
    throw new AppServiceError(`Invalid "${fieldName}" query parameter.`, 'validation');
  }
  const parsed = Number.parseInt(rawValue, 10);
  return parsed;
}

function parsePaginationQuery(query) {
  const limit = parsePositiveInteger(query.limit, 'limit') ?? DEFAULT_LIMIT;
  const offset = parsePositiveInteger(query.offset, 'offset') ?? 0;
  const boundedLimit = Math.min(limit, MAX_LIMIT);
  return { limit: boundedLimit, offset };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const pagination = parsePaginationQuery(req.query);
    const payload = await listApps(undefined, pagination);
    const useLegacyResponse = req.query.legacy === 'true';
    res.json(useLegacyResponse ? payload.items : payload);
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
