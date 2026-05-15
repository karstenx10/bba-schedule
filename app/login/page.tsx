'use client';

import styles from './login.module.css';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading, signIn, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/schedule');
  }, [user, loading, router]);

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.grid} />
      </div>

      <div className={`${styles.card} fade-in`}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <span>B</span><span>B</span><span>A</span>
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoBig}>Burr &amp; Burton</span>
            <span className={styles.logoSub}>Academy</span>
          </div>
        </div>

        <div className={styles.divider} />

        <h1 className={styles.title}>Student Scheduler</h1>
        <p className={styles.desc}>
          Plan your schedule, find classmates, and chat with<br />
          your fellow Bulldogs — all in one place.
        </p>

        {error && (
          <div className={styles.error}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <button
          className={styles.googleBtn}
          onClick={signIn}
          disabled={loading}
        >
          {loading ? (
            <div className="spinner" style={{ width: 18, height: 18 }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Sign in with Google
        </button>

        <p className={styles.note}>
          Only <strong>@burrburton.org</strong> accounts are permitted.
        </p>
      </div>
    </div>
  );
}
