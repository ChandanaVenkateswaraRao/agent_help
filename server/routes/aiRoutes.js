// const express = require('express');
// const router = express.Router();
// const axios = require('axios');
// const { google } = require('googleapis');
// const { GoogleGenAI } = require('@google/genai');
// const { protect } = require('../middleware/auth');
// const Task = require('../models/Task');
// const EmailSummary = require('../models/EmailSummary');
// const User = require('../models/User');

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// //────────────────────────────────────────────
// // GEMINI CHAT
// //────────────────────────────────────────────
// async function geminiChat(messages, systemPrompt = '') {
//   const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
//   let lastError;

//   for (const model of MODELS) {
//     for (let attempt = 1; attempt <= 3; attempt++) {
//       try {
//         const contents = messages
//           .filter(m => m.role !== 'system')
//           .map(m => ({
//             role: m.role === 'assistant' ? 'model' : 'user',
//             parts: [{ text: m.content }]
//           }));

//         const result = await ai.models.generateContent({
//           model,
//           contents,
//           config: { systemInstruction: systemPrompt, temperature: 0.7, maxOutputTokens: 800 }
//         });

//         return result.text || 'No response';
//       } catch (err) {
//         lastError = err;
//         const msg = err.message || '';
//         if (msg.includes('503') || msg.includes('high demand')) {
//           console.log(`Retry ${attempt}`);
//           await new Promise(r => setTimeout(r, 2000 * attempt));
//           continue;
//         }
//         break;
//       }
//     }
//   }
//   throw lastError;
// }

// //────────────────────────────────────────────
// // GMAIL HELPER
// //────────────────────────────────────────────
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
//         return decodeBase64(part.body.data).substring(0, 300);
//     }
//   }
//   return '';
// };

// // Fetch emails from Gmail and summarize with AI
// const fetchAndSummarizeEmails = async (userId, accessToken, refreshToken, count = 10, filterKeywords = null) => {
//   const gmail = getGmailClient(accessToken, refreshToken);

//   // Build query
//   let query = 'in:inbox';
//   if (filterKeywords) {
//     query += ` (${filterKeywords.map(k => `subject:${k} OR body:${k}`).join(' OR ')})`;
//   }

//   const { data } = await gmail.users.messages.list({
//     userId: 'me',
//     maxResults: count,
//     q: query
//   });

//   if (!data.messages?.length) return [];

//   const emails = await Promise.all(
//     data.messages.slice(0, count).map(async (msg) => {
//       // Check cache first
//       const cached = await EmailSummary.findOne({ userId, emailId: msg.id });
//       if (cached) return {
//         subject: cached.subject,
//         sender: cached.sender,
//         summary: cached.summary,
//         priority: cached.priority,
//         actionLabel: cached.actionLabel
//       };

//       // Fetch full email
//       const { data: full } = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
//       const headers = full.payload.headers;
//       const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
//       const sender = headers.find(h => h.name === 'From')?.value || 'Unknown';
//       const body = extractEmailBody(full.payload);

//       // AI summarize
//       try {
//         const raw = await geminiChat([{
//           role: 'user',
//           content: `Analyze this email. Respond ONLY with valid JSON (no markdown):
// {"summary":"one sentence","priority":"high|medium|low","actionRequired":true|false,"actionLabel":"Reply|Review|Schedule|None"}

// From: ${sender}
// Subject: ${subject}
// Body: ${body.substring(0, 400)}`
//         }]);

//         const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
//         // Cache it
//         await EmailSummary.create({ userId, emailId: msg.id, subject, sender, ...parsed }).catch(() => {});
//         return { subject, sender, summary: parsed.summary, priority: parsed.priority, actionLabel: parsed.actionLabel };
//       } catch {
//         return { subject, sender, summary: subject, priority: 'medium', actionLabel: 'None' };
//       }
//     })
//   );

//   return emails;
// };

// //────────────────────────────────────────────
// // AI CHAT
// //────────────────────────────────────────────
// router.post('/chat', protect, async (req, res) => {
//   try {
//     const { messages } = req.body;
//     if (!messages || !messages.length)
//       return res.status(400).json({ error: 'No messages provided' });

//     const systemPrompt = `You are an intelligent AI productivity assistant for IT professionals.
// User: ${req.user.name}

