import React, { useContext, useState } from 'react';
import { Box, TextField, Typography, Avatar, Paper, Grid, Button, Tooltip, IconButton, Divider, Switch, FormControlLabel } from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon, 
  Notifications as NotificationsIcon, 
  Security as SecurityIcon
} from '@mui/icons-material';
import TelegramIcon from '@mui/icons-material/Telegram';
import ChatIcon from '@mui/icons-material/Chat';
import TwitterIcon from '@mui/icons-material/Twitter';
import { AppContext } from 'src/AppContext';
import { styled } from '@mui/material/styles';
import ProfileNFTPicker from './ProfileNFTPicker';

// Styled component for editable fields
const EditableField = styled(TextField)(({ theme, isediting }) => ({
  '& .MuiInputBase-root': {
    backgroundColor: isediting === 'true' ? theme.palette.action.hover : theme.palette.action.disabledBackground,
    transition: theme.transitions.create(['background-color', 'box-shadow']),
  },
  '& .MuiOutlinedInput-root.Mui-focused': {
    backgroundColor: theme.palette.background.paper,
  },
}));

function ChatSettings() {
  const { accountProfile, updateAccountProfile } = useContext(AppContext);
  const [editMode, setEditMode] = useState(false);
  const [tempUsername, setTempUsername] = useState(accountProfile?.username || '');
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [showNFTPicker, setShowNFTPicker] = useState(false);

  // Add state for social media accounts
  const [socialMedia, setSocialMedia] = useState({
    telegram: accountProfile?.socialMedia?.telegram || '',
    discord: accountProfile?.socialMedia?.discord || '',
    x: accountProfile?.socialMedia?.x || '',
  });

  const handleSocialMediaChange = (platform) => (event) => {
    setSocialMedia({ ...socialMedia, [platform]: event.target.value });
  };

  const handleUsernameChange = (event) => {
    const newUsername = event.target.value.slice(0, 12); // Limit to 12 characters
    setTempUsername(newUsername);
  };

  const handleSave = () => {
    updateAccountProfile({
      ...accountProfile,
      username: tempUsername,
      socialMedia: socialMedia,
    });
    setEditMode(false);
  };

  const handleCancel = () => {
    setTempUsername(accountProfile?.username || '');
    setEditMode(false);
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (editMode) {
      setTempUsername(accountProfile?.username || '');
    }
  };

  const handleOpenNFTPicker = () => {
    setShowNFTPicker(true);
  };

  const handleCloseNFTPicker = () => {
    setShowNFTPicker(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Chat Settings
        </Typography>
        <Button
          variant={editMode ? "contained" : "outlined"}
          startIcon={editMode ? <SaveIcon /> : <EditIcon />}
          onClick={editMode ? handleSave : handleEditToggle}
          color={editMode ? "primary" : "secondary"}
        >
          {editMode ? "Save Changes" : "Edit Profile"}
        </Button>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {/* User info section with even smaller profile image */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
              <Avatar
                src={accountProfile?.profileImage || ''}
                alt={accountProfile?.username || 'User'}
                sx={{ width: 80, height: 80, mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                {accountProfile?.username || 'User'}
              </Typography>
              {editMode && (
                <Button variant="outlined" size="small" onClick={handleOpenNFTPicker}>
                  Change NFT
                </Button>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Username
                </Typography>
                <EditableField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={editMode ? tempUsername : (accountProfile?.username || '')}
                  onChange={handleUsernameChange}
                  disabled={!editMode}
                  isediting={editMode.toString()}
                  InputProps={{
                    endAdornment: editMode && (
                      <Typography variant="caption" color="textSecondary">
                        {`${tempUsername.length}/12`}
                      </Typography>
                    ),
                  }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Account
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={accountProfile?.account || ''}
                  disabled
                  InputProps={{
                    readOnly: true,
                    sx: { bgcolor: 'action.disabledBackground' }
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Preferences
        </Typography>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={<Switch checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationsIcon sx={{ mr: 1 }} />
                <Typography>Enable Notifications</Typography>
              </Box>
            }
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={<Switch checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon sx={{ mr: 1 }} />
                <Typography>Two-Factor Authentication</Typography>
              </Box>
            }
          />
        </Box>

        {/* Social Media Section */}
        <Typography variant="h6" sx={{ mb: 2, mt: 3, fontWeight: 'bold' }}>
          Social Media Accounts
        </Typography>

        <Grid container direction="column" spacing={2}>
          {['telegram', 'discord', 'x'].map((platform) => (
            <Grid item xs={12} key={platform}>
              <EditableField
                fullWidth
                variant="outlined"
                size="small"
                label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                value={socialMedia[platform]}
                onChange={handleSocialMediaChange(platform)}
                disabled={!editMode}
                isediting={editMode.toString()}
                InputProps={{
                  startAdornment: (
                    {
                      telegram: <TelegramIcon sx={{ mr: 1, color: 'action.active' }} />,
                      discord: <ChatIcon sx={{ mr: 1, color: 'action.active' }} />,
                      x: <TwitterIcon sx={{ mr: 1, color: 'action.active' }} />,
                    }[platform]
                  ),
                }}
              />
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Last login: {new Date().toLocaleString()}
        </Typography>

        <Button variant="outlined" color="secondary" fullWidth>
          Log Out
        </Button>

        {editMode && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={handleCancel} startIcon={<CancelIcon />} sx={{ mr: 1 }}>
              Cancel
            </Button>
          </Box>
        )}

        {showNFTPicker && (
          <ProfileNFTPicker open={showNFTPicker} onClose={handleCloseNFTPicker} />
        )}
      </Box>
    </Paper>
  );
}

export default ChatSettings;