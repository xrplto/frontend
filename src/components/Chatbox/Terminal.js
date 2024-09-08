import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ErrorIcon from '@mui/icons-material/Error';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const CustomScrollBox = styled(Box)(({ theme }) => ({
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    background: '#a9a9a94d',
    borderRadius: '10px'
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'darkgrey',
    borderRadius: '10px'
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#a9a9a9d4',
    cursor: 'pointer'
  }
}));

const Terminal = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (input.trim() && !isLoading) {
      setIsLoading(true);
      setError(null);
      setStreamingMessage('');
      const userMessage = { role: 'user', content: input };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput('');

      try {
        const response = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gemma2:2b',
            messages: [...messages, userMessage],
            stream: true
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() !== '') {
              try {
                const parsedChunk = JSON.parse(line);
                if (parsedChunk.message && parsedChunk.message.content) {
                  accumulatedContent += parsedChunk.message.content;
                  setStreamingMessage(accumulatedContent);
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }

        setMessages((prevMessages) => [
          ...prevMessages,
          { role: 'assistant', content: accumulatedContent }
        ]);
        setStreamingMessage('');
      } catch (error) {
        console.error('Error calling Ollama API:', error);
        let errorMessage = 'Error: Unable to get response from AI.';
        if (error.message) {
          errorMessage += ` ${error.message}`;
        }
        setError(errorMessage);
      }

      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CustomScrollBox
        ref={terminalRef}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          backgroundColor: 'background.paper'
        }}
      >
        {messages.map((message, index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              color: message.role === 'user' ? 'primary.main' : 'text.primary',
              mb: 1
            }}
          >
            {message.role === 'user' ? '> ' : ''}
            {message.content}
          </Typography>
        ))}
        {streamingMessage && (
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              color: 'text.primary',
              mb: 1
            }}
          >
            {streamingMessage}
          </Typography>
        )}
        {isLoading && !streamingMessage && (
          <Box display="flex" alignItems="center">
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
              AI is thinking...
            </Typography>
          </Box>
        )}
        {error && (
          <Box display="flex" alignItems="center" sx={{ color: 'error.main' }}>
            <ErrorIcon sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {error}
            </Typography>
          </Box>
        )}
      </CustomScrollBox>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          p: 2,
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={input}
          onChange={handleInputChange}
          placeholder="Chat with AI..."
          sx={{ mr: 1 }}
          disabled={isLoading}
        />
        <IconButton type="submit" color="primary" disabled={isLoading || !input.trim()}>
          {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default Terminal;
