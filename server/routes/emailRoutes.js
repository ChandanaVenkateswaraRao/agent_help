// const express = require('express');
// const router = express.Router();
// const axios = require('axios');
// const { google } = require('googleapis');
// const { protect } = require('../middleware/auth');
// const User = require('../models/User');
// const EmailSummary = require('../models/EmailSummary');

// const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

// // Free models in priority order — if one is down, next is tried
// const FREE_MODELS = [
//   'deepseek/deepseek-r1-0528:free',
//   'google/gemma-3-27b-it:free',
//   'mistralai/mistral-7b-instruct:free',
//   'qwen/qwen3-8b:free'
// ];

// const openRouterChat = async (messages, maxTokens = 200) => {
//   let lastError = null;
//   for (const model of FREE_MODELS) {
//     try {
//       const response = await axios.post(OPENROUTER_API, {
//         model,
//         max_tokens: maxTokens,
//         messages
//       }, {
//         headers: {
//           'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//           'Content-Type': 'application/json',
//           'HTTP-Referer': 'http://localhost:3000',
//           'X-Title': 'AI Productivity Dashboard'
//         },
//         timeout: 30000
//       });
//       const content = response.data.choices?.[0]?.message?.content;
//       if (content) return content.trim();
//     } catch (err) {
//       lastError = err;
//       const msg = err.response?.data?.error?.message || '';
//       if (err.response?.status === 404 || msg.includes('No endpoints')) {
//         console.warn(`Model ${model} unavailable, trying next...`);
//         continue;
//       }
//       throw err;
//     }
//   }
//   throw lastError || new Error('All free models unavailable');
// };

// const getGmailClient = (accessToken, refreshToken) => {
//   const auth = new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     process.env.GOOGLE_REDIRECT_URI
//   );
//   auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
//   return google.gmail({ version: 'v1', auth });
// };

// const decodeBase64 = (data) =>
//   Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');

// const extractEmailBody = (payload) => {
//   if (payload.body?.data) return decodeBase64(payload.body.data);
//   if (payload.parts) {
//     for (const part of payload.parts) {
//       if (part.mimeType === 'text/plain' && part.body?.data)
//         return decodeBase64(part.body.data);
//     }
//     for (const part of payload.parts) {
//       if (part.mimeType === 'text/html' && part.body?.data)
//         return decodeBase64(part.body.data).replace(/<[^>]+>/g, ' ').substring(0, 500);
//     }
//   }
//   return '';
// };

// const summarizeEmail = async (subject, sender, body) => {
//   try {
//     const text = await openRouterChat([{
//       role: 'user',
//       content: `Analyze this email and respond with ONLY a valid JSON object (no markdown, no backticks, no explanation):
// {"summary":"one sentence summary","priority":"high|medium|low","actionRequired":true|false,"actionLabel":"Reply|Review|Schedule|None"}

// From: ${sender}
// Subject: ${subject}
// Body: ${body?.substring(0, 600) || 'No body'}`
//     }]);

//     const cleaned = text.replace(/```json|```/g, '').trim();
//     return JSON.parse(cleaned);
//   } catch {
//     return { summary: subject || '(No subject)', priority: 'medium', actionRequired: false, actionLabel: 'None' };
//   }
// };

// router.get('/', protect, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);
//     if (!user.accessToken)
//       return res.status(403).json({ error: 'Gmail not connected. Please login with Google.' });

//     const gmail = getGmailClient(user.accessToken, user.refreshToken);
//     const { data } = await gmail.users.messages.list({ userId: 'me', maxResults: 8, labelIds: ['INBOX'] });

//     if (!data.messages?.length) return res.json({ emails: [] });

//     const emails = await Promise.all(
//       data.messages.slice(0, 6).map(async (msg) => {
//         const cached = await EmailSummary.findOne({ userId: user._id, emailId: msg.id });
//         if (cached) return {
//           id: msg.id, subject: cached.subject, sender: cached.sender,
//           summary: cached.summary, priority: cached.priority,
//           actionRequired: cached.actionRequired, actionLabel: cached.actionLabel, cached: true
//         };