// For tool requests respond ONLY with JSON (no other text):

// Weather:        {"tool":"get_weather","city":"CityName"}
// Tasks:          {"tool":"get_tasks"}
// News:           {"tool":"get_news"}
// Last N emails:  {"tool":"get_emails","count":10}
// Job emails:     {"tool":"get_emails","count":20,"filter":"job"}
// Custom emails:  {"tool":"get_emails","count":10,"filter":"interview"}
// GitHub profile: {"tool":"get_github","username":"user","type":"profile"}
// GitHub commits: {"tool":"get_github","username":"user","type":"commits"}
// GitHub repos:   {"tool":"get_github","username":"user","type":"repos"}
// GitHub PRs:     {"tool":"get_github","username":"user","type":"prs"}
// GitHub all:     {"tool":"get_github","username":"user","type":"all"}
// Draft email:    {"tool":"draft_email","to":"email@example.com","subject":"Subject","context":"what the email is about"}
// Send email:     {"tool":"send_email","to":"email@example.com","subject":"Subject","body":"full email body"}

// Use draft_email when user says:
// - "write an email to X about Y"
// - "compose email to X"
// - "draft a mail to X"
// After drafting, show the email clearly and ask user to confirm sending.

// Use send_email ONLY when user explicitly confirms like:
// - "send it", "looks good send it", "yes send", "ok send"
// AND there is a drafted email in the conversation history.

// Use get_github when user asks about:
// - my github, my repos, my commits, my pull requests, github stats, github activity
// - Default username if not mentioned: ${req.user.githubUsername || 'not configured'}

// Use get_emails when user asks about:
// - last X emails, recent emails, show emails
// - job emails, interview mails, offer letters, hiring mails

// Otherwise respond normally and helpfully.`;

//     let reply = await geminiChat(messages, systemPrompt);

//     // TOOL CALLS — extract JSON from reply even if wrapped in text
//     const extractJSON = (text) => {
//       // Try direct parse first
//       try { return JSON.parse(text.trim()); } catch {}
//       // Try stripping markdown
//       try { return JSON.parse(text.replace(/```json|```/g, '').trim()); } catch {}
//       // Try extracting first {...} block
//       const match = text.match(/\{[\s\S]*?\}/);
//       if (match) { try { return JSON.parse(match[0]); } catch {} }
//       return null;
//     };

//     const tool = extractJSON(reply);

//     if (tool && tool.tool) {
//       let toolResult = '';
//       try {

//       // WEATHER
//       if (tool.tool === 'get_weather') {
//         try {
//           const { data } = await axios.get(
//             `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(tool.city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
//           );
//           toolResult = `${data.name}: ${Math.round(data.main.temp)}°C, ${data.weather[0].description}, Humidity: ${data.main.humidity}%`;
//         } catch { toolResult = 'Weather unavailable'; }
//       }

//       // TASKS
//       else if (tool.tool === 'get_tasks') {
//         const tasks = await Task.find({ userId: req.user._id, completed: false }).sort({ createdAt: -1 });
//         toolResult = tasks.length ? tasks.map(t => `• ${t.title} [${t.priority}]`).join('\n') : 'No pending tasks';
//       }

//       // NEWS
//       else if (tool.tool === 'get_news') {
//         try {
//           const { data } = await axios.get(
//             `https://newsapi.org/v2/top-headlines?category=technology&pageSize=4&apiKey=${process.env.NEWS_API_KEY}`
//           );
//           toolResult = data.articles.map(a => `• ${a.title}`).join('\n');
//         } catch { toolResult = 'News unavailable'; }
//       }

//       // EMAILS (NEW)
//       else if (tool.tool === 'get_emails') {
//         try {
//           const user = await User.findById(req.user._id);
//           if (!user.accessToken) {
//             toolResult = 'Gmail not connected. Please login with Google to access emails.';
//           } else {
//             const count = Math.min(tool.count || 10, 20); // max 20

//             // Build keyword filters
//             let filterKeywords = null;
//             if (tool.filter) {
//               const filterMap = {
//                 job:       ['job', 'career', 'hiring', 'vacancy', 'position', 'recruit', 'offer letter', 'joining'],
//                 interview: ['interview', 'shortlisted', 'schedule', 'round', 'selection'],
//                 offer:     ['offer', 'offer letter', 'joining', 'salary', 'package', 'CTC'],
//                 unread:    null // handled via Gmail query separately
//               };
//               filterKeywords = filterMap[tool.filter] || [tool.filter];
//             }

