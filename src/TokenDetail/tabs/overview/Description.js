import React, { useState, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import styled from '@emotion/styled';
import { Edit, X } from 'lucide-react';
import { AppContext } from 'src/AppContext';

const alpha = (color, opacity) => color.replace(')', `, ${opacity})`);

const Card = styled.div`
  border-radius: 10px;
  background: transparent;
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  width: 100%;
  margin-bottom: 6px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px 4px;
`;

const Title = styled.div`
  font-size: 10px;
  font-weight: 500;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(33,43,54,0.4)'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
`;

const IconButton = styled.button`
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  border-radius: 6px;
  padding: 4px;
  background: transparent;
  cursor: pointer;
  color: ${props => props.isError ? '#ef4444' : (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')};
  display: flex;
  align-items: center;
  &:hover {
    border-color: ${props => props.isError ? '#ef4444' : '#3b82f6'};
    color: ${props => props.isError ? '#ef4444' : '#3b82f6'};
  }
`;

const Content = styled.div`
  padding: 6px 12px 12px;
  position: relative;
`;

const Typography = styled.div`
  font-size: ${props => props.variant === 'h6' ? '13px' : props.variant === 'subtitle1' ? '12px' : props.variant === 'subtitle2' ? '12px' : '13px'};
  font-weight: 400;
  color: ${props => props.color === 'text.secondary' ? (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)') : (props.isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)')};
  margin-bottom: ${props => props.paragraph ? '8px' : props.gutterBottom ? '8px' : 0};
  margin-top: ${props => props.gutterBottom ? '4px' : 0};
  line-height: 1.6;
  font-style: ${props => props.fontStyle || 'normal'};
  letter-spacing: 0.01em;
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
        <div style={{
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
        }}>
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
  <Typography variant="h6" gutterBottom isDark={isDark}>{children}</Typography>
);

const MarkdownH2 = ({ children, isDark }) => (
  <Typography variant="subtitle1" gutterBottom isDark={isDark}>{children}</Typography>
);

const MarkdownH3 = ({ children, isDark }) => (
  <Typography variant="subtitle2" gutterBottom isDark={isDark}>{children}</Typography>
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

  if (!description && !showEditor && !isAdmin) return null;

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
        <div style={{ padding: '8px 10px' }}>
          {mdEditor}
        </div>
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
    </Card>
  );
}
