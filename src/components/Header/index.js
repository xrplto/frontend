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
      <div className={`border-b flex items-center px-4 ${theme ? "" : "dark"}`}>
        <span className="mr-4"><b>Ledger Index: 68249567</b> </span>
        <span><b>Ledger Hash: D669BF5CA88CE15A7EA7D0707871F537C3AA5D3D53D47643EA7764676EA6132D</b> </span>
        <span className="flex-grow"/>
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