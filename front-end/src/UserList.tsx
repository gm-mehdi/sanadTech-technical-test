import React, { useState, useEffect, useRef } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import axios from 'axios';

const PAGE_SIZE = 100;

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });

interface AlphabetIndex {
  [letter: string]: number;
}

const UserList: React.FC = () => {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [pages, setPages] = useState<{ [pageIndex: number]: string[] }>({});
  const [alphabetIndex, setAlphabetIndex] = useState<AlphabetIndex>({});
  const inFlightPages = useRef<Set<number>>(new Set());
  const listRef = useRef<List>(null);

  // Fetch the alphabetical index once on mount
  useEffect(() => {
    api
      .get<AlphabetIndex>('/alphabet-index')
      .then((response) => {
        setAlphabetIndex(response.data);
      })
      .catch((error) => {
        console.error('Error fetching alphabet index:', error);
      });
  }, []);

  // Fetch initial page
  useEffect(() => {
    fetchPage(0);
  }, []);

  // Function to fetch a page from the backend
  const fetchPage = async (pageIndex: number) => {
    // Don't fetch if we already have the page or if it's already being fetched
    if (pages[pageIndex] || inFlightPages.current.has(pageIndex)) {
      return;
    }

    try {
      inFlightPages.current.add(pageIndex);
      const start = pageIndex * PAGE_SIZE;
      const response = await api.get(`/users?start=${start}&limit=${PAGE_SIZE}`);
      const data = response.data;

      setPages(prev => ({ ...prev, [pageIndex]: data.users }));
      setTotalUsers(data.total);
    } catch (error) {
      console.error(`Error fetching page ${pageIndex}:`, error);
    } finally {
      inFlightPages.current.delete(pageIndex);
    }
  };

  // Row renderer
  const Row = ({ index, style }: ListChildComponentProps) => {
    const pageIndex = Math.floor(index / PAGE_SIZE);
    const offset = index % PAGE_SIZE;
    
    const page = pages[pageIndex];
    if (!page) {
      fetchPage(pageIndex);
      return <div style={style}>Loading...</div>;
    }

    return (
      <div style={{ ...style, padding: '5px 10px' }}>
        {page[offset] || 'Loading...'}
      </div>
    );
  };

  // Alphabet navigation handler
  const handleAlphabetClick = (letter: string) => {
    const index = alphabetIndex[letter];
    if (typeof index === 'number') {
      // Calculate the exact page we need
      const pageIndex = Math.floor(index / PAGE_SIZE);
      
      // First, ensure we have the data
      fetchPage(pageIndex).then(() => {
        // Then scroll to the position
        if (listRef.current) {
          listRef.current.scrollToItem(index, 'start');
        }
      });
    }
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        marginBottom: '1rem',
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 1,
        padding: '10px 0'
      }}>
        {Object.keys(alphabetIndex)
          .sort()
          .map(letter => (
            <button
              key={letter}
              onClick={() => handleAlphabetClick(letter)}
              style={{
                margin: '0 5px 5px 0',
                padding: '5px 10px',
                cursor: 'pointer',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            >
              {letter}
            </button>
          ))}
      </div>

      <List
        ref={listRef}
        height={600}
        itemCount={totalUsers}
        itemSize={35}
        width={'100%'}
        onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
          const startPage = Math.floor(visibleStartIndex / PAGE_SIZE);
          const endPage = Math.floor(visibleStopIndex / PAGE_SIZE);
          
          // Only fetch the pages we're currently viewing
          fetchPage(startPage);
          if (startPage !== endPage) {
            fetchPage(endPage);
          }
        }}
      >
        {Row}
      </List>
    </div>
  );
};

export default UserList;