//         const { data: full } = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
//         const headers = full.payload.headers;
//         const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
//         const sender = headers.find(h => h.name === 'From')?.value || 'Unknown';
//         const body = extractEmailBody(full.payload);
//         const aiResult = await summarizeEmail(subject, sender, body);

//         await EmailSummary.create({ userId: user._id, emailId: msg.id, subject, sender, ...aiResult });
//         return { id: msg.id, subject, sender, ...aiResult };
//       })
//     );

//     const { data: unreadData } = await gmail.users.messages.list({
//       userId: 'me', labelIds: ['UNREAD', 'INBOX'], maxResults: 1
//     });

//     res.json({ emails, unreadCount: unreadData.resultSizeEstimate || 0 });
//   } catch (err) {
//     console.error('Email error:', err.message);
//     res.status(500).json({ error: 'Failed to fetch emails' });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { google } = require('googleapis');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const EmailSummary = require('../models/EmailSummary');

const NVIDIA_API = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL = 'google/gemma-3n-e4b-it';

const nvidiaChat = async (messages, maxTokens = 200) => {
  const response = await axios.post(NVIDIA_API, {
    model: NVIDIA_MODEL,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
    top_p: 0.95,
    stream: false
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 30000
  });
  return response.data.choices[0].message.content.trim();
};




const getGmailClient = (accessToken, refreshToken) => {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  return google.gmail({ version: 'v1', auth });
};

const decodeBase64 = (data) =>
  Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');

const extractEmailBody = (payload) => {
  if (payload.body?.data) return decodeBase64(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data)
        return decodeBase64(part.body.data);
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data)
        return decodeBase64(part.body.data).replace(/<[^>]+>/g, ' ').substring(0, 500);
    }
  }
  return '';
};

const summarizeEmail = async (subject, sender, body) => {
  try {
    const text = await nvidiaChat([{
      role: 'user',
      content: `Analyze this email. Respond ONLY with valid JSON, no markdown, no explanation:
{"summary":"one sentence summary","priority":"high|medium|low","actionRequired":true,"actionLabel":"Reply|Review|Schedule|None"}

From: ${sender}
Subject: ${subject}
Body: ${body?.substring(0, 600) || 'No body'}`
    }], 200);

    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { summary: subject || '(No subject)', priority: 'medium', actionRequired: false, actionLabel: 'None' };
  }
};

router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.accessToken)
      return res.status(403).json({ error: 'Gmail not connected. Please login with Google.' });

    const gmail = getGmailClient(user.accessToken, user.refreshToken);
    const { data } = await gmail.users.messages.list({ userId: 'me', maxResults: 8, labelIds: ['INBOX'] });

    if (!data.messages?.length) return res.json({ emails: [] });

    const emails = await Promise.all(
      data.messages.slice(0, 6).map(async (msg) => {
        const cached = await EmailSummary.findOne({ userId: user._id, emailId: msg.id });
        if (cached) return {
          id: msg.id, subject: cached.subject, sender: cached.sender,
          summary: cached.summary, priority: cached.priority,
          actionRequired: cached.actionRequired, actionLabel: cached.actionLabel, cached: true
        };

        const { data: full } = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
        const headers = full.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
        const sender = headers.find(h => h.name === 'From')?.value || 'Unknown';
        const body = extractEmailBody(full.payload);
        const aiResult = await summarizeEmail(subject, sender, body);

        await EmailSummary.create({ userId: user._id, emailId: msg.id, subject, sender, ...aiResult });
        return { id: msg.id, subject, sender, ...aiResult };
      })
    );

    const { data: unreadData } = await gmail.users.messages.list({
      userId: 'me', labelIds: ['UNREAD', 'INBOX'], maxResults: 1
    });

    res.json({ emails, unreadCount: unreadData.resultSizeEstimate || 0 });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

module.exports = router;