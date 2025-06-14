import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { FunctionComponent, useState } from "react";
import { getCurrentChatKey, setCurrentChatKey } from "./chatKeyStorage";

type ChatKeyDialogProps = {
  open: boolean;
  onClose: () => void;
  chatId?: string;
};

const ChatKeyDialog: FunctionComponent<ChatKeyDialogProps> = ({ open, onClose, chatId }) => {
  const [chatKey, setChatKey] = useState("");

  const handleSave = () => {
    if (chatId && chatKey) {
      setCurrentChatKey(chatId, chatKey);
      onClose();
    }
  };

  const handleCopy = () => {
    if (chatId) {
      const currentKey = getCurrentChatKey(chatId);
      if (currentKey) {
        navigator.clipboard.writeText(currentKey);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Chat Key Management</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {chatId && (
            <Button
              onClick={handleCopy}
              variant="outlined"
              fullWidth
              sx={{ mb: 2 }}
              disabled={!getCurrentChatKey(chatId)}
            >
              Copy Current Chat Key
            </Button>
          )}
          <TextField
            label="Paste Chat Key"
            fullWidth
            value={chatKey}
            onChange={(e) => setChatKey(e.target.value)}
            placeholder="Paste a chat key here to enable editing"
            variant="outlined"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!chatKey || !chatId}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChatKeyDialog;
