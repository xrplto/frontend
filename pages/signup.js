import { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { WalletContext } from 'src/context/AppContext';

export default function SignupPage() {
  const router = useRouter();
  const { ref } = router.query;
  const { setOpenWalletModal, accountProfile } = useContext(WalletContext);

  useEffect(() => {
    if (!router.isReady) return;

    // Store referral code for use during registration
    if (ref) {
      localStorage.setItem('referral_code', ref);
    }

    // If already logged in, go to wallet referral tab
    if (accountProfile?.account) {
      router.replace('/wallet?tab=referral');
      return;
    }

    // Open wallet modal for signup and redirect to home
    setOpenWalletModal(true);
    router.replace('/');
  }, [router.isReady, ref, accountProfile, setOpenWalletModal, router]);

  return null;
}
