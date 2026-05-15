'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COURSES, getCourseById } from '@/lib/courses';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import styles from './classmates.module.css';

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  grade: string;
}

interface ClassmateResult {
  profile: UserProfile;
  block: string;
}

const BLOCKS = [
  { key: 'aBlock', label: 'A Block' },
  { key: 'bBlock', label: 'B Block' },
  { key: 'cBlock', label: 'C Block' },
  { key: 'cdBlock', label: 'CD Block' },
  { key: 'dBlock', label: 'D Block' },
  { key: 'eBlock', label: 'E Block' },
];

export default function ClassmatesPage() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [classmates, setClassmates] = useState<ClassmateResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCourses = COURSES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!selectedCourse) {
      setClassmates([]);
      return;
    }

    const findClassmates = async () => {
      setSearching(true);
      const results: ClassmateResult[] = [];
      const seen = new Set<string>();

      for (const block of BLOCKS) {
        const q = query(
          collection(db, 'schedules'),
          where(block.key, '==', selectedCourse)
        );
        const snap = await getDocs(q);

        for (const schedDoc of snap.docs) {
          const uid = schedDoc.id;
          if (uid === user?.uid || seen.has(uid)) continue;
          seen.add(uid);

          const profileSnap = await getDoc(doc(db, 'users', uid));
          if (profileSnap.exists()) {
            results.push({
              profile: profileSnap.data() as UserProfile,
              block: block.label,
            });
          }
        }
      }

      setClassmates(results);
      setSearching(false);
    };

    findClassmates();
  }, [selectedCourse, user]);

  const course = getCourseById(selectedCourse);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Classmates</h1>
        <p className={styles.subtitle}>See who&apos;s in your classes next year</p>
      </div>

      {/* Course search */}
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Search for a course…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => { setSearch(''); setSelectedCourse(''); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {search && (
          <div className={styles.courseDropdown}>
            {filteredCourses.slice(0, 20).map((c) => (
              <button
                key={c.id}
                className={`${styles.courseItem} ${selectedCourse === c.id ? styles.courseItemActive : ''}`}
                onClick={() => { setSelectedCourse(c.id); setSearch(c.name); }}
              >
                <span className={styles.courseName}>{c.name}</span>
                <span className={styles.courseDept}>{c.department}</span>
              </button>
            ))}
            {filteredCourses.length === 0 && (
              <div className={styles.noResults}>No courses found</div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {selectedCourse && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <div>
              <h2 className={styles.courseName2}>{course?.name}</h2>
              <p className={styles.resultCount}>
                {searching ? 'Searching…' : `${classmates.length} classmate${classmates.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>

          {searching ? (
            <div className={styles.loadingRow}>
              <div className="spinner" />
              <span>Finding classmates…</span>
            </div>
          ) : classmates.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p>No other students have enrolled in this course yet.</p>
              <span>Check back after more students add their schedules!</span>
            </div>
          ) : (
            <div className={styles.classmateGrid}>
              {classmates.map(({ profile, block }) => (
                <div key={profile.uid} className={styles.classmateCard}>
                  {profile.photoURL ? (
                    <Image
                      src={profile.photoURL}
                      alt={profile.displayName}
                      width={48}
                      height={48}
                      className={styles.avatar}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={styles.avatarFallback}>
                      {profile.displayName?.[0] ?? '?'}
                    </div>
                  )}
                  <div className={styles.classmateInfo}>
                    <span className={styles.classmateName}>{profile.displayName}</span>
                    <div className={styles.classmateDetails}>
                      <span className="badge badge-green">{block}</span>
                      {profile.grade && (
                        <span className="badge badge-gold">Grade {profile.grade}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedCourse && (
        <div className={styles.emptyState}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>Search for a course above</p>
          <span>Then see which of your fellow Bulldogs are taking it</span>
        </div>
      )}
    </div>
  );
}