//             const emails = await fetchAndSummarizeEmails(
//               req.user._id,
//               user.accessToken,
//               user.refreshToken,
//               count,
//               filterKeywords
//             );

//             if (!emails.length) {
//               toolResult = tool.filter
//                 ? `No ${tool.filter}-related emails found in your inbox.`
//                 : 'No emails found.';
//             } else {
//               toolResult = emails.map((e, i) =>
//                 `${i + 1}. From: ${e.sender.replace(/<.*>/, '').trim()}\n   Subject: ${e.subject}\n   Summary: ${e.summary}\n   Priority: ${e.priority} | Action: ${e.actionLabel}`
//               ).join('\n\n');
//             }
//           }
//         } catch (err) {
//           console.error('Email fetch error:', err.message);
//           toolResult = 'Could not fetch emails: ' + err.message;
//         }
//       }

//       // GITHUB
//       else if (tool.tool === 'get_github') {
//         try {
//           const username = tool.username || req.user.githubUsername;
//           if (!username || username === 'not set' || username === 'not configured') {
//             toolResult = 'No GitHub username configured. Please set it in Settings.';
//           } else {
//             const gh = axios.create({
//               baseURL: 'https://api.github.com',
//               headers: {
//                 Authorization: `token ${process.env.GITHUB_TOKEN}`,
//                 Accept: 'application/vnd.github.v3+json'
//               }
//             });

//             const type = tool.type || 'all';

//             if (type === 'profile' || type === 'all') {
//               const { data: u } = await gh.get(`/users/${username}`);
//               toolResult += `👤 GitHub Profile: ${u.name || u.login}\n`;
//               toolResult += `Bio: ${u.bio || 'N/A'}\n`;
//               toolResult += `Public Repos: ${u.public_repos} | Followers: ${u.followers} | Following: ${u.following}\n\n`;
//             }

//             if (type === 'repos' || type === 'all') {
//               const { data: repos } = await gh.get(`/users/${username}/repos?sort=updated&per_page=5`);
//               toolResult += `📦 Top Repos:\n`;
//               toolResult += repos.map(r => `• ${r.name} (${r.language || 'N/A'}) ⭐${r.stargazers_count} — ${r.description || 'No description'}`).join('\n');
//               toolResult += '\n\n';
//             }

//             if (type === 'commits' || type === 'all') {
//               const { data: events } = await gh.get(`/users/${username}/events/public?per_page=10`);
//               const commits = events.filter(e => e.type === 'PushEvent').slice(0, 5);
//               if (commits.length) {
//                 toolResult += `📝 Recent Commits:\n`;
//                 toolResult += commits.map(e => `• [${e.repo.name.split('/')[1]}] ${e.payload.commits?.[0]?.message || 'No message'}`).join('\n');
//                 toolResult += '\n\n';
//               }
//             }

//             if (type === 'prs' || type === 'all') {
//               const { data: events } = await gh.get(`/users/${username}/events/public?per_page=20`);
//               const prs = events.filter(e => e.type === 'PullRequestEvent').slice(0, 3);
//               if (prs.length) {
//                 toolResult += `🔀 Recent Pull Requests:\n`;
//                 toolResult += prs.map(e => `• [${e.payload.action}] ${e.payload.pull_request?.title} in ${e.repo.name}`).join('\n');
//               } else {
//                 toolResult += type === 'prs' ? 'No recent pull requests found.' : '';
//               }
//             }

//             if (!toolResult.trim()) toolResult = `No GitHub data found for ${username}`;
//           }
//         } catch (err) {
//           console.error('GitHub tool error:', err.message);
//           toolResult = 'Could not fetch GitHub data: ' + err.message;
//         }
//       }

//       // DRAFT EMAIL
//       else if (tool.tool === 'draft_email') {
//         try {
//           const draftPrompt = `Write a professional email with these details:
// To: ${tool.to}
// Subject: ${tool.subject || 'No subject provided'}
// Context: ${tool.context}
// Sender name: ${req.user.name}

