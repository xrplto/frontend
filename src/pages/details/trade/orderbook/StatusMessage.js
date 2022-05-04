import React from 'react';

import styled from "styled-components";

const Container = styled.div`
  color: white;
  width: 100%;
  text-align: center;
`
const StatusMessage = ({selectedMarket = '', isFeedKilled}) => {
  return (
    <Container>
      {isFeedKilled ? 'Feed killed.' : `Selected market: ${selectedMarket}`}
    </Container>
  );
};

export default StatusMessage;
