'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import styles from './app-layout.module.css';
import Link from 'next/link';

interface Announcement {
  id: string;
  text: string;
  target: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !profile) return;
    
    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsub = onSnapshot(q, (snap) => {
      let activeAnn: Announcement | null = null;
      for (const d of snap.docs) {
        const data = d.data();
        if (profile.dismissedAnnouncements?.includes(d.id)) continue;
        
        const t = data.target;
        if (t === 'all' || t === profile.grade || t === profile.uid) {
          activeAnn = { id: d.id, text: data.text, target: t };
          break;
        }
      }
      setAnnouncement(activeAnn);
    });

    return () => unsub();
  }, [user, profile]);

  const dismissAnnouncement = async () => {
    if (!user || !announcement) return;
    setAnnouncement(null);
    await updateDoc(doc(db, 'users', user.uid), {
      dismissedAnnouncements: arrayUnion(announcement.id)
    });
  };

  if (loading || !user) {
    return (
      <div className={styles.loading}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <Navbar />
      <main className={styles.main}>
        {announcement && (
          <div className={styles.banner}>
            <div className={styles.bannerText}>
              <strong style={{ marginRight: 8 }}>Announcement:</strong>
              {announcement.text}
            </div>
            <button className={styles.bannerClose} onClick={dismissAnnouncement} title="Dismiss">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}
        {children}
        <footer className={styles.footer}>
          <Link href="/privacy" className={styles.footerLink} target="_blank">Privacy Policy</Link>
          <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
          <Link href="/terms" className={styles.footerLink} target="_blank">Terms of Service</Link>
        </footer>
      </main>
    </div>
  );
}
