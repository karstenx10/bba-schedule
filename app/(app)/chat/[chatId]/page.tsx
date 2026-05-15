'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  doc, getDoc, collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import styles from './chatroom.module.css';

interface Message {
  id: string;
  uid: string;
  displayName: string;
  photoURL: string;
  text: string;
  createdAt: { toDate: () => Date } | null;
}

interface ChatInfo {
  type: 'class' | 'dm' | 'group';
  courseName?: string;
  block?: string;
  participants?: string[];
  name?: string;
}

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
}

export default function ChatRoomPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dmPartner, setDmPartner] = useState<UserProfile | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat info
  useEffect(() => {
    if (!chatId || !user) return;
    getDoc(doc(db, 'chats', chatId)).then(async (snap) => {
      if (!snap.exists()) { router.replace('/chat'); return; }
      const info = snap.data() as ChatInfo;
      setChatInfo(info);

      if (info.type === 'dm') {
        const otherUid = info.participants?.find((p) => p !== user.uid);
        if (otherUid) {
          const pSnap = await getDoc(doc(db, 'users', otherUid));
          if (pSnap.exists()) setDmPartner(pSnap.data() as UserProfile);
        }
      }
      setLoading(false);
    });
  }, [chatId, user, router]);

  // Real-time messages listener
  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(200)
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
    });
    return () => unsub();
  }, [chatId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !profile || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        uid: user.uid,
        displayName: profile.displayName,
        photoURL: profile.photoURL ?? '',
        text,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      setInput(text);
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

  const chatName = chatInfo?.type === 'dm'
    ? dmPartner?.displayName ?? 'Direct Message'
    : chatInfo?.type === 'class'
    ? `${chatInfo.courseName} — ${chatInfo.block} Block`
    : chatInfo?.name ?? 'Chat';

  // Group messages by sender for compact display
  const groupedMessages = messages.reduce<Array<{ msgs: Message[]; isMine: boolean }>>((acc, msg) => {
    const prev = acc[acc.length - 1];
    if (prev && prev.msgs[0]?.uid === msg.uid) {
      prev.msgs.push(msg);
    } else {
      acc.push({ msgs: [msg], isMine: msg.uid === user?.uid });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  return (
    <div className={styles.room}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/chat" className={styles.backBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div className={styles.headerInfo}>
          {chatInfo?.type === 'dm' && dmPartner?.photoURL ? (
            <Image src={dmPartner.photoURL} alt={dmPartner.displayName} width={36} height={36} className={styles.headerAvatar} referrerPolicy="no-referrer" />
          ) : (
            <div className={styles.headerAvatarDefault}>
              {chatInfo?.type === 'class' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              ) : (
                dmPartner?.displayName?.[0] ?? '?'
              )}
            </div>
          )}
          <div>
            <div className={styles.headerName}>{chatName}</div>
            {chatInfo?.type === 'class' && (
              <div className={styles.headerSub}>Class Chat</div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>No messages yet — say hi! 👋</p>
          </div>
        )}

        {groupedMessages.map((group, gi) => (
          <div key={gi} className={`${styles.group} ${group.isMine ? styles.groupMine : ''}`}>
            {!group.isMine && (
              <div className={styles.groupSender}>
                {group.msgs[0].photoURL ? (
                  <Image src={group.msgs[0].photoURL} alt={group.msgs[0].displayName} width={32} height={32} className={styles.msgAvatar} referrerPolicy="no-referrer" />
                ) : (
                  <div className={styles.msgAvatarFallback}>{group.msgs[0].displayName?.[0]}</div>
                )}
              </div>
            )}
            <div className={styles.groupBubbles}>
              {!group.isMine && (
                <div className={styles.senderName}>{group.msgs[0].displayName}</div>
              )}
              {group.msgs.map((msg) => (
                <div key={msg.id} className={`${styles.bubble} ${group.isMine ? styles.bubbleMine : styles.bubbleOther}`}>
                  {msg.text}
                  <span className={styles.msgTime}>
                    {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <textarea
          ref={inputRef}
          className={styles.input}
          placeholder={`Message ${chatInfo?.type === 'dm' ? dmPartner?.displayName ?? 'student' : chatName}…`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ resize: 'none' }}
        />
        <button
          className={styles.sendBtn}
          onClick={sendMessage}
          disabled={!input.trim() || sending}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
