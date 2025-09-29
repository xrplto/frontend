import { Box, CircularProgress, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';

// Pulse animation
const pulse = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
`;

// Puff animation
const puff = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
`;

// Fade animation
const fade = keyframes`
  0%, 100% {
    opacity: 0.25;
  }
  50% {
    opacity: 1;
  }
`;

// Clip animation
const clip = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Bar animation
const barStretch = keyframes`
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
`;

// PulseLoader Component
const PulseContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  gap: '4px',
  alignItems: 'center'
}));

const PulseDot = styled('span')(({ theme, color, size, delay }) => ({
  display: 'inline-block',
  width: size || 10,
  height: size || 10,
  borderRadius: '50%',
  backgroundColor: color || theme.palette.primary.main,
  animation: `${pulse} 1.5s ease-in-out ${delay}s infinite`
}));

export const PulseLoader = ({ color, size = 10, ...props }) => (
  <PulseContainer {...props}>
    <PulseDot color={color} size={size} delay={0} />
    <PulseDot color={color} size={size} delay={0.2} />
    <PulseDot color={color} size={size} delay={0.4} />
  </PulseContainer>
);

// PuffLoader Component
const PuffCircle = styled(Box)(({ theme, color, size }) => ({
  width: size || 60,
  height: size || 60,
  position: 'relative',
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: `3px solid ${color || theme.palette.primary.main}`,
    animation: `${puff} 2s ease-out infinite`
  },
  '&::after': {
    animationDelay: '1s'
  }
}));

export const PuffLoader = ({ color, size = 60, ...props }) => (
  <PuffCircle color={color} size={size} {...props} />
);

// ClipLoader Component
const ClipCircle = styled(Box)(({ theme, color, size }) => ({
  width: size || 35,
  height: size || 35,
  border: `3px solid ${color ? `${color}33` : theme.palette.action.disabled}`,
  borderTopColor: color || theme.palette.primary.main,
  borderRadius: '50%',
  animation: `${clip} 1s linear infinite`
}));

export const ClipLoader = ({ color, size = 35, ...props }) => (
  <ClipCircle color={color} size={size} {...props} />
);

// FadeLoader Component
const FadeContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  gap: '2px',
  alignItems: 'center'
}));

const FadeBar = styled('span')(({ theme, color, delay }) => ({
  display: 'inline-block',
  width: 4,
  height: 35,
  backgroundColor: color || theme.palette.primary.main,
  animation: `${fade} 1.2s ease-in-out ${delay}s infinite`,
  borderRadius: 2
}));

export const FadeLoader = ({ color, ...props }) => (
  <FadeContainer {...props}>
    <FadeBar color={color} delay={0} />
    <FadeBar color={color} delay={0.1} />
    <FadeBar color={color} delay={0.2} />
    <FadeBar color={color} delay={0.3} />
    <FadeBar color={color} delay={0.4} />
  </FadeContainer>
);

// BarLoader Component
const BarContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  gap: '3px',
  alignItems: 'center'
}));

const Bar = styled('span')(({ theme, color, delay }) => ({
  display: 'inline-block',
  width: 4,
  height: 18,
  backgroundColor: color || theme.palette.primary.main,
  animation: `${barStretch} 1.2s ease-in-out ${delay}s infinite`,
  borderRadius: 2
}));

export const BarLoader = ({ color, ...props }) => (
  <BarContainer {...props}>
    <Bar color={color} delay={0} />
    <Bar color={color} delay={0.1} />
    <Bar color={color} delay={0.2} />
    <Bar color={color} delay={0.3} />
    <Bar color={color} delay={0.4} />
  </BarContainer>
);

// Default export for backward compatibility
export default {
  PulseLoader,
  PuffLoader,
  ClipLoader,
  FadeLoader,
  BarLoader
};