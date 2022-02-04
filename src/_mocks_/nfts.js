import faker from 'faker';
import { sample } from 'lodash';
// utils
import { mockImgNFT } from '../utils/mockImages';

// ----------------------------------------------------------------------

const NFT_NAME = [
  'ROBOT 1',
  'ROBOT 2',
  'ROBOT 3',
  'ROBOT 4',
  'ROBOT 5',
  'ROBOT 6',
  'ROBOT 7',
  'ROBOT 8',
  'ROBOT 9',
  'ROBOT 10',
  'ROBOT 11',
  'ROBOT 12',
  'ROBOT 13',
  'ROBOT 14',
  'ROBOT 15',
  'ROBOT 16',
  'ROBOT 17',
  'ROBOT 18',
  'ROBOT 19',
  'ROBOT 20',
  'ROBOT 21',
  'ROBOT 22',
  'ROBOT 23',
  'ROBOT 24',
  'ROBOT 25',
  'ROBOT 26',
  'ROBOT 27',
  'ROBOT 28',
];
const NFT_COLOR = [
  '#00AB55',
  '#000000',
  '#FFFFFF',
  '#FFC0CB',
  '#FF4842',
  '#1890FF',
  '#94D82D',
  '#FFC107'
];

// ----------------------------------------------------------------------

const nfts = [...Array(24)].map((_, index) => {
  const setIndex = index + 1;

  return {
    id: faker.datatype.uuid(),
    cover: mockImgNFT(setIndex),
    name: NFT_NAME[index],
    price: faker.datatype.number({ min: 4, max: 99, precision: 0.01 }),
    priceSale: setIndex % 3 ? null : faker.datatype.number({ min: 19, max: 29, precision: 0.01 }),
    colors:
      (setIndex === 1 && NFT_COLOR.slice(0, 2)) ||
      (setIndex === 2 && NFT_COLOR.slice(1, 3)) ||
      (setIndex === 3 && NFT_COLOR.slice(2, 4)) ||
      (setIndex === 4 && NFT_COLOR.slice(3, 6)) ||
      (setIndex === 23 && NFT_COLOR.slice(4, 6)) ||
      (setIndex === 24 && NFT_COLOR.slice(5, 6)) ||
      NFT_COLOR,
    status: sample(['hot', 'new', '', ''])
  };
});

export default nfts;
