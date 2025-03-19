import React, { useContext, useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Avatar,
  Paper,
  Grid,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Snackbar
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import TelegramIcon from '@mui/icons-material/Telegram';
import ChatIcon from '@mui/icons-material/Chat';
import TwitterIcon from '@mui/icons-material/Twitter';
import { AppContext } from 'src/AppContext';
import { styled } from '@mui/material/styles';
import ProfileNFTPicker from './ProfileNFTPicker';
import MuiAlert from '@mui/material/Alert';

// Styled component for editable fields
const EditableField = styled(TextField)(({ theme, isediting }) => ({
  '& .MuiInputBase-root': {
    backgroundColor:
      isediting === 'true' ? theme.palette.action.hover : theme.palette.action.disabledBackground,
    transition: theme.transitions.create(['background-color', 'box-shadow'])
  },
  '& .MuiOutlinedInput-root.Mui-focused': {
    backgroundColor: theme.palette.background.paper
  }
}));

function ChatSettings() {
  const { accountProfile, updateAccountProfile } = useContext(AppContext);

  // Add a check for updateAccountProfile
  const [localProfile, setLocalProfile] = useState(accountProfile);

  const safeUpdateAccountProfile = (newProfile) => {
    if (typeof updateAccountProfile === 'function') {
      updateAccountProfile(newProfile);
    } else {
      console.warn('updateAccountProfile is not a function, using local state update');
      setLocalProfile(newProfile);
    }
  };

  const [editMode, setEditMode] = useState(false);
  const [tempUsername, setTempUsername] = useState(localProfile?.username || '');
  const [showNFTPicker, setShowNFTPicker] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(false);

  // New state variable to track NFT availability
  const [nftsAvailable, setNftsAvailable] = useState(true);

  // Add state for social media accounts
  const [socialMedia, setSocialMedia] = useState({
    telegram: localProfile?.socialMedia?.telegram || '',
    discord: localProfile?.socialMedia?.discord || '',
    x: localProfile?.socialMedia?.x || ''
  });

  const handleSocialMediaChange = (platform) => (event) => {
    setSocialMedia({ ...socialMedia, [platform]: event.target.value });
  };

  const handleUsernameChange = (event) => {
    const newUsername = event.target.value.slice(0, 12); // Limit to 12 characters
    setTempUsername(newUsername);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setNftsAvailable(true); // Reset nftsAvailable
    const updatedProfile = {
      ...localProfile,
      username: tempUsername,
      socialMedia: socialMedia
    };
    safeUpdateAccountProfile(updatedProfile);
    setEditMode(false);

    // Send update to server
    try {
      const response = await fetch('http://37.27.134.126:5000/api/set-user-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account: localProfile.account,
          username: tempUsername,
          imageUrl: localProfile.imageUrl,
          nftTokenId: localProfile.nftTokenId,
          socialMedia: socialMedia
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile on server');
      }

      const result = await response.json();
      console.log('Server response:', result);

      // Update local state with the server response
      if (result.user) {
        safeUpdateAccountProfile(result.user);
      }

      // Show a success message to the user
      showNotification('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile on server:', error);
      // Show an error message to the user
      showNotification('Failed to update profile. Please try again.', 'error');
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    setTempUsername(localProfile?.username || '');
    setEditMode(false);
    setNftsAvailable(true); // Reset nftsAvailable
    setShowNFTPicker(false); // Close the NFT picker section
    // Reset social media fields to original values
    setSocialMedia({
      telegram: localProfile?.socialMedia?.telegram || '',
      discord: localProfile?.socialMedia?.discord || '',
      x: localProfile?.socialMedia?.x || ''
    });
  };

  const handleEditToggle = () => {
    setEditMode((prevMode) => !prevMode);
    if (!editMode) {
      setTempUsername(localProfile?.username || '');
      setSocialMedia({
        telegram: localProfile?.socialMedia?.telegram || '',
        discord: localProfile?.socialMedia?.discord || '',
        x: localProfile?.socialMedia?.x || ''
      });
    }
  };

  const handleOpenNFTPicker = () => {
    setShowNFTPicker(true);
  };

  const handleCloseNFTPicker = () => {
    setShowNFTPicker(false);
  };

  const handleNFTSelect = async (nft) => {
    console.log('Selected NFT:', nft);

    // Get the small thumbnail URL
    const smallThumbnailUrl =
      nft.files?.[0]?.thumbnail?.small ||
      nft.thumbnail?.image ||
      nft.meta?.image ||
      localProfile?.imageUrl;

    // Update the local state with the new profile image
    const updatedProfile = {
      ...localProfile,
      imageUrl: smallThumbnailUrl
    };

    // Update local state immediately
    safeUpdateAccountProfile(updatedProfile);

    // Force a re-render
    setTempUsername((prevUsername) => prevUsername);

    // Prepare the data for the request
    const requestData = {
      account: localProfile?.account,
      imageUrl: smallThumbnailUrl,
      nftTokenId: nft.NFTokenID || nft._id
    };

    try {
      const response = await fetch('http://37.27.134.126:5000/api/set-user-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile image on server');
      }

      const result = await response.json();
      console.log('Server response:', result);

      // Update local state with the server response
      if (result.user) {
        safeUpdateAccountProfile(result.user);
      }

      // Show a success message to the user
      showNotification('Profile image updated successfully!');
    } catch (error) {
      console.error('Error updating profile image on server:', error);
      // Show an error message to the user
      showNotification('Failed to update profile image. Please try again.', 'error');
    }

    setShowNFTPicker(false);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const showNotification = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getProfileImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `https://s2.xrpnft.com/d1/${imageUrl}`;
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(
          `http://37.27.134.126:5000/api/set-user-image?account=${accountProfile.account}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        if (data.user) {
          safeUpdateAccountProfile(data.user);
          setLocalProfile(data.user);
          setTempUsername(data.user.username || '');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        showNotification('Failed to load user profile', 'error');
      }
    };

    if (accountProfile?.account) fetchUserProfile();
  }, [accountProfile]);

  return (
    <Paper
      elevation={3}
      sx={{ p: 2, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mb: 1
        }}
      >
        <Button
          variant={editMode ? 'contained' : 'outlined'}
          startIcon={editMode ? <SaveIcon /> : <EditIcon />}
          onClick={editMode ? handleSave : handleEditToggle}
          color={editMode ? 'primary' : 'secondary'}
          disabled={isLoading}
          size="small"
        >
          {editMode ? (isLoading ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {/* User info section with profile image and NFT picker */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'center'
              }}
            >
              <Avatar
                src={getProfileImageUrl(localProfile?.imageUrl)}
                alt={localProfile?.username || 'User'}
                onClick={editMode ? handleOpenNFTPicker : undefined}
                sx={{
                  width: 80,
                  height: 80,
                  mb: 2,
                  borderRadius: 2,
                  '& img': {
                    objectFit: 'cover'
                  },
                  cursor: editMode ? 'pointer' : 'default',
                  '&:hover': editMode
                    ? {
                        opacity: 0.8,
                        transition: 'opacity 0.2s'
                      }
                    : {}
                }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, textAlign: 'center' }}
              >
                {localProfile?.username || 'User'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                justifyContent: 'center'
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Username
                </Typography>
                <EditableField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={editMode ? tempUsername : localProfile?.username || ''}
                  onChange={handleUsernameChange}
                  disabled={!editMode}
                  isediting={editMode.toString()}
                  InputProps={{
                    endAdornment: editMode && (
                      <Typography variant="caption" color="textSecondary">
                        {`${tempUsername.length}/12`}
                      </Typography>
                    )
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
                  value={localProfile?.account || ''}
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

        {showNFTPicker && nftsAvailable && (
          <Box sx={{ width: '100%', mb: 3 }}>
            <ProfileNFTPicker onSelect={handleNFTSelect} setNftsAvailable={setNftsAvailable} />
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Social Media Section */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
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
                  startAdornment: {
                    telegram: <TelegramIcon sx={{ mr: 1, color: 'action.active' }} />,
                    discord: <ChatIcon sx={{ mr: 1, color: 'action.active' }} />,
                    x: <TwitterIcon sx={{ mr: 1, color: 'action.active' }} />
                  }[platform]
                }}
              />
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3 }} />

        {editMode && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              onClick={handleCancel}
              startIcon={<CancelIcon />}
              variant="outlined"
              color="error"
              size="medium"
              sx={{
                minWidth: 120,
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Cancel
            </Button>
          </Box>
        )}
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <MuiAlert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Paper>
  );
}

export default ChatSettings;
