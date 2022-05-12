//import { ClassNameMap } from '@material-ui/styles';
//import makeStyles from '@material-ui/styles/makeStyles';
import { makeStyles } from "@mui/styles";

const tabsStyles = () => ({
    root: {
        width: '100%',
        boxShadow: 'inset 0 -1px 0 rgba(100,121,143,0.122)',
    },
    indicator: ({ indicatorColors = [] }) => ({
        height: 3,
        backgroundColor: 'rgba(0,0,0,0)',
        '& > div': {
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
            height: 3,
            margin: '0 4px',
            ...indicatorColors.reduce((result, color, index) => ({
                ...result,
                [`&.MuiIndicator-${index}`]: {
                    backgroundColor: color,
                }
            }), {}),
        },
    }),
});

const tabItemStyles = () => ({
    root: {
        minHeight: '56px',
        textTransform: 'none',
        color: '#454F5B',
        '&.Mui-selected': {
            color: props => props.color,
        },
        '&.Mui-focusVisible': {
            backgroundColor: 'rgba(100, 95, 228, 0.32)',
        },
    },
});

export const useGmailTabsStyles = makeStyles(tabsStyles)

export const useGmailTabItemStyles = makeStyles(tabItemStyles)

