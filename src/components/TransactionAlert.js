import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectProcess, selectTxHash, updateProcess } from 'src/redux/transactionSlice';
import { styled, keyframes } from '@mui/material/styles';

const slideIn = keyframes`
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const AlertContainer = styled.div`
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 9999;
  animation: ${(props) =>
    props.isClosing
      ? css`
          ${slideOut} 0.3s ease-out forwards
        `
      : css`
          ${slideIn} 0.3s ease-out
        `};

  @media (max-width: 640px) {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }
`;

const AlertBox = styled.div`
  min-width: 360px;
  max-width: 480px;
  padding: 20px;
  border-radius: 12px;
  backdrop-filter: blur(20px);
  background: ${(props) => {
    switch (props.severity) {
      case 'success':
        return 'rgba(16, 185, 129, 0.95)';
      case 'error':
        return 'rgba(239, 68, 68, 0.95)';
      default:
        return 'rgba(59, 130, 246, 0.95)';
    }
  }};
  box-shadow: none;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: transparent;
    animation: ${pulse} 2s ease-in-out infinite;
  }

  @media (max-width: 640px) {
    min-width: unset;
    width: 100%;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5px;
  margin-bottom: 8px;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const CheckIcon = styled.svg`
  width: 20px;
  height: 20px;
  fill: white;
`;

const WarningIcon = styled.svg`
  width: 20px;
  height: 20px;
  fill: white;
`;

const ClockIcon = styled.svg`
  width: 18px;
  height: 18px;
  fill: white;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  flex: 1;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 16px;
    height: 16px;
    fill: white;
  }
`;

const Content = styled.div`
  margin-left: 48px;
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.95;
`;

const ViewLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 1px;
  margin-top: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  text-decoration: none;
  font-size: 13px;
  font-weight: 400;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  svg {
    width: 14px;
    height: 14px;
    fill: white;
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.8);
    animation: ${(props) =>
      props.duration
        ? css`
      progress ${props.duration}ms linear forwards
    `
        : 'none'};

    @keyframes progress {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(0);
      }
    }
  }
`;

const TransactionAlert = () => {
  const dispatch = useDispatch();
  const isProcessing = useSelector(selectProcess);
  const txHash = useSelector(selectTxHash);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      dispatch(updateProcess(0));
      setIsClosing(false);
    }, 300);
  };

  useEffect(() => {
    if (isProcessing === 2 || isProcessing === 3) {
      const timer = setTimeout(
        () => {
          handleClose();
        },
        isProcessing === 2 ? 6000 : 5000
      );
      return () => clearTimeout(timer);
    }
  }, [isProcessing]);

  const alertConfig = {
    1: {
      title: 'Waiting for Signature',
      content: 'Please review and sign the transaction in your wallet',
      icon: (
        <>
          <ClockIcon>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
            </svg>
          </ClockIcon>
          <Spinner
            style={{ position: 'absolute', width: '36px', height: '36px', borderWidth: '1.5px' }}
          />
        </>
      ),
      severity: 'info',
      autoHideDuration: null,
      showClose: false
    },
    2: {
      title: 'Transaction Confirmed',
      content: (
        <>
          Transaction successfully submitted
          {txHash && (
            <ViewLink
              href={`https://bithomp.com/explorer/${txHash}`}
              target="_blank"
              rel="noreferrer"
            >
              View on Explorer
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
              </svg>
            </ViewLink>
          )}
        </>
      ),
      icon: (
        <CheckIcon>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        </CheckIcon>
      ),
      severity: 'success',
      autoHideDuration: 6000,
      showClose: true
    },
    3: {
      title: 'Transaction Cancelled',
      content: 'The transaction was cancelled or rejected',
      icon: (
        <WarningIcon>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </WarningIcon>
      ),
      severity: 'error',
      autoHideDuration: 5000,
      showClose: true
    }
  };

  const currentConfig = alertConfig[isProcessing];

  if (!isProcessing || !currentConfig) {
    return null;
  }

  const { title, content, icon, severity, autoHideDuration, showClose } = currentConfig;

  return (
    <AlertContainer isClosing={isClosing}>
      <AlertBox severity={severity}>
        <Header>
          <IconWrapper>{icon}</IconWrapper>
          <Title>{title}</Title>
          {showClose && (
            <CloseButton onClick={handleClose}>
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </CloseButton>
          )}
        </Header>
        <Content>{typeof content === 'string' ? content : content}</Content>
        {autoHideDuration && <ProgressBar duration={autoHideDuration} />}
      </AlertBox>
    </AlertContainer>
  );
};

export default TransactionAlert;
