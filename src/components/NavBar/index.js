import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Button from '@material-ui/core/Button';
import logo from 'assets/images/logo2.png';
import './style.scss';

const NavBar = (props) => {
  const { t } = useTranslation();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const dispatch = useDispatch();
  return (
    <>
      <div className="nav-bar">
        <img src={logo} width="130"/>
        <Link to="" >Cryptocurrencies</Link>
        <Link to="" >Exchanges</Link>
        <Link to="" >NFT</Link>
        <Link to="" >Portfolio</Link>
        <Link to="" >Watchlist</Link>
        <span className="flex-grow" />
        {!currentUser? (
            <>
            <Link to="/Login">{t('browse.login')}</Link>
            <Link to="/register">
                <Button variant="contained" color="secondary">
                    {t('browse.signup')}
                </Button>
            </Link>
            </>
            ) : 
            (
            <>
            <div className="dropdown mr-3">
                <span className="dropbtn font-bold hover:text-red-500 flex  mr-3"> <img src={`http://localhost:8080/api/public/${this.props.currentUser.image}`} className="rounded-full" width="40"/><ArrowDropDownIcon/></span>
                <div className="dropdown-content">
                    <a><ExitToAppIcon />{t('browse.logout')}</a>
                </div>                  
            </div>
        </>                      
        )
        }        
      </div>
    </>
  )
}

export default NavBar