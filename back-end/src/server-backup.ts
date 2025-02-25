import express from 'express';
import fs from 'fs';
import cors from 'cors';
import { LetterIndex, IndexData } from './types';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());

// Load precomputed indexes
const loadIndexes = (): IndexData => ({
  lineOffsets: JSON.parse(fs.readFileSync('./line-offsets.json', 'utf-8')),
  letterIndex: JSON.parse(fs.readFileSync('./letter-index.json', 'utf-8'))
});

const { lineOffsets, letterIndex } = loadIndexes();
const FILE_PATH = './usernames.txt';

// Helper function to read lines from file
async function readLines(startLine: number, limit: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const startByte = lineOffsets[startLine];
    const endLine = Math.min(startLine + limit, lineOffsets.length - 1);
    const endByte = lineOffsets[endLine];

    const stream = fs.createReadStream(FILE_PATH, {
      start: startByte,
      end: endByte
    });

    const lines: string[] = [];
    stream.on('data', (chunk: string | Buffer) => {
      const chunkString = chunk.toString('utf-8');
      lines.push(...chunkString.split('\n'));
    })

    stream.on('end', () => resolve(lines.slice(0, limit)));
    stream.on('error', reject);
  });
}

// API Endpoints
app.get('/api/meta', (req, res) => {
  res.json({
    totalItems: lineOffsets.length,
    letterIndex
  });
});


app.get('/api/users', async (req: any, res: any) => {
  try {
    const startLine = parseInt(req.query.start as string, 10);
    const limit = parseInt(req.query.limit as string, 10);

    if (isNaN(startLine) || isNaN(limit)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const lines = await readLines(startLine, limit);
    res.json(lines);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});