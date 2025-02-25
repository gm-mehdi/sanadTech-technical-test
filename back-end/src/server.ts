import express from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { LetterIndex, IndexData } from './types';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());

// Resolve paths to ensure they're correct
const lineOffsetsPath = path.resolve(__dirname, 'line-offsets.json');
const letterIndexPath = path.resolve(__dirname, 'letter-index.json');
const FILE_PATH = path.resolve(__dirname, 'usernames.txt');

// Load precomputed indexes
const loadIndexes = (): IndexData => {
  try {
    const lineOffsets = JSON.parse(fs.readFileSync(lineOffsetsPath, 'utf-8'));
    const letterIndex = JSON.parse(fs.readFileSync(letterIndexPath, 'utf-8'));
    return { lineOffsets, letterIndex };
  } catch (error) {
    console.error('Error loading indexes:', error);
    process.exit(1); // Exit process on error loading files
  }
};

const { lineOffsets, letterIndex } = loadIndexes();

// Helper function to read lines from file
async function readLines(startLine: number, limit: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (startLine >= lineOffsets.length) {
      return resolve([]); // Prevent out-of-bounds errors
    }

    const startByte = lineOffsets[startLine];
    const endLine = Math.min(startLine + limit, lineOffsets.length - 1);
    const endByte = endLine < lineOffsets.length - 1 ? lineOffsets[endLine] : undefined;

    const stream = fs.createReadStream(FILE_PATH, {
      start: startByte,
      end: endByte
    });

    const lines: string[] = [];
    stream.on('data', (chunk: string | Buffer) => {
      const chunkString = chunk.toString('utf-8');
      console.log("Raw Chunk Read:", chunkString);
      lines.push(...chunkString.split('\n'));
    });

    stream.on('end', () => resolve(lines.slice(0, limit)));
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      reject(err);
    });
  });
}

// API Endpoints
app.get('/api/meta', (req, res) => {
  res.json({
    totalItems: lineOffsets.length,
    letterIndex
  });
});

console.log('Letter Index:', letterIndex);

app.get('/api/users', async (req: any, res: any) => {
  try {
    const startLine = parseInt(req.query.start as string, 10);
    const limit = parseInt(req.query.limit as string, 10);

    if (isNaN(startLine) || isNaN(limit)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const lines = await readLines(startLine, limit);
    res.json(lines);
    console.log('Users fetched:', lines);
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
