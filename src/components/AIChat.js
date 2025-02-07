import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Tooltip
} from '@mui/material';
import axios from 'axios';
import SendIcon from '@mui/icons-material/Send';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const ChatModal = ({ open, onClose, article }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setMessages([]);
    setNewMessage('');
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: newMessage
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage('');
    setLoading(true);

    try {
      const contentToAnalyze = article.articleBody?.trim()?.endsWith('Cloudflare')
        ? article.title
        : `${article.title}\nBody: ${article.articleBody?.substring(0, 700) || ''}`;

      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'gemma2',
        prompt: `You are a helpful assistant analyzing news articles. Please provide a clear and concise response in JSON format.

Article Information:
Title: ${article.title}
Content: ${contentToAnalyze}

User Question: ${newMessage}

Please respond with a JSON object containing:
{
  "answer": "Your detailed answer to the user's question",
  "key_points": ["List of key points related to the answer"],
  "sentiment": "Overall sentiment of the response (positive/negative/neutral)",
  "confidence": "High/Medium/Low based on available information"
}`,
        format: 'json',
        stream: false,
        options: {
          temperature: 0.7
        }
      });

      let formattedResponse;
      try {
        const jsonResponse = JSON.parse(response.data.response);
        formattedResponse = `${jsonResponse.answer}\n\n${
          jsonResponse.key_points.length > 0
            ? '**Key Points:**\n' + jsonResponse.key_points.map((point) => `• ${point}`).join('\n')
            : ''
        }${jsonResponse.confidence ? `\n\n*Confidence: ${jsonResponse.confidence}*` : ''}`;
      } catch (parseError) {
        formattedResponse = response.data.response;
      }

      const assistantMessage = {
        role: 'assistant',
        content: formattedResponse
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="h6">Discuss Article</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {article?.title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
            {messages.length === 0 ? (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography color="text.secondary">
                  Start a conversation about this article
                </Typography>
              </Box>
            ) : (
              messages.map((message, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 2,
                    mb: 1,
                    backgroundColor: message.role === 'user' ? 'primary.light' : 'background.paper',
                    ml: message.role === 'user' ? 'auto' : 0,
                    mr: message.role === 'assistant' ? 'auto' : 0,
                    maxWidth: '80%',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  <Typography component="div" sx={{ '& p': { my: 0.5 } }}>
                    {message.content}
                  </Typography>
                </Paper>
              ))
            )}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about the article..."
              disabled={loading}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={loading || !newMessage.trim()}
              endIcon={<SendIcon />}
            >
              Send
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ gap: 1 }}>
        <Tooltip title="Clear conversation">
          <span>
            <Button
              onClick={handleReset}
              disabled={messages.length === 0 || loading}
              startIcon={<RestartAltIcon />}
              color="error"
              variant="outlined"
            >
              Reset
            </Button>
          </span>
        </Tooltip>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChatModal;
