'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from './Navbar.module.css';
import Image from 'next/image';

const NAV_LINKS = [
  {
    href: '/schedule',
    label: 'Schedule',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/classmates',
    label: 'Classmates',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/school-chat',
    label: 'School Chat',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: '/chat',
    label: 'Class Chats',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { profile, isAdmin, signOut } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || !profile) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        uid: profile.uid,
        displayName: profile.displayName,
        text: feedbackText.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setShowFeedback(false);
      setFeedbackText('');
      alert('Feedback submitted! Thank you.');
    } catch (err) {
      console.error(err);
      alert('Error submitting feedback.');
    }
    setSubmitting(false);
  };

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.inner}>
          {/* Logo */}
          <Link href="/schedule" className={styles.logo}>
            <div className={styles.logoMark}>BBA</div>
            <span className={styles.logoLabel}>Schedule</span>
          </Link>

          {/* Nav Links */}
          <div className={styles.links}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${pathname.startsWith(link.href) ? styles.active : ''}`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={`${styles.link} ${pathname.startsWith('/admin') ? styles.active : ''}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Admin
              </Link>
            )}
          </div>

          {/* User */}
          <div className={styles.user}>
            {/* Feedback Button */}
            <button className={styles.feedbackBtn} onClick={() => setShowFeedback(true)} title="Send Feedback">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              <span style={{ fontSize: '10px', marginTop: '2px' }}>Feedback</span>
            </button>
            {profile?.photoURL ? (
              <Image
                src={profile.photoURL}
                alt={profile.displayName}
                width={34}
                height={34}
                className={styles.avatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.avatarFallback}>
                {profile?.displayName?.[0] ?? '?'}
              </div>
            )}
            <div className={styles.userInfo}>
              <span className={styles.userName}>{profile?.displayName?.split(' ')[0]}</span>
            </div>
            <button className={styles.signOut} onClick={signOut} title="Sign out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {showFeedback && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Send Feedback</h3>
            <p>Let us know about any bugs, concerns, or features you&apos;d like to see!</p>
            <textarea
              className={styles.feedbackInput}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Type your feedback here..."
              rows={4}
            />
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowFeedback(false)} disabled={submitting}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleFeedbackSubmit} disabled={submitting || !feedbackText.trim()}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
