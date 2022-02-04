//import { useFormik } from 'formik';
//import { useState } from 'react';
// material
import { Container/*, Typography*/ } from '@mui/material';
// components
import Page from '../components/Page';
import { TokenList/*, TokenCartWidget*/ } from '../components/market';
//
import NFTS from '../_mocks_/nfts';

// ----------------------------------------------------------------------

export default function EcommerceShop() {
  // const [openFilter, setOpenFilter] = useState(false);

  // const formik = useFormik({
  //   initialValues: {
  //     gender: '',
  //     category: '',
  //     colors: '',
  //     priceRange: '',
  //     rating: ''
  //   },
  //   onSubmit: () => {
  //     setOpenFilter(false);
  //   }
  // });

  //const { resetForm, handleSubmit } = formik;

  return (
    <Page title="Market">
      <Container>
        <TokenList tokens={NFTS} />
        {/* <TokenCartWidget /> */}
      </Container>
    </Page>
  );
}
