import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

const appSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const App = mongoose.model('App', appSchema);

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const apps = await App.find().sort({ createdAt: -1 });
    res.json(apps);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'App name is required.' });
    }

    const appRecord = await App.create({ name: name.trim() });
    res.status(201).json(appRecord);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const appRecord = await App.findByIdAndDelete(id);
    if (!appRecord) {
      return res.status(404).json({ error: 'App not found.' });
    }
    res.status(204).send();
  })
);

export default router;