// Write ONLY the email body (no subject line, no "To:" header). Be professional and concise.`;

//           const emailBody = await geminiChat([{ role: 'user', content: draftPrompt }]);

//           // Return structured draft for frontend to display with Send button
//           return res.json({
//             reply: `Here's your drafted email:

// ---
// **To:** ${tool.to}
// **Subject:** ${tool.subject || 'No subject'}

// ${emailBody}
// ---

// Does this look good? Say **"send it"** to send or ask me to make changes.`,
//             draft: {
//               to: tool.to,
//               subject: tool.subject || 'No subject',
//               body: emailBody
//             }
//           });
//         } catch (err) {
//           toolResult = 'Could not draft email: ' + err.message;
//         }
//       }

//       // SEND EMAIL
//       else if (tool.tool === 'send_email') {
//         try {
//           const user = await User.findById(req.user._id);
//           if (!user.accessToken) {
//             toolResult = 'Gmail not connected. Please login with Google to send emails.';
//           } else {
//             const gmail = getGmailClient(user.accessToken, user.refreshToken);

//             // Extract draft from conversation history if body not in tool
//             let body = tool.body;
//             if (!body) {
//               // Find last draft in messages
//               const lastDraft = [...messages].reverse().find(m =>
//                 m.role === 'assistant' && m.draft
//               );
//               if (lastDraft) body = lastDraft.draft.body;
//             }

//             if (!body) {
//               toolResult = 'No email draft found. Please draft the email first.';
//             } else {
//               const emailLines = [
//                 `To: ${tool.to}`,
//                 `Subject: ${tool.subject || 'No subject'}`,
//                 `From: ${user.email}`,
//                 'Content-Type: text/plain; charset=utf-8',
//                 'MIME-Version: 1.0',
//                 '',
//                 body
//               ];

//               const raw = Buffer.from(emailLines.join('\n'))
//                 .toString('base64')
//                 .replace(/\+/g, '-')
//                 .replace(/\//g, '_')
//                 .replace(/=+$/, '');

//               await gmail.users.messages.send({
//                 userId: 'me',
//                 requestBody: { raw }
//               });

//               toolResult = `✅ Email sent successfully to ${tool.to}!`;
//             }
//           }
//         } catch (err) {
//           console.error('Send email error:', err.message);
//           toolResult = '❌ Failed to send email: ' + err.message;
//         }
//       }

//         // Follow-up with tool result
//         reply = await geminiChat([{
//           role: 'user',
//           content: `User asked for: ${tool.tool}${tool.filter ? ` (filter: ${tool.filter})` : ''}\n\nData:\n${toolResult}\n\nRespond naturally and helpfully. Format nicely.`
//         }], systemPrompt);

//       } catch (toolErr) {
//         console.error('Tool execution error:', toolErr.message);
//         reply = 'Sorry, I encountered an error fetching that data: ' + toolErr.message;
//       }
//     }

//     res.json({ reply });
//   } catch (err) {
//     console.error('AI chat error:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// //────────────────────────────────────────────
// // DAILY BRIEFING
// //────────────────────────────────────────────
// router.get('/briefing', protect, async (req, res) => {
//   try {
//     const [tasks, emails] = await Promise.all([
//       Task.find({ userId: req.user._id, completed: false }),
//       EmailSummary.find({ userId: req.user._id, priority: 'high' }).sort({ createdAt: -1 }).limit(3)
//     ]);

//     const prompt = `Create a professional daily briefing.
// User: ${req.user.name}
// Tasks: ${tasks.map(t => t.title).join(', ') || 'None'}
// High Priority Emails: ${emails.map(e => e.summary).join(', ') || 'None'}
// Keep under 100 words. Be motivating.`;

//     const briefing = await geminiChat([{ role: 'user', content: prompt }]);

//     res.json({
//       briefing,
//       stats: { pendingTasks: tasks.length, highPriorityEmails: emails.length }
//     });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to generate briefing' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { google } = require('googleapis');
const { protect } = require('../middleware/auth');
const Task = require('../models/Task');
const EmailSummary = require('../models/EmailSummary');
const User = require('../models/User');

const NVIDIA_API = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL = 'google/gemma-3n-e4b-it';

