import styled from '@emotion/styled';

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

export default function SummaryTag({ tagName }) {
  return (
    <Container>
      <Title>Top {tagName} Tokens Ranked by Trading Volume</Title>

      <Subtitle>
        <ContentTypography>
          This page showcases the top {tagName} tokens, ranked by 24-hour volume in descending order,
          with the largest volume first. To reorder the list, simply click on one of the options, such
          as 24h or 7d, for a different perspective on the sector.
        </ContentTypography>
      </Subtitle>
    </Container>
  );
}
