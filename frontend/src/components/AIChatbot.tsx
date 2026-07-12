import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, Fab, Paper, Typography, TextField, IconButton, 
  Avatar, CircularProgress, Tooltip, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { 
  Chat as ChatIcon, Close as CloseIcon, Send as SendIcon, 
  SmartToy as BotIcon, Person as UserIcon, Refresh as RefreshIcon 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Simple client-side Markdown to JSX parser to render tables and lists beautifully
const renderFormattedText = (text: string) => {
  const lines = text.split('\n');
  const jsxElements: React.ReactNode[] = [];
  
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  let listItems: string[] = [];
  let inList = false;

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      jsxElements.push(
        <List key={`list-${key}`} dense sx={{ pl: 2, listStyleType: 'disc', '& .MuiListItem-root': { display: 'list-item' } }}>
          {listItems.map((item, idx) => (
            <ListItem key={idx} sx={{ p: 0, py: 0.2 }}>
              <ListItemText 
                primary={parseInlineFormatting(item)} 
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = (key: number) => {
    if (tableRows.length > 0) {
      jsxElements.push(
        <TableContainer component={Paper} variant="outlined" key={`table-container-${key}`} sx={{ my: 1.5, overflowX: 'auto', maxWidth: '100%' }}>
          <Table size="small" sx={{ minWidth: 280 }}>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                {tableHeaders.map((h, i) => (
                  <TableCell key={i} sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{h.trim()}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.map((row, idx) => (
                <TableRow key={idx}>
                  {row.map((col, i) => (
                    <TableCell key={i} sx={{ fontSize: '0.75rem', py: 1 }}>{parseInlineFormatting(col.trim())}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  const parseInlineFormatting = (str: string) => {
    // Handle inline code: `code`
    const codeRegex = /`([^`]+)`/g;
    // Handle bold: **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    
    let parts: React.ReactNode[] = [str];
    
    // Simple inline parser
    if (str.includes('`') || str.includes('**')) {
      const tokens: React.ReactNode[] = [];
      let tempStr = str;
      
      // Match bold first, then code, this is simplified for safety
      const boldParts = tempStr.split('**');
      boldParts.forEach((part, index) => {
        if (index % 2 === 1) {
          tokens.push(<strong key={`b-${index}`}>{part}</strong>);
        } else {
          // Check for code inside normal part
          const codeParts = part.split('`');
          codeParts.forEach((cPart, cIndex) => {
            if (cIndex % 2 === 1) {
              tokens.push(
                <Box 
                  component="span" 
                  key={`c-${index}-${cIndex}`} 
                  sx={{ 
                    bgcolor: 'action.selected', 
                    px: 0.6, 
                    py: 0.2, 
                    borderRadius: 1, 
                    fontFamily: 'monospace', 
                    fontSize: '0.8em',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {cPart}
                </Box>
              );
            } else {
              tokens.push(cPart);
            }
          });
        }
      });
      return <>{tokens}</>;
    }
    
    return str;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // 1. Heading parse
    if (trimmed.startsWith('###')) {
      flushList(index);
      flushTable(index);
      jsxElements.push(
        <Typography key={index} variant="subtitle1" color="primary" sx={{ fontWeight: 'bold', mt: 1.5, mb: 0.5 }}>
          {trimmed.replace('###', '').trim()}
        </Typography>
      );
    } else if (trimmed.startsWith('##')) {
      flushList(index);
      flushTable(index);
      jsxElements.push(
        <Typography key={index} variant="h6" color="primary" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
          {trimmed.replace('##', '').trim()}
        </Typography>
      );
    }
    // 2. Table parse
    else if (trimmed.startsWith('|')) {
      flushList(index);
      const cols = trimmed.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      
      // Skip separator row: | --- | --- |
      if (cols.every(c => c.startsWith('---') || c.startsWith(':---') || c.startsWith(':-'))) {
        return;
      }
      
      if (!inTable) {
        inTable = true;
        tableHeaders = cols;
      } else {
        tableRows.push(cols);
      }
    } 
    // 3. List item parse
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushTable(index);
      inList = true;
      listItems.push(trimmed.substring(2));
    }
    // 4. Normal paragraph line
    else {
      if (inList) flushList(index);
      if (inTable) flushTable(index);
      
      if (trimmed === '') {
        jsxElements.push(<Box key={index} sx={{ height: 8 }} />);
      } else {
        jsxElements.push(
          <Typography key={index} variant="body2" sx={{ mb: 0.8 }}>
            {parseInlineFormatting(trimmed)}
          </Typography>
        );
      }
    }
  });

  // End of text flushes
  flushList(9999);
  flushTable(9999);

  return jsxElements;
};

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: `👋 Hello! I am **AssetFlow AI**, your enterprise assistant.\n\nI can help you monitor telemetry streams, inspect depreciation indexes, search logs, and schedule repair cycles directly. Here are some commands you can try:\n\n- 🔍 **Search**: *"Show me all IT hardware"* or *"List active assets"* \n- ⚠️ **Predictive Maintenance**: *"Check predictive maintenance"* or *"Any anomalies?"*\n- 🛠️ **Service**: *"Schedule maintenance for Forklift Model T"* \n- 🏢 **Partners**: *"Show active vendors"* \n- 📈 **Valuation**: *"Summarize asset depreciation"*`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const { role, user } = useAuth();
  const { addNotification } = useNotifications();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;
    
    const userText = inputValue;
    setInputValue('');
    
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      text: userText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await api.sendChatMessage(userText, role, user?.email || 'admin@assetflow.com');
      
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        text: response.reply,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);

      // Check if action was scheduled and fire a notification
      if (response.actionTaken === 'SCHEDULE_MAINTENANCE' && response.data) {
        addNotification(
          '🛠️ Service Ticket Opened via AI',
          `New maintenance cycle was created for asset: ${response.data.description.split(':').pop()}`,
          'success'
        );
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          text: '❌ Apologies, I encountered an issue communicating with my indexing core. Please make sure the service node is online.',
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleSuggestion = (suggestionText: string) => {
    setInputValue(suggestionText);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        text: `👋 Hello! I am **AssetFlow AI**, your enterprise assistant.\n\nI can help you monitor telemetry streams, inspect depreciation indexes, search logs, and schedule repair cycles directly. Here are some commands you can try:\n\n- 🔍 **Search**: *"Show me all IT hardware"* or *"List active assets"* \n- ⚠️ **Predictive Maintenance**: *"Check predictive maintenance"* or *"Any anomalies?"*\n- 🛠️ **Service**: *"Schedule maintenance for Forklift Model T"* \n- 🏢 **Partners**: *"Show active vendors"* \n- 📈 **Valuation**: *"Summarize asset depreciation"*`,
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
      {/* Floating Button with Pulse animation */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Fab 
              color="primary" 
              onClick={() => setIsOpen(true)}
              sx={{
                width: 60,
                height: 60,
                boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.5)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '2px solid #6366f1',
                  animation: 'ripple 1.5s infinite ease-in-out',
                  opacity: 0.6,
                },
                '@keyframes ripple': {
                  '0%': { transform: 'scale(1)', opacity: 0.6 },
                  '100%': { transform: 'scale(1.4)', opacity: 0 }
                }
              }}
            >
              <ChatIcon />
            </Fab>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            <Paper
              sx={{
                width: { xs: 'calc(100vw - 40px)', sm: 420 },
                height: 520,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.4)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 4,
                overflow: 'hidden',
                bgcolor: 'background.paper',
              }}
            >
              {/* Header */}
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'primary.main', 
                  color: 'primary.contrastText',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px 0 rgba(0,0,0,0.1)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
                    <BotIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                      AssetFlow AI
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box component="span" sx={{ width: 8, height: 8, bgcolor: '#10b981', borderRadius: '50%', display: 'inline-block' }} />
                      Online Agent
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Tooltip title="Reset Chat">
                    <IconButton size="small" color="inherit" onClick={clearChat} sx={{ mr: 0.5 }}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small" color="inherit" onClick={() => setIsOpen(false)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Message List */}
              <Box 
                sx={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  bgcolor: 'background.default'
                }}
              >
                {messages.map((msg) => (
                  <Box 
                    key={msg.id}
                    sx={{ 
                      display: 'flex', 
                      gap: 1.5,
                      flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start'
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: msg.sender === 'user' ? 'secondary.main' : 'primary.main',
                        fontSize: '0.85rem'
                      }}
                    >
                      {msg.sender === 'user' ? <UserIcon fontSize="small" /> : <BotIcon fontSize="small" />}
                    </Avatar>
                    
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 1.5, 
                        maxWidth: '75%', 
                        borderRadius: msg.sender === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                        bgcolor: msg.sender === 'user' ? 'secondary.dark' : 'background.paper',
                        color: msg.sender === 'user' ? '#fff' : 'text.primary',
                        border: '1px solid',
                        borderColor: msg.sender === 'user' ? 'transparent' : 'divider',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}
                    >
                      {renderFormattedText(msg.text)}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          textAlign: 'right', 
                          mt: 0.5, 
                          opacity: 0.6,
                          fontSize: '0.65rem'
                        }}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Paper>
                  </Box>
                ))}

                {loading && (
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      <BotIcon fontSize="small" />
                    </Avatar>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 1.5, 
                        borderRadius: '4px 16px 16px 16px', 
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <CircularProgress size={16} thickness={5} color="primary" />
                      <Typography variant="body2" color="text.secondary">Analyzing database streams...</Typography>
                    </Paper>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Quick Suggestions */}
              {messages.length === 1 && (
                <Box sx={{ p: 1, display: 'flex', gap: 1, flexWrap: 'wrap', borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                  {[
                    'Any telemetry anomalies?',
                    'Show IT Hardware',
                    'Summarize depreciation'
                  ].map((s, idx) => (
                    <Typography
                      key={idx}
                      onClick={() => handleSuggestion(s)}
                      sx={{
                        fontSize: '0.75rem',
                        bgcolor: 'action.hover',
                        px: 1.2,
                        py: 0.6,
                        borderRadius: 4,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      {s}
                    </Typography>
                  ))}
                </Box>
              )}

              {/* Footer Input */}
              <Box 
                sx={{ 
                  p: 1.5, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  borderTop: '1px solid', 
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Ask anything about assets..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    }
                  }}
                />
                <IconButton 
                  color="primary" 
                  onClick={handleSend}
                  disabled={!inputValue.trim() || loading}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
                  }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};
