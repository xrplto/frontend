import styled from '@emotion/styled';
import FiberNewIcon from '@mui/icons-material/FiberNew';
// ----------------------------------------------------------------------

const RootStyle = styled.div`
    z-index: 999;
    right: 0;
    display: flex;
    cursor: pointer;
    position: fixed;
    align-items: center;
    top: 104px; /* ~13 * 8px */
    padding-left: 12px; /* ~1.5 * 8px */
    padding-right: 8px; /* ~1 * 8px */
    padding-top: 5.6px; /* ~0.7 * 8px */
    padding-bottom: 5.6px; /* ~0.7 * 8px */
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    background-color: rgba(140, 124, 240, 0.08);
    border-top-left-radius: 16px;
    border-bottom-left-radius: 16px;
`;

const StyledLink = styled.button`
    background: none;
    border: none;
    text-decoration: none;
    color: ${props => props.active ? '#d32f2f' : 'inherit'};
    cursor: pointer;
    padding: 0;
    font: inherit;
    
    &:hover {
        text-decoration: none;
    }
`;

const Container = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6.4px; /* ~0.8 * 8px */
    padding: 0;
`;

const StyledText = styled.span`
    text-align: center;
    word-wrap: break-word;
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1.66;
    letter-spacing: 0.03333em;
`;

// ----------------------------------------------------------------------
export default function WidgetNew({showNew, setShowNew}) {
    return (
        <StyledLink
            active={showNew}
            onClick={() => {
                setShowNew(!showNew);
            }}
        >
            <RootStyle>
                <Container>
                    <FiberNewIcon sx={{ width: 24, height: 24 }} />
                    <StyledText>
                        Recent
                    </StyledText>
                </Container>
            </RootStyle>
        </StyledLink>
    );
}
