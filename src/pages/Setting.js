import React from "react";

import { Palette, CompareArrows} from "@mui/icons-material";

import { useSelector, useDispatch } from 'react-redux';

import { toggleThemeMode, swapThemeColors, isDarkMode, isColorSwaped } from "../context/settingsReducer";

// material
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    Switch
} from '@mui/material';

export default function Setting() {

  const darkMode = useSelector(isDarkMode);
  const colorSwaped = useSelector(isColorSwaped);

  const dispatch = useDispatch();

  return (
  <div>
    <Typography variant="h5">Settings</Typography>
    <Card>
      <CardContent>
        <List>
          <ListItem>
            <ListItemIcon>
              <Palette />
            </ListItemIcon>
            <ListItemText primary="Dark Mode" />
            <ListItemSecondaryAction>
              <Switch
                onChange={(e, checked) =>  dispatch(toggleThemeMode(checked))}
                checked={darkMode}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CompareArrows />
            </ListItemIcon>
            <ListItemText primary="Swap Colors" />
            <ListItemSecondaryAction>
              <Switch
                onChange={(e, checked) => dispatch(swapThemeColors(checked))}
                checked={colorSwaped}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  </div>);
};
