import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  AppBar,
  Toolbar,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import type { Journal } from '../types';
import {
  getJournal,
  addEntry,
  updateEntry,
  deleteEntry
} from '../services/journalService';
import EntryItem from './EntryItem';

export default function JournalView() {
  const [journal, setJournal] = useState<Journal | null>(null);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textFieldRef = useRef<HTMLInputElement>(null);

  const loadJournal = useCallback(async (journalId: string) => {
    setIsLoading(true);
    try {
      const journalData = await getJournal(journalId);
      if (!journalData) {
        showSnackbar('Journal not found', 'error');
        navigate('/');
        return;
      }
      console.log('--- setting journal ---', journalData);
      // Create a new object to ensure state update triggers effects
      setJournal({...journalData});
    } catch (error) {
      console.error('Failed to load journal:', error);
      showSnackbar('Failed to load journal', 'error');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (id) {
      loadJournal(id);
    }
  }, [id, loadJournal]);

  // Log journal changes outside useEffect
  console.info('--- a1', journal)
  useEffect(() => {
    console.info('--- a2')
    // Scroll to bottom when entries change
    // Add a small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      console.log('--- scrolling to bottom ---');
      scrollToBottom()
    }, 100);
    return () => clearTimeout(timer);
  }, [journal]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  const handleAddEntry = async () => {
    if (!newEntryContent.trim() || !journal) return;

    setIsSubmitting(true);
    try {
      await addEntry(journal.id, newEntryContent.trim());
      setNewEntryContent('');
      // Reload journal to get updated entries
      await loadJournal(journal.id);
      // Focus back to text field
      setTimeout(() => {
        textFieldRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Failed to add entry:', error);
      showSnackbar('Failed to add entry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEntry = async (entryId: string, content: string) => {
    if (!journal) return;

    try {
      await updateEntry(journal.id, entryId, content);
      // Reload journal to get updated entries
      await loadJournal(journal.id);
      showSnackbar('Entry updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update entry:', error);
      showSnackbar('Failed to update entry', 'error');
      throw error; // Re-throw to let EntryItem handle the error state
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!journal) return;

    try {
      await deleteEntry(journal.id, entryId);
      // Reload journal to get updated entries
      await loadJournal(journal.id);
      showSnackbar('Entry deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      showSnackbar('Failed to delete entry', 'error');
      throw error; // Re-throw to let EntryItem handle the error state
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAddEntry();
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!journal) {
    return null;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar
        position="static"
        elevation={2}
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          borderRadius: 0
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate('/')}
            aria-label="back to home"
            sx={{ color: 'white' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              ml: 1,
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            {journal.title}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {journal.entries.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No entries yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start writing your first journal entry below
            </Typography>
          </Box>
        ) : (
          journal.entries.map((entry) => (
            <EntryItem
              key={entry.id}
              entry={entry}
              onUpdate={handleUpdateEntry}
              onDelete={handleDeleteEntry}
            />
          ))
        )}
        <div ref={messagesEndRef}>
          &nbsp; {/* Empty space to ensure scrolling works */}
        </div>
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            ref={textFieldRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="Write your entry..."
            value={newEntryContent}
            onChange={(e) => setNewEntryContent(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSubmitting}
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleAddEntry}
            disabled={!newEntryContent.trim() || isSubmitting}
            sx={{ mb: 0.5 }}
          >
            {isSubmitting ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
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
    </Box>
  );
}
