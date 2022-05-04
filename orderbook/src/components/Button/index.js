import React, { FunctionComponent } from 'react';

import { Container } from "./styles";

const Container = styled(button)(({ theme }) => ({
    padding: '.3em .7em',
    margin: '1em',
    borderRadius: '4px',
    border: 'none',
    color: white,
    background: ${backgroundColor},
    fontFamily: '"Calibri", sans-serif',
    fontSize: '1.2em',
    '&: hover': {
        cursor: 'pointer',
        opacity: '.8'
    }
}));

const Button = ({ title, backgroundColor = '#5741d9', callback}) => {
    return (
        <Container backgroundColor={backgroundColor} onClick={callback}>
            {title}
        </Container>
    );
};

export default Button;