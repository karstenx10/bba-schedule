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
  const [dmChats, setDmChats] = useState<Chat[]>([]);
  const [dmPartners, setDmPartners] = useState<Record<string, UserProfile>>({});
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [showNewDM, setShowNewDM] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Load class chats the student is a member of
      const chatSnap = await getDocs(query(collection(db, 'chats'), where('type', '==', 'class')));
      
      const myClassChats: Chat[] = [];
      for (const chatDoc of chatSnap.docs) {
        const memberRef = doc(db, 'chats', chatDoc.id, 'members', user.uid);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          myClassChats.push({ id: chatDoc.id, ...chatDoc.data() } as Chat);
        }
      }
      // Sort by semester then block
      myClassChats.sort((a, b) => (a.semester || 1) - (b.semester || 1) || (a.block || '').localeCompare(b.block || ''));
      setClassChats(myClassChats);

      // Load DM chats
      const dmSnap = await getDocs(
        query(collection(db, 'chats'), where('type', '==', 'dm'), where('participants', 'array-contains', user.uid))
      );
      const dmList = dmSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Chat & { hiddenBy?: string[] }))
        .filter((dm) => !(dm.hiddenBy || []).includes(user.uid));
      setDmChats(dmList);

      // Fetch DM partner profiles
      const partners: Record<string, UserProfile> = {};
      for (const dm of dmList) {
        const otherUid = dm.participants?.find((p) => p !== user.uid);
        if (otherUid && !partners[otherUid]) {
          const pSnap = await getDoc(doc(db, 'users', otherUid));
          if (pSnap.exists()) partners[otherUid] = pSnap.data() as UserProfile;
        }
      }
      setDmPartners(partners);

      setLoading(false);
    };

    load();
  }, [user]);

  // Load all users for DM search
  useEffect(() => {
    if (!showNewDM) return;
    getDocs(collection(db, 'users')).then((snap) => {
      setAllUsers(snap.docs.map((d) => d.data() as UserProfile).filter((u) => u.uid !== user?.uid));
    });
  }, [showNewDM, user]);

  const startDM = async (otherUid: string) => {
    if (!user) return;
    // Check if DM already exists
    const existing = dmChats.find(
      (dm) => dm.participants?.includes(otherUid) && dm.participants?.includes(user.uid)
    );
    if (existing) {
      window.location.href = `/chat/${existing.id}`;
      return;
    }
    // Create new DM
    const ref = await addDoc(collection(db, 'chats'), {
      type: 'dm',
      participants: [user.uid, otherUid],
      createdAt: serverTimestamp(),
    });
    window.location.href = `/chat-room?id=${ref.id}`;
  };

  const handleHideClassChat = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (!confirm('Are you sure you want to leave this class chat?')) return;
    await deleteDoc(doc(db, 'chats', chatId, 'members', user.uid));
    setClassChats(classChats.filter(c => c.id !== chatId));
  };

  const handleHideDM = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    await updateDoc(doc(db, 'chats', chatId), {
      hiddenBy: arrayUnion(user.uid)
    });
    setDmChats(dmChats.filter(c => c.id !== chatId));
  };

  const filteredUsers = allUsers.filter((u) =>
    u.displayName?.toLowerCase().includes(dmSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(dmSearch.toLowerCase())
  );

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
          <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => setShowNewDM(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New DM
          </button>
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
                    <div className={styles.chatSub}>
                      <span className="badge badge-green" style={{ fontSize: 9 }}>S{chat.semester}</span>
                      <span>{chat.block} Block</span>
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

        <div className={styles.divider} />

        {/* DMs */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Direct Messages
          </div>
          {dmChats.length === 0 ? (
            <div className={styles.emptySection}>No DMs yet — start one!</div>
          ) : (
            dmChats.map((dm) => {
              const otherUid = dm.participants?.find((p) => p !== user?.uid) ?? '';
              const partner = dmPartners[otherUid];
              return (
                <Link key={dm.id} href={`/chat-room?id=${dm.id}`} className={styles.chatItem}>
                  <div className={styles.chatItemInner}>
                    {partner?.photoURL ? (
                      <Image src={partner.photoURL} alt={partner.displayName} width={36} height={36} className={styles.chatAvatarImg} referrerPolicy="no-referrer" />
                    ) : (
                      <div className={styles.chatAvatar} style={{ background: 'var(--green-700)' }}>
                        {partner?.displayName?.[0] ?? '?'}
                      </div>
                    )}
                    <div className={styles.chatInfo}>
                      <span className={styles.chatName}>{partner?.displayName ?? 'Student'}</span>
                      <span className={styles.chatSub}>Direct Message</span>
                    </div>
                  </div>
                  <div className={styles.chatActions}>
                    <button className={styles.hideBtn} onClick={(e) => handleHideDM(e, dm.id)} title="Hide DM">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </Link>
              );
            })
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
          <p>Choose a class chat or DM from the sidebar, or start a new DM.</p>
        </div>
      </div>

      {/* New DM modal */}
      {showNewDM && (
        <div className={styles.modalOverlay} onClick={() => setShowNewDM(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>New Direct Message</h2>
              <button className={styles.modalClose} onClick={() => setShowNewDM(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className={styles.modalSearchWrap}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                autoFocus
                className={styles.modalSearch}
                placeholder="Search students…"
                value={dmSearch}
                onChange={(e) => setDmSearch(e.target.value)}
              />
            </div>
            <div className={styles.userList}>
              {filteredUsers.slice(0, 20).map((u) => (
                <button key={u.uid} className={styles.userItem} onClick={() => startDM(u.uid)}>
                  {u.photoURL ? (
                    <Image src={u.photoURL} alt={u.displayName} width={36} height={36} className={styles.chatAvatarImg} referrerPolicy="no-referrer" />
                  ) : (
                    <div className={styles.chatAvatar}>{u.displayName?.[0] ?? '?'}</div>
                  )}
                  <div className={styles.chatInfo}>
                    <span className={styles.chatName}>{u.displayName}</span>
                    <span className={styles.chatSub}>{u.email}</span>
                  </div>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className={styles.emptySection} style={{ padding: '24px' }}>No students found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
