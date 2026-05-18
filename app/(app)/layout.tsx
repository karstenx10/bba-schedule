'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import styles from './app-layout.module.css';
import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

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
