import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import './style.scss'
import { useState, useEffect, useRef } from 'react';

function useOutsideAlerter(ref, setActive) {
    useEffect(() => {
      /**
       * Alert if clicked on outside of element
       */
      function handleClickOutside(event) {
        if (ref.current && !ref.current.contains(event.target)) {
          setActive(false)
        }
      }
      // Bind the event listener
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        // Unbind the event listener on clean up
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref]);
  }

const Dropdown = ({account}) => {
    const wrapperRef = useRef(null);
    const [ active, setActive ] = useState(false);
    useOutsideAlerter(wrapperRef, setActive);    

    return (
        <span className="cp-dropdown" ref={wrapperRef}>
            <IconButton onClick={() => setActive(!active)} >
                <MoreVertIcon />
            </IconButton>
            <div className={`cp-dropdown-modal  ${ active ? "active": ""}`}>  
                <Paper elevation={3} >
                    <MenuList>
                        <MenuItem><a href={`https://bithomp.com/explorer/${account}`}>Bithomp</a></MenuItem>                                     
                        <MenuItem><a href={`https://xrpscan.com/account/${account}`}>XRPScan</a></MenuItem>
                    </MenuList>
                </Paper>
            </div>
        </span>
    )
}

export default Dropdown