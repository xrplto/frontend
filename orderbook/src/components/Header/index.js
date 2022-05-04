import React, { FunctionComponent } from 'react';

import { Container } from "./styles";
import GroupingSelectBox from "../GroupingSelectBox";

const Header = ({options}) => {
  return (
    <Container>
      <h3>Order Book</h3>
      <GroupingSelectBox options={options} />
    </Container>
  );
};

export default Header;
