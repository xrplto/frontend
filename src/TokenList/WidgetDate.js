import styled from '@emotion/styled';
import { Icon } from '@iconify/react';

// ----------------------------------------------------------------------

const RootStyle = styled.button`
    z-index: 999;
    right: 0;
    display: flex;
    cursor: pointer;
    position: fixed;
    align-items: center;
    top: 184px;
    padding: 5.6px 8px 5.6px 12px;
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    background-color: rgba(140, 124, 240, 0.08);
    border-top-left-radius: 16px;
    border-bottom-left-radius: 16px;
    border: none;
    color: ${props => props.active ? '#FF5630' : 'inherit'};
    text-decoration: none;
    font-family: inherit;
    
    &:hover {
        opacity: 0.9;
    }
`;

const Stack = styled.div`
    display: flex;
    align-items: center;
    gap: 6.4px;
`;

const Caption = styled.span`
    font-size: 12px;
    line-height: 1.66;
    word-wrap: break-word;
`;

// ----------------------------------------------------------------------
export default function WidgetDate({showDate, setShowDate}) {
    return (
        <RootStyle
            active={showDate}
            onClick={() => {
                setShowDate(!showDate);
            }}
        >
            <Stack>
                <Icon icon="material-symbols:update-disabled" width="20" height="20" />
                <Caption>
                    Date
                </Caption>
            </Stack>
        </RootStyle>
    );
}