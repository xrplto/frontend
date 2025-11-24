import React, { useState, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import styled from '@emotion/styled';
import { Edit, X, ChevronDown, ChevronUp } from 'lucide-react';
import { AppContext } from 'src/AppContext';

const alpha = (color, opacity) => color.replace(')', `, ${opacity})`);

const Card = styled.div`
  border-radius: 12px;
  background: transparent;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
  width: 100%;
  margin-bottom: 6px;
  &:hover {
    border-color: ${props => props.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
    background: ${props => props.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
`;

const Title = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: ${props => props.isDark ? '#FFFFFF' : '#212B36'};
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
`;

const IconButton = styled.button`
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
  border-radius: 8px;
  padding: 4px;
  background: transparent;
  cursor: pointer;
  color: ${props => props.isError ? '#f44336' : (props.isDark ? '#FFFFFF' : '#212B36')};
  display: flex;
  align-items: center;
  &:hover {
    background: ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
  }
`;

const Content = styled.div`
  padding: 6px 8px;
  position: relative;
  overflow: ${props => props.expanded ? 'visible' : 'hidden'};
  max-height: ${props => props.expanded ? 'none' : '60px'};
  transition: max-height 0.3s ease;
`;

const Typography = styled.div`
  font-size: ${props => props.variant === 'h6' ? '13px' : props.variant === 'subtitle1' ? '12px' : props.variant === 'subtitle2' ? '11px' : '11px'};
  font-weight: ${props => props.variant?.startsWith('h') ? 400 : 400};
  color: ${props => props.color === 'text.secondary' ? (props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)') : (props.isDark ? '#FFFFFF' : '#212B36')};
  margin-bottom: ${props => props.paragraph ? '4px' : props.gutterBottom ? '8px' : 0};
  margin-top: ${props => props.gutterBottom ? '4px' : 0};
  line-height: ${props => props.lineHeight || 1.4};
  font-style: ${props => props.fontStyle || 'normal'};
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
  const [expanded, setExpanded] = useState(false);
  const effectiveIsDark = isDark || themeName === 'XrplToDarkTheme';

  const isAdmin = accountProfile?.admin;
  const displayName = token.user || token.name;

  const handleEditToggle = () => {
    if (showEditor) onApplyDescription();
    setShowEditor(!showEditor);
  };

  const markdownComponents = {
    p: (props) => <MarkdownParagraph {...props} isDark={effectiveIsDark} />,
    h1: (props) => <MarkdownH1 {...props} isDark={effectiveIsDark} />,
    h2: (props) => <MarkdownH2 {...props} isDark={effectiveIsDark} />,
    h3: (props) => <MarkdownH3 {...props} isDark={effectiveIsDark} />,
    ul: MarkdownUL,
    ol: MarkdownOL,
    li: (props) => <MarkdownLI {...props} isDark={effectiveIsDark} />
  };

  if (!description && !showEditor && !isAdmin) return null;

  return (
    <Card isDark={effectiveIsDark}>
      <CardHeader isDark={effectiveIsDark}>
        <Title isDark={effectiveIsDark}>About {displayName}</Title>
        <Actions>
          <Tooltip title={expanded ? 'Show less' : 'Show more'}>
            <IconButton onClick={() => setExpanded(!expanded)} isDark={effectiveIsDark}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </IconButton>
          </Tooltip>
          {isAdmin && (
            <Tooltip title={showEditor ? 'Save & close' : 'Edit'}>
              <IconButton onClick={handleEditToggle} isError={showEditor} isDark={effectiveIsDark}>
                {showEditor ? <X size={16} /> : <Edit size={16} />}
              </IconButton>
            </Tooltip>
          )}
        </Actions>
      </CardHeader>

      {showEditor && mdEditor ? (
        <div style={{ padding: '6px 8px' }}>
          {mdEditor}
        </div>
      ) : !showEditor && description ? (
        <Content expanded={expanded} isDark={effectiveIsDark}>
          <ReactMarkdown components={markdownComponents}>{description}</ReactMarkdown>
        </Content>
      ) : (
        !showEditor && (
          <div style={{ padding: '6px 8px', minHeight: '40px' }}>
            <Typography
              variant="body2"
              color="text.secondary"
              fontStyle="italic"
              isDark={effectiveIsDark}
            >
              No description available.
            </Typography>
          </div>
        )
      )}
    </Card>
  );
}
