import PropTypes from 'prop-types';
import { styled } from '@mui/system';
import clsx from 'clsx';

const TextWrapper = styled('span')(({ theme }) => ({
  display: 'inline-block',
  alignItems: 'center',

  '&.flexItem': {
    display: 'inline-flex',
  },

  '&.MuiText': {
    '&-black': {
      color: theme.palette.common.black,
    },
    '&-primary': {
      color: theme.palette.primary.main,
    },
    '&-secondary': {
      color: theme.palette.secondary.main,
    },
    '&-success': {
      color: theme.palette.success.main,
    },
    '&-warning': {
      color: theme.palette.warning.main,
    },
    '&-error': {
      color: theme.palette.error.main,
    },
    '&-info': {
      color: theme.palette.info.main,
    },
  },
}));

const Text = ({ className, color = 'secondary', flex, children, ...rest }) => {
  return (
    <TextWrapper className={clsx(`MuiText-${color}`, { flexItem: flex })} {...rest}>
      {children}
    </TextWrapper>
  );
};

Text.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'success', 'info', 'black']),
};

export default Text;
