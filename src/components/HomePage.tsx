import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Snackbar,
  TextField,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  checkJournalExists,
  createJournal,
  deleteJournal,
  exportJournal,
  getAllJournals,
  importJournal,
  updateJournal
} from '../services/journalService';
import type { ExportedJournal, Journal } from '../types';
import { formatEntryDate } from '../utils/dateFormat';
import { downloadJournalAsJson, uploadJsonFile } from '../utils/fileUtils';

export default function HomePage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [journalToImport, setJournalToImport] = useState<ExportedJournal | null>(null);
  const [editJournalTitle, setEditJournalTitle] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newJournalTitle, setNewJournalTitle] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const navigate = useNavigate();

  const loadJournals = useCallback(async () => {
    try {
      const journalList = await getAllJournals();
      setJournals(journalList);
    } catch (error) {
      console.error('Failed to load journals:', error);
      showSnackbar('Failed to load journals', 'error');
    }
  }, []);

  useEffect(() => {
    loadJournals();
  }, [loadJournals]);

  const handleUpdateJournalTitle = async () => {
    if (!selectedJournal || !editJournalTitle.trim()) return;

    try {
      const updatedJournal = { ...selectedJournal, title: editJournalTitle.trim() };
      await updateJournal(updatedJournal);
      setEditDialogOpen(false);
      setSelectedJournal(null);
      setEditJournalTitle('');
      await loadJournals();
      showSnackbar('Journal title updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update journal title:', error);
      showSnackbar('Failed to update journal title', 'error');
    }
  };

  const handleCreateJournal = async () => {
    if (!newJournalTitle.trim()) return;

    try {
      await createJournal(newJournalTitle.trim());
      setNewJournalTitle('');
      setCreateDialogOpen(false);
      await loadJournals();
      showSnackbar('Journal created successfully', 'success');
    } catch (error) {
      console.error('Failed to create journal:', error);
      showSnackbar('Failed to create journal', 'error');
    }
  };

  const handleDeleteJournal = async () => {
    if (!selectedJournal) return;

    try {
      await deleteJournal(selectedJournal.id);
      setDeleteDialogOpen(false);
      setSelectedJournal(null);
      await loadJournals();
      showSnackbar('Journal deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete journal:', error);
      showSnackbar('Failed to delete journal', 'error');
    }
  };

  const handleExportJournal = (journal: Journal) => {
    try {
      const exportedJournal = exportJournal(journal);
      downloadJournalAsJson(exportedJournal);
      showSnackbar('Journal exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export journal:', error);
      showSnackbar('Failed to export journal', 'error');
    }
  };

  const handleImportJournal = async () => {
    try {
      const exportedJournal = await uploadJsonFile();

      // Check if journal with same ID exists
      const existingJournal = await checkJournalExists(exportedJournal.id);

      if (existingJournal) {
        // Store the journal to import and show confirmation dialog
        setJournalToImport(exportedJournal);
        setSelectedJournal(existingJournal);
        setOverwriteDialogOpen(true);
      } else {
        // No conflict, proceed with import
        await importJournal(exportedJournal);
        await loadJournals();
        showSnackbar('Journal imported successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to import journal:', error);
      showSnackbar(`Failed to import journal: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleConfirmOverwrite = async () => {
    if (!journalToImport) return;

    try {
      await importJournal(journalToImport, true); // Pass true to overwrite
      setOverwriteDialogOpen(false);
      setJournalToImport(null);
      setSelectedJournal(null);
      await loadJournals();
      showSnackbar('Journal imported successfully', 'success');
    } catch (error) {
      console.error('Failed to import journal:', error);
      showSnackbar('Failed to import journal', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 2, pb: 10, position: 'relative' }}>
      {journals.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No journals yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first journal to get started
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {journals.map((journal) => (
            <Card key={journal.id} sx={{ cursor: 'pointer' }}>
              <CardContent onClick={() => navigate(`/journal/${journal.id}`)}>
                <Typography variant="h6" gutterBottom>
                  {journal.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {journal.entries.length} entries
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last modified: {formatEntryDate(journal.modifiedAt)}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedJournal(journal);
                    setEditJournalTitle(journal.title);
                    setEditDialogOpen(true);
                  }}
                  title="Edit journal title"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportJournal(journal);
                  }}
                  title="Export journal"
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedJournal(journal);
                    setDeleteDialogOpen(true);
                  }}
                  title="Delete journal"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Import button below journals */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={handleImportJournal}
          sx={{ minWidth: 120 }}
        >
          Import Journal
        </Button>
      </Box>

      {/* Add journal button positioned within app width */}
      <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
        <Fab
          color="primary"
          aria-label="add journal"
          onClick={() => setCreateDialogOpen(true)}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Edit Journal Title Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Journal Title</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Journal Title"
            fullWidth
            variant="outlined"
            value={editJournalTitle}
            onChange={(e) => setEditJournalTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleUpdateJournalTitle();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateJournalTitle} variant="contained" disabled={!editJournalTitle.trim()}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Journal Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Journal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Journal Title"
            fullWidth
            variant="outlined"
            value={newJournalTitle}
            onChange={(e) => setNewJournalTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateJournal();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateJournal} variant="contained" disabled={!newJournalTitle.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Journal Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Journal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedJournal?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteJournal} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Overwrite Journal Dialog */}
      <Dialog open={overwriteDialogOpen} onClose={() => setOverwriteDialogOpen(false)}>
        <DialogTitle>Journal Already Exists</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            A journal with the title "{selectedJournal?.title}" already exists.
          </Typography>
          <Typography>
            Do you want to overwrite the existing journal with the imported one? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOverwriteDialogOpen(false);
            setJournalToImport(null);
            setSelectedJournal(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmOverwrite} color="warning" variant="contained">
            Overwrite
          </Button>
        </DialogActions>
      </Dialog>

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
