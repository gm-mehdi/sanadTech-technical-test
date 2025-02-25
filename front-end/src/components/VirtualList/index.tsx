import { useState, useEffect, useCallback, useRef } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { fetchMetadata, fetchUsers } from '../../api/client';
import { ApiMetaResponse, ChunkCache } from './types';

const CHUNK_SIZE = 100;
const ROW_HEIGHT = 35;
  
const VirtualList = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [letterIndex, setLetterIndex] = useState<ApiMetaResponse['letterIndex']>({});
  const [cache, setCache] = useState<ChunkCache>({});
  const listRef = useRef<FixedSizeList>(null);

  // Load initial metadata
  useEffect(() => {
    const loadMetadata = async () => {
      const { totalItems, letterIndex } = await fetchMetadata();
      setTotalUsers(totalItems);
      setLetterIndex(letterIndex);
    };
    
    loadMetadata();
  }, []);

  // Data loader with memoization
  const loadChunk = useCallback(
    async (chunkIndex: number) => {
      if (cache[chunkIndex]) return;

      const start = chunkIndex * CHUNK_SIZE;
      const users = await fetchUsers(start, CHUNK_SIZE);
      
      setCache(prev => ({
        ...prev,
        [chunkIndex]: users
      }));
    },
    [cache]
  );

  // Virtual list row renderer
  const Row = ({ index, style }: ListChildComponentProps) => {
    const chunkIndex = Math.floor(index / CHUNK_SIZE);
    const chunkOffset = index % CHUNK_SIZE;
    
    useEffect(() => {
      loadChunk(chunkIndex);
    }, [chunkIndex, loadChunk]);

    return (
      <div style={style}>
        {cache[chunkIndex]?.[chunkOffset] || 'Loading...'}
      </div>
    );
  };

  // Alphabet navigation handler
  const handleLetterClick = (letter: string) => {
    const startIndex = letterIndex[letter]?.start;
    if (startIndex !== undefined && listRef.current) {
      listRef.current.scrollToItem(startIndex, 'start');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        {Object.keys(letterIndex).map(letter => (
          <button
            key={letter}
            onClick={() => handleLetterClick(letter)}
            style={{ margin: '0 5px' }}
          >
            {letter}
          </button>
        ))}
      </div>
      
      <FixedSizeList
        height={700}
        width="100%"
        itemCount={totalUsers}
        itemSize={ROW_HEIGHT}
        ref={listRef}
      >
        {Row}
      </FixedSizeList>
    </div>
  );
};

export default VirtualList;