//────────────────────────────────────────────
// NVIDIA CHAT
//────────────────────────────────────────────
async function nvidiaChat(messages, systemPrompt = '', maxTokens = 800) {
  const allMessages = [];

  if (systemPrompt) {
    allMessages.push({ role: 'user', content: systemPrompt + '\n\nAcknowledge you understand.' });
    allMessages.push({ role: 'assistant', content: 'Understood. I am ready to assist.' });
  }

  for (const m of messages) {
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    // Skip leading assistant messages
    if (allMessages.length === 0 && role === 'assistant') continue;
    // Merge consecutive same-role
    const last = allMessages[allMessages.length - 1];
    if (last && last.role === role) {
      last.content += '\n' + m.content;
    } else {
      allMessages.push({ role, content: m.content });
    }
  }

  const response = await axios.post(NVIDIA_API, {
    model: NVIDIA_MODEL,
    messages: allMessages,
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
}

//────────────────────────────────────────────
// GMAIL HELPER
//────────────────────────────────────────────
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
        return decodeBase64(part.body.data).substring(0, 300);
    }
  }
  return '';
};

const fetchAndSummarizeEmails = async (userId, accessToken, refreshToken, count = 10, filterKeywords = null) => {
  const gmail = getGmailClient(accessToken, refreshToken);

  let query = 'in:inbox';
  if (filterKeywords) {
    query += ` (${filterKeywords.map(k => `subject:${k}`).join(' OR ')})`;
  }

  const { data } = await gmail.users.messages.list({ userId: 'me', maxResults: count, q: query });
  if (!data.messages?.length) return [];

  const emails = await Promise.all(
    data.messages.slice(0, count).map(async (msg) => {
      const cached = await EmailSummary.findOne({ userId, emailId: msg.id });
      if (cached) return {
        subject: cached.subject, sender: cached.sender,
        summary: cached.summary, priority: cached.priority, actionLabel: cached.actionLabel
      };

      const { data: full } = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
      const headers = full.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
      const sender = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const body = extractEmailBody(full.payload);

      try {
        const raw = await nvidiaChat([{
          role: 'user',
          content: `Analyze this email. Respond ONLY with valid JSON, no explanation, no markdown:
{"summary":"one sentence","priority":"high|medium|low","actionRequired":true,"actionLabel":"Reply|Review|Schedule|None"}

From: ${sender}
Subject: ${subject}
Body: ${body.substring(0, 400)}`
        }], '', 200);

        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
        await EmailSummary.create({ userId, emailId: msg.id, subject, sender, ...parsed }).catch(() => {});
        return { subject, sender, summary: parsed.summary, priority: parsed.priority, actionLabel: parsed.actionLabel };
      } catch {
        return { subject, sender, summary: subject, priority: 'medium', actionLabel: 'None' };
      }
    })
  );
  return emails;
};

