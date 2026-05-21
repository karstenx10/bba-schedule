'use client';

import { useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from '@/app/(app)/admin/admin.module.css';
import {
  ScheduleDoc,
  SemesterSchedule,
  getCourseDisplayName,
  getTeacherDisplayName,
  scheduleHasAnyCourse,
} from '@/lib/schedule';

interface UserRow {
  uid: string;
  displayName: string;
  email: string;
  grade: string;
}

interface AdminSchedulesTabProps {
  users: UserRow[];
  schedules: Record<string, ScheduleDoc | null>;
  loading?: boolean;
}

function BlockRow({
  label,
  time,
  courseId,
  teacherEmail,
  onCourseClick,
}: {
  label: string;
  time?: string;
  courseId: string;
  teacherEmail?: string;
  onCourseClick?: (courseId: string) => void;
}) {
  const teacher = getTeacherDisplayName(teacherEmail);
  const courseName = getCourseDisplayName(courseId);
  const isClickable = !!courseId && courseId !== '' && !!onCourseClick;

  return (
    <div className={styles.scheduleBlock}>
      <div className={styles.scheduleBlockHeader}>
        <span className={styles.scheduleBlockLabel}>{label}</span>
        {time && <span className={styles.scheduleBlockTime}>{time}</span>}
      </div>
      <div
        className={`${styles.scheduleBlockCourse} ${isClickable ? styles.scheduleBlockCourseClickable : ''}`}
        onClick={isClickable ? () => onCourseClick!(courseId) : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onCourseClick!(courseId); } : undefined}
      >
        {courseName}
        {isClickable && (
          <svg className={styles.courseClickIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )}
      </div>
      {teacher && <div className={styles.scheduleBlockTeacher}>{teacher}</div>}
    </div>
  );
}

function SemesterView({
  sched,
  semester,
  onCourseClick,
}: {
  sched: SemesterSchedule;
  semester: 1 | 2;
  onCourseClick?: (courseId: string) => void;
}) {
  return (
    <div className={styles.scheduleSemester}>
      <h3 className={styles.scheduleSemesterTitle}>Semester {semester}</h3>
      <BlockRow label="A Block" time="Daily, 8:15–9:20" courseId={sched.aBlock} teacherEmail={sched.aBlockTeacher} onCourseClick={onCourseClick} />
      <BlockRow label="B Block" time="Daily, 9:25–10:30" courseId={sched.bBlock} teacherEmail={sched.bBlockTeacher} onCourseClick={onCourseClick} />
      {sched.hasCDBlock ? (
        <BlockRow label="CD Block" time="Double, daily" courseId={sched.cdBlock} teacherEmail={sched.cdBlockTeacher} onCourseClick={onCourseClick} />
      ) : (
        <>
          <BlockRow label="C Block" time="Day 1" courseId={sched.cBlock} teacherEmail={sched.cBlockTeacher} onCourseClick={onCourseClick} />
          <BlockRow label="D Block" time="Day 2" courseId={sched.dBlock} teacherEmail={sched.dBlockTeacher} onCourseClick={onCourseClick} />
        </>
      )}
      <BlockRow label="E Block" time="Daily, 1:30–2:35" courseId={sched.eBlock} teacherEmail={sched.eBlockTeacher} onCourseClick={onCourseClick} />
    </div>
  );
}

interface ClassViewStudent {
  uid: string;
  displayName: string;
  email: string;
  grade: string;
  blocks: string[]; // e.g. ["S1 A Block", "S2 B Block"]
  teacher?: string;
}

export default function AdminSchedulesTab({ users, schedules, loading }: AdminSchedulesTabProps) {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [onlyWithSchedule, setOnlyWithSchedule] = useState(false);
  const [viewingCourseId, setViewingCourseId] = useState<string | null>(null);

  const sortedFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...users]
      .filter((u) => {
        if (onlyWithSchedule && !schedules[u.uid]) return false;
        if (!q) return true;
        const sched = schedules[u.uid];
        const courseHaystack = sched
          ? [
              sched.semester1.aBlock,
              sched.semester1.bBlock,
              sched.semester1.cBlock,
              sched.semester1.dBlock,
              sched.semester1.cdBlock,
              sched.semester1.eBlock,
              sched.semester2.aBlock,
              sched.semester2.bBlock,
              sched.semester2.cBlock,
              sched.semester2.dBlock,
              sched.semester2.cdBlock,
              sched.semester2.eBlock,
            ]
              .map(getCourseDisplayName)
              .join(' ')
              .toLowerCase()
          : '';
        return (
          (u.displayName || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.grade || '').includes(q) ||
          courseHaystack.includes(q)
        );
      })
      .sort((a, b) =>
        (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '', undefined, {
          sensitivity: 'base',
        })
      );
  }, [users, schedules, search, onlyWithSchedule]);

  // Compute students in a given course
  const studentsInCourse = useMemo(() => {
    if (!viewingCourseId) return [];

    const results: ClassViewStudent[] = [];

    const getBlockCourses = (s: SemesterSchedule) => [
      { course: s.aBlock, teacher: s.aBlockTeacher, label: 'A Block' },
      { course: s.bBlock, teacher: s.bBlockTeacher, label: 'B Block' },
      { course: s.cBlock, teacher: s.cBlockTeacher, label: 'C Block' },
      { course: s.dBlock, teacher: s.dBlockTeacher, label: 'D Block' },
      { course: s.cdBlock, teacher: s.cdBlockTeacher, label: 'CD Block' },
      { course: s.eBlock, teacher: s.eBlockTeacher, label: 'E Block' },
    ];

    for (const user of users) {
      const sched = schedules[user.uid];
      if (!sched) continue;

      const blocks: string[] = [];
      let teacher: string | undefined;

      for (const sem of [{ s: sched.semester1, label: 'S1' }, { s: sched.semester2, label: 'S2' }]) {
        for (const bd of getBlockCourses(sem.s)) {
          if (bd.course === viewingCourseId) {
            blocks.push(`${sem.label} ${bd.label}`);
            if (bd.teacher && !teacher) {
              teacher = getTeacherDisplayName(bd.teacher) || bd.teacher;
            }
          }
        }
      }

      if (blocks.length > 0) {
        results.push({
          uid: user.uid,
          displayName: user.displayName || 'Unknown',
          email: user.email,
          grade: user.grade,
          blocks,
          teacher,
        });
      }
    }

    results.sort((a, b) =>
      (a.displayName || '').localeCompare(b.displayName || '', undefined, { sensitivity: 'base' })
    );

    return results;
  }, [viewingCourseId, users, schedules]);

  const handleCourseClick = useCallback((courseId: string) => {
    setViewingCourseId(courseId);
  }, []);

  const activeUid = selectedUid ?? sortedFiltered[0]?.uid ?? null;
  const activeUser = sortedFiltered.find((u) => u.uid === activeUid) ?? users.find((u) => u.uid === activeUid);
  const activeSchedule = activeUid ? schedules[activeUid] : null;

  if (!isAdmin) {
    return (
      <p className={styles.schedulePlaceholder}>You do not have permission to view student schedules.</p>
    );
  }

  if (loading) {
    return (
      <div className={styles.schedulePlaceholder} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="spinner" style={{ width: 24, height: 24 }} />
        Loading student schedules…
      </div>
    );
  }

  return (
    <>
      <div className={styles.scheduleBrowser}>
        <div className={styles.scheduleSidebar}>
          <div className={styles.scheduleSearchWrap}>
            <input
              type="text"
              className={styles.scheduleSearch}
              placeholder="Search name, email, grade, or course…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <label className={styles.scheduleFilterLabel}>
              <input
                type="checkbox"
                checked={onlyWithSchedule}
                onChange={(e) => setOnlyWithSchedule(e.target.checked)}
              />
              Only students with a saved schedule
            </label>
            <span className={styles.scheduleCount}>
              {sortedFiltered.length} student{sortedFiltered.length === 1 ? '' : 's'}
            </span>
          </div>
          <ul className={styles.scheduleUserList}>
            {sortedFiltered.map((u) => {
              const hasSched = !!schedules[u.uid];
              const isActive = u.uid === activeUid;
              return (
                <li key={u.uid}>
                  <button
                    type="button"
                    className={`${styles.scheduleUserBtn} ${isActive ? styles.scheduleUserBtnActive : ''}`}
                    onClick={() => setSelectedUid(u.uid)}
                  >
                    <span className={styles.scheduleUserName}>{u.displayName || 'Unknown'}</span>
                    <span className={styles.scheduleUserEmail}>{u.email}</span>
                    <span className={styles.scheduleUserMeta}>
                      {u.grade ? `${u.grade}th` : 'No grade'}
                      {hasSched ? '' : ' · No schedule'}
                    </span>
                  </button>
                </li>
              );
            })}
            {sortedFiltered.length === 0 && (
              <li className={styles.scheduleEmptyList}>No students match your search.</li>
            )}
          </ul>
        </div>

        <div className={styles.scheduleDetail}>
          {!activeUser ? (
            <p className={styles.schedulePlaceholder}>Select a student to view their schedule.</p>
          ) : !activeSchedule ? (
            <div>
              <h2 className={styles.scheduleDetailTitle}>{activeUser.displayName}</h2>
              <p className={styles.schedulePlaceholder}>{activeUser.email} has not saved a schedule yet.</p>
            </div>
          ) : (
            <>
              <div className={styles.scheduleDetailHeader}>
                <div>
                  <h2 className={styles.scheduleDetailTitle}>{activeUser.displayName}</h2>
                  <p className={styles.scheduleDetailSub}>
                    {activeUser.email}
                    {activeSchedule.grade ? ` · Grade ${activeSchedule.grade}` : ''}
                  </p>
                </div>
                {!scheduleHasAnyCourse(activeSchedule) && (
                  <span className={styles.scheduleEmptyBadge}>Empty schedule</span>
                )}
              </div>
              <p className={styles.scheduleClickHint}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 15l-2 5L9 9l11 4-5 2z" />
                </svg>
                Click on a class name to see all students in that class
              </p>
              <div className={styles.scheduleGrid}>
                <SemesterView sched={activeSchedule.semester1} semester={1} onCourseClick={handleCourseClick} />
                <SemesterView sched={activeSchedule.semester2} semester={2} onCourseClick={handleCourseClick} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Class Roster Modal */}
      {viewingCourseId && (
        <div className={styles.classRosterOverlay} onClick={() => setViewingCourseId(null)}>
          <div className={styles.classRosterModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.classRosterHeader}>
              <div>
                <h2 className={styles.classRosterTitle}>{getCourseDisplayName(viewingCourseId)}</h2>
                <p className={styles.classRosterSubtitle}>
                  {studentsInCourse.length} student{studentsInCourse.length === 1 ? '' : 's'} enrolled
                </p>
              </div>
              <button
                className={styles.classRosterClose}
                onClick={() => setViewingCourseId(null)}
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {studentsInCourse.length === 0 ? (
              <div className={styles.classRosterEmpty}>
                No students have selected this class in their schedule.
              </div>
            ) : (
              <div className={styles.classRosterList}>
                {studentsInCourse.map((s, i) => (
                  <div
                    key={s.uid}
                    className={styles.classRosterItem}
                    onClick={() => {
                      setSelectedUid(s.uid);
                      setViewingCourseId(null);
                    }}
                  >
                    <div className={styles.classRosterIndex}>{i + 1}</div>
                    <div className={styles.classRosterInfo}>
                      <span className={styles.classRosterName}>{s.displayName}</span>
                      <span className={styles.classRosterEmail}>{s.email}</span>
                    </div>
                    <div className={styles.classRosterMeta}>
                      <span className={styles.classRosterGrade}>
                        {s.grade ? `${s.grade}th` : '—'}
                      </span>
                      <div className={styles.classRosterBlocks}>
                        {s.blocks.map((b) => (
                          <span key={b} className={styles.classRosterBlockBadge}>{b}</span>
                        ))}
                      </div>
                      {s.teacher && (
                        <span className={styles.classRosterTeacher}>{s.teacher}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
