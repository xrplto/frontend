import { useContext, useState } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { Divider, IconButton, Stack, Typography } from '@mui/material';
import styled from '@emotion/styled';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { enqueueSnackbar } from 'notistack';

import { isInstalled, getPublicKey, signMessage } from "@gemwallet/api";
import sdk from "@crossmarkio/sdk";

import LoginDialog from '../LoginDialog';
import { AppContext } from 'src/AppContext';

const WalletItem = styled(Stack)(({ theme }) => ({
  padding: "15px",
  cursor: "pointer",
  transition: "all 0.2s",
  "&:hover": {
    backgroundColor: theme.general.backgroundAlt
  }
}));


const WalletConnectModal = () => {

  const {
    darkMode,
    openWalletModal,
    setOpenWalletModal,
    openLogin,
    qrUrl,
    nextUrl,
    handleLoginClose,
    handleLogin,
    onLogoutXumm
  } = useContext(AppContext);


  const handleClose = () => {
    setOpenWalletModal(false);
  };

  const handleConnectGem = () => {
    isInstalled().then((response) => {
      if (response.result.isInstalled) {
        getPublicKey().then((response) => {
          // console.log(`${response.result?.address} - ${response.result?.publicKey}`);
          const pubkey = response.result?.publicKey;
          //fetch nonce from /api/gem/nonce?pubkey=pubkey
          fetch(
            `/api/auth/gem/nonce?pubkey=${pubkey}&address=${response.result?.address}`
          )
            .then((response) => response.json())
            .then((data) => {
              const nonceToken = data.token;
              const opts = {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${nonceToken}`,
                },
              };
              signMessage(nonceToken).then((response) => {
                const signedMessage = response.result?.signedMessage;
                if (signedMessage !== undefined) {
                  //post at /api/gem/checksign?signature=signature
                  fetch(`/api/auth/gem/checksign?signature=${signedMessage}`, opts)
                    .then((response) => response.json())
                    .then((data) => {
                      const { token, address } = data;
                      if (token === undefined) {
                        console.log("error");
                        return;
                      }
                      setXrpAddress(address);
                      setOpen(false);
                      if (enableJwt) {
                        setCookie("jwt", token, { path: "/" });
                      }
                    });
                }
              });
            });
        });
      }
      else {
        enqueueSnackbar("GemWallet is not installed", { variant: "error" });
      }
    })
  };

  const handleConnectCrossmark = async () => {
    try {
      if (!window.xrpl) {
        enqueueSnackbar("CrossMark wallet is not installed", { variant: "error" });
        return;
      }
      const { isCrossmark } = window.xrpl;
      if (isCrossmark) {
        let { request, response, createdAt, resolvedAt } = await sdk.methods.signInAndWait();
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Dialog
      open={openWalletModal}
      onClose={handleClose}
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: "450px",
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent={openLogin ? "space-between" : "end"}>
          {
            openLogin &&
            <IconButton onClick={onLogoutXumm}>
              <ArrowBackIcon />
            </IconButton>
          }
          <IconButton onClick={handleClose}>
            <ClearIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ paddingBottom: "60px" }}>
        {
          openLogin ?
            <LoginDialog
              open={openLogin}
              handleClose={handleLoginClose}
              qrUrl={qrUrl}
              nextUrl={nextUrl}
            />
            :
            <>
              <Typography variant="modal" mb={2}>Login</Typography>
              <Stack
                spacing={0.5}
              >
                <WalletItem direction="row" spacing={2} alignItems="center" onClick={handleLogin}>
                  <img src="/icons/xaman.png" />
                  <Typography variant="h3">Xaman</Typography>
                </WalletItem>
                <Divider />

                <WalletItem direction="row" spacing={2} alignItems="center" onClick={handleConnectGem}>
                  <img src="/icons/gem.svg" />
                  <Typography variant="h3">GemWallet</Typography>
                </WalletItem>
                <Divider />

                <WalletItem direction="row" spacing={2} alignItems="center" onClick={handleConnectCrossmark}>
                  <img src="/icons/crossmark.png" />
                  <Typography variant="h3">CrossMark</Typography>
                </WalletItem>
              </Stack>
            </>
        }


      </DialogContent>
    </Dialog>
  )
}

export default WalletConnectModal;