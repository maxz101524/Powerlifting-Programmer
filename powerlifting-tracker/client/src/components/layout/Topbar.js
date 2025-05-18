import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  ExitToApp as ExitToAppIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

const Topbar = ({ onMenuClick, user, onLogout }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - 240px)` },
        ml: { sm: '240px' },
        boxShadow: '0 2px 10px 0 rgba(0,0,0,0.05)',
        backgroundColor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Powerlifting Tracker
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Notifications">
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <NotificationsIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Account">
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: theme.palette.primary.main,
                }}
              >
                {user?.name?.charAt(0) || <PersonIcon />}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            mt: 1.5,
            minWidth: 220,
            borderRadius: 2,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1.5,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              boxShadow: theme.shadows[1],
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" noWrap>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user?.email || ''}
          </Typography>
        </Box>
        
        <MenuItem onClick={handleProfileClick} sx={{ py: 1.5 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <Typography variant="body2">My Profile</Typography>
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <Avatar sx={{ bgcolor: theme.palette.grey[200] }}>
            <DashboardIcon fontSize="small" sx={{ color: 'text.primary' }} />
          </Avatar>
          <Typography variant="body2">Dashboard</Typography>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <Avatar sx={{ bgcolor: theme.palette.grey[200] }}>
            <SettingsIcon fontSize="small" sx={{ color: 'text.primary' }} />
          </Avatar>
          <Typography variant="body2">Settings</Typography>
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={handleLogout} 
          sx={{ 
            py: 1.5,
            color: theme.palette.error.main,
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.05),
            },
          }}
        >
          <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1) }}>
            <ExitToAppIcon fontSize="small" color="error" />
          </Avatar>
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Topbar;
