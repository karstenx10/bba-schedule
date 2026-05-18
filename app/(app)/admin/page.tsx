'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, serverTimestamp, setDoc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from './admin.module.css';
import Link from 'next/link';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  grade: string;
  isBanned?: boolean;
  timeoutUntil?: { toDate: () => Date } | null;
  forceLogout?: boolean;
}

interface Chat {
  id: string;
  courseName: string;
  block: string;
  semester: number;
}

interface DmChat {
  id: string;
  participants: string[];
  lastMessageText?: string;
  lastMessageSenderName?: string;
  lastMessageSenderUid?: string;
  lastMessageAt?: { toDate: () => Date } | null;
}

interface Feedback {
  id: string;
  uid: string;
  displayName: string;
  text: string;
  status: 'pending' | 'corrected' | 'flagged';
  createdAt: any;
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'users' | 'chats' | 'announcements' | 'feedback'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [dmChats, setDmChats] = useState<DmChat[]>([]);
  const [chatSubTab, setChatSubTab] = useState<'class' | 'dm'>('class');
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatSearch, setChatSearch] = useState('');

  // Announcement State
  const [annTarget, setAnnTarget] = useState('all'); // 'all', '9', '10', '11', '12', or specific uid
  const [annMessage, setAnnMessage] = useState('');
  const [annSending, setAnnSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/schedule');
    }
  }, [authLoading, isAdmin, router]);

  const loadData = async () => {
    setLoading(true);
    const uSnap = await getDocs(collection(db, 'users'));
    setUsers(uSnap.docs.map(d => d.data() as UserProfile));

    const cSnap = await getDocs(query(collection(db, 'chats'), where('type', '==', 'class')));
    setChats(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Chat)));

    const dmSnap = await getDocs(query(collection(db, 'chats'), where('type', '==', 'dm')));
    setDmChats(dmSnap.docs.map(d => ({ id: d.id, ...d.data() } as DmChat)));

    const fSnap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
    setFeedbackList(fSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback)));
    
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const updateUser = async (uid: string, data: Partial<UserProfile>) => {
    await updateDoc(doc(db, 'users', uid), data);
    setUsers(users.map(u => u.uid === uid ? { ...u, ...data } : u));
  };

  const handleKick = (uid: string) => updateUser(uid, { forceLogout: true });
  const handleBan = (uid: string) => updateUser(uid, { isBanned: true });
  const handleUnban = (uid: string) => updateUser(uid, { isBanned: false, timeoutUntil: null });
  const handleTimeout = (uid: string) => {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    updateUser(uid, { timeoutUntil: tomorrow as any });
  };
  const handleUpdateGrade = (uid: string, grade: string) => updateUser(uid, { grade });

  const handleFeedbackStatus = async (id: string, status: 'pending' | 'corrected' | 'flagged') => {
    await updateDoc(doc(db, 'feedback', id), { status });
    setFeedbackList(feedbackList.map(f => f.id === id ? { ...f, status } : f));
  };

  const sendAnnouncement = async () => {
    if (!annMessage.trim() || annSending) return;
    setAnnSending(true);

    try {
      await addDoc(collection(db, 'announcements'), {
        text: annMessage.trim(),
        target: annTarget,
        createdAt: serverTimestamp()
      });

      setAnnMessage('');
      alert('Announcement sent globally!');
    } catch (err) {
      console.error(err);
      alert('Failed to send announcement');
    }
    setAnnSending(false);
  };

  if (authLoading || !isAdmin || loading) {
    return <div className="spinner" style={{ margin: '100px auto' }} />;
  }

  return (
    <div className={`${styles.page} fade-in`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Panel</h1>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`} onClick={() => setActiveTab('users')}>Users</button>
        <button className={`${styles.tab} ${activeTab === 'chats' ? styles.active : ''}`} onClick={() => { setActiveTab('chats'); setChatSearch(''); }}>Chats</button>
        <button className={`${styles.tab} ${activeTab === 'announcements' ? styles.active : ''}`} onClick={() => setActiveTab('announcements')}>Announcements</button>
        <button className={`${styles.tab} ${activeTab === 'feedback' ? styles.active : ''}`} onClick={() => setActiveTab('feedback')}>User Feedback</button>
      </div>

      {activeTab === 'users' && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name / Email</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                let status = 'Active';
                let statusClass = styles.active;
                if (u.isBanned) { status = 'Banned'; statusClass = styles.banned; }
                else if (u.timeoutUntil && u.timeoutUntil.toDate() > new Date()) { status = 'Timeout'; statusClass = styles.timeout; }

                return (
                  <tr key={u.uid}>
                    <td>
                      <div><strong>{u.displayName}</strong></div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td>
                      <select 
                        className={styles.select} 
                        value={u.grade || ''} 
                        onChange={(e) => handleUpdateGrade(u.uid, e.target.value)}
                      >
                        <option value="">Unknown</option>
                        <option value="9">9th Grade</option>
                        <option value="10">10th Grade</option>
                        <option value="11">11th Grade</option>
                        <option value="12">12th Grade</option>
                      </select>
                    </td>
                    <td>
                      <span className={`${styles.status} ${statusClass}`}>{status}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionBtn} onClick={() => handleKick(u.uid)}>Kick</button>
                        {status === 'Active' ? (
                          <>
                            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleTimeout(u.uid)}>Timeout (24h)</button>
                            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleBan(u.uid)}>Ban</button>
                          </>
                        ) : (
                          <button className={styles.actionBtn} onClick={() => handleUnban(u.uid)}>Revoke Penalty</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'chats' && (
        <div>
          {/* Sub tabs for Class Chats vs DMs */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button 
              className={`${styles.actionBtn}`}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                background: chatSubTab === 'class' ? 'var(--accent)' : 'var(--bg-raised)',
                color: chatSubTab === 'class' ? 'black' : 'var(--text-primary)',
                borderColor: chatSubTab === 'class' ? 'var(--accent)' : 'var(--border)'
              }}
              onClick={() => { setChatSubTab('class'); setChatSearch(''); }}
            >
              Class Chats
            </button>
            <button 
              className={`${styles.actionBtn}`}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                background: chatSubTab === 'dm' ? 'var(--accent)' : 'var(--bg-raised)',
                color: chatSubTab === 'dm' ? 'black' : 'var(--text-primary)',
                borderColor: chatSubTab === 'dm' ? 'var(--accent)' : 'var(--border)'
              }}
              onClick={() => { setChatSubTab('dm'); setChatSearch(''); }}
            >
              Direct Messages (DMs)
            </button>
          </div>

          <div className={styles.tableWrap}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
              <input 
                type="text" 
                placeholder={chatSubTab === 'class' ? "Search course name or block..." : "Search student names..."} 
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className={styles.searchInput}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            {chatSubTab === 'class' ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Block</th>
                    <th>Semester</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {chats
                    .filter(c => 
                      c.courseName.toLowerCase().includes(chatSearch.toLowerCase()) || 
                      c.block.toLowerCase().includes(chatSearch.toLowerCase())
                    )
                    .map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.courseName}</strong></td>
                      <td>{c.block} Block</td>
                      <td>S{c.semester}</td>
                      <td>
                        <Link href={`/chat-room?id=${c.id}`} className={styles.actionBtn}>View Chat</Link>
                      </td>
                    </tr>
                  ))}
                  {chats.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>No class chats exist yet.</td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Participants</th>
                    <th>Latest Sender</th>
                    <th>Latest Message</th>
                    <th>Last Active</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dmChats
                    .map(dm => {
                      const names = dm.participants
                        .map(uid => users.find(u => u.uid === uid)?.displayName || 'Unknown')
                        .join(' & ');
                      return { ...dm, names };
                    })
                    .filter(dm => dm.names.toLowerCase().includes(chatSearch.toLowerCase()))
                    .map(dm => (
                    <tr key={dm.id}>
                      <td><strong>{dm.names}</strong></td>
                      <td>
                        {dm.lastMessageSenderName ? (
                          <span>{dm.lastMessageSenderName}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {dm.lastMessageText ? (
                          <span>{dm.lastMessageText}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No messages yet</span>
                        )}
                      </td>
                      <td>
                        {dm.lastMessageAt ? (
                          <span>{dm.lastMessageAt.toDate().toLocaleString()}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <Link href={`/chat-room?id=${dm.id}`} className={styles.actionBtn}>View Chat</Link>
                      </td>
                    </tr>
                  ))}
                  {dmChats.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>No direct messages exist yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className={styles.announcementForm}>
          <h2 style={{ marginBottom: 16 }}>Send Announcement</h2>
          <div className={styles.formGroup}>
            <label>Target Audience</label>
            <select value={annTarget} onChange={(e) => setAnnTarget(e.target.value)}>
              <option value="all">Everyone</option>
              <option value="9">9th Grade</option>
              <option value="10">10th Grade</option>
              <option value="11">11th Grade</option>
              <option value="12">12th Grade</option>
              <optgroup label="Specific Users">
                {users.map(u => (
                  <option key={u.uid} value={u.uid}>{u.displayName} ({u.email})</option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Message</label>
            <textarea 
              placeholder="Write your announcement here. It will appear as a banner at the top of the website for the selected users."
              value={annMessage}
              onChange={(e) => setAnnMessage(e.target.value)}
            />
          </div>
          <button 
            className="btn btn-primary" 
            onClick={sendAnnouncement}
            disabled={!annMessage.trim() || annSending}
          >
            {annSending ? 'Sending...' : 'Send Announcement'}
          </button>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Feedback</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbackList.map(f => (
                <tr key={f.id}>
                  <td><strong>{f.displayName}</strong></td>
                  <td style={{ whiteSpace: 'pre-wrap', maxWidth: '400px' }}>{f.text}</td>
                  <td>
                    <span className={`${styles.status} ${f.status === 'corrected' ? styles.active : f.status === 'flagged' ? styles.banned : styles.timeout}`}>
                      {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <select 
                      className={styles.select} 
                      value={f.status} 
                      onChange={(e) => handleFeedbackStatus(f.id, e.target.value as any)}
                    >
                      <option value="pending">Pending</option>
                      <option value="flagged">Flagged</option>
                      <option value="corrected">Corrected</option>
                    </select>
                  </td>
                </tr>
              ))}
              {feedbackList.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>No feedback yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
