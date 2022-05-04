import React, { FunctionComponent } from 'react';
import { Container } from "./styles";
import { MOBILE_WIDTH } from "../../../constants";

const TitleRow = ({reversedFieldsOrder = false, windowWidth}) => {
  return (
    <Container data-testid='title-row'>
      {reversedFieldsOrder || windowWidth < MOBILE_WIDTH ?
        <>
          <span>PRICE</span>
          <span>SIZE</span>
          <span>TOTAL</span>
        </> :
        <>
          <span>TOTAL</span>
          <span>SIZE</span>
          <span>PRICE</span>
        </>}
    </Container>
  );
};

export default TitleRow;
