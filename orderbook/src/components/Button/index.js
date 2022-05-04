import React from 'react';
import styled from "styled-components";

const Container = styled.button`
    padding: .3em .7em;
    margin: 1em;
    border-radius: 4px;
    border: none;
    color: white;
    background: ${props => props.backgroundColor};
    font-family: "Calibri", sans-serif;
    font-size: 1.2em;
    
    &:hover {
        cursor: pointer;
        opacity: .8;
    }
`

const Button = ({ title, backgroundColor = '#5741d9', callback}) => {
    return (
        <Container backgroundColor={backgroundColor} onClick={callback}>
            {title}
        </Container>
    );
};

export default Button;