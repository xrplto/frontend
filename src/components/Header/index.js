import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import logo from 'assets/images/newlogo.png';
import Brightness3Icon from "@material-ui/icons/Brightness3";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import IconButton from "@material-ui/core/IconButton";
import { List, ListItem, ListItemIcon, ListItemText, Divider } from '@material-ui/core';
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { ExitToApp,  } from '@material-ui/icons';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import AssignmentIndOutlinedIcon from '@material-ui/icons/AssignmentIndOutlined';
import DvrIcon from '@material-ui/icons/Dvr';
import { withTheme } from '@material-ui/core/styles';
import { withTranslation } from 'react-i18next';
import ChatOutlinedIcon from '@material-ui/icons/ChatOutlined';
import { changeTheme } from 'store/actions/common'
import LanguageSelect from 'components/languageSelect'
import { yellow } from '@material-ui/core/colors';

const Header = (props) => {
  const {t, i18n} = props
  const [ show, setShow ] = useState(false)
  const theme = useSelector((state) => state.common.theme)
  const dispatch = useDispatch()
  return (
    <>
      <div className={`border-b-black border flex justify-end items-center px-4 ${theme ? "" : "dark"}`}>
        <LanguageSelect theme={theme} />
        <IconButton
          edge="end"
          color="inherit"
          aria-label="mode"
          onClick={() => changeTheme(dispatch, !theme) }>
             {!theme ? <Brightness7Icon style={{ color: "yellow" }}/> : <Brightness3Icon />}
        </IconButton>
      </div>
    </>
  )
}

export default Header