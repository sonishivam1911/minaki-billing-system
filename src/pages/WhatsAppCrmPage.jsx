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
  Tooltip,
  Alert,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popover,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  MessageCircle, Search, Send, User, Plus, Megaphone, FileText, ArrowLeft, UserCheck,
  Check, CheckCheck, AlertTriangle, Paperclip, Package, X, FileIcon, Image as ImageIcon,
  MapPin, Contact, MousePointerClick, List as ListIcon, SmilePlus, MoreVertical, ShoppingBag,
} from 'lucide-react';
import { whatsappCrmApi } from '../services/whatsappCrmApi';
import { formatPhoneForDisplay } from '../utils/phoneValidation';
import { NewConversationModal } from '../components/NewConversationModal';
import { BroadcastModal } from '../components/BroadcastModal';
import { TemplateSelector } from '../components/TemplateSelector';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['open', 'pending', 'resolved'];
const STATUS_LABELS = { open: 'Open', pending: 'Pending', resolved: 'Resolved' };
const POLL_INTERVAL_MS = 6000;
// Meta's actual supported set per message type (WhatsApp Cloud API media
// docs) - previously this only accepted pdf/doc/docx/xls/xlsx, silently
// excluding ppt/pptx/txt and every other document type Meta itself allows.
const SUPPORTED_MEDIA_MIME_TYPES = [
  'image/jpeg', 'image/png',
  'video/mp4', 'video/3gpp',
  'audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/ogg',
  'text/plain', 'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const MEDIA_ACCEPT = [
  ...SUPPORTED_MEDIA_MIME_TYPES,
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.pdf',
].join(',');
const MEDIA_MAX_SIZE_MB = 16;

// Known Meta failure codes worth a specific, non-generic explanation -
// everything else falls back to Meta's own error_title/error_detail so an
// unmapped code is still legible instead of silently "failed".
const KNOWN_ERROR_CODES = {
  131047: { label: 'Outside 24h window', hint: 'The customer hasn’t messaged in the last 24 hours — send a template instead of free text.' },
  131026: { label: 'Not on WhatsApp', hint: 'This number isn’t reachable on WhatsApp.' },
  131053: { label: 'Media error', hint: 'Meta couldn’t process this media file.' },
  132000: { label: 'Template error', hint: 'The template parameters didn’t match what the approved template expects.' },
};

