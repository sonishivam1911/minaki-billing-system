import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Paper,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress,
  Button,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { MessageCircle, Search, Send, User, Plus, Megaphone, FileText, ArrowLeft, UserCheck } from 'lucide-react';
import { whatsappCrmApi } from '../services/whatsappCrmApi';
import { formatPhoneForDisplay } from '../utils/phoneValidation';
import { NewConversationModal } from '../components/NewConversationModal';
import { BroadcastModal } from '../components/BroadcastModal';
import { TemplateSelector } from '../components/TemplateSelector';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['open', 'pending', 'resolved'];
const STATUS_LABELS = { open: 'Open', pending: 'Pending', resolved: 'Resolved' };
const POLL_INTERVAL_MS = 6000;

export function WhatsAppCrmPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userInfo } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [chatMessageType, setChatMessageType] = useState('text');
  const [chatTemplateName, setChatTemplateName] = useState('');
  const [chatTemplateLanguage, setChatTemplateLanguage] = useState('en');
  const [chatTemplateVars, setChatTemplateVars] = useState('');
  const [chatHeaderMediaUrl, setChatHeaderMediaUrl] = useState('');
  const [chatTemplateComponents, setChatTemplateComponents] = useState([]);
  const [sending, setSending] = useState(false);
  const [newConvModalOpen, setNewConvModalOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    whatsappCrmApi.getAgents().then(setAgents).catch(() => setAgents([]));
  }, []);

  const fetchConversations = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await whatsappCrmApi.getConversations({
        search: search || undefined,
        filter: unreadOnly ? 'unread' : 'all',
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 50,
        offset: 0,
      });
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      if (!silent) setConversations([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, unreadOnly, statusFilter]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Live-ish updates: poll the conversation list, and the open thread's
  // messages, instead of requiring a manual refresh. No new infra - just
  // reuses the existing endpoints on an interval, paused while the tab is
  // backgrounded.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      fetchConversations({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchConversations]);

  useEffect(() => {
    if (!selectedId) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      whatsappCrmApi.getMessages(selectedId, { limit: 100 }).then((data) => {
        if (selectedIdRef.current === selectedId) setMessages(Array.isArray(data) ? data : []);
      }).catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [selectedId]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setProfile(null);
      return;
    }
    setMessagesLoading(true);
    setProfileLoading(true);
    whatsappCrmApi.getMessages(selectedId, { limit: 100 }).then((data) => {
      setMessages(Array.isArray(data) ? data : []);
      setMessagesLoading(false);
    }).catch(() => setMessagesLoading(false));
    whatsappCrmApi.getConversationProfile(selectedId).then((p) => {
      setProfile(p);
      setProfileLoading(false);
    }).catch(() => setProfileLoading(false));
    whatsappCrmApi.markConversationRead(selectedId).catch(() => {});
  }, [selectedId]);

  const handleUpdateConversation = async (localPatch, apiPayload = localPatch) => {
    if (!selectedId) return;
    setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, ...localPatch } : c)));
    try {
      await whatsappCrmApi.updateConversation(selectedId, apiPayload);
    } catch (e) {
      console.error(e);
      fetchConversations({ silent: true });
    }
  };

  const handleAssign = (agentId) => {
    if (!agentId) {
      handleUpdateConversation({ assigned_user_id: null, assigned_user_name: null }, { clear_assignment: true });
      return;
    }
    const agent = agents.find((a) => a.id === agentId);
    handleUpdateConversation(
      { assigned_user_id: agentId, assigned_user_name: agent?.name || null },
      { assigned_user_id: agentId },
    );
  };

  const handleSend = async () => {
    if (!selectedConversation?.phone) return;
    const isTemplate = chatMessageType === 'template';
    if (isTemplate && !chatTemplateName.trim()) {
      alert('Please select or enter a template name');
      return;
    }
    if (!isTemplate && !messageInput.trim()) return;

    setSending(true);
    try {
      const payload = isTemplate
        ? {
            to_phone: selectedConversation.phone,
            message_type: 'template',
            template_name: chatTemplateName.trim(),
            template_language: chatTemplateLanguage,
            template_components: chatTemplateComponents,
          }
        : {
            to_phone: selectedConversation.phone,
            message_type: 'text',
            body: messageInput.trim(),
          };
      await whatsappCrmApi.sendMessage(payload);
      if (!isTemplate) setMessageInput('');
      else {
        setChatTemplateVars('');
        setChatHeaderMediaUrl('');
      }
      const data = await whatsappCrmApi.getMessages(selectedId, { limit: 100 });
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const canSend =
    selectedConversation?.phone &&
    (chatMessageType === 'text' ? !!messageInput.trim() : !!chatTemplateName.trim());

  const displayName = (c) =>
    c?.contact_name || c?.display_name || c?.phone || 'Unknown';

  const handleNewConversationSuccess = async (phone) => {
    const data = await whatsappCrmApi.getConversations({ filter: 'all', limit: 100, offset: 0 });
    const list = Array.isArray(data) ? data : [];
    setConversations(list);
    const sentDigits = String(phone || '').replace(/\D/g, '');
    const last10 = (s) => String(s || '').replace(/\D/g, '').slice(-10);
    const conv = list.find((c) => last10(c.phone) === last10(sentDigits));
    if (conv) setSelectedId(conv.id);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden', p: 0, backgroundColor: '#f0f2f5' }}>
      {/* Page header - hide on mobile when in chat view to save space */}
      {(!isMobile || !selectedId) && (
        <Box sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          backgroundColor: '#fff', 
          borderBottom: '1px solid #e9edef',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
              <Box sx={{ 
                width: { xs: 36, sm: 44 }, 
                height: { xs: 36, sm: 44 }, 
                borderRadius: '10px', 
                backgroundColor: '#25D366', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.35)',
              }}>
                <MessageCircle size={isMobile ? 20 : 24} color="#fff" />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416', letterSpacing: '-0.02em', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                  WhatsApp CRM
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.25, display: { xs: 'none', sm: 'block' } }}>
                  Manage customer conversations & broadcasts
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Megaphone size={isMobile ? 16 : 18} />}
                onClick={() => setBroadcastModalOpen(true)}
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  borderColor: '#25D366', 
                  color: '#128C7E',
                  minWidth: { xs: 'auto', sm: 'auto' },
                  px: { xs: 1, sm: 2 },
                  '&:hover': { borderColor: '#128C7E', backgroundColor: 'rgba(37, 211, 102, 0.08)' },
                }}
              >
                Broadcast
              </Button>
              <Button
                variant="contained"
                startIcon={<Plus size={isMobile ? 16 : 18} />}
                onClick={() => setNewConvModalOpen(true)}
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  backgroundColor: '#25D366',
                  minWidth: { xs: 'auto', sm: 'auto' },
                  px: { xs: 1, sm: 2 },
                  '&:hover': { backgroundColor: '#20bd5a' },
                }}
              >
                New chat
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      <NewConversationModal
        open={newConvModalOpen}
        onClose={() => setNewConvModalOpen(false)}
        onSuccess={handleNewConversationSuccess}
      />

      <BroadcastModal
        open={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        onSuccess={() => fetchConversations()}
      />

      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        minHeight: 0, 
        gap: { xs: 0, sm: 1.5 }, 
        p: { xs: 1, sm: 1.5 },
        flexDirection: { xs: 'column', md: 'row' },
      }}>
        {/* Left: conversation list - full width on mobile when no chat selected, hidden when chat selected */}
        <Paper elevation={0} sx={{ 
          width: { xs: '100%', md: 340 }, 
          minWidth: { xs: '100%', md: 300 }, 
          display: { xs: selectedId ? 'none' : 'flex', md: 'flex' }, 
          flexDirection: 'column', 
          overflow: 'hidden',
          borderRadius: { xs: '8px', sm: '12px' },
          border: '1px solid #e9edef',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          flex: { xs: selectedId ? 0 : 1, md: '0 0 auto' },
        }}>
          <TextField
            size="small"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ m: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#f0f2f5' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#667781" />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, gap: 1 }}>
            <Tabs
              value={statusFilter}
              onChange={(_, v) => setStatusFilter(v)}
              sx={{
                minHeight: 44,
                flex: 1,
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, minWidth: 0, px: 1 },
                '& .Mui-selected': { color: '#25D366', fontWeight: 600 },
                '& .MuiTabs-indicator': { backgroundColor: '#25D366' },
              }}
              variant="scrollable"
              scrollButtons={false}
            >
              <Tab label="All" value="all" />
              {STATUS_OPTIONS.map((s) => (
                <Tab key={s} label={STATUS_LABELS[s]} value={s} />
              ))}
            </Tabs>
            <Chip
              label="Unread"
              size="small"
              onClick={() => setUnreadOnly((v) => !v)}
              sx={{
                backgroundColor: unreadOnly ? 'rgba(37, 211, 102, 0.18)' : '#f0f2f5',
                color: unreadOnly ? '#128C7E' : '#667781',
                fontWeight: unreadOnly ? 600 : 500,
                cursor: 'pointer',
              }}
            />
          </Box>
          <List sx={{ overflow: 'auto', flex: 1, py: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              conversations.map((c) => (
                <ListItemButton
                  key={c.id}
                  selected={c.id === selectedId}
                  onClick={() => setSelectedId(c.id)}
                  sx={{
                    mx: 1,
                    borderRadius: '8px',
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(37, 211, 102, 0.1)',
                      '&:hover': { backgroundColor: 'rgba(37, 211, 102, 0.15)' },
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: c.id === selectedId ? '#25D366' : '#8b6f47', width: 48, height: 48 }}>
                      {(c.contact_name || c.phone || '?').slice(0, 1).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {displayName(c)}
                        </Box>
                        {c.status && c.status !== 'open' && (
                          <Chip
                            label={STATUS_LABELS[c.status] || c.status}
                            size="small"
                            sx={{ height: 16, fontSize: '0.6rem', backgroundColor: c.status === 'resolved' ? '#e6f4ea' : '#fff4e5', color: c.status === 'resolved' ? '#1b7f3a' : '#a15c00' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={c.assigned_user_name ? `${c.assigned_user_name} · ${c.last_message_preview || 'No messages'}` : (c.last_message_preview || 'No messages')}
                    primaryTypographyProps={{ noWrap: true, fontWeight: 500, component: 'div' }}
                    secondaryTypographyProps={{ noWrap: true, fontSize: '0.8rem', color: '#667781' }}
                  />
                  {c.unread_count > 0 && (
                    <Box sx={{ 
                      minWidth: 20, 
                      height: 20, 
                      borderRadius: '10px', 
                      backgroundColor: '#25D366', 
                      color: '#fff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}>
                      {c.unread_count}
                    </Box>
                  )}
                </ListItemButton>
              ))
            )}
          </List>
        </Paper>

        {/* Center: chat - on mobile shows when conversation selected */}
        <Paper elevation={0} sx={{ 
          flex: 1, 
          display: { xs: selectedId ? 'flex' : 'none', md: 'flex' }, 
          flexDirection: 'column', 
          minWidth: 0,
          borderRadius: { xs: '8px', sm: '12px' },
          border: '1px solid #e9edef',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          {!selectedId ? (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: '#f0f2f5',
              gap: 2,
            }}>
              <Box sx={{ 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                backgroundColor: '#e9edef', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
              }}>
                <MessageCircle size={48} color="#667781" />
              </Box>
              <Typography variant="h6" sx={{ color: '#41525d', fontWeight: 400 }}>
                WhatsApp CRM
              </Typography>
              <Typography variant="body2" sx={{ color: '#667781', textAlign: 'center', maxWidth: 320 }}>
                Select a conversation from the list or start a new one to begin messaging
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<Plus size={18} />} 
                onClick={() => setNewConvModalOpen(true)} 
                size="medium"
                sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#20bd5a' } }}
              >
                New conversation
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ 
                p: { xs: 1, sm: 1.5 }, 
                borderBottom: '1px solid #e9edef', 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: '#f0f2f5',
                gap: 1,
              }}>
                {isMobile && (
                  <IconButton size="small" onClick={() => setSelectedId(null)} sx={{ mr: 0.5 }} aria-label="Back to conversations">
                    <ArrowLeft size={20} />
                  </IconButton>
                )}
                <MessageCircle size={22} color="#25D366" style={{ marginRight: 4 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2c2416', fontSize: { xs: '0.95rem', sm: '1rem' }, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName(selectedConversation)}
                </Typography>
                {!isMobile && (
                  <>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <Select
                        value={selectedConversation?.assigned_user_id || ''}
                        displayEmpty
                        onChange={(e) => handleAssign(e.target.value || null)}
                        sx={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '0.8rem', '& .MuiSelect-select': { py: 0.75 } }}
                      >
                        <MenuItem value="">
                          <em>Unassigned</em>
                        </MenuItem>
                        {agents.map((a) => (
                          <MenuItem key={a.id} value={a.id}>{a.name || `Agent #${a.id}`}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {userInfo?.id && selectedConversation?.assigned_user_id !== userInfo.id && (
                      <IconButton size="small" onClick={() => handleAssign(userInfo.id)} title="Assign to me" sx={{ color: '#128C7E' }}>
                        <UserCheck size={18} />
                      </IconButton>
                    )}
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                      <Select
                        value={selectedConversation?.status || 'open'}
                        onChange={(e) => handleUpdateConversation({ status: e.target.value })}
                        sx={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '0.8rem', '& .MuiSelect-select': { py: 0.75 } }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                )}
              </Box>
              <List sx={{ flex: 1, overflow: 'auto', p: { xs: 1, sm: 2 }, backgroundColor: '#efeae2', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d9dbd5\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                {messagesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={24} sx={{ color: '#25D366' }} />
                  </Box>
                ) : (
                  messages.map((m) => (
                    <Box
                      key={m.id}
                      sx={{
                        display: 'flex',
                        justifyContent: m.direction === 'outbound' ? 'flex-end' : 'flex-start',
                        mb: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '65%',
                          p: 1.5,
                          borderRadius: '8px',
                          borderTopRightRadius: m.direction === 'outbound' ? '2px' : '8px',
                          borderTopLeftRadius: m.direction === 'outbound' ? '8px' : '2px',
                          backgroundColor: m.direction === 'outbound' ? '#d9fdd3' : '#fff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#111b21' }}>{m.body || '(media)'}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'right', mt: 0.5 }}>
                          {m.status || ''}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </List>
              <Box sx={{ p: { xs: 1, sm: 1.5 }, borderTop: '1px solid #e9edef', backgroundColor: '#f0f2f5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <ToggleButtonGroup
                    value={chatMessageType}
                    exclusive
                    onChange={(_, v) => v && setChatMessageType(v)}
                    size="small"
                    sx={{
                      '& .Mui-selected': { backgroundColor: 'rgba(37, 211, 102, 0.2)', color: '#128C7E', '&:hover': { backgroundColor: 'rgba(37, 211, 102, 0.3)' } },
                    }}
                  >
                    <ToggleButton value="text">Text</ToggleButton>
                    <ToggleButton value="template">
                      <FileText size={14} style={{ marginRight: 4 }} />
                      Template
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {chatMessageType === 'text' ? (
                  <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'flex-end', width: '100%' }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Type a message... (only if they messaged in last 24h)"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      disabled={sending}
                      sx={{ 
                        flex: 1,
                        minWidth: 0,
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: '24px', 
                          backgroundColor: '#fff',
                          minHeight: { xs: 44, sm: 48 },
                          '& fieldset': { borderColor: '#e9edef' },
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSend}
                      disabled={!canSend || sending}
                      sx={{ 
                        minWidth: { xs: 44, sm: 48 }, 
                        height: { xs: 44, sm: 48 }, 
                        borderRadius: '50%',
                        flexShrink: 0,
                        backgroundColor: '#25D366',
                        '&:hover': { backgroundColor: '#20bd5a' },
                        '&:disabled': { backgroundColor: '#aebac1', color: '#fff' },
                      }}
                    >
                      <Send size={isMobile ? 18 : 20} />
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                    <TemplateSelector
                      value={chatTemplateName}
                      onChange={setChatTemplateName}
                      templateLanguage={chatTemplateLanguage}
                      onLanguageChange={setChatTemplateLanguage}
                      templateVars={chatTemplateVars}
                      onTemplateVarsChange={setChatTemplateVars}
                      headerMediaUrl={chatHeaderMediaUrl}
                      onHeaderMediaUrlChange={setChatHeaderMediaUrl}
                      onComponentsChange={setChatTemplateComponents}
                      fetchTemplates={() => whatsappCrmApi.getTemplates()}
                      disabled={sending}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button
                        variant="contained"
                        onClick={handleSend}
                        disabled={!canSend || sending}
                        startIcon={<Send size={18} />}
                        sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#20bd5a' } }}
                      >
                        Send template
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Paper>

        {/* Right: customer profile - hidden on mobile */}
        <Paper elevation={0} sx={{ 
          width: { md: 300 }, 
          minWidth: { md: 260 }, 
          overflow: 'auto', 
          p: 2,
          borderRadius: '12px',
          border: '1px solid #e9edef',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          flex: { md: '0 0 auto' },
          display: { xs: 'none', md: 'block' },
        }}>
          <Typography variant="overline" sx={{ color: '#667781', fontSize: '0.75rem', letterSpacing: 1, mb: 1.5, display: 'block' }}>
            Customer Profile
          </Typography>
          {!selectedId ? (
            <Typography variant="body2" color="text.secondary">
              Select a conversation
            </Typography>
          ) : profileLoading ? (
            <CircularProgress size={24} />
          ) : profile ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Avatar sx={{ bgcolor: '#25D366', width: 48, height: 48 }}>
                  <User size={24} color="#fff" />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#2c2416' }}>
                  {profile.contact_name || profile.display_name || 'Unknown'}
                </Typography>
              </Box>
              <Divider sx={{ my: 1.5, borderColor: '#e9edef' }} />
              {profile.phone && (
                <Typography variant="body2" sx={{ mb: 1, color: '#41525d' }}>
                  Phone: {formatPhoneForDisplay(profile.phone)}
                </Typography>
              )}
              {profile.mobile_phone && profile.mobile_phone !== profile.phone && (
                <Typography variant="body2" sx={{ mb: 1, color: '#41525d' }}>
                  Mobile: {formatPhoneForDisplay(profile.mobile_phone)}
                </Typography>
              )}
              {profile.email && (
                <Typography variant="body2" sx={{ mb: 1, color: '#41525d' }}>
                  Email: {profile.email}
                </Typography>
              )}
              {(profile.billing_city || profile.billing_state || profile.city || profile.state) && (
                <Typography variant="body2" sx={{ mb: 1, color: '#41525d' }}>
                  Location: {[profile.billing_city || profile.city, profile.billing_state || profile.state, profile.billing_country || profile.country].filter(Boolean).join(', ')}
                </Typography>
              )}
              {(profile.total_spend != null || profile.order_count != null) && (
                <>
                  <Divider sx={{ my: 1.5, borderColor: '#e9edef' }} />
                  <Typography variant="overline" sx={{ color: '#667781', fontSize: '0.7rem', letterSpacing: 1, mb: 1, display: 'block' }}>
                    CRM
                  </Typography>
                  {profile.total_spend != null && (
                    <Typography variant="body2" sx={{ mb: 1, color: '#41525d' }}>
                      Total spend: ₹{Number(profile.total_spend).toLocaleString('en-IN')}
                    </Typography>
                  )}
                  {profile.order_count != null && (
                    <Typography variant="body2" sx={{ mb: 1, color: '#41525d' }}>
                      Orders: {profile.order_count}
                    </Typography>
                  )}
                  {Array.isArray(profile.source_providers) && profile.source_providers.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      {profile.source_providers.map((s) => (
                        <Chip key={s} label={s} size="small" sx={{ backgroundColor: '#f5f1e8', color: '#8b6f47', fontSize: '0.7rem' }} />
                      ))}
                    </Box>
                  )}
                  {Array.isArray(profile.tags) && profile.tags.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      {profile.tags.map((t) => (
                        <Chip key={t} label={t} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      ))}
                    </Box>
                  )}
                </>
              )}
              <Button
                variant="contained"
                size="small"
                sx={{ mt: 2, backgroundColor: '#8b6f47', '&:hover': { backgroundColor: '#6b5537' } }}
                onClick={() => window.open('/checkout', '_blank')}
              >
                Create order
              </Button>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No profile
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
