import React, { useState, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import styled from '@emotion/styled';
import { Edit, X } from 'lucide-react';
import { AppContext } from 'src/context/AppContext';
import { CompactSocialLinks, CompactTags } from './PriceStatistics';

const alpha = (color, opacity) => color.replace(')', `, ${opacity})`);

const Card = styled.div`
  border-radius: 16px;
  background: ${(props) => (props.isDark ? 'rgba(10, 10, 10, 0.5)' : 'rgba(255, 255, 255, 0.5)')};
  backdrop-filter: blur(8px);
  border: 1px solid ${(props) => (props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')};
  width: 100%;
  transition: all 0.2s ease;
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px 10px;
  border-bottom: 1px solid ${(props) => (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')};
  background: ${(props) => (props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)')};
`;

const Title = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)')};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 8px;
  &:before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #3b82f6;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
`;

const IconButton = styled.button`
  border: 1.5px solid ${(props) => (props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
  border-radius: 8px;
  padding: 5px;
  background: transparent;
  cursor: pointer;
  color: ${(props) =>
    props.isError ? '#ef4444' : props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  display: flex;
  align-items: center;
  transition: all 0.15s;
  &:hover {
    border-color: ${(props) => (props.isError ? '#ef4444' : '#3b82f6')};
    background: ${(props) => (props.isError ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)')};
    color: ${(props) => (props.isError ? '#ef4444' : '#3b82f6')};
  }
`;

const Content = styled.div`
  padding: 6px 12px 10px;
  position: relative;
`;

const Typography = styled.div`
  font-size: ${(props) =>
    props.variant === 'h6'
      ? '13px'
      : props.variant === 'subtitle1'
        ? '12px'
        : props.variant === 'subtitle2'
          ? '12px'
          : '13px'};
  font-weight: 400;
  color: ${(props) =>
    props.color === 'text.secondary'
      ? props.isDark
        ? 'rgba(255,255,255,0.45)'
        : 'rgba(0,0,0,0.45)'
      : props.isDark
        ? 'rgba(255,255,255,0.75)'
        : 'rgba(0,0,0,0.75)'};
  margin-bottom: ${(props) => (props.paragraph ? '10px' : props.gutterBottom ? '10px' : 0)};
  margin-top: ${(props) => (props.gutterBottom ? '4px' : 0)};
  line-height: 1.7;
  font-style: ${(props) => props.fontStyle || 'normal'};
  letter-spacing: 0.015em;
`;

const Tooltip = ({ title, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.9)',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            marginBottom: '4px'
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
};

const MarkdownParagraph = ({ children, isDark }) => (
  <Typography variant="body2" paragraph lineHeight={1.4} isDark={isDark}>
    {children}
  </Typography>
);

const MarkdownH1 = ({ children, isDark }) => (
  <Typography variant="h6" gutterBottom isDark={isDark}>
    {children}
  </Typography>
);

const MarkdownH2 = ({ children, isDark }) => (
  <Typography variant="subtitle1" gutterBottom isDark={isDark}>
    {children}
  </Typography>
);

const MarkdownH3 = ({ children, isDark }) => (
  <Typography variant="subtitle2" gutterBottom isDark={isDark}>
    {children}
  </Typography>
);

const MarkdownUL = ({ children }) => (
  <ul style={{ paddingLeft: '16px', marginBottom: '4px' }}>{children}</ul>
);

const MarkdownOL = ({ children }) => (
  <ol style={{ paddingLeft: '16px', marginBottom: '4px' }}>{children}</ol>
);

const MarkdownLI = ({ children, isDark }) => (
  <Typography component="li" variant="body2" lineHeight={1.4} isDark={isDark}>
    {children}
  </Typography>
);

export default function Description({
  token,
  showEditor,
  setShowEditor,
  description,
  onApplyDescription,
  mdEditor,
  isDark = false
}) {
  const { accountProfile, themeName } = useContext(AppContext);
  const effectiveIsDark = isDark || themeName === 'XrplToDarkTheme';

  const isAdmin = accountProfile?.admin;
  const displayName = token.user || token.name;

  const handleEditToggle = () => {
    if (showEditor) onApplyDescription();
    setShowEditor(!showEditor);
  };

  const hasSocial = token.domain || (token.social && Object.keys(token.social).some((k) => token.social[k]));
  const tags = token.tags || [];
  const hasTags = tags.length > 0;
  if (!description && !showEditor && !isAdmin && !hasSocial && !hasTags) return null;

  const markdownComponents = {
    p: (props) => <MarkdownParagraph {...props} isDark={effectiveIsDark} />,
    h1: (props) => <MarkdownH1 {...props} isDark={effectiveIsDark} />,
    h2: (props) => <MarkdownH2 {...props} isDark={effectiveIsDark} />,
    h3: (props) => <MarkdownH3 {...props} isDark={effectiveIsDark} />,
    ul: MarkdownUL,
    ol: MarkdownOL,
    li: (props) => <MarkdownLI {...props} isDark={effectiveIsDark} />
  };

  return (
    <Card isDark={effectiveIsDark}>
      <CardHeader isDark={effectiveIsDark}>
        <Title isDark={effectiveIsDark}>About {displayName}</Title>
        {isAdmin && (
          <Actions>
            <Tooltip title={showEditor ? 'Save & close' : 'Edit'}>
              <IconButton onClick={handleEditToggle} isError={showEditor} isDark={effectiveIsDark}>
                {showEditor ? <X size={16} /> : <Edit size={16} />}
              </IconButton>
            </Tooltip>
          </Actions>
        )}
      </CardHeader>

      {showEditor && mdEditor ? (
        <div style={{ padding: '8px 10px' }}>{mdEditor}</div>
      ) : description ? (
        <Content isDark={effectiveIsDark}>
          <ReactMarkdown components={markdownComponents}>{description}</ReactMarkdown>
        </Content>
      ) : (
        <div style={{ padding: '8px 10px', minHeight: '40px' }}>
          <Typography
            variant="body2"
            color="text.secondary"
            fontStyle="italic"
            isDark={effectiveIsDark}
          >
            No description available.
          </Typography>
        </div>
      )}

      {(hasSocial || hasTags) && (
        <div
          style={{
            padding: '8px 12px 10px',
            borderTop: `1px solid ${effectiveIsDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {hasSocial && (
            <CompactSocialLinks social={{ ...token.social, website: token.domain }} isDark={effectiveIsDark} fullWidth />
          )}
          {hasSocial && hasTags && (
            <div
              style={{
                height: '1px',
                background: effectiveIsDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
              }}
            />
          )}
          {hasTags && <CompactTags enhancedTags={tags} maxTags={6} isDark={effectiveIsDark} />}
        </div>
      )}
    </Card>
  );
}
