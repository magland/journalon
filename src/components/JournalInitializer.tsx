import { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { getAllJournals } from '../services/journalService';

/**
 * Component that initializes the journal cache when the app starts.
 * This component doesn't render anything visible.
 */
export default function JournalInitializer() {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    // Initialize journals from local storage
    const initJournals = async () => {
      try {
        await getAllJournals();
        console.log('Journals initialized from hashkeep');
      } catch (error) {
        console.error('Failed to initialize journals:', error);
        setSnackbar({
          open: true,
          message: 'Failed to initialize journals',
          severity: 'error'
        });
      }
    };

    initJournals();
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // This component doesn't render anything visible except error messages
  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}
