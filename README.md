# Large List Viewer (10M Users)
A full-stack application demonstrating efficient handling of large datasets using virtual scrolling. The application displays a list of 10 million users with optimized performance.

### Project Structure
```
├── .gitignore
├── package.json
├── back-end
│   ├── package.json
│   ├── tsconfig.json
│   └── src
│       ├── preprocess.ts
│       ├── server.ts
│       ├── types.ts
│       └── usernames.txt
└── front-end
    ├── package.json
    ├── tsconfig.json
    ├── README.md
    └── src
        ├── api
        │   └── client.ts
        ├── App.tsx
        ├── components
        │   └── VirtualList
        │       ├── index.tsx
        │       └── types.ts
        └── index.tsx
```

### Prerequisites
- Node.js (Latest LTS version recommended)
- npm (comes with Node.js)

### Installation


    # Install dependencies for both front-end and back-end
    npm run setup
    

### Building the Project


    # Build both front-end and back-end
    npm run build
	

### Starting the Application


    # Starts both the server and client
    npm start
	

The application will be available at:

Frontend: http://localhost:3000

Backend API: http://localhost:8000

### FeaturesFeatures
- Virtual scrolling implementation for handling large datasets
- Server-side pagination and efficient file reading
- Material-UI based responsive interface
- TypeScript implementation for both frontend and backend
- Preprocessed data indexing for quick access

### API Endpoints
`GET /api/meta` - Returns metadata about the dataset including total items

`GET /api/users?start={number}&limit={number}` - Returns paginated user data

### Project Configuration
- Backend uses tsconfig.json for TypeScript configuration
- Frontend is built using Create React App with TypeScript

### DevelopmentDevelopment
For development, you can run the frontend and backend separately:
```
# Backend
cd back-end
npm start

# Frontend
cd front-end
npm start
```

### Dependencies
#### 1. Backend
- Express.js - Web framework
- CORS - Cross-origin resource sharing
- TypeScript - Type safety and modern JavaScript features

#### 2. Frontend
- React - UI library
- Material-UI - Component library
- Virtual List - Custom implementation for efficient list rendering

### Building
The project uses TypeScript for both frontend and backend. Build process:

1. Preprocesses the data files using `preprocess.ts`
2. Compiles TypeScript to JavaScript
3. Copies necessary assets to the distribution folder

#### Why Preprocessing?
Preprocessing is essential for handling large datasets efficiently. By creating indexes, we can quickly access specific parts of the data without reading the entire file. This reduces the time complexity of data retrieval operations and improves the overall performance of the application.

#### How Preprocessing Works
The preprocessing script reads the `usernames.txt` file line by line and creates two indexes:

- **Line Offsets**: An array that stores the byte offset of each line in the file. This allows us to quickly seek to any line in the file.
- **Letter Index**: An object that maps each starting letter to the range of lines that start with that letter. This helps in quickly navigating to sections of the file based on the starting letter.

Here is the preprocessing script:

```typescript
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
```
