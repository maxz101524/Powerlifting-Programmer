import React from 'react';
import { Box, Container, Typography, useTheme } from '@mui/material';

const AuthLayout = ({ children }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.grey[50],
        p: 3,
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 4,
          boxShadow: 3,
          p: { xs: 3, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            mb: 4,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: 1,
            }}
          >
            PowerLift
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ maxWidth: 400 }}
          >
            Track your powerlifting progress
          </Typography>
        </Box>
        {children}
      </Container>
    </Box>
  );
};

export default AuthLayout;