//────────────────────────────────────────────
// AI CHAT
//────────────────────────────────────────────
router.post('/chat', protect, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !messages.length)
      return res.status(400).json({ error: 'No messages provided' });

    const systemPrompt = `You are an intelligent AI productivity assistant for IT professionals.
User: ${req.user.name}

IMPORTANT: For tool requests respond ONLY with a single JSON object, nothing else, no explanation:

Weather:        {"tool":"get_weather","city":"CityName"}
Tasks:          {"tool":"get_tasks"}
News:           {"tool":"get_news"}
Last N emails:  {"tool":"get_emails","count":10}
Job emails:     {"tool":"get_emails","count":20,"filter":"job"}
Interview mails:{"tool":"get_emails","count":10,"filter":"interview"}
GitHub profile: {"tool":"get_github","username":"user","type":"profile"}
GitHub commits: {"tool":"get_github","username":"user","type":"commits"}
GitHub repos:   {"tool":"get_github","username":"user","type":"repos"}
GitHub all:     {"tool":"get_github","username":"user","type":"all"}
Draft email:    {"tool":"draft_email","to":"email@example.com","subject":"Subject","context":"what the email is about"}
Send email:     {"tool":"send_email","to":"email@example.com","subject":"Subject","body":"full email body"}

Rules:
- Use get_github for any github/repos/commits/pull requests questions. Default username: ${req.user.githubUsername || 'not configured'}
- Use get_emails for any email listing/filtering questions
- Use draft_email when user wants to write/compose/draft an email
- Use send_email ONLY when user says "send it" or confirms sending
- For everything else respond normally and helpfully`;

    let reply = await nvidiaChat(messages, systemPrompt);

    // Extract JSON tool call from reply
    const extractJSON = (text) => {
      try { return JSON.parse(text.trim()); } catch {}
      try { return JSON.parse(text.replace(/```json|```/g, '').trim()); } catch {}
      const match = text.match(/\{[\s\S]*?"tool"[\s\S]*?\}/);
      if (match) { try { return JSON.parse(match[0]); } catch {} }
      return null;
    };

    const tool = extractJSON(reply);

    if (tool && tool.tool) {
      let toolResult = '';
      try {

        // WEATHER
        if (tool.tool === 'get_weather') {
          try {
            const { data } = await axios.get(
              `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(tool.city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
            );
            toolResult = `${data.name}: ${Math.round(data.main.temp)}°C, ${data.weather[0].description}, Humidity: ${data.main.humidity}%, Wind: ${data.wind.speed} m/s`;
          } catch { toolResult = 'Weather unavailable'; }
        }

        // TASKS
        else if (tool.tool === 'get_tasks') {
          const tasks = await Task.find({ userId: req.user._id, completed: false }).sort({ createdAt: -1 });
          toolResult = tasks.length
            ? `${tasks.length} pending tasks:\n` + tasks.map(t => `• ${t.title} [${t.priority}]`).join('\n')
            : 'No pending tasks. Great job!';
        }

        // NEWS
        else if (tool.tool === 'get_news') {
          try {
            const { data } = await axios.get(
              `https://newsapi.org/v2/top-headlines?category=technology&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
            );
            toolResult = data.articles.slice(0, 5).map(a => `• ${a.title} (${a.source.name})`).join('\n');
          } catch { toolResult = 'News unavailable'; }
        }

        // EMAILS
        else if (tool.tool === 'get_emails') {
          const user = await User.findById(req.user._id);
          if (!user.accessToken) {
            toolResult = 'Gmail not connected. Please login with Google to access emails.';
          } else {
            const count = Math.min(tool.count || 10, 20);
            const filterMap = {
              job:       ['job', 'career', 'hiring', 'vacancy', 'position', 'recruit', 'joining'],
              interview: ['interview', 'shortlisted', 'schedule', 'selection'],
              offer:     ['offer', 'joining', 'salary', 'package', 'CTC']
            };
            const filterKeywords = tool.filter ? (filterMap[tool.filter] || [tool.filter]) : null;
            const emails = await fetchAndSummarizeEmails(req.user._id, user.accessToken, user.refreshToken, count, filterKeywords);

            toolResult = emails.length
              ? emails.map((e, i) => `${i + 1}. From: ${e.sender.replace(/<.*>/, '').trim()}\n   Subject: ${e.subject}\n   Summary: ${e.summary}\n   Priority: ${e.priority} | Action: ${e.actionLabel}`).join('\n\n')
              : tool.filter ? `No ${tool.filter}-related emails found.` : 'No emails found.';
          }
        }

        // GITHUB
        else if (tool.tool === 'get_github') {
          const username = tool.username && tool.username !== 'user' ? tool.username : req.user.githubUsername;
          if (!username || username === 'not configured') {
            toolResult = 'No GitHub username configured. Please set it in Settings.';
          } else {
            const gh = axios.create({
              baseURL: 'https://api.github.com',
              headers: { Authorization: `token ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
            });
            const type = tool.type || 'all';

            if (type === 'profile' || type === 'all') {
              const { data: u } = await gh.get(`/users/${username}`);
              toolResult += `👤 ${u.name || u.login} | Repos: ${u.public_repos} | Followers: ${u.followers}\nBio: ${u.bio || 'N/A'}\n\n`;
            }
            if (type === 'repos' || type === 'all') {
              const { data: repos } = await gh.get(`/users/${username}/repos?sort=updated&per_page=5`);
              toolResult += `📦 Top Repos:\n` + repos.map(r => `• ${r.name} (${r.language || 'N/A'}) ⭐${r.stargazers_count}`).join('\n') + '\n\n';
            }
            if (type === 'commits' || type === 'all') {
              const { data: events } = await gh.get(`/users/${username}/events/public?per_page=15`);
              const commits = events.filter(e => e.type === 'PushEvent').slice(0, 5);
              if (commits.length)
                toolResult += `📝 Recent Commits:\n` + commits.map(e => `• [${e.repo.name.split('/')[1]}] ${e.payload.commits?.[0]?.message || 'No message'}`).join('\n') + '\n\n';
            }
            if (type === 'prs' || type === 'all') {
              const { data: events } = await gh.get(`/users/${username}/events/public?per_page=20`);
              const prs = events.filter(e => e.type === 'PullRequestEvent').slice(0, 3);
              if (prs.length)
                toolResult += `🔀 Pull Requests:\n` + prs.map(e => `• [${e.payload.action}] ${e.payload.pull_request?.title}`).join('\n');
            }
            if (!toolResult.trim()) toolResult = `No GitHub data found for ${username}`;
          }
        }

        // DRAFT EMAIL
        else if (tool.tool === 'draft_email') {
          const emailBody = await nvidiaChat([{
            role: 'user',
            content: `Write a professional email body only (no subject line, no To: header).
To: ${tool.to}
Subject: ${tool.subject || 'No subject'}
Context: ${tool.context}
Sender: ${req.user.name}
Be professional, concise, and friendly.`
          }], '', 500);

          return res.json({
            reply: `Here's your drafted email:\n\n---\n**To:** ${tool.to}\n**Subject:** ${tool.subject || 'No subject'}\n\n${emailBody}\n---\n\nDoes this look good? Click **Send Email** to send or ask me to make changes.`,
            draft: { to: tool.to, subject: tool.subject || 'No subject', body: emailBody }
          });
        }

        // SEND EMAIL
        else if (tool.tool === 'send_email') {
          const user = await User.findById(req.user._id);
          if (!user.accessToken) {
            toolResult = 'Gmail not connected. Please login with Google.';
          } else {
            const gmail = getGmailClient(user.accessToken, user.refreshToken);
            const emailLines = [
              `To: ${tool.to}`,
              `Subject: ${tool.subject || 'No subject'}`,
              `From: ${user.email}`,
              'Content-Type: text/plain; charset=utf-8',
              'MIME-Version: 1.0',
              '',
              tool.body
            ];
            const raw = Buffer.from(emailLines.join('\n'))
              .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
            toolResult = `✅ Email sent successfully to ${tool.to}!`;
          }
        }

        // Follow-up response
        reply = await nvidiaChat([{
          role: 'user',
          content: `Tool: ${tool.tool}\nData:\n${toolResult}\n\nRespond naturally and helpfully based on this data. Format nicely.`
        }], systemPrompt, 600);

      } catch (toolErr) {
        console.error('Tool error:', toolErr.message);
        reply = 'Sorry, I encountered an error: ' + toolErr.message;
      }
    }

    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || err.message });
  }
});

