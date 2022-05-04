import React from 'react';

import { MOBILE_WIDTH } from "../../../constants";

import styled from "styled-components";

const Container = styled.div`
  display: flex;
  justify-content: space-around;
  background-color: #121723;
  position: relative;
  
  &:after {
    background-color: ${props => props.isRight ? '#113534' : '#3d1e28'};
    background-position: center;
    height: 100%;
    padding: .3em 0;
    display: block;
    content: "";
    position: absolute;
    left: 0;
    right: unset;
    z-index: 0;

    @media only screen and (min-width: 800px) {
      left: ${props => props.isRight ? 'unset' : 0};
      right: ${props => props.isRight ? 0 : 'unset'};
    }
  }
  
  span {
    z-index: 1;
    min-width: 54px;
  }
  
  .price {
    color: ${props => props.isRight ? '#118860' : '#bb3336'}
  }
`
const PriceLevelRow = ({ total, size, price, reversedFieldsOrder = false, windowWidth }) => {
  return (
    <Container data-testid='price-level-row' isRight={!reversedFieldsOrder} windowWidth={windowWidth}>
      {reversedFieldsOrder || windowWidth < MOBILE_WIDTH ?
        <>
          <span className='price'>{price}</span>
          <span>{size}</span>
          <span>{total}</span>
        </> :
        <>
          <span>{total}</span>
          <span>{size}</span>
          <span className='price'>{price}</span>
        </>}
    </Container>
  );
};

export default PriceLevelRow;
