import PsychologyIcon from '@mui/icons-material/Psychology';
import WaterIcon from '@mui/icons-material/Water';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedIcon from '@mui/icons-material/Verified';
import DiamondIcon from '@mui/icons-material/Diamond';
import BoltIcon from '@mui/icons-material/Bolt';
import StarIcon from '@mui/icons-material/Star';
import ShieldIcon from '@mui/icons-material/Shield';

export const ranks = [
  {
    id: 'rank1',
    name: 'Emerald',
    description: 'Basic premium features for XRP Ledger Chat',
    price: 10,
    color: '#4CAF50',
    icon: PsychologyIcon,
    benefits: ['Custom chat badge', 'Extended message length', 'Priority support']
  },
  {
    id: 'rank2',
    name: 'Sapphire',
    description: 'Enhanced features for active community members',
    price: 25,
    color: '#2196F3',
    icon: WaterIcon,
    benefits: ['All Emerald benefits', 'Custom profile highlights', 'Access to exclusive channels']
  },
  {
    id: 'rank3',
    name: 'Amethyst',
    description: 'Premium features for dedicated users',
    price: 50,
    color: '#9C27B0',
    icon: VerifiedUserIcon,
    benefits: [
      'All Sapphire benefits',
      'Advanced customization options',
      'Early access to new features',
      'Increased media sharing limits'
    ]
  },
  {
    id: 'rank4',
    name: 'Amber',
    description: 'Elite features for power users',
    price: 100,
    color: '#FF9800',
    icon: LockIcon,
    benefits: [
      'All Amethyst benefits',
      'Custom emojis and reactions',
      'Priority in chat rooms',
      'Extended file storage'
    ]
  },
  {
    id: 'rank5',
    name: 'Ruby',
    description: 'Ultimate XRP Ledger Chat experience',
    price: 250,
    color: '#F44336',
    icon: SecurityIcon,
    benefits: [
      'All Amber benefits',
      'Exclusive Guardian badge',
      'Direct access to developers',
      'Influence on future features',
      'Unlimited media sharing'
    ]
  },
  {
    id: 'rank6',
    name: 'Diamond',
    description: 'Premium tier for serious XRP enthusiasts',
    price: 150,
    color: '#00BCD4',
    icon: DiamondIcon,
    benefits: [
      'All Amber benefits',
      'Animated profile avatar',
      'Custom chat themes',
      'Exclusive Diamond badge'
    ]
  },
  {
    id: 'rank7',
    name: 'Gold',
    description: 'Exclusive features for XRP market makers',
    price: 200,
    color: '#FFC107',
    icon: StarIcon,
    benefits: [
      'All Diamond benefits',
      'Market analysis tools integration',
      'Golden name highlight in chat',
      'Priority message visibility'
    ]
  },
  {
    id: 'rank8',
    name: 'Silver',
    description: 'Advanced tools for XRP ecosystem builders',
    price: 75,
    color: '#9E9E9E',
    icon: ShieldIcon,
    benefits: [
      'All Amethyst benefits',
      'Network visualization tools',
      'Enhanced security features',
      'Silver badge recognition'
    ]
  },
  {
    id: 'rank9',
    name: 'Neon',
    description: 'Lightning-fast features for power users',
    price: 125,
    color: '#76FF03',
    icon: BoltIcon,
    benefits: [
      'All Silver benefits',
      'Instant message delivery',
      'Advanced notification controls',
      'Exclusive neon effects in chat'
    ]
  }
];

export const verifiedStatus = {
  id: 'verified',
  name: 'Verified',
  description: 'Get a verified badge next to your name',
  price: 500,
  color: '#00BCD4',
  icon: VerifiedIcon,
  benefits: [
    'Verified badge next to your name',
    'Increased visibility in chat rooms',
    'Enhanced credibility in the community',
    'All Ruby benefits included'
  ]
};
