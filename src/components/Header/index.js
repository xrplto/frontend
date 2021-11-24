import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Brightness3Icon from "@material-ui/icons/Brightness3";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import IconButton from "@material-ui/core/IconButton";
import { changeTheme } from 'store/actions/common'
import LanguageSelect from 'components/languageSelect'

const Header = (props) => {
  const {t, i18n} = props
  const [ show, setShow ] = useState(false)
  const theme = useSelector((state) => state.common.theme)
  const dispatch = useDispatch()
  return (
    <>
      <div className={`border-b flex justify-end items-center px-4 ${theme ? "" : "dark"}`}>
        <LanguageSelect theme={theme} />
        <IconButton
          edge="end"
          color="inherit"
          style={{padding: "3px"}}
          aria-label="mode"
          onClick={() => changeTheme(dispatch, !theme) }>
             {!theme ? <Brightness7Icon style={{ color: "yellow" }}/> : <Brightness3Icon />}
        </IconButton>
      </div>
    </>
  )
}

export default Header