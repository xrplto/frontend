import styled from '@emotion/styled';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Components

const ContentTypography = styled.div`
  color: rgba(145, 158, 171, 0.99);
`;

const Container = styled.div`
  margin-top: 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2.125rem;
  font-weight: 300;
  line-height: 1.235;
  letter-spacing: -0.00833em;
  
  @media (max-width: 600px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.div`
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.00938em;
  margin-top: 16px;
`;

export default function SummaryWatchList({}) {
  const { accountProfile, openSnackbar, setLoading } = useContext(AppContext);

  const account = accountProfile?.account;

  return (
    <Container>
      <Title>My Token Watchlist</Title>

      {!account && (
        <Subtitle>
          <ContentTypography>
            Please log in to view your Watchlist.
          </ContentTypography>
        </Subtitle>
      )}
    </Container>
  );
}
