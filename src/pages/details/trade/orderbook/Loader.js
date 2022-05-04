import React from 'react';
import { styled } from '@mui/material/styles';

const Container = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '79vh'
});

const CustomSVG = styled('svg')({
    width: '4em',
    height: '4em'
});

const Loader = () => {
  return (
    <Container>
      <CustomSVG version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
           x="0px" y="0px"
           width="24px" height="24px" viewBox="0 0 24 24" xmlSpace="preserve">
        <rect x="0" y="0" width="4" height="7" fill="#333">
          <animateTransform attributeType="xml"
                            attributeName="transform" type="scale"
                            values="1,1; 1,3; 1,1"
                            begin="0s" dur="0.6s" repeatCount="indefinite" />
        </rect>

        <rect x="10" y="0" width="4" height="7" fill="#333">
          <animateTransform attributeType="xml"
                            attributeName="transform" type="scale"
                            values="1,1; 1,3; 1,1"
                            begin="0.2s" dur="0.6s" repeatCount="indefinite" />
        </rect>
        <rect x="20" y="0" width="4" height="7" fill="#333">
          <animateTransform attributeType="xml"
                            attributeName="transform" type="scale"
                            values="1,1; 1,3; 1,1"
                            begin="0.4s" dur="0.6s" repeatCount="indefinite" />
        </rect>
      </CustomSVG>
    </Container>
  );
};

export default Loader;
