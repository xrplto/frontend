import PropTypes from 'prop-types';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
    alpha,
    styled,
    Box,
    Fab,
    useScrollTrigger,
    Zoom
 } from '@mui/material';

 const FabStyle = styled(Fab)(({ theme }) => ({
    boxShadow: 'none',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    //backgroundColor: alpha(theme.palette.background.default, 0.9),
    //color: alpha("#00AB88", 0.7),
    //backgroundColor: alpha("#00AB88", 0.7),
    backgroundColor: alpha("#9E86FF", 0.7),
    '&:hover': {
        backgroundColor: alpha("#9E86FF", 0.4),
    },
}));

 ScrollToTop.propTypes = {
    /**
     * Injected by the documentation to work in an iframe.
     * You won't need it on your project.
     */
    window: PropTypes.func,
};

export default function ScrollToTop(props) {
    const { window } = props;
    // Note that you normally won't need to set the window ref as useScrollTrigger
    // will default to window.
    // This is only being set here because the demo is in an iframe.
    const trigger = useScrollTrigger({
        target: window ? window() : undefined,
        disableHysteresis: true,
        threshold: 100,
    });
  
    const handleClick = (event) => {
      const anchor = (event.target.ownerDocument || document).querySelector(
        '#back-to-top-anchor',
      );
  
      if (anchor) {
        anchor.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
      }
    };
  
    return (
        <Zoom in={trigger}>
            <Box
                onClick={handleClick}
                role="presentation"
                sx={{ position: 'fixed', bottom: 16, right: 16 }}
            >
                <FabStyle size="small" aria-label="scroll back to top">
                    <KeyboardArrowUpIcon />
                </FabStyle>
            </Box>
        </Zoom>
    );
}
