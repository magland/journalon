import { Box, Paper, Typography } from '@mui/material';

export default function AboutPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          About Journalon
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          What is Journalon?
        </Typography>
        <Typography paragraph>
          Journalon is a simple web application designed to help you record your thoughts and reflections. It provides a chat-like interface that makes writing feel natural and conversational.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Key Features
        </Typography>
        <Typography component="ul" sx={{ pl: 2 }}>
          <li>Chat-like interface that makes journaling feel natural</li>
          <li>Create multiple journals for different aspects of your life</li>
          <li>Edit or delete entries at any time</li>
          <li>Export your journals as JSON files for backup</li>
          <li>Import journals using files or private keys</li>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Privacy Information
        </Typography>
        <Typography paragraph>
          While journals are not searchable or publicly indexed, they can be accessed by anyone who has the journal ID. For your privacy and safety:
        </Typography>
        <Typography component="ul" sx={{ pl: 2 }}>
          <li>Avoid including sensitive personal information in your journals</li>
          <li>Do not share content that you would not want to be publicly visible</li>
          <li>Keep your journal IDs private if you want to maintain confidentiality</li>
        </Typography>
      </Paper>
    </Box>
  );
}
