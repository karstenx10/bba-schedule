import { getCourseById, TEACHERS } from '@/lib/courses';

export interface SemesterSchedule {
  aBlock: string;
  aBlockTeacher?: string;
  bBlock: string;
  bBlockTeacher?: string;
  hasCDBlock: boolean;
  cBlock: string;
  cBlockTeacher?: string;
  cdBlock: string;
  cdBlockTeacher?: string;
  dBlock: string;
  dBlockTeacher?: string;
  eBlock: string;
  eBlockTeacher?: string;
}

export interface ScheduleDoc {
  semester1: SemesterSchedule;
  semester2: SemesterSchedule;
  grade: string;
  updatedAt?: unknown;
}

export const EMPTY_SEMESTER: SemesterSchedule = {
  aBlock: '',
  aBlockTeacher: '',
  bBlock: '',
  bBlockTeacher: '',
  hasCDBlock: false,
  cBlock: '',
  cBlockTeacher: '',
  cdBlock: '',
  cdBlockTeacher: '',
  dBlock: '',
  dBlockTeacher: '',
  eBlock: '',
  eBlockTeacher: '',
};

export function parseScheduleDoc(raw: Record<string, unknown> | undefined): ScheduleDoc | null {
  if (!raw) return null;

  if (!raw.semester1 && !raw.semester2) {
    return {
      semester1: {
        ...EMPTY_SEMESTER,
        aBlock: (raw.aBlock as string) || '',
        bBlock: (raw.bBlock as string) || '',
        hasCDBlock: !!raw.hasCDBlock,
        cBlock: (raw.cBlock as string) || '',
        cdBlock: (raw.cdBlock as string) || '',
        dBlock: (raw.dBlock as string) || '',
        eBlock: (raw.eBlock as string) || '',
      },
      semester2: { ...EMPTY_SEMESTER },
      grade: (raw.grade as string) || '',
      updatedAt: raw.updatedAt,
    };
  }

  return {
    semester1: { ...EMPTY_SEMESTER, ...(raw.semester1 as SemesterSchedule) },
    semester2: { ...EMPTY_SEMESTER, ...(raw.semester2 as SemesterSchedule) },
    grade: (raw.grade as string) || '',
    updatedAt: raw.updatedAt,
  };
}

export function getCourseDisplayName(courseId: string): string {
  if (!courseId) return '—';
  return getCourseById(courseId)?.name ?? courseId;
}

export function getTeacherDisplayName(email: string | undefined): string {
  if (!email) return '';
  return TEACHERS.find((t) => t.email === email)?.name ?? email;
}

export function scheduleHasAnyCourse(sched: ScheduleDoc): boolean {
  const check = (s: SemesterSchedule) =>
    !!(s.aBlock || s.bBlock || s.cBlock || s.dBlock || s.cdBlock || s.eBlock);
  return check(sched.semester1) || check(sched.semester2);
}
