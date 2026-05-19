'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COURSES, getCourseById, TEACHERS } from '@/lib/courses';
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
  teacherEmail: string;
  teacherName: string;
  courseName?: string;
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

function BlockCard({ label, courseId, teacherEmail, semester, sublabel, badge }: { label: string, courseId: string, teacherEmail?: string, semester: number, sublabel?: string, badge?: string }) {
  const course = getCourseById(courseId);
  const teacherObj = TEACHERS.find((t) => t.email === teacherEmail);
  const teacherName = teacherObj ? teacherObj.name : (teacherEmail ? 'Unknown Teacher' : 'No Teacher Selected');
  
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
          <span className={scheduleStyles.selectedDept}>
            {course?.department} {courseId && teacherEmail && teacherEmail !== '' ? `• ${teacherName}` : ''}
          </span>
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
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('all');
  const [mySchedule, setMySchedule] = useState<any>(null);

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

      const FILM_SCORING = ['film-scoring-found', 'film-scoring-studio', 'film-scoring-adv'];
      const SONGWRITING = ['songwriting-found', 'songwriting-studio', 'songwriting-adv'];
      const MUSIC_PROD = ['music-prod-found', 'music-prod-studio', 'music-prod-adv'];

      let targetCourseIds = [selectedCourse];
      if (FILM_SCORING.includes(selectedCourse)) targetCourseIds = FILM_SCORING;
      else if (SONGWRITING.includes(selectedCourse)) targetCourseIds = SONGWRITING;
      else if (MUSIC_PROD.includes(selectedCourse)) targetCourseIds = MUSIC_PROD;

      for (const block of blocksToSearch) {
        const q = query(
          collection(db, 'schedules'),
          where(`${semKey}.${block.key}`, 'in', targetCourseIds)
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
            const theirCourseId = schedData[semKey]?.[block.key];
            const theirCourse = getCourseById(theirCourseId);
            const teacherObj = TEACHERS.find((t) => t.email === teacherEmail);
            const teacherName = teacherObj ? teacherObj.name : teacherEmail ? 'Unknown Teacher' : 'No Teacher Selected';

            results.push({
              profile: profileSnap.data() as UserProfile,
              block: block.label,
              teacherEmail,
              teacherName,
              courseName: theirCourse ? theirCourse.name : '',
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
        <p className={styles.subtitle}>Click on a class from your schedule to see who&apos;s in it</p>
      </div>

      <div className={styles.filterBar}>
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
              <p>
                {selectedTeacherFilter !== 'all'
                  ? 'No other students found matching this filter.'
                  : 'No other students in this block have enrolled yet.'}
              </p>
              <span>
                {selectedTeacherFilter !== 'all'
                  ? 'Try selecting another teacher/section or check back later!'
                  : 'Check back after more students add their schedules!'}
              </span>
            </div>
          ) : (
            <div className={styles.classmateGrid}>
              {displayedClassmates.map(({ profile, block, teacherName, courseName }) => (
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
                      {courseName && (
                        <span className="badge badge-green" style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', borderColor: 'var(--border-hover)' }}>
                          {courseName}
                        </span>
                      )}
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
                teacherEmail={semester === 1 ? (scheduleData.semester1 as any).aBlockTeacher : (scheduleData.semester2 as any).aBlockTeacher}
                sublabel="Block — Daily, 8:15–9:20"
                semester={semester}
              />
              <BlockCard
                label="B"
                courseId={semester === 1 ? scheduleData.semester1.bBlock : scheduleData.semester2.bBlock}
                teacherEmail={semester === 1 ? (scheduleData.semester1 as any).bBlockTeacher : (scheduleData.semester2 as any).bBlockTeacher}
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
                    teacherEmail={semester === 1 ? (scheduleData.semester1 as any).cdBlockTeacher : (scheduleData.semester2 as any).cdBlockTeacher}
                    sublabel="Double Block — Every day"
                    badge="Full period"
                    semester={semester}
                  />
                ) : (
                  <div className={scheduleStyles.cdPair}>
                    <BlockCard
                      label="C"
                      courseId={semester === 1 ? scheduleData.semester1.cBlock : scheduleData.semester2.cBlock}
                      teacherEmail={semester === 1 ? (scheduleData.semester1 as any).cBlockTeacher : (scheduleData.semester2 as any).cBlockTeacher}
                      sublabel="Day 1 only"
                      badge="Alternating"
                      semester={semester}
                    />
                    <BlockCard
                      label="D"
                      courseId={semester === 1 ? scheduleData.semester1.dBlock : scheduleData.semester2.dBlock}
                      teacherEmail={semester === 1 ? (scheduleData.semester1 as any).dBlockTeacher : (scheduleData.semester2 as any).dBlockTeacher}
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
                teacherEmail={semester === 1 ? (scheduleData.semester1 as any).eBlockTeacher : (scheduleData.semester2 as any).eBlockTeacher}
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
