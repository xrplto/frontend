//import { Link as RouterLink, Outlet } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
// material
//import { styled } from '@mui/material/styles';
// ----------------------------------------------------------------------

// const HeaderStyle = styled('header')(({ theme }) => ({
//   top: 0,
//   left: 0,
//   lineHeight: 0,
//   width: '100%',
//   position: 'absolute',
//   padding: theme.spacing(3, 3, 0),
//   [theme.breakpoints.up('sm')]: {
//     padding: theme.spacing(5, 5, 0)
//   }
// }));

// ----------------------------------------------------------------------

// <HeaderStyle>
//   <RouterLink to="/">
//     <Logo />       
//   </RouterLink>
// </HeaderStyle>

export default function EmptyLayout() {
  return (
    <>      
      <Outlet />
    </>
  );
}
