export interface User {
    id: number;
    name: string;
  }
  
  export interface ApiMetaResponse {
    totalItems: number;
    letterIndex: {
      [key: string]: {
        start: number;
        end: number;
      };
    };
  }
  
  export interface ChunkCache {
    [chunkIndex: number]: string[];
  }