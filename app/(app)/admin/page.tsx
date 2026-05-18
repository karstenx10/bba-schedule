'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
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

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'users' | 'chats' | 'announcements'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

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
        <button className={`${styles.tab} ${activeTab === 'chats' ? styles.active : ''}`} onClick={() => setActiveTab('chats')}>Class Chats</button>
        <button className={`${styles.tab} ${activeTab === 'announcements' ? styles.active : ''}`} onClick={() => setActiveTab('announcements')}>Announcements</button>
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
        <div className={styles.tableWrap}>
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
              {chats.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.courseName}</strong></td>
                  <td>{c.block} Block</td>
                  <td>S{c.semester}</td>
                  <td>
                    <Link href={`/chat/${c.id}`} className={styles.actionBtn}>View Chat</Link>
                  </td>
                </tr>
              ))}
              {chats.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>No class chats exist yet.</td></tr>
              )}
            </tbody>
          </table>
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
    </div>
  );
}