//────────────────────────────────────────────
// DAILY BRIEFING
//────────────────────────────────────────────
router.get('/briefing', protect, async (req, res) => {
  try {
    const [tasks, emails, weatherData] = await Promise.all([
      Task.find({ userId: req.user._id, completed: false }),
      EmailSummary.find({ userId: req.user._id, priority: 'high' }).sort({ createdAt: -1 }).limit(3),
      axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(req.user.city || 'Hyderabad')}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`).catch(() => null)
    ]);

    const weather = weatherData
      ? `${Math.round(weatherData.data.main.temp)}°C, ${weatherData.data.weather[0].description} in ${weatherData.data.name}`
      : 'Unavailable';

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    const prompt = `Create a professional daily briefing for ${req.user.name}.
Weather: ${weather}
Pending Tasks (${tasks.length}): ${tasks.map(t => t.title).join(', ') || 'None'}
High Priority Emails (${emails.length}): ${emails.map(e => e.summary).join(', ') || 'None'}

Start with "${greeting}, ${req.user.name}." Be motivating and concise. Under 100 words.`;

    const briefing = await nvidiaChat([{ role: 'user', content: prompt }], '', 300);

    res.json({
      briefing,
      stats: { pendingTasks: tasks.length, highPriorityEmails: emails.length, weather }
    });
  } catch (err) {
    console.error('Briefing error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate briefing' });
  }
});

module.exports = router;