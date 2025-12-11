import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Voicings endpoint (placeholder per future feature)
app.post('/api/voicings/ai', async (req: Request, res: Response) => {
  try {
    const { chordSymbol, parsedChord, style } = req.body;

    if (!chordSymbol || !parsedChord) {
      return res.status(400).json({ 
        error: 'Missing required fields: chordSymbol, parsedChord' 
      });
    }

    // TODO: Implementare chiamata API AI (Anthropic/OpenAI)
    // Per ora ritorna un placeholder
    res.json({
      success: true,
      message: 'AI voicings generation not yet implemented',
      voicings: [],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating AI voicings:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI voicings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎹 Piano Voicings API running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;