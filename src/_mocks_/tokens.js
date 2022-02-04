import faker from 'faker';
import { sample } from 'lodash';
// utils
import { mockImgToken } from '../utils/mockImages';

// ----------------------------------------------------------------------

const TOKEN_NAME = [
  'Sologenic',
  'CasinoCoin',
  'ShibaNFT OFFICIAL',
  'Elysian',
  'XMETA',
  'ETH',
  'Equilibrium',
  'GateHub Fifth BTC',
  'XRdoge',
  'BTC',
  'XRPL PUNKS',
  'AdvisorBid',
  'XLS-20.art',
  'USD',
  'RPR',
  'xSTIK Official',
  'Vagabond VGB',
  'XDX',
  'xCoin',
];

// name: faker.name.findName(),

const tokens = [...Array(19)].map((_, index) => ({
  id: faker.datatype.uuid(),
  imgUrl: mockImgToken(index + 1),
  name: TOKEN_NAME[index],
  price: '$ ' + faker.datatype.number({ min: 4, max: 99, precision: 0.01 }),
  dailypercent: faker.datatype.number({ min: 4, max: 10, precision: 0.01 }) + ' %',
  marketcap: '$ ' + faker.datatype.number({ min: 3000000, max: 10000000 }),
  holders: faker.datatype.number({ min: 100000, max: 1000000 }),
  isVerified: faker.datatype.boolean(),
  status: sample(['active', 'banned']),
  role: sample([
    'Leader',
    'Hr Manager',
  ])
}));

export default tokens;
