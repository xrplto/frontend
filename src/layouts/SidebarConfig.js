import { Icon } from '@iconify/react';
//import pieChart2Fill from '@iconify/icons-eva/pie-chart-2-fill';
//import peopleFill from '@iconify/icons-eva/people-fill';
import postageStamp from '@iconify/icons-mdi/postage-stamp';
//import spinIcon from '@iconify/icons-uil/spin';
//import spin6Icon from '@iconify/icons-fontelico/spin6';
import spinnerIcon from '@iconify/icons-fontisto/spinner';

// ----------------------------------------------------------------------

const getIcon = (name) => <Icon icon={name} width={22} height={22} />;

const sidebarConfig = [
  {
    title: 'Tokens',
    path: '/tokens',
    icon: getIcon(postageStamp)
  },
  {
    title: 'Spinners',
    path: '/spinners',
    icon: getIcon(spinnerIcon)
  }
];

export default sidebarConfig;
