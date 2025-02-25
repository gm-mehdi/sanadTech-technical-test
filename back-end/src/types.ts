export interface LetterIndex {
    [key: string]: {
      start: number;
      end: number;
    };
  }
  
  export interface IndexData {
    lineOffsets: number[];
    letterIndex: LetterIndex;
  }