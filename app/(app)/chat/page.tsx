'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import styles from './chat.module.css';

interface Chat {
  id: string;
  type: 'class' | 'group' | 'dm';
  name?: string;
  courseName?: string;
  block?: string;
  semester?: number;
  participants?: string[];
  lastMessage?: string;
  lastMessageAt?: { toDate: () => Date } | null;
  teacher?: string;
  teacherEmail?: string;
}

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}

export default function ChatPage() {
  const { user, profile } = useAuth();
  const [classChats, setClassChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Load class chats the student is a member of
      const chatSnap = await getDocs(query(collection(db, 'chats'), where('type', '==', 'class')));
      
      const membershipPromises = chatSnap.docs.map(async (chatDoc) => {
        const memberRef = doc(db, 'chats', chatDoc.id, 'members', user.uid);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          return { id: chatDoc.id, ...chatDoc.data() } as Chat;
        }
        return null;
      });

      const membershipResults = await Promise.all(membershipPromises);
      const myClassChats = membershipResults.filter((c): c is Chat => c !== null);
      // Sort by semester then block
      myClassChats.sort((a, b) => (a.semester || 1) - (b.semester || 1) || (a.block || '').localeCompare(b.block || ''));
      setClassChats(myClassChats);

      setLoading(false);
    };

    load();
  }, [user]);

  const handleHideClassChat = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (!confirm('Are you sure you want to leave this class chat?')) return;
    await deleteDoc(doc(db, 'chats', chatId, 'members', user.uid));
    setClassChats(classChats.filter(c => c.id !== chatId));
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.sidebarTitle}>Messages</h1>
        </div>

        {/* Class Chats */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Class Chats
          </div>
          {classChats.length === 0 ? (
            <div className={styles.emptySection}>
              Save your schedule to join class chats
            </div>
          ) : (
            classChats.map((chat) => (
              <Link key={chat.id} href={`/chat-room?id=${chat.id}`} className={styles.chatItem}>
                <div className={styles.chatItemInner}>
                  <div className={styles.chatAvatar} style={{ background: 'var(--green-600)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div className={styles.chatInfo}>
                    <span className={styles.chatName}>{chat.courseName}</span>
                    <div className={styles.chatSub} style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <span className="badge badge-green" style={{ fontSize: 9 }}>S{chat.semester}</span>
                      <span>{chat.block} Block</span>
                      {chat.teacher && (
                        <span className="badge badge-blue" style={{ fontSize: 9, background: 'var(--green-800)', borderColor: 'var(--green-600)' }}>
                          {chat.teacher}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.chatActions}>
                  <button className={styles.hideBtn} onClick={(e) => handleHideClassChat(e, chat.id)} title="Leave Class Chat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </Link>
            ))
          )}
        </div>

      </div>

      {/* Main area — empty state */}
      <div className={styles.main}>
        <div className={styles.welcomeWrap}>
          <div className={styles.welcomeIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2>Select a conversation</h2>
          <p>Choose a class chat from the sidebar to view messages.</p>
        </div>
      </div>
    </div>
  );
}
