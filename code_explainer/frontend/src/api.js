// Simple fetch-wrapper for the Code Explainer backend API
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Register a user (returns created or existing user)
 * @param {{name?:string,email:string}} body
 */
export async function register(body) {
  const res = await fetch(`${BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * Login by email (returns user)
 * @param {{email:string}} body
 */
export async function login(body) {
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * List chats for authenticated user
 * @param {string} token - Authorization token (Bearer)
 */
export async function listChats(token) {
  const res = await fetch(`${BASE}/api/chats`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}

/**
 * Get messages for a chat
 * @param {string} chatId
 * @param {string} token
 */
export async function getMessages(chatId, token) {
  const res = await fetch(`${BASE}/api/chats/${encodeURIComponent(chatId)}/messages`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}

/**
 * Call explain endpoint and return the Response so caller can stream it.
 * @param {{code:string,language:string,chatId?:string,userId?:string,token?:string,model?:string}} opts
 * @returns {Promise<Response>}
 */
export async function explainCode({ code, language, chatId, userId, token, model, provider }) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const body = { code, language };
  if (chatId) body.chatId = chatId;
  if (userId) body.userId = userId;
  if (model) body.model = model;
  if (provider) body.provider = provider;
  const res = await fetch(`${BASE}/api/explain-code`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return res;
}

export default { register, login, listChats, getMessages, explainCode };
