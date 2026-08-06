import cors from 'cors';
import dotenv from 'dotenv';
import express, {Express,NextFunction,Request,Response,} from 'express';
import mongoose from 'mongoose';

import routes from './api/routes/vocabRoutes';

dotenv.config();

const app: Express = express();
const port: number | string = process.env.PORT || 3000;

const frontendUrl =
  process.env.FRONTEND_URL ?? 'http://localhost:5173';

const mongoUri = process.env.MONGODB_URI;


if (!mongoUri) {
  throw new Error(
    'MONGODB_URI is not configured in the environment',
  );
}

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS configuration
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Request body parsers
app.use(
  express.json({
    limit: '10kb',
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  }),
);

// Register API routes
routes(app);

// Fallback response for endpoints that do not exist
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: `${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    console.error(error);

    res.status(500).json({
      message: 'An unexpected server error occurred',
    });
  },
);

// Connect to MongoDB before starting the server
async function startServer(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(mongoUri!);

    console.log('MongoDB successfully connected');

    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

void startServer();
