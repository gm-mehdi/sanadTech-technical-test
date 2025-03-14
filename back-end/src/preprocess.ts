import fs from 'fs';
import readline from 'readline';
import { LetterIndex, IndexData } from './types';
import path from 'path';

const inputFile = './src/usernames.txt';

async function createIndexes(): Promise<IndexData> {
  const lineOffsets: number[] = [];
  const letterIndex: LetterIndex = {};
  let currentLetter: string | null = null;
  let offset = 0;

  const rl = readline.createInterface({
    input: fs.createReadStream(inputFile),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const firstChar = line[0]?.toUpperCase() || 'SPECIAL';
    
    if (!/[A-Z]/.test(firstChar)) {
      currentLetter = 'SPECIAL';
    }
    
    if (firstChar !== currentLetter) {
      if (currentLetter) {
        letterIndex[currentLetter].end = lineOffsets.length - 1;
      }
      currentLetter = firstChar;
      letterIndex[currentLetter] = {
        start: lineOffsets.length,
        end: lineOffsets.length
      };
    }
    
    lineOffsets.push(offset);
    offset += Buffer.byteLength(line) + 1; // Account for newline
  }

  // Finalize last letter
  if (currentLetter) {
    letterIndex[currentLetter].end = lineOffsets.length - 1;
  }

  return { lineOffsets, letterIndex };
}

// Run the preprocessing
createIndexes()
  .then((indexData) => {
    const lineOffsetsPath = path.resolve(__dirname, 'line-offsets.json');
    const letterIndexPath = path.resolve(__dirname, 'letter-index.json');

    fs.writeFileSync(lineOffsetsPath, JSON.stringify(indexData.lineOffsets, null, 2));
    fs.writeFileSync(letterIndexPath, JSON.stringify(indexData.letterIndex, null, 2));
    console.log('Indexes created successfully!');
  })
  .catch(console.error);