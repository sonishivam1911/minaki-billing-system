import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import { MessageCircle, Search, Send, User, Plus, Megaphone, FileText } from 'lucide-react';
import { whatsappCrmApi } from '../services/whatsappCrmApi';
import { formatPhoneForDisplay } from '../utils/phoneValidation';
import { NewConversationModal } from '../components/NewConversationModal';
import { BroadcastModal } from '../components/BroadcastModal';
import { TemplateSelector } from '../components/TemplateSelector';

export function WhatsAppCrmPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
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
  const [sending, setSending] = useState(false);
  const [newConvModalOpen, setNewConvModalOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await whatsappCrmApi.getConversations({
        search: search || undefined,
        filter,
        limit: 50,
        offset: 0,
      });
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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

  const buildTemplateComponents = () => {
    const vars = chatTemplateVars.split('\n').map((v) => v.trim()).filter(Boolean);
    if (vars.length === 0) return [];
    return [{ type: 'body', parameters: vars.map((text) => ({ type: 'text', text })) }];
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
            template_components: buildTemplateComponents(),
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden', p: 0 }}>
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416' }}>
            WhatsApp CRM
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Manage customer conversations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Megaphone size={18} />}
            onClick={() => setBroadcastModalOpen(true)}
            size="small"
          >
            Broadcast
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => setNewConvModalOpen(true)}
            size="small"
          >
            New conversation
          </Button>
        </Box>
      </Box>

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

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, gap: 1 }}>
        {/* Left: conversation list */}
        <Paper sx={{ width: 320, minWidth: 280, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TextField
            size="small"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ m: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            }}
          />
          <Tabs value={filter} onChange={(_, v) => setFilter(v)} sx={{ px: 1 }}>
            <Tab label="All" value="all" />
            <Tab label="Unread" value="unread" />
          </Tabs>
          <List sx={{ overflow: 'auto', flex: 1 }}>
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
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {(c.contact_name || c.phone || '?').slice(0, 1).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={displayName(c)}
                    secondary={c.last_message_preview || 'No messages'}
                    primaryTypographyProps={{ noWrap: true }}
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                  {c.unread_count > 0 && (
                    <Typography variant="caption" color="primary" sx={{ ml: 0.5 }}>
                      {c.unread_count}
                    </Typography>
                  )}
                </ListItemButton>
              ))
            )}
          </List>
        </Paper>

        {/* Center: chat */}
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!selectedId ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', gap: 1 }}>
              <Typography>Select a conversation or start a new one</Typography>
              <Button variant="outlined" startIcon={<Plus size={18} />} onClick={() => setNewConvModalOpen(true)} size="small">
                New conversation
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <MessageCircle size={20} style={{ marginRight: 8 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {displayName(selectedConversation)}
                </Typography>
              </Box>
              <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {messagesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  messages.map((m) => (
                    <Box
                      key={m.id}
                      sx={{
                        display: 'flex',
                        justifyContent: m.direction === 'outbound' ? 'flex-end' : 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          maxWidth: '75%',
                          p: 1.5,
                          bgcolor: m.direction === 'outbound' ? 'primary.light' : 'grey.100',
                          color: m.direction === 'outbound' ? 'primary.contrastText' : 'text.primary',
                        }}
                      >
                        <Typography variant="body2">{m.body || '(media)'}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {m.status || ''}
                        </Typography>
                      </Paper>
                    </Box>
                  ))
                )}
              </List>
              <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ToggleButtonGroup
                    value={chatMessageType}
                    exclusive
                    onChange={(_, v) => v && setChatMessageType(v)}
                    size="small"
                  >
                    <ToggleButton value="text">Text</ToggleButton>
                    <ToggleButton value="template">
                      <FileText size={14} style={{ marginRight: 4 }} />
                      Template
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {chatMessageType === 'text' ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Type a message... (only if they messaged in last 24h)"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      disabled={sending}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSend}
                      disabled={!canSend || sending}
                      startIcon={<Send size={18} />}
                    >
                      Send
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
                      fetchTemplates={() => whatsappCrmApi.getTemplates()}
                      disabled={sending}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button
                        variant="contained"
                        onClick={handleSend}
                        disabled={!canSend || sending}
                        startIcon={<Send size={18} />}
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

        {/* Right: customer profile */}
        <Paper sx={{ width: 280, minWidth: 240, overflow: 'auto', p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Customer
          </Typography>
          {!selectedId ? (
            <Typography variant="body2" color="text.secondary">
              Select a conversation
            </Typography>
          ) : profileLoading ? (
            <CircularProgress size={24} />
          ) : profile ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Avatar sx={{ bgcolor: 'grey.400' }}>
                  <User size={20} />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={600}>
                  {profile.contact_name || profile.display_name || 'Unknown'}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              {profile.phone && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Phone: {formatPhoneForDisplay(profile.phone)}
                </Typography>
              )}
              {profile.mobile_phone && profile.mobile_phone !== profile.phone && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Mobile: {formatPhoneForDisplay(profile.mobile_phone)}
                </Typography>
              )}
              {profile.email && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Email: {profile.email}
                </Typography>
              )}
              {(profile.billing_city || profile.billing_state) && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Location: {[profile.billing_city, profile.billing_state, profile.billing_country].filter(Boolean).join(', ')}
                </Typography>
              )}
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 2 }}
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
