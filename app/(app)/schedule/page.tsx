'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { COURSES, DEPARTMENTS, getCourseById } from '@/lib/courses';
import Link from 'next/link';
import styles from './schedule.module.css';

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
  updatedAt?: unknown;
}

const EMPTY_SEMESTER: SemesterSchedule = {
  aBlock: '',
  bBlock: '',
  hasCDBlock: false,
  cBlock: '',
  cdBlock: '',
  dBlock: '',
  eBlock: '',
};

const EMPTY_DOC: ScheduleDoc = {
  semester1: { ...EMPTY_SEMESTER },
  semester2: { ...EMPTY_SEMESTER },
  grade: '',
};

function CourseSelect({
  id,
  value,
  onChange,
  label,
  sublabel,
  badge,
  semester,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  sublabel?: string;
  badge?: string;
  semester: number;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const selected = getCourseById(value);

  const filtered = COURSES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = DEPARTMENTS.reduce<Record<string, typeof COURSES>>((acc, dept) => {
    const matches = filtered.filter((c) => c.department === dept);
    if (matches.length) acc[dept] = matches;
    return acc;
  }, {});

  const handleSelect = (courseId: string) => {
    onChange(courseId);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className={styles.blockCard}>
      <div className={styles.blockHeader}>
        <div className={styles.blockLabel}>
          <span className={styles.blockLetter}>{label}</span>
          {sublabel && <span className={styles.blockSub}>{sublabel}</span>}
        </div>
        {badge && <span className={`badge badge-green`}>{badge}</span>}
      </div>

      <div className={styles.selectWrapper}>
        <button
          className={styles.selectTrigger}
          onClick={() => setOpen(!open)}
          type="button"
        >
          {selected ? (
            <span className={styles.selectedCourse}>
              <span className={styles.selectedName}>{selected.name}</span>
              <span className={styles.selectedDept}>{selected.department}</span>
            </span>
          ) : (
            <span className={styles.placeholder}>Select a course…</span>
          )}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {selected && (
          <Link 
            href={`/classmates?courseId=${selected.id}&semester=${semester}&block=${label}`} 
            className={styles.classmateLink}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            View Classmates
          </Link>
        )}

        {open && (
          <div className={styles.dropdown}>
            <div className={styles.searchWrap}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                autoFocus
                className={styles.searchInput}
                placeholder="Search courses or departments…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className={styles.dropdownList}>
              <button
                className={styles.dropdownItem}
                onClick={() => handleSelect('')}
                type="button"
              >
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>— None / Free —</span>
              </button>

              {Object.entries(grouped).map(([dept, courses]) => (
                <div key={dept}>
                  <div className={styles.deptHeader}>{dept}</div>
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      className={`${styles.dropdownItem} ${value === course.id ? styles.dropdownItemActive : ''}`}
                      onClick={() => handleSelect(course.id)}
                      type="button"
                    >
                      {course.name}
                    </button>
                  ))}
                </div>
              ))}

              {Object.keys(grouped).length === 0 && (
                <div className={styles.noResults}>No courses found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const { user } = useAuth();
  const [semester, setSemester] = useState<1 | 2>(1);
  const [docData, setDocData] = useState<ScheduleDoc>(EMPTY_DOC);
  const [savedData, setSavedData] = useState<ScheduleDoc>(EMPTY_DOC);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'schedules', user.uid)).then((snap) => {
      if (snap.exists()) {
        const raw = snap.data() as any;
        // Migration: check if old structure (no semester keys)
        let initialized: ScheduleDoc;
        if (!raw.semester1 && !raw.semester2) {
          initialized = {
            semester1: {
              aBlock: raw.aBlock || '',
              bBlock: raw.bBlock || '',
              hasCDBlock: !!raw.hasCDBlock,
              cBlock: raw.cBlock || '',
              cdBlock: raw.cdBlock || '',
              dBlock: raw.dBlock || '',
              eBlock: raw.eBlock || '',
            },
            semester2: { ...EMPTY_SEMESTER },
            grade: raw.grade || '',
          };
        } else {
          initialized = raw as ScheduleDoc;
        }
        setDocData(initialized);
        setSavedData(initialized);
      }
      setLoading(false);
    });
  }, [user]);

  const isDirty = JSON.stringify(docData) !== JSON.stringify(savedData);
  const currentSchedule = semester === 1 ? docData.semester1 : docData.semester2;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const data: ScheduleDoc = { ...docData, updatedAt: serverTimestamp() };
      await setDoc(doc(db, 'schedules', user.uid), data);

      // Update grade in user profile
      if (docData.grade) {
        await setDoc(doc(db, 'users', user.uid), { grade: docData.grade }, { merge: true });
      }

      // Auto-create class chat rooms
      const sems = [
        { num: 1, sched: docData.semester1 },
        { num: 2, sched: docData.semester2 }
      ];

      for (const sem of sems) {
        const s = sem.sched;
        const oldS = sem.num === 1 ? savedData.semester1 : savedData.semester2;

        const newBlockCourses = [
          { block: 'A', courseId: s.aBlock },
          { block: 'B', courseId: s.bBlock },
          { block: s.hasCDBlock ? 'CD' : 'C', courseId: s.hasCDBlock ? s.cdBlock : s.cBlock },
          ...(!s.hasCDBlock && s.dBlock ? [{ block: 'D', courseId: s.dBlock }] : []),
          { block: 'E', courseId: s.eBlock },
        ].filter(x => x.courseId);

        const oldBlockCourses = [
          { block: 'A', courseId: oldS.aBlock },
          { block: 'B', courseId: oldS.bBlock },
          { block: oldS.hasCDBlock ? 'CD' : 'C', courseId: oldS.hasCDBlock ? oldS.cdBlock : oldS.cBlock },
          ...(!oldS.hasCDBlock && oldS.dBlock ? [{ block: 'D', courseId: oldS.dBlock }] : []),
          { block: 'E', courseId: oldS.eBlock },
        ].filter(x => x.courseId);

        // Remove from chats that were dropped
        for (const oldItem of oldBlockCourses) {
          const isStillInChat = newBlockCourses.some(
            (newItem) => newItem.block === oldItem.block && newItem.courseId === oldItem.courseId
          );
          if (!isStillInChat) {
            const oldChatId = `class_${oldItem.courseId}_${oldItem.block}_S${sem.num}`;
            await deleteDoc(doc(db, 'chats', oldChatId, 'members', user.uid));
          }
        }

        for (const { block, courseId } of newBlockCourses) {
          const chatId = `class_${courseId}_${block}_S${sem.num}`;
          const chatRef = doc(db, 'chats', chatId);
          const chatSnap = await getDoc(chatRef);
          if (!chatSnap.exists()) {
            const course = getCourseById(courseId);
            await setDoc(chatRef, {
              type: 'class',
              courseName: course?.name ?? courseId,
              block,
              semester: sem.num,
              createdAt: serverTimestamp(),
            });
          }
          await setDoc(doc(db, 'chats', chatId, 'members', user.uid), {
            uid: user.uid,
            joinedAt: serverTimestamp(),
          });
        }
      }

      setSavedData(data);
      setSaveMsg('Schedule saved!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setSaveMsg('Error saving. Please try again.');
    }
    setSaving(false);
  };

  const updateDoc = (key: keyof ScheduleDoc, value: string) => {
    setDocData(prev => ({ ...prev, [key]: value }));
  };

  const updateSemester = useCallback((key: keyof SemesterSchedule, value: string | boolean) => {
    setDocData(prev => ({
      ...prev,
      [semester === 1 ? 'semester1' : 'semester2']: {
        ...prev[semester === 1 ? 'semester1' : 'semester2'],
        [key]: value
      }
    }));
  }, [semester]);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
        <span>Loading your schedule…</span>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Schedule</h1>
          <div className={styles.headerRow}>
            <p className={styles.subtitle}>Select your courses for the 2026–27 school year</p>
            <div className={styles.gradeSelect}>
              <span className={styles.gradeLabel}>Grade:</span>
              <select
                className={styles.gradeInput}
                value={docData.grade || ''}
                onChange={(e) => updateDoc('grade', e.target.value)}
              >
                <option value="">Set Grade…</option>
                <option value="9">9th Grade</option>
                <option value="10">10th Grade</option>
                <option value="11">11th Grade</option>
                <option value="12">12th Grade</option>
              </select>
            </div>
          </div>
        </div>
        <div className={styles.saveArea}>
          {saveMsg && (
            <span className={`${styles.saveMsg} ${saveMsg.includes('Error') ? styles.saveMsgError : ''}`}>
              {saveMsg}
            </span>
          )}
          <button
            className={`btn btn-primary ${!isDirty ? styles.btnDisabled : ''}`}
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : null}
            {saving ? 'Saving…' : 'Save Schedule'}
          </button>
        </div>
      </div>

      <div className={styles.semesterTabs}>
        <button 
          className={`${styles.semesterTab} ${semester === 1 ? styles.semesterTabActive : ''}`}
          onClick={() => setSemester(1)}
        >
          Semester 1
        </button>
        <button 
          className={`${styles.semesterTab} ${semester === 2 ? styles.semesterTabActive : ''}`}
          onClick={() => setSemester(2)}
        >
          Semester 2
        </button>
      </div>

      <div className={styles.scheduleGrid}>
        <CourseSelect
          id="a"
          label="A"
          value={currentSchedule.aBlock}
          onChange={(v) => updateSemester('aBlock', v)}
          sublabel="Block — Daily, 8:15–9:20"
          semester={semester}
        />

        <CourseSelect
          id="b"
          label="B"
          value={currentSchedule.bBlock}
          onChange={(v) => updateSemester('bBlock', v)}
          sublabel="Block — Daily, 9:25–10:30"
          semester={semester}
        />

        <div className={styles.cdSection}>
          <div className={styles.cdToggleHeader}>
            <div>
              <span className={styles.cdLabel}>C / CD Block</span>
              <span className={styles.cdSub}>Daily, 11:45–12:50</span>
            </div>
            <div className={styles.toggle}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${!currentSchedule.hasCDBlock ? styles.toggleActive : ''}`}
                onClick={() => updateSemester('hasCDBlock', false)}
              >
                Separate C &amp; D
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${currentSchedule.hasCDBlock ? styles.toggleActive : ''}`}
                onClick={() => updateSemester('hasCDBlock', true)}
              >
                CD Block (double)
              </button>
            </div>
          </div>

          {currentSchedule.hasCDBlock ? (
            <CourseSelect
              id="cd"
              label="CD"
              value={currentSchedule.cdBlock}
              onChange={(v) => updateSemester('cdBlock', v)}
              sublabel="Double Block — Every day"
              badge="Full period"
              semester={semester}
            />
          ) : (
            <div className={styles.cdPair}>
              <CourseSelect
                id="c"
                label="C"
                value={currentSchedule.cBlock}
                onChange={(v) => updateSemester('cBlock', v)}
                sublabel="Day 1 only"
                badge="Alternating"
                semester={semester}
              />
              <CourseSelect
                id="d"
                label="D"
                value={currentSchedule.dBlock}
                onChange={(v) => updateSemester('dBlock', v)}
                sublabel="Day 2 only"
                badge="Alternating"
                semester={semester}
              />
            </div>
          )}
        </div>

        <CourseSelect
          id="e"
          label="E"
          value={currentSchedule.eBlock}
          onChange={(v) => updateSemester('eBlock', v)}
          sublabel="Block — Daily, 1:30–2:35"
          semester={semester}
        />
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: 'var(--green-400)' }} />
          <span>Separate C &amp; D blocks alternate by day — course meets Day 1 (C) or Day 2 (D)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: 'var(--gold-400)' }} />
          <span>CD Block is a double-length period that meets every day</span>
        </div>
      </div>
    </div>
  );
}
