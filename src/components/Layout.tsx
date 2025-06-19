import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import React from 'react';
import { useLocation, Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isJournalPage = location.pathname.startsWith('/journal/');

  const browserWidth = useBrowserWidth();

  return (
    <Box sx={{ width: Math.min(650, browserWidth), padding: 0 }}>
      {isHomePage && (
        <AppBar
          position="fixed"
          elevation={2}
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            borderRadius: 0
          }}
        >
          <Toolbar>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                flexGrow: 1,
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}
              >
                journalon
              </Typography>
              <Button
                component={Link}
                to="/about"
                color="inherit"
                sx={{ textTransform: 'none' }}
              >
                About
              </Button>
          </Toolbar>
        </AppBar>
      )}
      <Box>
        {(isHomePage || isJournalPage) && <Box sx={{ height: '64px' }} />} {/* Spacer for AppBar */}
        <Box sx={{
          minHeight: isHomePage || isJournalPage ? 'calc(100dvh - 64px)' : '100dvh',
          padding: isHomePage || isJournalPage ? 0 : 2
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

const useBrowserWidth = () => {
  const [width, setWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}
