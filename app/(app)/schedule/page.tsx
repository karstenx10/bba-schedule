'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { COURSES, DEPARTMENTS, getCourseById } from '@/lib/courses';
import styles from './schedule.module.css';

interface Schedule {
  aBlock: string;
  bBlock: string;
  hasCDBlock: boolean;
  cBlock: string;
  cdBlock: string;
  dBlock: string;
  eBlock: string;
  grade?: string;
  updatedAt?: unknown;
}

const EMPTY_SCHEDULE: Schedule = {
  aBlock: '',
  bBlock: '',
  hasCDBlock: false,
  cBlock: '',
  cdBlock: '',
  dBlock: '',
  eBlock: '',
  grade: '',
};

function CourseSelect({
  id,
  value,
  onChange,
  label,
  sublabel,
  badge,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  sublabel?: string;
  badge?: string;
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
  const [schedule, setSchedule] = useState<Schedule>(EMPTY_SCHEDULE);
  const [saved, setSaved] = useState<Schedule>(EMPTY_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'schedules', user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as Schedule;
        setSchedule(data);
        setSaved(data);
      }
      setLoading(false);
    });
  }, [user]);

  const isDirty = JSON.stringify(schedule) !== JSON.stringify(saved);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const data: Schedule = { ...schedule, updatedAt: serverTimestamp() };
      await setDoc(doc(db, 'schedules', user.uid), data);

      // Update grade in user profile
      if (schedule.grade) {
        await setDoc(doc(db, 'users', user.uid), { grade: schedule.grade }, { merge: true });
      }

      // Auto-create class chat rooms for each enrolled course
      const blockCourses: { block: string; courseId: string }[] = [
        { block: 'A', courseId: schedule.aBlock },
        { block: 'B', courseId: schedule.bBlock },
        { block: schedule.hasCDBlock ? 'CD' : 'C', courseId: schedule.hasCDBlock ? schedule.cdBlock : schedule.cBlock },
        ...(!schedule.hasCDBlock && schedule.dBlock ? [{ block: 'D', courseId: schedule.dBlock }] : []),
        { block: 'E', courseId: schedule.eBlock },
      ].filter((x) => x.courseId);

      for (const { block, courseId } of blockCourses) {
        const chatId = `class_${courseId}_${block}`;
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);
        if (!chatSnap.exists()) {
          const course = getCourseById(courseId);
          await setDoc(chatRef, {
            type: 'class',
            courseName: course?.name ?? courseId,
            block,
            participants: [],
            createdAt: serverTimestamp(),
          });
        }
        // Track student enrollment in this class chat
        const enrollRef = doc(db, 'chats', chatId, 'members', user.uid);
        await setDoc(enrollRef, {
          uid: user.uid,
          joinedAt: serverTimestamp(),
        });
      }

      setSaved(data);
      setSaveMsg('Schedule saved!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setSaveMsg('Error saving. Please try again.');
    }
    setSaving(false);
  };

  const set = useCallback((key: keyof Schedule) => (value: string | boolean) => {
    setSchedule((prev) => ({ ...prev, [key]: value }));
  }, []);

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
                value={schedule.grade || ''}
                onChange={(e) => set('grade')(e.target.value)}
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

      <div className={styles.scheduleGrid}>
        {/* A Block */}
        <CourseSelect
          id="a"
          label="A"
          value={schedule.aBlock}
          onChange={set('aBlock') as (v: string) => void}
          sublabel="Block — Daily, 8:15–9:20"
        />

        {/* B Block */}
        <CourseSelect
          id="b"
          label="B"
          value={schedule.bBlock}
          onChange={set('bBlock') as (v: string) => void}
          sublabel="Block — Daily, 9:25–10:30"
        />

        {/* CD / C+D Toggle Section */}
        <div className={styles.cdSection}>
          <div className={styles.cdToggleHeader}>
            <div>
              <span className={styles.cdLabel}>C / CD Block</span>
              <span className={styles.cdSub}>Daily, 11:45–12:50</span>
            </div>
            <div className={styles.toggle}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${!schedule.hasCDBlock ? styles.toggleActive : ''}`}
                onClick={() => set('hasCDBlock')(false)}
              >
                Separate C &amp; D
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${schedule.hasCDBlock ? styles.toggleActive : ''}`}
                onClick={() => set('hasCDBlock')(true)}
              >
                CD Block (double)
              </button>
            </div>
          </div>

          {schedule.hasCDBlock ? (
            <CourseSelect
              id="cd"
              label="CD"
              value={schedule.cdBlock}
              onChange={set('cdBlock') as (v: string) => void}
              sublabel="Double Block — Every day"
              badge="Full period"
            />
          ) : (
            <div className={styles.cdPair}>
              <CourseSelect
                id="c"
                label="C"
                value={schedule.cBlock}
                onChange={set('cBlock') as (v: string) => void}
                sublabel="Day 1 only"
                badge="Alternating"
              />
              <CourseSelect
                id="d"
                label="D"
                value={schedule.dBlock}
                onChange={set('dBlock') as (v: string) => void}
                sublabel="Day 2 only"
                badge="Alternating"
              />
            </div>
          )}
        </div>

        {/* E Block */}
        <CourseSelect
          id="e"
          label="E"
          value={schedule.eBlock}
          onChange={set('eBlock') as (v: string) => void}
          sublabel="Block — Daily, 1:30–2:35"
        />
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: 'var(--green-400)' }} />
          <span>Separate C &amp; D blocks alternate by day — each course meets every other day</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: 'var(--gold-400)' }} />
          <span>CD Block is a double-length period that meets every day</span>
        </div>
      </div>
    </div>
  );
}
