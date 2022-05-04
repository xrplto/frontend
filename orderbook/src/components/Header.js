import React from 'react';
import styled from "styled-components";
import GroupingSelectBox from "../GroupingSelectBox";

const Container = styled.div`
  display: flex;
  width: 100%;
  margin: 0 auto;
  justify-content: space-between;
  color: #98a6af;
  padding: .6em;
  background-color: #121723;
  border-bottom: 1px solid #29303e;
  
  h3 {
    color: #bfc1c8;
  }

  @media only screen and (min-width: 800px) {
    padding: 0.7em;
  }
`

const Header = ({options}) => {
  return (
    <Container>
      <h3>Order Book</h3>
      <GroupingSelectBox options={options} />
    </Container>
  );
};

export default Header;
