import express from 'express';
import cors from 'cors';
import searchRoutes from './routes/searchRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', network: 'online' }));

// /api/search/parts — inventory + YouTube search
// /api/rego/lookup  — worldwide registration lookup with region fallback
app.use('/api/search', searchRoutes);
app.use('/api/rego', searchRoutes);

export default app;
