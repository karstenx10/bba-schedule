'use client';

import { useMemo, useState } from 'react';
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
}

function BlockRow({
  label,
  time,
  courseId,
  teacherEmail,
}: {
  label: string;
  time?: string;
  courseId: string;
  teacherEmail?: string;
}) {
  const teacher = getTeacherDisplayName(teacherEmail);
  return (
    <div className={styles.scheduleBlock}>
      <div className={styles.scheduleBlockHeader}>
        <span className={styles.scheduleBlockLabel}>{label}</span>
        {time && <span className={styles.scheduleBlockTime}>{time}</span>}
      </div>
      <div className={styles.scheduleBlockCourse}>{getCourseDisplayName(courseId)}</div>
      {teacher && <div className={styles.scheduleBlockTeacher}>{teacher}</div>}
    </div>
  );
}

function SemesterView({ sched, semester }: { sched: SemesterSchedule; semester: 1 | 2 }) {
  return (
    <div className={styles.scheduleSemester}>
      <h3 className={styles.scheduleSemesterTitle}>Semester {semester}</h3>
      <BlockRow label="A Block" time="Daily, 8:15–9:20" courseId={sched.aBlock} teacherEmail={sched.aBlockTeacher} />
      <BlockRow label="B Block" time="Daily, 9:25–10:30" courseId={sched.bBlock} teacherEmail={sched.bBlockTeacher} />
      {sched.hasCDBlock ? (
        <BlockRow label="CD Block" time="Double, daily" courseId={sched.cdBlock} teacherEmail={sched.cdBlockTeacher} />
      ) : (
        <>
          <BlockRow label="C Block" time="Day 1" courseId={sched.cBlock} teacherEmail={sched.cBlockTeacher} />
          <BlockRow label="D Block" time="Day 2" courseId={sched.dBlock} teacherEmail={sched.dBlockTeacher} />
        </>
      )}
      <BlockRow label="E Block" time="Daily, 1:30–2:35" courseId={sched.eBlock} teacherEmail={sched.eBlockTeacher} />
    </div>
  );
}

export default function AdminSchedulesTab({ users, schedules }: AdminSchedulesTabProps) {
  const [search, setSearch] = useState('');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [onlyWithSchedule, setOnlyWithSchedule] = useState(false);

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

  const activeUid = selectedUid ?? sortedFiltered[0]?.uid ?? null;
  const activeUser = sortedFiltered.find((u) => u.uid === activeUid) ?? users.find((u) => u.uid === activeUid);
  const activeSchedule = activeUid ? schedules[activeUid] : null;

  return (
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
            <div className={styles.scheduleGrid}>
              <SemesterView sched={activeSchedule.semester1} semester={1} />
              <SemesterView sched={activeSchedule.semester2} semester={2} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
