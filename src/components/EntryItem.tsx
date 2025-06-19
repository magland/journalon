import {
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import type { Entry } from '../types';
import { formatEntryDate } from '../utils/dateFormat';

interface EntryItemProps {
  entry: Entry;
  onUpdate: (entryId: string, content: string) => Promise<void>;
  onDelete: (entryId: string) => Promise<void>;
}

export default function EntryItem({ entry, onUpdate, onDelete }: EntryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartEdit = () => {
    setEditContent(entry.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditContent(entry.content);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() === entry.content) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(entry.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(entry.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Paper
        elevation={1}
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          position: 'relative',
          '&:hover .entry-actions': {
            opacity: 1
          }
        }}
      >
        {isEditing ? (
          <Box>
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              variant="outlined"
              autoFocus
              disabled={isLoading}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
              <IconButton
                size="small"
                onClick={handleCancelEdit}
                disabled={isLoading}
                title="Cancel"
              >
                <CancelIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleSaveEdit}
                disabled={isLoading || !editContent.trim()}
                color="primary"
                title="Save"
              >
                <SaveIcon />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                pr: 6 // Make room for action buttons
              }}
            >
              {entry.content}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              {formatEntryDate(entry.timestamp)}
            </Typography>
            <Box
              className="entry-actions"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                opacity: 0,
                transition: 'opacity 0.2s',
                display: 'flex',
                gap: 0.5
              }}
            >
              <IconButton
                size="small"
                onClick={handleStartEdit}
                title="Edit entry"
                disabled={isLoading}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setDeleteDialogOpen(true)}
                title="Delete entry"
                color="error"
                disabled={isLoading}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </>
        )}
      </Paper>

      {/* Delete Entry Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Entry</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this entry? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={isLoading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
