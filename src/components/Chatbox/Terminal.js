import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, TextField, IconButton, CircularProgress, Tabs, Tab } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import DefaultPrompts from './DefaultPrompts'; // We'll create this component

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
  const [conversations, setConversations] = useState(() => {
    const savedConversations = localStorage.getItem('chatConversations');
    return savedConversations ? JSON.parse(savedConversations) : [];
  });
  const [activeConversation, setActiveConversation] = useState('new');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    // Save messages to localStorage whenever they change
    localStorage.setItem('chatConversations', JSON.stringify(conversations));
  }, [conversations]);

  const handleNewConversation = () => {
    setActiveConversation('new');
    setInput('');
  };

  const handleTabChange = (event, newValue) => {
    if (newValue === conversations.length) {
      handleNewConversation();
    } else {
      setActiveConversation(newValue);
    }
  };

  const handleSubmit = async (event, overrideInput = null) => {
    event.preventDefault();
    const submittedInput = overrideInput || input;
    if (submittedInput.trim() && !isLoading) {
      const userMessage = { role: 'user', content: submittedInput.trim() };
      let currentMessages = [];
      let newConversationId = null;

      setConversations(prevConversations => {
        let updatedConversations = [...prevConversations];
        if (activeConversation === 'new') {
          newConversationId = updatedConversations.length;
          updatedConversations.push({ id: newConversationId, messages: [userMessage] });
          setActiveConversation(newConversationId);
        } else {
          updatedConversations[activeConversation].messages.push(userMessage);
        }
        currentMessages = updatedConversations[newConversationId !== null ? newConversationId : activeConversation].messages;
        return updatedConversations;
      });

      setInput('');
      setIsLoading(true);
      setError(null);
      setStreamingMessage('');

      try {
        const response = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gemma2:2b',
            messages: currentMessages,
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

        setConversations(prevConversations => {
          const updatedConversations = [...prevConversations];
          const conversationIndex = newConversationId !== null ? newConversationId : activeConversation;
          if (!updatedConversations[conversationIndex]) {
            console.error('Conversation not found:', conversationIndex);
            return prevConversations;
          }
          updatedConversations[conversationIndex].messages.push({ role: 'assistant', content: accumulatedContent });
          return updatedConversations;
        });
      } catch (error) {
        console.error('Error calling Ollama API:', error);
        let errorMessage = 'Error: Unable to get response from AI.';
        if (error.message) {
          errorMessage += ` ${error.message}`;
        }
        setError(errorMessage);
      }

      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleCloseConversation = (event, conversationIndex) => {
    event.stopPropagation(); // Prevent tab from being selected when closing
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.filter((_, index) => index !== conversationIndex);
      // If we're closing the active conversation, set the active to the previous one or 'new'
      if (activeConversation === conversationIndex) {
        setActiveConversation(updatedConversations.length > 0 ? updatedConversations.length - 1 : 'new');
      } else if (activeConversation > conversationIndex) {
        // Adjust the active conversation index if we're closing a tab before it
        setActiveConversation(activeConversation - 1);
      }
      return updatedConversations;
    });
  };

  const handlePromptClick = (promptText) => {
    // Automatically submit the prompt
    handleSubmit({ preventDefault: () => {} }, promptText);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeConversation === 'new' ? conversations.length : activeConversation} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {conversations.map((conv, index) => (
            <Tab key={conv.id} label={
              <Box display="flex" alignItems="center">
                {`Chat ${index + 1}`}
                <IconButton size="small" onClick={(event) => handleCloseConversation(event, index)} sx={{ ml: 1, p: 0 }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            } />
          ))}
          <Tab label="New Chat" />
        </Tabs>
      </Box>
      <CustomScrollBox
        ref={terminalRef}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          backgroundColor: 'background.paper'
        }}
      >
        {activeConversation === 'new' && (
          <DefaultPrompts onPromptClick={handlePromptClick} />
        )}
        {activeConversation !== 'new' && conversations[activeConversation]?.messages.map((message, index) => (
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
        onSubmit={(e) => handleSubmit(e)}
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