export function WhatsAppCrmPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userInfo } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [myConversationsOnly, setMyConversationsOnly] = useState(false);
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
  const [sendError, setSendError] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaCaption, setMediaCaption] = useState('');
  const [productRetailerId, setProductRetailerId] = useState('');
  const [productBodyText, setProductBodyText] = useState('');
  const [newConvModalOpen, setNewConvModalOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quickActionsAnchor, setQuickActionsAnchor] = useState(null);
  const [openDialog, setOpenDialog] = useState(null); // null | 'location' | 'contact' | 'buttons' | 'list'
  const [locationForm, setLocationForm] = useState({ latitude: '', longitude: '', name: '', address: '' });
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '' });
  const [buttonsForm, setButtonsForm] = useState({ bodyText: '', buttons: ['', '', ''] });
  const [listForm, setListForm] = useState({ bodyText: '', buttonText: 'Options', rows: [{ title: '', description: '' }] });
  const [reactionAnchor, setReactionAnchor] = useState(null);
  const [reactionTargetWamid, setReactionTargetWamid] = useState(null);
  const selectedIdRef = useRef(selectedId);
  const mediaInputRef = useRef(null);
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
        assignedUserId: myConversationsOnly ? userInfo?.id : undefined,
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
  }, [search, unreadOnly, statusFilter, myConversationsOnly, userInfo?.id]);

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
    // Reset composer state on conversation switch - a media file or error
    // banner left over from the previous thread has no business showing up
    // here.
    setSendError(null);
    setMediaFile(null);
    setMediaCaption('');
    setProductRetailerId('');
    setProductBodyText('');
    setOpenDialog(null);
    setReactionAnchor(null);
    if (!selectedId) {
      setMessages([]);
      setProfile(null);
      setOrders([]);
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
    whatsappCrmApi.getConversationOrders(selectedId).then(setOrders).catch(() => setOrders([]));
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

  // Structured error (from apiClient's error.response.data.detail, populated
  // by the backend's _parse_meta_error) instead of a raw alert() dump - falls
  // back to e.message when the backend didn't return the structured shape.
  const describeSendError = (e) => {
    const detail = e?.response?.data?.detail;
    if (detail && typeof detail === 'object') {
      const known = KNOWN_ERROR_CODES[detail.error_code];
      return {
        message: known?.hint || detail.error_detail || detail.message || 'Send failed',
        label: known?.label || detail.error_title || null,
        code: detail.error_code || null,
      };
    }
    return { message: e?.message || 'Send failed', label: null, code: null };
  };

  const refreshAfterSend = async () => {
    const targetId = selectedId;
    const data = await whatsappCrmApi.getMessages(targetId, { limit: 100 });
    // Guard against the conversation having changed while the request was
    // in flight (was previously unguarded, unlike the polling effect above).
    if (selectedIdRef.current === targetId) setMessages(Array.isArray(data) ? data : []);
    fetchConversations({ silent: true });
  };

  const handleSend = async () => {
    if (!selectedConversation?.phone) return;
    const isTemplate = chatMessageType === 'template';
    if (isTemplate && !chatTemplateName.trim()) {
      setSendError({ message: 'Please select or enter a template name', label: null, code: null });
      return;
    }
    if (!isTemplate && !messageInput.trim()) return;

    setSending(true);
    setSendError(null);
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
      await refreshAfterSend();
    } catch (e) {
      console.error(e);
      setSendError(describeSendError(e));
    } finally {
      setSending(false);
    }
  };

  const handleSendMedia = async () => {
    if (!selectedConversation?.phone || !mediaFile) return;
    setSending(true);
    setSendError(null);
    try {
      await whatsappCrmApi.sendMedia({ toPhone: selectedConversation.phone, caption: mediaCaption.trim() || undefined, file: mediaFile });
      setMediaFile(null);
      setMediaCaption('');
      await refreshAfterSend();
    } catch (e) {
      console.error(e);
      setSendError(describeSendError(e));
    } finally {
      setSending(false);
    }
  };

  const handleSendCatalog = async () => {
    if (!selectedConversation?.phone) return;
    setSending(true);
    setSendError(null);
    try {
      await whatsappCrmApi.sendCatalog({
        to_phone: selectedConversation.phone,
        body_text: productBodyText.trim() || 'Browse our full catalog',
      });
      setProductBodyText('');
      await refreshAfterSend();
    } catch (e) {
      console.error(e);
      setSendError(describeSendError(e));
    } finally {
      setSending(false);
    }
  };

  const handleSendProduct = async () => {
    if (!selectedConversation?.phone || !productRetailerId.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      await whatsappCrmApi.sendProduct({
        to_phone: selectedConversation.phone,
        product_retailer_id: productRetailerId.trim(),
        body_text: productBodyText.trim() || undefined,
      });
      setProductRetailerId('');
      setProductBodyText('');
      await refreshAfterSend();
    } catch (e) {
      console.error(e);
      setSendError(describeSendError(e));
    } finally {
      setSending(false);
    }
  };

  const handleSendLocation = async () => {
    if (!selectedConversation?.phone) return;
    const lat = parseFloat(locationForm.latitude);
    const lng = parseFloat(locationForm.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setSendError({ message: 'Latitude and longitude must be numbers', label: null, code: null });
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      await whatsappCrmApi.sendLocation({
        to_phone: selectedConversation.phone,
        latitude: lat,
        longitude: lng,
        name: locationForm.name.trim() || undefined,
        address: locationForm.address.trim() || undefined,
      });
      setLocationForm({ latitude: '', longitude: '', name: '', address: '' });
      setOpenDialog(null);
      await refreshAfterSend();
    } catch (e) {
      console.error(e);
      setSendError(describeSendError(e));
    } finally {
      setSending(false);
    }
  };

  const handleSendContact = async () => {
    if (!selectedConversation?.phone || !contactForm.name.trim() || !contactForm.phone.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      await whatsappCrmApi.sendContact({
        to_phone: selectedConversation.phone,
        contact_name: contactForm.name.trim(),
        contact_phone: contactForm.phone.trim(),
        contact_email: contactForm.email.trim() || undefined,
      });
      setContactForm({ name: '', phone: '', email: '' });
      setOpenDialog(null);
      await refreshAfterSend();
    } catch (e) {
      console.error(e);
      setSendError(describeSendError(e));
    } finally {
      setSending(false);
    }
  };

  const handleSendButtons = async () => {
    const buttons = buttonsForm.buttons.map((t) => t.trim()).filter(Boolean).map((title) => ({ title }));
    if (!selectedConversation?.phone || !buttonsForm.bodyText.trim() || buttons.length === 0) return;
    setSending(true);
    setSendError(null);
    try {
      await whatsappCrmApi.sendButtons({
        to_phone: selectedConversation.phone,
        body_text: buttonsForm.bodyText.trim(),
        buttons,
      });
      setButtonsForm({ bodyText: '', buttons: ['', '', ''] });
      setOpenDialog(null);
      await refreshAfterSend();
    } catch (e) {
      console.error(e);
      setSendError(describeSendError(e));
    } finally {
      setSending(false);
    }
  };

  const handleSendList = async () => {
    const rows = listForm.rows.filter((r) => r.title.trim());
    if (!selectedConversation?.phone || !listForm.bodyText.trim() || rows.length === 0) return;
    setSending(true);
    setSendError(null);
    try {
      await whatsappCrmApi.sendList({
        to_phone: selectedConversation.phone,
        body_text: listForm.bodyText.trim(),
        button_text: listForm.buttonText.trim() || 'Options',
        sections: [{ title: 'Options', rows }],
      });
      setListForm({ bodyText: '', buttonText: 'Options', rows: [{ title: '', description: '' }] });
      setOpenDialog(null);
      await refreshAfterSend();
    } catch (e) {
      console.error(e);
      setSendError(describeSendError(e));
    } finally {
      setSending(false);
    }
  };

  const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '🙏', '👏'];

  const handleSendReaction = async (emoji) => {
    const targetWamid = reactionTargetWamid;
    setReactionAnchor(null);
    if (!selectedConversation?.phone || !targetWamid) return;
    try {
      await whatsappCrmApi.sendReaction({ to_phone: selectedConversation.phone, target_wamid: targetWamid, emoji });
      await refreshAfterSend();
    } catch (e) {
      console.error(e);
      setSendError(describeSendError(e));
    }
  };

  const handleMediaFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type && !SUPPORTED_MEDIA_MIME_TYPES.includes(file.type)) {
      setSendError({ message: `${file.name} (${file.type}) isn’t a format WhatsApp supports. Allowed: images (jpg/png), video (mp4/3gpp), audio (aac/mp4/mpeg/amr/ogg), and documents (pdf/doc/docx/xls/xlsx/ppt/pptx/txt).`, label: null, code: null });
      return;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MEDIA_MAX_SIZE_MB) {
      setSendError({ message: `${file.name} is ${sizeMB.toFixed(1)}MB, over the ${MEDIA_MAX_SIZE_MB}MB limit`, label: null, code: null });
      return;
    }
    setSendError(null);
    setMediaFile(file);
  };

  const canSend =
    selectedConversation?.phone &&
    (chatMessageType === 'text' ? !!messageInput.trim()
      : chatMessageType === 'template' ? !!chatTemplateName.trim()
      : chatMessageType === 'media' ? !!mediaFile
      : chatMessageType === 'product' ? !!productRetailerId.trim()
      : false);

  const displayName = (c) =>
    c?.contact_name || c?.display_name || c?.phone || 'Unknown';

  // WhatsApp-style delivery ticks. failed gets a color/label taken from the
  // error taxonomy instead of looking identical to every other failure -
  // yellow specifically for "outside the 24h window" since that's the one
  // agents hit constantly and needs a different response (send a template)
  // than a genuine error does.
  const renderTick = (m) => {
    if (m.direction !== 'outbound') return null;
    if (m.status === 'failed') {
      const known = KNOWN_ERROR_CODES[m.error_code];
      const color = m.error_code === 131047 ? '#e6a417' : '#e74c3c';
      const label = known?.label || m.error_title || 'Failed';
      const detail = known?.hint || m.error_detail || m.error_title || 'Message failed to send.';
      return (
        <Tooltip title={`${label}: ${detail}`} arrow placement="top">
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, cursor: 'help' }}>
            <AlertTriangle size={13} color={color} />
          </Box>
        </Tooltip>
      );
    }
    if (m.status === 'read') return <CheckCheck size={15} color="#53bdeb" />;
    if (m.status === 'delivered') return <CheckCheck size={15} color="#8696a0" />;
    if (m.status === 'sent') return <Check size={15} color="#8696a0" />;
    return null;
  };

  const renderBubbleContent = (m) => {
    if (m.media_url && (m.type === 'image' || m.type === 'video')) {
      return (
        <Box>
          {m.type === 'image' ? (
            <Box component="img" src={m.media_url} alt="" sx={{ maxWidth: '100%', maxHeight: 260, borderRadius: '6px', display: 'block' }} />
          ) : (
            <Box component="video" src={m.media_url} controls sx={{ maxWidth: '100%', maxHeight: 260, borderRadius: '6px', display: 'block' }} />
          )}
          {m.body && <Typography variant="body2" sx={{ color: '#111b21', mt: 0.75 }}>{m.body}</Typography>}
        </Box>
      );
    }
    if (m.media_url && (m.type === 'document' || m.type === 'audio')) {
      return (
        <Box component="a" href={m.media_url} target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: '#111b21' }}>
          <FileIcon size={20} />
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{m.body || (m.type === 'audio' ? 'Audio message' : 'Document')}</Typography>
        </Box>
      );
    }
    if (m.type === 'product') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Package size={18} color="#128C7E" />
          <Typography variant="body2" sx={{ color: '#111b21' }}>{m.body}</Typography>
        </Box>
      );
    }
    if (m.type === 'order') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingBag size={18} color="#128C7E" />
          <Typography variant="body2" sx={{ color: '#111b21' }}>{m.body}</Typography>
        </Box>
      );
    }
    if (m.type === 'location') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MapPin size={18} color="#128C7E" />
          <Typography variant="body2" sx={{ color: '#111b21' }}>{m.body}</Typography>
        </Box>
      );
    }
    if (m.type === 'contact') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Contact size={18} color="#128C7E" />
          <Typography variant="body2" sx={{ color: '#111b21' }}>{m.body}</Typography>
        </Box>
      );
    }
    if (m.type === 'button' || m.type === 'list') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {m.type === 'button' ? <MousePointerClick size={16} color="#128C7E" /> : <ListIcon size={16} color="#128C7E" />}
          <Typography variant="body2" sx={{ color: '#111b21' }}>{m.body}</Typography>
        </Box>
      );
    }
    if (m.type === 'button_reply' || m.type === 'list_reply') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={m.body} size="small" sx={{ backgroundColor: '#e6f4ea', color: '#1b7f3a' }} />
        </Box>
      );
    }
    return <Typography variant="body2" sx={{ color: '#111b21' }}>{m.body || '(media)'}</Typography>;
  };

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
            {userInfo?.id && (
              <Chip
                label="Mine"
                size="small"
                onClick={() => setMyConversationsOnly((v) => !v)}
                sx={{
                  backgroundColor: myConversationsOnly ? 'rgba(37, 211, 102, 0.18)' : '#f0f2f5',
                  color: myConversationsOnly ? '#128C7E' : '#667781',
                  fontWeight: myConversationsOnly ? 600 : 500,
                  cursor: 'pointer',
                }}
              />
            )}
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
                        className="wa-bubble-group"
                        sx={{
                          position: 'relative',
                          maxWidth: '65%',
                          '&:hover .wa-react-btn': { opacity: 1 },
                        }}
                      >
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: '8px',
                            borderTopRightRadius: m.direction === 'outbound' ? '2px' : '8px',
                            borderTopLeftRadius: m.direction === 'outbound' ? '8px' : '2px',
                            backgroundColor: m.direction === 'outbound' ? '#d9fdd3' : '#fff',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          }}
                        >
                          {renderBubbleContent(m)}
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            {renderTick(m)}
                          </Box>
                        </Box>
                        {m.wamid && (
                          <IconButton
                            className="wa-react-btn"
                            size="small"
                            onClick={(e) => { setReactionTargetWamid(m.wamid); setReactionAnchor(e.currentTarget); }}
                            sx={{
                              position: 'absolute',
                              top: -12,
                              [m.direction === 'outbound' ? 'left' : 'right']: -12,
                              opacity: 0,
                              transition: 'opacity 0.15s',
                              backgroundColor: '#fff',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              width: 24,
                              height: 24,
                              '&:hover': { backgroundColor: '#f0f2f5' },
                            }}
                          >
                            <SmilePlus size={13} color="#667781" />
                          </IconButton>
                        )}
                        {m.reaction_emoji && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: -10,
                              [m.direction === 'outbound' ? 'left' : 'right']: -6,
                              backgroundColor: '#fff',
                              borderRadius: '10px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              px: 0.5,
                              fontSize: '0.85rem',
                              lineHeight: '18px',
                            }}
                          >
                            {m.reaction_emoji}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ))
                )}
              </List>
              <Box sx={{ p: { xs: 1, sm: 1.5 }, borderTop: '1px solid #e9edef', backgroundColor: '#f0f2f5' }}>
                {sendError && (
                  <Alert
                    severity={sendError.code === 131047 ? 'warning' : 'error'}
                    onClose={() => setSendError(null)}
                    sx={{ mb: 1, borderRadius: '8px' }}
                  >
                    {sendError.label ? <strong>{sendError.label}: </strong> : null}
                    {sendError.message}
                  </Alert>
                )}
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
                    <ToggleButton value="media">
                      <Paperclip size={14} style={{ marginRight: 4 }} />
                      Media
                    </ToggleButton>
                    <ToggleButton value="product">
                      <Package size={14} style={{ marginRight: 4 }} />
                      Product
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <Tooltip title="More: location, contact, buttons, list">
                    <IconButton size="small" onClick={(e) => setQuickActionsAnchor(e.currentTarget)} sx={{ border: '1px solid #e9edef', backgroundColor: '#fff' }}>
                      <MoreVertical size={16} />
                    </IconButton>
                  </Tooltip>
                  <Menu anchorEl={quickActionsAnchor} open={!!quickActionsAnchor} onClose={() => setQuickActionsAnchor(null)}>
                    <MenuItem onClick={() => { setOpenDialog('location'); setQuickActionsAnchor(null); }}>
                      <MapPin size={16} style={{ marginRight: 8 }} /> Location
                    </MenuItem>
                    <MenuItem onClick={() => { setOpenDialog('contact'); setQuickActionsAnchor(null); }}>
                      <Contact size={16} style={{ marginRight: 8 }} /> Contact card
                    </MenuItem>
                    <MenuItem onClick={() => { setOpenDialog('buttons'); setQuickActionsAnchor(null); }}>
                      <MousePointerClick size={16} style={{ marginRight: 8 }} /> Quick-reply buttons
                    </MenuItem>
                    <MenuItem onClick={() => { setOpenDialog('list'); setQuickActionsAnchor(null); }}>
                      <ListIcon size={16} style={{ marginRight: 8 }} /> List picker
                    </MenuItem>
                  </Menu>
                </Box>
                {chatMessageType === 'text' && (
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
                      {sending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Send size={isMobile ? 18 : 20} />}
                    </Button>
                  </Box>
                )}
                {chatMessageType === 'template' && (
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
                        startIcon={sending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Send size={18} />}
                        sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#20bd5a' } }}
                      >
                        Send template
                      </Button>
                    </Box>
                  </Box>
                )}
                {chatMessageType === 'media' && (
                  <Box>
                    <input
                      ref={mediaInputRef}
                      type="file"
                      accept={MEDIA_ACCEPT}
                      onChange={handleMediaFileChange}
                      style={{ display: 'none' }}
                    />
                    {mediaFile ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, backgroundColor: '#fff', borderRadius: '8px' }}>
                        {mediaFile.type.startsWith('image/') ? <ImageIcon size={20} color="#128C7E" /> : <FileIcon size={20} color="#128C7E" />}
                        <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(1)}MB)
                        </Typography>
                        <IconButton size="small" onClick={() => setMediaFile(null)} disabled={sending}>
                          <X size={16} />
                        </IconButton>
                      </Box>
                    ) : (
                      <Button
                        variant="outlined"
                        startIcon={<Paperclip size={16} />}
                        onClick={() => mediaInputRef.current?.click()}
                        sx={{ mb: 1, borderColor: '#25D366', color: '#128C7E' }}
                      >
                        Attach file
                      </Button>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Caption (optional)"
                        value={mediaCaption}
                        onChange={(e) => setMediaCaption(e.target.value)}
                        disabled={sending}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#fff' } }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleSendMedia}
                        disabled={!canSend || sending}
                        startIcon={sending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Send size={16} />}
                        sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#20bd5a' }, flexShrink: 0 }}
                      >
                        Send
                      </Button>
                    </Box>
                  </Box>
                )}
                {chatMessageType === 'product' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                      size="small"
                      label="Product retailer ID"
                      helperText="From the connected catalog (Shopify variant ID) - format unverified, confirm with a test send"
                      value={productRetailerId}
                      onChange={(e) => setProductRetailerId(e.target.value)}
                      disabled={sending}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#fff' } }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Message (optional)"
                        value={productBodyText}
                        onChange={(e) => setProductBodyText(e.target.value)}
                        disabled={sending}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#fff' } }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleSendProduct}
                        disabled={!canSend || sending}
                        startIcon={sending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Send size={16} />}
                        sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#20bd5a' }, flexShrink: 0 }}
                      >
                        Send
                      </Button>
                    </Box>
                    <Divider sx={{ my: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">or</Typography>
                    </Divider>
                    <Button
                      variant="outlined"
                      onClick={handleSendCatalog}
                      disabled={sending}
                      startIcon={sending ? <CircularProgress size={16} /> : <Package size={16} />}
                      sx={{ borderColor: '#25D366', color: '#128C7E' }}
                    >
                      Send whole catalog instead
                    </Button>
                  </Box>
                )}
              </Box>

              <Popover
                open={!!reactionAnchor}
                anchorEl={reactionAnchor}
                onClose={() => setReactionAnchor(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              >
                <Box sx={{ display: 'flex', gap: 0.5, p: 0.75 }}>
                  {QUICK_REACTIONS.map((emoji) => (
                    <IconButton key={emoji} size="small" onClick={() => handleSendReaction(emoji)}>
                      <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
                    </IconButton>
                  ))}
                </Box>
              </Popover>

              <Dialog open={openDialog === 'location'} onClose={() => setOpenDialog(null)} fullWidth maxWidth="xs">
                <DialogTitle>Send location</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                  <TextField size="small" label="Latitude" value={locationForm.latitude} onChange={(e) => setLocationForm((f) => ({ ...f, latitude: e.target.value }))} />
                  <TextField size="small" label="Longitude" value={locationForm.longitude} onChange={(e) => setLocationForm((f) => ({ ...f, longitude: e.target.value }))} />
                  <TextField size="small" label="Name (optional)" value={locationForm.name} onChange={(e) => setLocationForm((f) => ({ ...f, name: e.target.value }))} />
                  <TextField size="small" label="Address (optional)" value={locationForm.address} onChange={(e) => setLocationForm((f) => ({ ...f, address: e.target.value }))} />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenDialog(null)}>Cancel</Button>
                  <Button variant="contained" onClick={handleSendLocation} disabled={sending} sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#20bd5a' } }}>
                    {sending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Send'}
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog open={openDialog === 'contact'} onClose={() => setOpenDialog(null)} fullWidth maxWidth="xs">
                <DialogTitle>Send contact card</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                  <TextField size="small" label="Name" value={contactForm.name} onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))} />
                  <TextField size="small" label="Phone" value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} />
                  <TextField size="small" label="Email (optional)" value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenDialog(null)}>Cancel</Button>
                  <Button variant="contained" onClick={handleSendContact} disabled={sending} sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#20bd5a' } }}>
                    {sending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Send'}
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog open={openDialog === 'buttons'} onClose={() => setOpenDialog(null)} fullWidth maxWidth="xs">
                <DialogTitle>Send quick-reply buttons</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                  <TextField size="small" label="Message" value={buttonsForm.bodyText} onChange={(e) => setButtonsForm((f) => ({ ...f, bodyText: e.target.value }))} />
                  {buttonsForm.buttons.map((b, i) => (
                    <TextField
                      key={i}
                      size="small"
                      label={`Button ${i + 1}${i === 0 ? '' : ' (optional)'}`}
                      value={b}
                      inputProps={{ maxLength: 20 }}
                      helperText={`${b.length}/20`}
                      onChange={(e) => setButtonsForm((f) => ({ ...f, buttons: f.buttons.map((x, j) => (j === i ? e.target.value : x)) }))}
                    />
                  ))}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenDialog(null)}>Cancel</Button>
                  <Button variant="contained" onClick={handleSendButtons} disabled={sending} sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#20bd5a' } }}>
                    {sending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Send'}
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog open={openDialog === 'list'} onClose={() => setOpenDialog(null)} fullWidth maxWidth="xs">
                <DialogTitle>Send list picker</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                  <TextField size="small" label="Message" value={listForm.bodyText} onChange={(e) => setListForm((f) => ({ ...f, bodyText: e.target.value }))} />
                  <TextField size="small" label="Button label" inputProps={{ maxLength: 20 }} value={listForm.buttonText} onChange={(e) => setListForm((f) => ({ ...f, buttonText: e.target.value }))} />
                  {listForm.rows.map((row, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                      <TextField size="small" label={`Option ${i + 1}`} value={row.title} inputProps={{ maxLength: 24 }} onChange={(e) => setListForm((f) => ({ ...f, rows: f.rows.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)) }))} />
                      <TextField size="small" label="Description (optional)" value={row.description} inputProps={{ maxLength: 72 }} onChange={(e) => setListForm((f) => ({ ...f, rows: f.rows.map((r, j) => (j === i ? { ...r, description: e.target.value } : r)) }))} />
                      {listForm.rows.length > 1 && (
                        <IconButton size="small" onClick={() => setListForm((f) => ({ ...f, rows: f.rows.filter((_, j) => j !== i) }))}>
                          <X size={14} />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  <Button size="small" onClick={() => setListForm((f) => ({ ...f, rows: [...f.rows, { title: '', description: '' }] }))}>
                    + Add option
                  </Button>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenDialog(null)}>Cancel</Button>
                  <Button variant="contained" onClick={handleSendList} disabled={sending} sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#20bd5a' } }}>
                    {sending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Send'}
                  </Button>
                </DialogActions>
              </Dialog>
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
              {orders.length > 0 && (
                <>
                  <Divider sx={{ my: 1.5, borderColor: '#e9edef' }} />
                  <Typography variant="overline" sx={{ color: '#667781', fontSize: '0.7rem', letterSpacing: 1, mb: 1, display: 'block' }}>
                    WhatsApp Orders
                  </Typography>
                  {orders.map((o) => (
                    <Box key={o.id} sx={{ mb: 1, p: 1, backgroundColor: '#f5f1e8', borderRadius: '8px' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c2416' }}>
                        {o.items.length} item(s) · {o.currency || ''} {o.total_amount != null ? Number(o.total_amount).toFixed(2) : '-'}
                      </Typography>
                      {o.buyer_note && (
                        <Typography variant="caption" sx={{ color: '#667781', display: 'block' }}>
                          “{o.buyer_note}”
                        </Typography>
                      )}
                    </Box>
                  ))}
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
