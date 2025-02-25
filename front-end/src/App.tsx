import { CssBaseline, Container, Typography } from '@mui/material';
import VirtualList from './components/VirtualList';

function App() {
  return (
    <>
      <CssBaseline />
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Large List Viewer (10M Users)
        </Typography>
        <VirtualList />
      </Container>
    </>
  );
}

export default App;