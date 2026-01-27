import { query } from './index.js';
import { v4 as uuidv4 } from 'uuid';

export async function createUser({ name, email }) {
  const id = uuidv4();
  await query('INSERT INTO users(id, name, email) VALUES($1,$2,$3)', [id, name || null, email || null]);
  return { id, name, email };
}

export async function createChat(userId, { title }) {
  const id = uuidv4();
  await query('INSERT INTO chats(id, user_id, title) VALUES($1,$2,$3)', [id, userId, title || null]);
  return { id, userId, title };
}

export async function createMessage(chatId, { role, content }) {
  const id = uuidv4();
  await query('INSERT INTO messages(id, chat_id, role, content) VALUES($1,$2,$3,$4)', [id, chatId, role, content || null]);
  return { id, chatId, role, content };
}

export async function createCodeSnippet(messageId, { code, language }) {
  const id = uuidv4();
  await query('INSERT INTO code_snippets(id, message_id, code, language) VALUES($1,$2,$3,$4)', [id, messageId, code, language || null]);
  return { id, messageId, code, language };
}

export async function addMessageWithOptionalCode(chatId, { role, content, code, language }) {
  const message = await createMessage(chatId, { role, content });
  if (code) {
    const snippet = await createCodeSnippet(message.id, { code, language });
    return { message, codeSnippet: snippet };
  }
  return { message };
}

export async function getUserChats(userId) {
  const res = await query('SELECT * FROM chats WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
  return res.rows;
}

export async function getChatMessages(chatId) {
  const res = await query('SELECT m.*, cs.id as code_id, cs.code, cs.language FROM messages m LEFT JOIN code_snippets cs ON cs.message_id = m.id WHERE chat_id=$1 ORDER BY m.created_at ASC', [chatId]);
  return res.rows;
}
