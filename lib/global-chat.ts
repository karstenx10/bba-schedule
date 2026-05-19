import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const GLOBAL_CHAT_ID = 'school_global';

export interface ChatUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface CommandResult {
  handled: boolean;
  error?: string;
  systemMessage?: string;
}

export const ADMIN_COMMAND_HELP = `Admin commands:
  /help — Show this list
  /ban <email> — Permanently ban a user
  /unban <email> — Remove a ban
  /timeout <email> [hours] — Suspend user (default 24h)
  /kick <email> — Force sign-out
  /warn <email> <reason> — Post a public warning
  /announce <message> — Broadcast to the whole chat
  /clear — Delete all visible messages (use carefully)`;

export const STUDENT_COMMAND_HELP = `Commands:
  /help — Show chat tips

Be respectful. Messages are visible to the whole school.`;

export function findUserByTarget(users: ChatUser[], target: string): ChatUser | null {
  const q = target.trim().toLowerCase();
  if (!q) return null;

  const byEmail = users.find((u) => u.email?.toLowerCase() === q);
  if (byEmail) return byEmail;

  const emailPartial = users.find((u) => u.email?.toLowerCase().includes(q));
  if (emailPartial) return emailPartial;

  const byName = users.find((u) => u.displayName?.toLowerCase() === q);
  if (byName) return byName;

  const namePartial = users.find((u) => u.displayName?.toLowerCase().includes(q));
  return namePartial ?? null;
}

async function postSystemMessage(text: string, adminName: string) {
  await addDoc(collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'), {
    uid: 'system',
    displayName: 'Moderation',
    photoURL: '',
    text,
    isSystem: true,
    moderatorName: adminName,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'chats', GLOBAL_CHAT_ID), {
    lastMessageText: text,
    lastMessageSenderName: 'Moderation',
    lastMessageSenderUid: 'system',
    lastMessageAt: serverTimestamp(),
  });
}

export async function ensureGlobalChatExists() {
  const ref = doc(db, 'chats', GLOBAL_CHAT_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      type: 'global',
      name: 'School Chat',
      createdAt: serverTimestamp(),
    });
  }
}

export async function executeAdminCommand(
  raw: string,
  users: ChatUser[],
  adminName: string,
  isAdmin: boolean
): Promise<CommandResult> {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return { handled: false };

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();

  if (cmd === '/help') {
    return {
      handled: true,
      systemMessage: isAdmin ? ADMIN_COMMAND_HELP : STUDENT_COMMAND_HELP,
    };
  }

  if (!isAdmin) {
    return { handled: true, error: 'You do not have permission to use that command.' };
  }

  const target = parts[1];

  switch (cmd) {
    case '/ban': {
      if (!target) return { handled: true, error: 'Usage: /ban <email>' };
      const u = findUserByTarget(users, target);
      if (!u) return { handled: true, error: `No user found for "${target}".` };
      await updateDoc(doc(db, 'users', u.uid), { isBanned: true });
      const msg = `${u.displayName} was banned by ${adminName}.`;
      await postSystemMessage(msg, adminName);
      return { handled: true, systemMessage: msg };
    }
    case '/unban': {
      if (!target) return { handled: true, error: 'Usage: /unban <email>' };
      const u = findUserByTarget(users, target);
      if (!u) return { handled: true, error: `No user found for "${target}".` };
      await updateDoc(doc(db, 'users', u.uid), { isBanned: false, timeoutUntil: null });
      const msg = `${u.displayName} was unbanned by ${adminName}.`;
      await postSystemMessage(msg, adminName);
      return { handled: true, systemMessage: msg };
    }
    case '/timeout': {
      if (!target) return { handled: true, error: 'Usage: /timeout <email> [hours]' };
      const u = findUserByTarget(users, target);
      if (!u) return { handled: true, error: `No user found for "${target}".` };
      const hours = Math.min(Math.max(parseInt(parts[2] ?? '24', 10) || 24, 1), 168);
      const until = new Date();
      until.setHours(until.getHours() + hours);
      await updateDoc(doc(db, 'users', u.uid), { timeoutUntil: Timestamp.fromDate(until) });
      const msg = `${u.displayName} was timed out for ${hours}h by ${adminName}.`;
      await postSystemMessage(msg, adminName);
      return { handled: true, systemMessage: msg };
    }
    case '/kick': {
      if (!target) return { handled: true, error: 'Usage: /kick <email>' };
      const u = findUserByTarget(users, target);
      if (!u) return { handled: true, error: `No user found for "${target}".` };
      await updateDoc(doc(db, 'users', u.uid), { forceLogout: true });
      const msg = `${u.displayName} was kicked by ${adminName}.`;
      await postSystemMessage(msg, adminName);
      return { handled: true, systemMessage: msg };
    }
    case '/warn': {
      if (!target || parts.length < 3) {
        return { handled: true, error: 'Usage: /warn <email> <reason>' };
      }
      const u = findUserByTarget(users, target);
      if (!u) return { handled: true, error: `No user found for "${target}".` };
      const reason = parts.slice(2).join(' ');
      const msg = `Warning for ${u.displayName}: ${reason} — ${adminName}`;
      await postSystemMessage(msg, adminName);
      return { handled: true, systemMessage: msg };
    }
    case '/announce': {
      const text = parts.slice(1).join(' ');
      if (!text) return { handled: true, error: 'Usage: /announce <message>' };
      const msg = `📢 Announcement from ${adminName}: ${text}`;
      await postSystemMessage(msg, adminName);
      return { handled: true, systemMessage: msg };
    }
    case '/clear': {
      if (typeof window !== 'undefined' && !window.confirm('Delete all visible messages in school chat?')) {
        return { handled: true, error: 'Clear cancelled.' };
      }
      const q = query(
        collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(200)
      );
      const snap = await getDocs(q);
      if (snap.empty) return { handled: true, systemMessage: 'Chat is already empty.' };
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      const msg = `Chat was cleared by ${adminName}.`;
      await postSystemMessage(msg, adminName);
      return { handled: true, systemMessage: msg };
    }
    default:
      return { handled: true, error: `Unknown command "${cmd}". Type /help for a list.` };
  }
}
