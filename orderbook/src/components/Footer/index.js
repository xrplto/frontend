import React, { FunctionComponent } from 'react';
import Button from "../Button";
import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  justify-content: center;
  background-color: #121723;
`

const Footer = ({ toggleFeedCallback, killFeedCallback , isFeedKilled}) => {
  return (
    <Container>
      {!isFeedKilled && <Button title={'Toggle Feed'} backgroundColor={'#5741d9'} callback={toggleFeedCallback}/>}
      <Button title={isFeedKilled ? 'Renew feed' : 'Kill Feed'} backgroundColor={'#b91d1d'} callback={killFeedCallback}/>
    </Container>
  );
};

export default Footer;