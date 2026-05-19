'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import styles from './school-chat.module.css';
import {
  GLOBAL_CHAT_ID,
  ensureGlobalChatExists,
  executeAdminCommand,
  ADMIN_COMMAND_HELP,
  STUDENT_COMMAND_HELP,
  type ChatUser,
} from '@/lib/global-chat';

interface Message {
  id: string;
  uid: string;
  displayName: string;
  photoURL: string;
  text: string;
  isSystem?: boolean;
  createdAt: { toDate: () => Date } | null;
}

export default function SchoolChatPage() {
  const { user, profile, isAdmin } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) return;
    ensureGlobalChatExists().finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    getDocs(collection(db, 'users')).then((snap) => {
      setAllUsers(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: data.uid ?? d.id,
            email: data.email ?? '',
            displayName: data.displayName ?? '',
            photoURL: data.photoURL,
          };
        })
      );
    });
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(300)
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendNormalMessage = useCallback(
    async (text: string) => {
      if (!user || !profile) return;
      await addDoc(collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'), {
        uid: user.uid,
        displayName: profile.displayName,
        photoURL: profile.photoURL ?? '',
        text,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chats', GLOBAL_CHAT_ID), {
        lastMessageText: text,
        lastMessageSenderName: profile.displayName,
        lastMessageSenderUid: user.uid,
        lastMessageAt: serverTimestamp(),
      });
    },
    [user, profile]
  );

  const sendMessage = async () => {
    if (!input.trim() || !user || !profile || sending) return;
    setSending(true);
    setCommandError(null);
    const text = input.trim();
    setInput('');

    try {
      if (text.startsWith('/')) {
        if (text.toLowerCase() === '/help') {
          setShowHelp(true);
          setSending(false);
          inputRef.current?.focus();
          return;
        }

        const result = await executeAdminCommand(
          text,
          allUsers,
          profile.displayName,
          isAdmin
        );

        if (result.error) {
          setCommandError(result.error);
        }

        setSending(false);
        inputRef.current?.focus();
        return;
      }

      await sendNormalMessage(text);
    } catch (err) {
      console.error(err);
      setInput(text);
      setCommandError('Failed to send message. Try again.');
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const groupedMessages = messages.reduce<
    Array<{ msgs: Message[]; isMine: boolean; isSystem: boolean }>
  >((acc, msg) => {
    if (msg.isSystem) {
      acc.push({ msgs: [msg], isMine: false, isSystem: true });
      return acc;
    }
    const prev = acc[acc.length - 1];
    if (prev && !prev.isSystem && prev.msgs[0]?.uid === msg.uid) {
      prev.msgs.push(msg);
    } else {
      acc.push({ msgs: [msg], isMine: msg.uid === user?.uid, isSystem: false });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <LoadingSpinner />
    );
  }

  return (
    <div className={styles.room}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>School Chat</div>
          <div className={styles.headerSub}>Everyone at BBA · Type /help for commands</div>
        </div>
        <button
          type="button"
          className={`btn btn-ghost ${styles.helpToggle}`}
          onClick={() => setShowHelp((v) => !v)}
        >
          {showHelp ? 'Hide' : 'Help'}
        </button>
      </div>

      {showHelp && (
        <div className={styles.helpPanel}>
          {isAdmin ? ADMIN_COMMAND_HELP : STUDENT_COMMAND_HELP}
        </div>
      )}

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>No messages yet — say hi to the whole school!</p>
          </div>
        )}

        {groupedMessages.map((group, gi) =>
          group.isSystem ? (
            <div key={gi} className={styles.systemWrap}>
              <div className={styles.bubbleSystem}>
                {group.msgs[0].text}
                <span className={styles.msgTime}>
                  {group.msgs[0].createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? ''}
                </span>
              </div>
            </div>
          ) : (
            <div key={gi} className={`${styles.group} ${group.isMine ? styles.groupMine : ''}`}>
              {!group.isMine && (
                <div className={styles.groupSender}>
                  {group.msgs[0].photoURL ? (
                    <Image
                      src={group.msgs[0].photoURL}
                      alt={group.msgs[0].displayName}
                      width={32}
                      height={32}
                      className={styles.msgAvatar}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={styles.msgAvatarFallback}>{group.msgs[0].displayName?.[0]}</div>
                  )}
                </div>
              )}
              <div className={styles.groupBubbles}>
                {!group.isMine && <div className={styles.senderName}>{group.msgs[0].displayName}</div>}
                {group.msgs.map((msg) => (
                  <div
                    key={msg.id}
                    className={`${styles.bubble} ${group.isMine ? styles.bubbleMine : styles.bubbleOther}`}
                  >
                    {msg.text}
                    <span className={styles.msgTime}>
                      {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {commandError && <div className={styles.commandError}>{commandError}</div>}
      {isAdmin && (
        <p className={styles.commandHint}>Admin: /ban /unban /timeout /kick /warn /announce /clear</p>
      )}
      <div className={styles.inputArea}>
        <textarea
          ref={inputRef}
          className={styles.input}
          placeholder="Message the whole school… (type /help)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ resize: 'none' }}
        />
        <button
          type="button"
          className={styles.sendBtn}
          onClick={sendMessage}
          disabled={!input.trim() || sending}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className={styles.loadingWrap}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );
}
