'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCourseById } from '@/lib/courses';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import styles from './classmates.module.css';
import scheduleStyles from '../schedule/schedule.module.css';

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

interface SemesterSchedule {
  aBlock: string;
  bBlock: string;
  hasCDBlock: boolean;
  cBlock: string;
  cdBlock: string;
  dBlock: string;
  eBlock: string;
}

interface ScheduleDoc {
  semester1: SemesterSchedule;
  semester2: SemesterSchedule;
  grade: string;
}

const BLOCKS = [
  { key: 'aBlock', label: 'A Block' },
  { key: 'bBlock', label: 'B Block' },
  { key: 'cBlock', label: 'C Block' },
  { key: 'cdBlock', label: 'CD Block' },
  { key: 'dBlock', label: 'D Block' },
  { key: 'eBlock', label: 'E Block' },
];

function BlockCard({ label, courseId, semester, sublabel, badge }: { label: string, courseId: string, semester: number, sublabel?: string, badge?: string }) {
  const course = getCourseById(courseId);
  
  if (!courseId) {
    return (
      <div className={`${scheduleStyles.blockCard} ${styles.disabledCard}`}>
        <div className={scheduleStyles.blockHeader}>
          <div className={scheduleStyles.blockLabel}>
            <span className={scheduleStyles.blockLetter}>{label}</span>
            {sublabel && <span className={scheduleStyles.blockSub}>{sublabel}</span>}
          </div>
        </div>
        <div className={styles.emptyBlock}>Free / No Class</div>
      </div>
    );
  }

  return (
    <Link 
      href={`/classmates?courseId=${courseId}&semester=${semester}&block=${label}`} 
      className={`${scheduleStyles.blockCard} ${styles.clickableCard}`}
    >
      <div className={scheduleStyles.blockHeader}>
        <div className={scheduleStyles.blockLabel}>
          <span className={scheduleStyles.blockLetter}>{label}</span>
          {sublabel && <span className={scheduleStyles.blockSub}>{sublabel}</span>}
        </div>
        {badge && <span className="badge badge-green">{badge}</span>}
      </div>
      <div className={scheduleStyles.selectTrigger} style={{ pointerEvents: 'none' }}>
        <div className={scheduleStyles.selectedCourse}>
          <span className={scheduleStyles.selectedName}>{course?.name}</span>
          <span className={scheduleStyles.selectedDept}>{course?.department}</span>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );
}

function ClassmateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const selectedCourse = searchParams.get('courseId') || '';
  const urlSemester = Number(searchParams.get('semester'));
  const [semester, setSemester] = useState<1 | 2>(urlSemester === 2 ? 2 : 1);
  const [classmates, setClassmates] = useState<ClassmateResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleDoc | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  // Sync state with URL changes
  useEffect(() => {
    if (urlSemester === 1 || urlSemester === 2) setSemester(urlSemester);
  }, [urlSemester]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'schedules', user.uid)).then((snap) => {
      if (snap.exists()) {
        setScheduleData(snap.data() as ScheduleDoc);
      }
      setLoadingSchedule(false);
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
  }, [selectedCourse, semester, user, searchParams]);

  const course = getCourseById(selectedCourse);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Classmates</h1>
        <p className={styles.subtitle}>Click on a class from your schedule to see who&apos;s in it</p>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.semesterToggle}>
          <button 
            className={`${styles.semBtn} ${semester === 1 ? styles.semBtnActive : ''}`}
            onClick={() => {
              setSemester(1);
              if (selectedCourse) router.push('/classmates');
            }}
          >
            Semester 1
          </button>
          <button 
            className={`${styles.semBtn} ${semester === 2 ? styles.semBtnActive : ''}`}
            onClick={() => {
              setSemester(2);
              if (selectedCourse) router.push('/classmates?semester=2');
            }}
          >
            Semester 2
          </button>
        </div>
      </div>

      {selectedCourse && (
        <div className={styles.results}>
          <button className={styles.backBtn} onClick={() => router.push(`/classmates?semester=${semester}`)}>
            &larr; Back to my schedule
          </button>
          <div className={styles.resultsHeader}>
            <div>
              <h2 className={styles.courseName2}>{course?.name} <span style={{fontSize: 16, color: 'var(--text-muted)'}}>({searchParams.get('block')} Block)</span></h2>
              <p className={styles.resultCount}>
                {searching ? 'Searching…' : `${classmates.length} classmate${classmates.length !== 1 ? 's' : ''} found in Semester ${semester}`}
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
              <p>No other students in this block have enrolled yet.</p>
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
        <div className={styles.scheduleView}>
          {loadingSchedule ? (
            <div className={scheduleStyles.loadingWrap}>
              <div className="spinner" style={{ width: 28, height: 28 }} />
              <span>Loading your schedule…</span>
            </div>
          ) : scheduleData ? (
            <div className={scheduleStyles.scheduleGrid}>
              <BlockCard
                label="A"
                courseId={semester === 1 ? scheduleData.semester1.aBlock : scheduleData.semester2.aBlock}
                sublabel="Block — Daily, 8:15–9:20"
                semester={semester}
              />
              <BlockCard
                label="B"
                courseId={semester === 1 ? scheduleData.semester1.bBlock : scheduleData.semester2.bBlock}
                sublabel="Block — Daily, 9:25–10:30"
                semester={semester}
              />

              <div className={scheduleStyles.cdSection}>
                <div className={scheduleStyles.cdToggleHeader}>
                  <div>
                    <span className={scheduleStyles.cdLabel}>C / CD Block</span>
                    <span className={scheduleStyles.cdSub}>Daily, 11:45–12:50</span>
                  </div>
                </div>

                {(semester === 1 ? scheduleData.semester1.hasCDBlock : scheduleData.semester2.hasCDBlock) ? (
                  <BlockCard
                    label="CD"
                    courseId={semester === 1 ? scheduleData.semester1.cdBlock : scheduleData.semester2.cdBlock}
                    sublabel="Double Block — Every day"
                    badge="Full period"
                    semester={semester}
                  />
                ) : (
                  <div className={scheduleStyles.cdPair}>
                    <BlockCard
                      label="C"
                      courseId={semester === 1 ? scheduleData.semester1.cBlock : scheduleData.semester2.cBlock}
                      sublabel="Day 1 only"
                      badge="Alternating"
                      semester={semester}
                    />
                    <BlockCard
                      label="D"
                      courseId={semester === 1 ? scheduleData.semester1.dBlock : scheduleData.semester2.dBlock}
                      sublabel="Day 2 only"
                      badge="Alternating"
                      semester={semester}
                    />
                  </div>
                )}
              </div>

              <BlockCard
                label="E"
                courseId={semester === 1 ? scheduleData.semester1.eBlock : scheduleData.semester2.eBlock}
                sublabel="Block — Daily, 1:30–2:35"
                semester={semester}
              />
            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>You haven&apos;t saved your schedule yet!</p>
              <span>Head over to the Schedule tab to add your classes first.</span>
            </div>
          )}
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
