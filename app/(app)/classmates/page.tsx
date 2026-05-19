'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COURSES, getCourseById, TEACHERS } from '@/lib/courses';
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
  teacherEmail: string;
  teacherName: string;
}

const BLOCKS = [
  { key: 'aBlock', label: 'A Block' },
  { key: 'bBlock', label: 'B Block' },
  { key: 'cBlock', label: 'C Block' },
  { key: 'cdBlock', label: 'CD Block' },
  { key: 'dBlock', label: 'D Block' },
  { key: 'eBlock', label: 'E Block' },
];

function ClassmateContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('courseId') || '');
  const [semester, setSemester] = useState<1 | 2>(Number(searchParams.get('semester')) === 2 ? 2 : 1);
  const [classmates, setClassmates] = useState<ClassmateResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('all');
  const [mySchedule, setMySchedule] = useState<any>(null);

  const filteredCourses = COURSES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'schedules', user.uid)).then((snap) => {
      if (snap.exists()) setMySchedule(snap.data());
    });
  }, [user]);

  useEffect(() => {
    if (!selectedCourse) {
      setClassmates([]);
      return;
    }

    const findClassmates = async () => {
      setSearching(true);
      const results: ClassmateResult[] = [];
      const seen = new Set<string>();
      const semKey = `semester${semester}`;

      const targetBlock = searchParams.get('block');
      const blocksToSearch = targetBlock
        ? BLOCKS.filter((b) => b.label.startsWith(targetBlock))
        : BLOCKS;

      for (const block of blocksToSearch) {
        // Query the nested semester object field
        const q = query(
          collection(db, 'schedules'),
          where(`${semKey}.${block.key}`, '==', selectedCourse)
        );
        const snap = await getDocs(q);

        for (const schedDoc of snap.docs) {
          const uid = schedDoc.id;
          if (uid === user?.uid || seen.has(uid)) continue;
          seen.add(uid);

          const profileSnap = await getDoc(doc(db, 'users', uid));
          if (profileSnap.exists()) {
            const schedData = schedDoc.data() as any;
            const teacherEmail = schedData[semKey]?.[`${block.key}Teacher`] || '';
            const teacherObj = TEACHERS.find((t) => t.email === teacherEmail);
            const teacherName = teacherObj ? teacherObj.name : teacherEmail ? 'Unknown Teacher' : 'No Teacher Selected';

            results.push({
              profile: profileSnap.data() as UserProfile,
              block: block.label,
              teacherEmail,
              teacherName,
            });
          }
        }
      }

      setClassmates(results);
      setSelectedTeacherFilter('all');
      setSearching(false);
    };

    findClassmates();
  }, [selectedCourse, semester, user, searchParams]);

  // Set search text if course is pre-selected via URL
  useEffect(() => {
    const courseId = searchParams.get('courseId');
    if (courseId) {
      const c = getCourseById(courseId);
      if (c) setSearch(c.name);
    }
  }, [searchParams]);

  const course = getCourseById(selectedCourse);

  const getMyTeacherForCourse = () => {
    if (!mySchedule) return '';
    const semKey = `semester${semester}`;
    const semSched = mySchedule[semKey];
    if (!semSched) return '';

    const blockKeys = ['aBlock', 'bBlock', 'cBlock', 'cdBlock', 'dBlock', 'eBlock'];
    for (const bk of blockKeys) {
      if (semSched[bk] === selectedCourse) {
        return semSched[`${bk}Teacher`] || '';
      }
    }
    return '';
  };

  const myTeacherEmail = getMyTeacherForCourse();
  const myTeacherObj = TEACHERS.find((t) => t.email === myTeacherEmail);
  const myTeacherName = myTeacherObj ? myTeacherObj.name : '';

  const uniqueTeachersInResults = Array.from(
    new Set(
      classmates
        .map((c) => c.teacherEmail)
        .filter((email): email is string => !!email)
    )
  );

  const displayedClassmates = classmates.filter((c) => {
    if (selectedTeacherFilter === 'all') return true;
    if (selectedTeacherFilter === 'none') return !c.teacherEmail;
    if (selectedTeacherFilter.startsWith('my_')) {
      const email = selectedTeacherFilter.substring(3);
      return c.teacherEmail === email;
    }
    return c.teacherEmail === selectedTeacherFilter;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Classmates</h1>
        <p className={styles.subtitle}>See who&apos;s in your classes next year</p>
      </div>

      <div className={styles.filterBar}>
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
            {(search || selectedCourse) && (
              <button className={styles.clearBtn} onClick={() => { setSearch(''); setSelectedCourse(''); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {search && !selectedCourse && (
            <div className={styles.courseDropdown}>
              {filteredCourses.slice(0, 20).map((c) => (
                <button
                  key={c.id}
                  className={`${styles.courseItem}`}
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

        {selectedCourse && (
          <div className={styles.teacherFilterWrap}>
            <select
              className={styles.teacherFilterSelect}
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            >
              <option value="all">All Sections / Teachers</option>
              {myTeacherEmail && (
                <option value={`my_${myTeacherEmail}`}>My Section ({myTeacherName})</option>
              )}
              {uniqueTeachersInResults.map((tEmail) => {
                const tObj = TEACHERS.find((t) => t.email === tEmail);
                if (!tObj) return null;
                if (tEmail === myTeacherEmail) return null;
                return (
                  <option key={tEmail} value={tEmail}>
                    Section: {tObj.name}
                  </option>
                );
              })}
              {classmates.some((c) => !c.teacherEmail) && (
                <option value="none">No Teacher Selected</option>
              )}
            </select>
          </div>
        )}

        <div className={styles.semesterToggle}>
          <button 
            className={`${styles.semBtn} ${semester === 1 ? styles.semBtnActive : ''}`}
            onClick={() => setSemester(1)}
          >
            Sem 1
          </button>
          <button 
            className={`${styles.semBtn} ${semester === 2 ? styles.semBtnActive : ''}`}
            onClick={() => setSemester(2)}
          >
            Sem 2
          </button>
        </div>
      </div>

      {selectedCourse && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <div>
              <h2 className={styles.courseName2}>{course?.name}</h2>
              <p className={styles.resultCount}>
                {searching ? 'Searching…' : `${displayedClassmates.length} classmate${displayedClassmates.length !== 1 ? 's' : ''} found in Semester ${semester}`}
              </p>
            </div>
          </div>

          {searching ? (
            <div className={styles.loadingRow}>
              <div className="spinner" />
              <span>Finding classmates…</span>
            </div>
          ) : displayedClassmates.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p>No other students found matching this filter.</p>
              <span>Try selecting another teacher/section or check back later!</span>
            </div>
          ) : (
            <div className={styles.classmateGrid}>
              {displayedClassmates.map(({ profile, block, teacherName }) => (
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
                      {teacherName && teacherName !== 'No Teacher Selected' && (
                        <span className="badge badge-blue" style={{ background: 'var(--green-800)', borderColor: 'var(--green-600)' }}>
                          {teacherName}
                        </span>
                      )}
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

export default function ClassmatesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClassmateContent />
    </Suspense>
  );
}
