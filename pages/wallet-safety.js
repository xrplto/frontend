import { useState } from 'react';
import Head from 'next/head';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Fingerprint as FingerprintIcon,
  Lock as LockIcon,
  Backup as BackupIcon,
  Devices as DevicesIcon
} from '@mui/icons-material';

export default function WalletSafety() {
  const theme = useTheme();
  const [expanded, setExpanded] = useState('seed-backup');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const SafetyCard = ({ title, icon, severity = 'info', children }) => (
    <Card sx={{
      mb: 2,
      border: `1px solid ${alpha(theme.palette[severity].main, 0.2)}`,
      backgroundColor: alpha(theme.palette[severity].main, 0.05)
    }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box sx={{
            p: 1,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette[severity].main, 0.1),
            color: theme.palette[severity].main
          }}>
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {children}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const DosDontsList = ({ dos, donts }) => (
    <Box sx={{ mt: 2 }}>
      <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ color: theme.palette.success.main, mb: 1, fontWeight: 600 }}>
            ✅ Do's
          </Typography>
          <List dense>
            {dos.map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                </ListItemIcon>
                <ListItemText primary={item} sx={{ fontSize: '0.9rem' }} />
              </ListItem>
            ))}
          </List>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ color: theme.palette.error.main, mb: 1, fontWeight: 600 }}>
            ❌ Don'ts
          </Typography>
          <List dense>
            {donts.map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CancelIcon sx={{ fontSize: 18, color: theme.palette.error.main }} />
                </ListItemIcon>
                <ListItemText primary={item} sx={{ fontSize: '0.9rem' }} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Stack>
    </Box>
  );

  return (
    <>
      <Head>
        <title>Wallet Safety Guide - XRPL.to</title>
        <meta name="description" content="Complete guide to keeping your XRPL.to device wallet secure. Learn best practices for hardware-secured wallet safety." />
      </Head>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Wallet Safety Guide
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Your complete guide to securing your XRPL.to device wallet and protecting your digital assets
          </Typography>
        </Box>

        {/* Critical Security Alert */}
        <Alert severity="error" sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            🚨 Critical Security Notice
          </Typography>
          <Typography>
            Your device wallet is only as secure as your device. Always keep your device updated,
            use strong authentication, and never share access with untrusted parties.
          </Typography>
        </Alert>

        {/* Quick Safety Overview */}
        <SafetyCard
          title="Passkey Wallet Security Overview"
          icon={<ShieldIcon />}
          severity="info"
        >
          <Typography paragraph>
            XRPL.to uses passkey authentication to secure your wallets. Each wallet has its own seed that can be backed up.
            Your wallets are tied to your specific device - if you lose your device, you can only restore wallets if you have backed up the seeds.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip label="Passkey Protected" color="success" size="small" />
            <Chip label="Seed Backup Available" color="primary" size="small" />
            <Chip label="Device Specific" color="warning" size="small" />
            <Chip label="Hardware Secured" color="info" size="small" />
          </Stack>
        </SafetyCard>

        {/* Detailed Safety Sections */}
        <Box sx={{ mt: 4 }}>
          <Accordion expanded={expanded === 'passkey-security'} onChange={handleChange('passkey-security')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={2} alignItems="center">
                <FingerprintIcon color="primary" />
                <Typography variant="h6">Passkey Security</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Your wallets are secured by passkeys stored on your device. Passkeys use biometric authentication or device PINs for access.
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Critical:</Typography>
                <Typography>
                  Passkeys are device-specific. If you lose or replace your device, you cannot access your wallets unless you have backed up the seed for each wallet.
                </Typography>
              </Alert>
              <DosDontsList
                dos={[
                  "Enable biometric authentication (fingerprint, face, Touch ID)",
                  "Use strong device PIN/password as backup authentication",
                  "Keep your device OS updated for latest passkey security",
                  "Understand that passkeys are tied to your specific device",
                  "Test passkey authentication regularly"
                ]}
                donts={[
                  "Share your device with untrusted people",
                  "Disable biometric authentication without good reason",
                  "Assume passkeys work across different devices",
                  "Forget that losing device = losing wallet access",
                  "Ignore passkey security prompts from your browser"
                ]}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'browser-safety'} onChange={handleChange('browser-safety')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={2} alignItems="center">
                <SecurityIcon color="warning" />
                <Typography variant="h6">Browser & Network Safety</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Safe browsing practices are essential for protecting your wallet from phishing and malicious sites.
              </Typography>
              <DosDontsList
                dos={[
                  "Always verify you're on the correct XRPL.to domain",
                  "Look for HTTPS (secure connection) indicator",
                  "Use updated browsers with security features enabled",
                  "Bookmark the official XRPL.to site",
                  "Use secure, trusted networks when possible"
                ]}
                donts={[
                  "Click on suspicious links claiming to be XRPL.to",
                  "Use your wallet on public or unsecured WiFi",
                  "Ignore browser security warnings",
                  "Use outdated browsers with known vulnerabilities",
                  "Trust shortened URLs or links from unknown sources"
                ]}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'seed-backup'} onChange={handleChange('seed-backup')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={2} alignItems="center">
                <BackupIcon color="error" />
                <Typography variant="h6">Seed Backup & Recovery</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Each wallet account has its own unique seed. This seed is your ONLY way to recover wallet access if you lose your device.
              </Typography>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>🚨 Critical Warning:</Typography>
                <Typography>
                  If you lose your device and don't have the seed backup, your wallet is permanently lost.
                  There is no way to recover it without the seed. Backup your seeds immediately after creating wallets.
                </Typography>
              </Alert>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                How to backup your seed:
              </Typography>
              <List dense sx={{ mb: 2 }}>
                <ListItem>
                  <ListItemText primary="1. Click the backup icon in your wallet interface" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="2. Authenticate with your passkey to reveal the seed" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="3. Write down the seed on paper (recommended)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="4. Store the paper in a secure, private location" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="5. Repeat for each wallet account you want to backup" />
                </ListItem>
              </List>
              <DosDontsList
                dos={[
                  "Backup seeds for every wallet account you create",
                  "Write seeds on paper and store securely offline",
                  "Test seed recovery on a different device before trusting it",
                  "Keep multiple copies in different secure locations",
                  "Backup seeds immediately after creating new wallets"
                ]}
                donts={[
                  "Store seeds digitally (cloud, email, photos)",
                  "Share your seed with anyone for any reason",
                  "Assume you can recover without the seed",
                  "Wait to backup - do it immediately",
                  "Store all backups in the same location"
                ]}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'transaction-safety'} onChange={handleChange('transaction-safety')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={2} alignItems="center">
                <LockIcon color="error" />
                <Typography variant="h6">Transaction Safety</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Always verify transaction details carefully before confirming. Blockchain transactions are irreversible.
              </Typography>
              <DosDontsList
                dos={[
                  "Double-check recipient addresses before sending",
                  "Verify transaction amounts and fees",
                  "Start with small test transactions for new recipients",
                  "Keep transaction records for your reference",
                  "Understand gas/network fees before transacting"
                ]}
                donts={[
                  "Rush through transaction confirmations",
                  "Send to addresses you haven't verified",
                  "Ignore unusually high transaction fees",
                  "Transact when you're distracted or in a hurry",
                  "Trust transaction details from untrusted sources"
                ]}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'device-loss'} onChange={handleChange('device-loss')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={2} alignItems="center">
                <DevicesIcon color="warning" />
                <Typography variant="h6">Device Loss & Recovery</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Understanding what happens when you lose your device and how to recover your wallets.
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Device Loss Reality:</Typography>
                <Typography>
                  Passkeys cannot be transferred between devices. If you lose your device, your only option is to import your wallets using the seed backup on a new device.
                </Typography>
              </Alert>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Recovery Process:
              </Typography>
              <List dense sx={{ mb: 2 }}>
                <ListItem>
                  <ListItemText primary="1. Get a new device and access XRPL.to" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="2. Use 'Import Wallet' feature instead of creating new" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="3. Enter the seed phrase you backed up" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="4. Your wallet will be restored with all funds" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="5. Create new passkey authentication for the new device" />
                </ListItem>
              </List>
              <DosDontsList
                dos={[
                  "Plan for device loss before it happens",
                  "Have seed backups ready before you need them",
                  "Practice wallet recovery on a test device",
                  "Keep your seed backups updated and accessible",
                  "Understand that each device needs its own passkey setup"
                ]}
                donts={[
                  "Assume passkeys will work on a new device",
                  "Wait until you lose your device to think about recovery",
                  "Rely only on device-specific authentication",
                  "Forget where you stored your seed backups",
                  "Create wallets without immediate seed backup"
                ]}
              />
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Emergency Procedures */}
        <SafetyCard
          title="Emergency Procedures"
          icon={<WarningIcon />}
          severity="error"
        >
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            If You Suspect Unauthorized Access:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="1. Immediately move funds to a new secure wallet" />
            </ListItem>
            <ListItem>
              <ListItemText primary="2. Check all recent transactions for unauthorized activity" />
            </ListItem>
            <ListItem>
              <ListItemText primary="3. Review your device security settings" />
            </ListItem>
            <ListItem>
              <ListItemText primary="4. Consider creating fresh wallets on a secure device" />
            </ListItem>
          </List>
        </SafetyCard>

        {/* Support Information */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="h6" gutterBottom>
            Need Help?
          </Typography>
          <Typography color="text.secondary">
            For security-related questions or concerns, refer to our documentation or community resources.
            Never share your private keys or device access with anyone claiming to provide "support."
          </Typography>
        </Box>
      </Container>
    </>
  );
}