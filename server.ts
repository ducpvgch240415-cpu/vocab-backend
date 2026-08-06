
import cors from 'cors';
import dotenv from 'dotenv';
import path from "path";

import express, { Express, NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import routes from './api/routes/vocabRoutes';

dotenv.config();

console.log(process.cwd());
console.log(process.env.MONGODB_URI);
const app: Express = express(); 
const port: number | string = process.env.PORT || 3000;

const frontendUrl =
  process.env.FRONTEND_URL ?? 'http://localhost:5173';

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: '10kb',
  }),
);

// Mongoose connection string
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('MONGODB_URI is not configured in the environment');
}

mongoose.set('strictQuery', true);
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB successfully connected'))
  .catch((err: Error) => console.error('MongoDB connection error:', err));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Register the routes
routes(app);

// Fallback response for missing endpoints
app.use((req: Request, res: Response) => {
  res.status(404).send({ url: `${req.originalUrl} not found` });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);

    response.status(500).json({
      message: 'An unexpected server error occurred',
    });
  },
);
