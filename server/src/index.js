import fs from 'fs';
import path from 'path';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

// Minimal .env loader to keep configuration in sync with docker-compose defaults
function loadEnvFile(envFilePath) {
  if (!fs.existsSync(envFilePath)) return;

  const envContents = fs.readFileSync(envFilePath, 'utf8');
  envContents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    });
}

loadEnvFile(path.resolve(process.cwd(), '.env'));

const PORT = process.env.PORT || 4000;
const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/fullstack-pilot';
const MONGODB_URI = (process.env.MONGODB_URI || DEFAULT_MONGODB_URI).trim();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

app.get(
  '/api/projects',
  asyncHandler(async (_req, res) => {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  })
);

app.post(
  '/api/projects',
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    const project = await Project.create({ name: name.trim() });
    res.status(201).json(project);
  })
);

app.delete(
  '/api/projects/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.status(204).send();
  })
);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB at ${MONGODB_URI}`);
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log('Shutting down server...');
  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
