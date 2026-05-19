'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, serverTimestamp, setDoc, getDoc, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore';
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
  lastActive?: any;
  createdAt?: any;
}

interface Chat {
  id: string;
  courseName: string;
  block: string;
  semester: number;
}



interface Feedback {
  id: string;
  uid: string;
  displayName: string;
  text: string;
  status: 'pending' | 'corrected' | 'flagged';
  createdAt: any;
}

interface SystemLog {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  type: 'login' | 'join' | 'schedule_save';
  timestamp: any;
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'chats' | 'announcements' | 'feedback'>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);

  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatSearch, setChatSearch] = useState('');

  // Dashboard & Logs State
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [schedulesCount, setSchedulesCount] = useState(0);
  interface CompletedScheduleInfo {
    uid: string;
    updatedAt: Date | null;
  }
  const [completedSchedules, setCompletedSchedules] = useState<CompletedScheduleInfo[]>([]);

  // Interactive CLI Console state
  const [cmdValue, setCmdValue] = useState('');
  const [customConsoleLines, setCustomConsoleLines] = useState<{
    id: string;
    type: 'input' | 'output';
    message: string;
    timestamp: Date;
  }[]>([]);

  const terminalBodyRef = useRef<HTMLDivElement>(null);

  interface Announcement {
    id: string;
    text: string;
    target: string;
    type?: 'announcement' | 'update' | 'downtime';
    viewable?: boolean;
    createdAt: any;
  }

  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [annType, setAnnType] = useState<'announcement' | 'update' | 'downtime'>('announcement');

  // Announcement State
  const [annTarget, setAnnTarget] = useState('all'); // 'all', '9', '10', '11', '12', or specific uid
  const [annMessage, setAnnMessage] = useState('');
  const [annSending, setAnnSending] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);

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



    const fSnap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
    setFeedbackList(fSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback)));

    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    // Real-time subscription to logs
    const logsQuery = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as SystemLog)));
    });

    // Real-time subscription to schedules completed count & info
    const schedQuery = collection(db, 'schedules');
    const unsubSched = onSnapshot(schedQuery, (snap) => {
      setSchedulesCount(snap.size);
      setCompletedSchedules(snap.docs.map(doc => {
        const data = doc.data();
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : null;
        return { uid: doc.id, updatedAt };
      }));
    });

    // Real-time subscription to announcements list
    const annQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsubAnn = onSnapshot(annQuery, (snap) => {
      setAnnouncementsList(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    });

    return () => {
      unsubLogs();
      unsubSched();
      unsubAnn();
    };
  }, [isAdmin]);

  // Terminal Auto-scroll logic
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [logs, customConsoleLines, users]);

  const handleConsoleSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !cmdValue.trim()) return;

    const cmd = cmdValue.trim();
    setCmdValue('');

    const inputLine = {
      id: `cmd_in_${Date.now()}`,
      type: 'input' as const,
      message: cmd,
      timestamp: new Date()
    };

    let outputMsg = '';
    const cleanCmd = cmd.toLowerCase();

    if (cleanCmd === 'help') {
      outputMsg = 'Available commands:\n  help      - Display this help information menu.\n  completed - List completed schedules chronologically (beginning to end).\n  recent    - List completed schedules reverse-chronologically (most recent first).\n  teachers  - Analyze and list students who selected teachers for ALL of their classes.\n  users     - Show count of registered schedule profiles.\n  clear     - Clear custom logs and reset console view.';
    } else if (cleanCmd === 'completed' || cleanCmd === 'recent') {
      const enriched = users
        .map(u => {
          const schedInfo = completedSchedules.find(s => s.uid === u.uid);
          return schedInfo ? { ...u, completedAt: schedInfo.updatedAt } : null;
        })
        .filter((u): u is UserProfile & { completedAt: Date | null } => u !== null);

      if (cleanCmd === 'recent') {
        // Sort reverse-chronologically from end (latest) to beginning (earliest)
        enriched.sort((a, b) => {
          if (!a.completedAt) return 1;
          if (!b.completedAt) return -1;
          return b.completedAt.getTime() - a.completedAt.getTime();
        });
      } else {
        // Sort chronologically from beginning (earliest) to end (latest)
        enriched.sort((a, b) => {
          if (!a.completedAt) return 1;
          if (!b.completedAt) return -1;
          return a.completedAt.getTime() - b.completedAt.getTime();
        });
      }

      if (enriched.length > 0) {
        const orderStr = cleanCmd === 'recent' ? 'Most Recent First' : 'Beginning to End';
        outputMsg = `Completed schedules (${enriched.length}) - [Sorted: ${orderStr}]:\n` +
          enriched.map((u, i) => {
            const timeStr = u.completedAt
              ? u.completedAt.toLocaleString()
              : 'Unknown Time';
            return `  ${i + 1}. ${u.displayName} (${u.email}) [Grade: ${u.grade || 'N/A'}] - Completed: ${timeStr}`;
          }).join('\n');
      } else {
        outputMsg = 'No students have completed schedules yet.';
      }
    } else if (cleanCmd === 'teachers') {
      try {
        const schedSnap = await getDocs(collection(db, 'schedules'));
        const totalUsersCount = users.length;
        const totalSchedulesCount = schedSnap.size;

        let completedTeachersCount = 0;
        const completedUsers: { displayName: string; email: string; grade: string }[] = [];

        schedSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          const uid = docSnap.id;
          const userProfile = users.find(u => u.uid === uid);

          if (!userProfile) return;

          let hasClasses = false;
          let missingTeacher = false;

          const sems = [data.semester1, data.semester2].filter(Boolean);
          sems.forEach(sem => {
            // Block A
            if (sem.aBlock) {
              hasClasses = true;
              if (!sem.aBlockTeacher) missingTeacher = true;
            }
            // Block B
            if (sem.bBlock) {
              hasClasses = true;
              if (!sem.bBlockTeacher) missingTeacher = true;
            }
            // CD Blocks
            if (sem.hasCDBlock) {
              if (sem.cdBlock) {
                hasClasses = true;
                if (!sem.cdBlockTeacher) missingTeacher = true;
              }
            } else {
              if (sem.cBlock) {
                hasClasses = true;
                if (!sem.cBlockTeacher) missingTeacher = true;
              }
              if (sem.dBlock) {
                hasClasses = true;
                if (!sem.dBlockTeacher) missingTeacher = true;
              }
            }
            // Block E
            if (sem.eBlock) {
              hasClasses = true;
              if (!sem.eBlockTeacher) missingTeacher = true;
            }
          });

          // Must have classes selected and NO missing teachers on any of them
          if (hasClasses && !missingTeacher) {
            completedTeachersCount++;
            completedUsers.push({
              displayName: userProfile.displayName || 'Unknown Student',
              email: userProfile.email || '',
              grade: userProfile.grade || 'N/A'
            });
          }
        });

        const pctBody = totalUsersCount > 0 ? Math.round((completedTeachersCount / totalUsersCount) * 100) : 0;
        const pctSched = totalSchedulesCount > 0 ? Math.round((completedTeachersCount / totalSchedulesCount) * 100) : 0;

        outputMsg = `Teacher Selection Completeness Report:\n` +
          `----------------------------------------\n` +
          `Total Registered Users: ${totalUsersCount}\n` +
          `Saved Schedules Count: ${totalSchedulesCount}\n` +
          `Completed Teacher Selection for ALL Classes: ${completedTeachersCount}\n` +
          `Percentage of Total Student Body: ${pctBody}%\n` +
          `Percentage of Saved Schedules: ${pctSched}%\n\n` +
          `Students who completed teacher selections for all saved blocks:\n` +
          (completedUsers.length > 0
            ? completedUsers.map((u, idx) => `  ${idx + 1}. ${u.displayName} (${u.email}) [Grade: ${u.grade}]`).join('\n')
            : '  No students have fully selected teachers for all their classes yet.');

      } catch (err) {
        console.error(err);
        outputMsg = 'Error fetching schedule records for teacher selection analysis.';
      }
    } else if (cleanCmd === 'users') {
      outputMsg = `Total registered schedule profiles: ${users.length} user(s).`;
    } else if (cleanCmd === 'clear') {
      setCustomConsoleLines([]);
      return;
    } else {
      outputMsg = `Command not recognized: '${cmd}'. Type 'help' for support.`;
    }

    const outputLine = {
      id: `cmd_out_${Date.now()}`,
      type: 'output' as const,
      message: outputMsg,
      timestamp: new Date()
    };

    setCustomConsoleLines(prev => [...prev, inputLine, outputLine]);
  };

  const getCombinedConsoleLines = () => {
    // 1. Map existing users into historical join logs
    const historicalJoins = users
      .filter(u => u.createdAt)
      .map(u => {
        const timestamp = typeof (u.createdAt as any).toDate === 'function'
          ? (u.createdAt as any).toDate()
          : new Date(u.createdAt as any);
        return {
          id: `hist_join_${u.uid}`,
          uid: u.uid,
          displayName: u.displayName,
          email: u.email,
          type: 'join' as const,
          message: 'Created schedule profile for the first time',
          timestamp
        };
      });

    // 2. Map reactive real-time logs from Firestore logs state
    const firestoreLogs = logs
      .map(log => {
        const timestamp = log.timestamp?.toDate
          ? log.timestamp.toDate()
          : new Date();

        let details = 'Came online';
        if (log.type === 'join') details = 'Created schedule profile for the first time';
        else if (log.type === 'schedule_save') details = 'Saved schedule blocks to the database';

        return {
          id: log.id,
          uid: log.uid,
          displayName: log.displayName,
          email: log.email,
          type: log.type,
          message: details,
          timestamp
        };
      });

    // 3. Map custom command lines
    const cliLines = customConsoleLines.map(line => ({
      id: line.id,
      uid: '',
      displayName: 'system',
      email: '',
      type: (line.type === 'input' ? 'cmd_input' : 'cmd_output') as any,
      message: line.message,
      timestamp: line.timestamp
    }));

    // 4. Combine all together
    const all = [...historicalJoins, ...firestoreLogs, ...cliLines];

    // Filter duplicates (e.g. if we have dynamic "join" logs and historical user createdAt, keep only one)
    const seen = new Set<string>();
    const unique: typeof all = [];

    // Sort by timestamp asc first so we merge logically like a terminal stream
    all.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (const item of all) {
      const dupKey = item.type === 'join' ? `join_${item.uid}` : item.id;
      if (!seen.has(dupKey)) {
        seen.add(dupKey);
        unique.push(item);
      }
    }

    return unique;
  };

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

  const handleFeedbackStatus = async (id: string, status: 'pending' | 'corrected' | 'flagged' | 'delete') => {
    if (status === 'delete') {
      if (!window.confirm('Are you sure you want to delete this feedback?')) return;
      await deleteDoc(doc(db, 'feedback', id));
      setFeedbackList(feedbackList.filter(f => f.id !== id));
      return;
    }
    await updateDoc(doc(db, 'feedback', id), { status });
    setFeedbackList(feedbackList.map(f => f.id === id ? { ...f, status } : f));
  };

  const sendAnnouncement = async () => {
    if (!annMessage.trim() || annSending) return;
    setAnnSending(true);

    try {
      if (editingAnnId) {
        // Update existing announcement
        await updateDoc(doc(db, 'announcements', editingAnnId), {
          text: annMessage.trim(),
          target: annTarget,
          type: annType
        });
        setEditingAnnId(null);
        alert('Announcement updated successfully!');
      } else {
        // Create new announcement
        await addDoc(collection(db, 'announcements'), {
          text: annMessage.trim(),
          target: annTarget,
          type: annType,
          viewable: true,
          createdAt: serverTimestamp()
        });
        alert('Announcement sent successfully!');
      }

      setAnnMessage('');
      setAnnTarget('all');
      setAnnType('announcement');
    } catch (err) {
      console.error(err);
      alert(editingAnnId ? 'Failed to update announcement' : 'Failed to send announcement');
    }
    setAnnSending(false);
  };

  const startEditingAnnouncement = (ann: Announcement) => {
    setEditingAnnId(ann.id);
    setAnnTarget(ann.target);
    setAnnType(ann.type || 'announcement');
    setAnnMessage(ann.text);
  };

  const cancelEditingAnnouncement = () => {
    setEditingAnnId(null);
    setAnnTarget('all');
    setAnnType('announcement');
    setAnnMessage('');
  };

  const toggleAnnouncementVisibility = async (id: string, currentViewable: boolean) => {
    await updateDoc(doc(db, 'announcements', id), {
      viewable: !currentViewable
    });
  };

  const deleteAnnouncement = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this announcement? It will disappear from everyone\'s screen.')) {
      await deleteDoc(doc(db, 'announcements', id));
    }
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
        <button className={`${styles.tab} ${activeTab === 'dashboard' ? styles.active : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`} onClick={() => setActiveTab('users')}>Users</button>
        <button className={`${styles.tab} ${activeTab === 'chats' ? styles.active : ''}`} onClick={() => { setActiveTab('chats'); setChatSearch(''); }}>Chats</button>
        <button className={`${styles.tab} ${activeTab === 'announcements' ? styles.active : ''}`} onClick={() => setActiveTab('announcements')}>Announcements</button>
        <button className={`${styles.tab} ${activeTab === 'feedback' ? styles.active : ''}`} onClick={() => setActiveTab('feedback')}>User Feedback</button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="fade-in">
          {/* Dashboard Metrics Grid */}
          <div className={styles.dashboardGrid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.pulsingDot}></span>
                <h3>Active Right Now</h3>
              </div>
              <div className={styles.statValue}>
                {users.filter(u => {
                  if (!u.lastActive) return false;
                  const activeDate = typeof (u.lastActive as any).toDate === 'function'
                    ? (u.lastActive as any).toDate()
                    : new Date(u.lastActive as any);
                  const fiveMinutesAgo = new Date();
                  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
                  return activeDate > fiveMinutesAgo;
                }).length}
              </div>
              <div className={styles.statSubText}>Students active in last 5m</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--accent)' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <h3>Schedules Completed</h3>
              </div>
              <div className={styles.statValue}>
                {schedulesCount} <span className={styles.statMax}>/ {users.length}</span>
              </div>
              <div className={styles.statProgressBarWrap}>
                <div className={styles.statProgressBar} style={{ width: `${users.length > 0 ? (schedulesCount / users.length) * 100 : 0}%` }}></div>
              </div>
              <div className={styles.statSubText}>{users.length > 0 ? Math.round((schedulesCount / users.length) * 100) : 0}% of student body</div>
            </div>
          </div>

          {/* Real-time Logger Terminal */}
          <div className={styles.terminalContainer}>
            <div className={styles.terminalHeader}>
              <div className={styles.terminalButtons}>
                <span className={styles.termRed}></span>
                <span className={styles.termYellow}></span>
                <span className={styles.termGreen}></span>
              </div>
              <span className={styles.terminalTitle}>student_session_join.log</span>
            </div>

            <div className={styles.terminalBody} ref={terminalBodyRef}>
              {getCombinedConsoleLines().map((log) => {
                let typeBadge = 'ONLINE';
                let badgeClass = styles.badgeAuth;

                if (log.type === 'join') {
                  typeBadge = 'JOIN';
                  badgeClass = styles.badgeJoin;
                } else if (log.type === 'login') {
                  typeBadge = 'ONLINE';
                  badgeClass = styles.badgeAuth;
                } else if (log.type === 'schedule_save') {
                  typeBadge = 'SAVE';
                  badgeClass = styles.badgeSave;
                } else if (log.type === 'cmd_input') {
                  typeBadge = 'IN';
                  badgeClass = styles.badgeCmd;
                } else if (log.type === 'cmd_output') {
                  typeBadge = 'OUT';
                  badgeClass = styles.badgeOut;
                }

                const logTime = log.timestamp.toLocaleTimeString();

                return (
                  <div key={log.id} className={styles.terminalLine}>
                    <span className={styles.termTimestamp}>[{logTime}]</span>
                    <span className={`${styles.termBadge} ${badgeClass}`}>{typeBadge}</span>
                    {log.type !== 'cmd_input' && log.type !== 'cmd_output' ? (
                      <>
                        <span className={styles.termName}>{log.displayName}</span>
                        {log.email && <span className={styles.termEmail}>({log.email})</span>}
                        <span className={styles.termMessage}>{log.message}</span>
                      </>
                    ) : (
                      <span className={styles.termMessage} style={{ whiteSpace: 'pre-wrap' }}>
                        {log.type === 'cmd_input' ? `$ ${log.message}` : log.message}
                      </span>
                    )}
                  </div>
                );
              })}
              {getCombinedConsoleLines().length === 0 && (
                <div className={styles.terminalEmpty}>Listening for live student connections...</div>
              )}
            </div>

            <div className={styles.terminalInputRow} style={{ padding: '8px 16px 12px', background: '#1e293b' }}>
              <span className={styles.termPrompt}>$</span>
              <input
                type="text"
                className={styles.termInput}
                placeholder="Type command (e.g. 'help', 'completed', 'teachers', 'users', 'clear')..."
                value={cmdValue}
                onChange={(e) => setCmdValue(e.target.value)}
                onKeyDown={handleConsoleSubmit}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className={styles.tableWrap}>
          <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <span>Total Users: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{users.length}</span></span>
            <span>9th: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{users.filter(u => u.grade === '9').length}</span></span>
            <span>10th: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{users.filter(u => u.grade === '10').length}</span></span>
            <span>11th: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{users.filter(u => u.grade === '11').length}</span></span>
            <span>12th: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{users.filter(u => u.grade === '12').length}</span></span>
          </div>
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
          <div style={{ marginBottom: 16 }}>
            <Link href="/school-chat" className="btn btn-primary">Open School Chat</Link>
          </div>
          <div className={styles.tableWrap}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
              <input
                type="text"
                placeholder="Search course name or block..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className={styles.searchInput}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

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
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className={styles.announcementDashboard}>
          {/* Create Announcement Form */}
          <div className={styles.announcementForm} style={{ maxWidth: '100%' }}>
            <h2 style={{ marginBottom: 16 }}>{editingAnnId ? 'Edit Announcement' : 'Send Announcement'}</h2>

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
              <label>Announcement Type</label>
              <select value={annType} onChange={(e) => setAnnType(e.target.value as any)}>
                <option value="announcement">Announcement (Default Blue)</option>
                <option value="update">System Update (Premium Green)</option>
                <option value="downtime">Maintenance Warning (Orange/Red)</option>
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
              style={{ width: '100%' }}
            >
              {annSending ? 'Saving...' : editingAnnId ? 'Update Announcement' : 'Send Announcement'}
            </button>
            {editingAnnId && (
              <button
                className={styles.actionBtn}
                onClick={cancelEditingAnnouncement}
                style={{ width: '100%', marginTop: '8px', padding: '10px' }}
              >
                Cancel Edit
              </button>
            )}
          </div>

          {/* Announcements Tally Table */}
          <div className={styles.tableWrap}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Active & Dismissed Announcements</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total: {announcementsList.length}</span>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Target</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcementsList.map(ann => {
                  let targetName = 'Everyone';
                  if (ann.target !== 'all') {
                    if (['9', '10', '11', '12'].includes(ann.target)) {
                      targetName = `${ann.target}th Grade`;
                    } else {
                      const matchedUser = users.find(u => u.uid === ann.target);
                      targetName = matchedUser ? matchedUser.displayName : 'Specific User';
                    }
                  }

                  let typeBadge = styles.badgeTypeAnn;
                  let typeText = 'General';
                  if (ann.type === 'update') {
                    typeBadge = styles.badgeTypeUpdate;
                    typeText = 'Update';
                  } else if (ann.type === 'downtime') {
                    typeBadge = styles.badgeTypeDowntime;
                    typeText = 'Downtime';
                  }

                  const isViewable = ann.viewable !== false;

                  return (
                    <tr key={ann.id}>
                      <td>
                        <span className={`${styles.status} ${typeBadge}`}>{typeText}</span>
                      </td>
                      <td>
                        <strong>{targetName}</strong>
                      </td>
                      <td style={{ maxWidth: '280px', wordBreak: 'break-word', fontSize: '13px' }}>
                        {ann.text}
                      </td>
                      <td>
                        {isViewable ? (
                          <span className={`${styles.status} ${styles.badgeTypeUpdate}`} style={{ padding: '2px 8px' }}>Active</span>
                        ) : (
                          <span className={`${styles.status} ${styles.badgeOut}`} style={{ padding: '2px 8px' }}>Hidden</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => startEditingAnnouncement(ann)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.actionBtn}
                            onClick={() => toggleAnnouncementVisibility(ann.id, isViewable)}
                          >
                            {isViewable ? 'Hide' : 'Show'}
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            onClick={() => deleteAnnouncement(ann.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {announcementsList.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No announcements sent yet. Write one using the panel on the left!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                      <option value="delete" style={{ color: 'red' }}>Delete</option>
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
