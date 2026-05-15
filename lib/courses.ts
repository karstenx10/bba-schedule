// BBA Course Catalog — 2026-27
// Organized by department and course name

export interface Course {
  id: string;
  name: string;
  department: string;
  canBeCD?: boolean; // can be taken as a CD double block
}

export const DEPARTMENTS = [
  'English',
  'Social Studies',
  'Mathematics',
  'Science',
  'World Languages',
  'Creative Arts',
  'CS & Engineering',
  'Farm & Food Studies',
  'PE & Wellness',
  'Flexible Pathways',
] as const;

export const COURSES: Course[] = [
  // English
  { id: 'eng1-cp', name: 'CP English 1', department: 'English' },
  { id: 'eng1-h', name: 'Honors English 1', department: 'English' },
  { id: 'eng2-cp', name: 'CP English 2', department: 'English' },
  { id: 'eng2-h', name: 'Honors English 2', department: 'English' },
  { id: 'eng3-cp', name: 'CP English 3', department: 'English' },
  { id: 'eng3-h', name: 'Honors English 3', department: 'English' },
  { id: 'eng4-cp', name: 'CP English 4', department: 'English' },
  { id: 'eng4-h', name: 'Honors English 4', department: 'English' },
  { id: 'ap-lit', name: 'AP English Literature & Composition', department: 'English' },
  { id: 'ap-lang', name: 'AP English Language & Composition', department: 'English' },
  { id: 'creative-writing', name: 'Creative Writing', department: 'English' },
  { id: 'public-speaking', name: 'Public Speaking', department: 'English' },
  { id: 'lit-identity', name: 'Literature & Identity', department: 'English' },
  { id: 'eld-emerging', name: 'English Language Development (Emerging)', department: 'English' },
  { id: 'eld-transitioning', name: 'English Language Development (Transitioning)', department: 'English' },

  // Social Studies
  { id: 'ss1-cp', name: 'CP Social Studies 1 (Humanities)', department: 'Social Studies' },
  { id: 'ss1-h', name: 'Honors Social Studies 1 (Humanities)', department: 'Social Studies' },
  { id: 'ss2-cp', name: 'CP Social Studies 2 (World History)', department: 'Social Studies' },
  { id: 'ss2-h', name: 'Honors Social Studies 2 (World History)', department: 'Social Studies' },
  { id: 'psych-cp', name: 'CP Psychology', department: 'Social Studies' },
  { id: 'psych-h', name: 'Honors Psychology', department: 'Social Studies' },
  { id: 'econ', name: 'CP Economics', department: 'Social Studies' },
  { id: 'civics', name: 'CP Civics & Government', department: 'Social Studies' },
  { id: 'wh-20th', name: 'Honors 20th Century World History', department: 'Social Studies' },
  { id: 'ap-ush', name: 'AP U.S. History', department: 'Social Studies' },
  { id: 'ap-gov', name: 'AP Government & Politics', department: 'Social Studies' },

  // Mathematics
  { id: 'math1', name: 'Math 1', department: 'Mathematics' },
  { id: 'math2', name: 'Math 2', department: 'Mathematics' },
  { id: 'math3', name: 'Math 3', department: 'Mathematics' },
  { id: 'precalc-cp', name: 'CP Pre-Calculus', department: 'Mathematics' },
  { id: 'precalc-h', name: 'Honors Pre-Calculus', department: 'Mathematics' },
  { id: 'calc-cp', name: 'CP Calculus', department: 'Mathematics' },
  { id: 'calc-h', name: 'Honors Calculus', department: 'Mathematics' },
  { id: 'stats-h', name: 'Honors Statistics', department: 'Mathematics' },
  { id: 'ap-calc-ab', name: 'AP Calculus AB', department: 'Mathematics' },
  { id: 'ap-calc-bc', name: 'AP Calculus BC', department: 'Mathematics' },
  { id: 'ap-stats', name: 'AP Statistics', department: 'Mathematics' },

  // Science
  { id: 'physics-cp', name: 'CP Physics', department: 'Science' },
  { id: 'physics-h', name: 'Honors Physics', department: 'Science' },
  { id: 'chem-cp', name: 'CP Chemistry', department: 'Science' },
  { id: 'chem-h', name: 'Honors Chemistry', department: 'Science' },
  { id: 'bio-cp', name: 'CP Biology', department: 'Science' },
  { id: 'bio-h', name: 'Honors Biology', department: 'Science' },
  { id: 'anat-phys', name: 'Anatomy & Physiology', department: 'Science' },
  { id: 'adv-chem', name: 'Honors Advanced Chemistry (Dual Enrollment)', department: 'Science' },
  { id: 'ap-bio', name: 'AP Biology', department: 'Science' },
  { id: 'ap-chem', name: 'AP Chemistry', department: 'Science' },
  { id: 'ap-physics', name: 'AP Physics', department: 'Science' },

  // World Languages — French
  { id: 'fr1', name: 'French 1', department: 'World Languages' },
  { id: 'fr2', name: 'French 2', department: 'World Languages' },
  { id: 'fr3', name: 'French 3', department: 'World Languages' },
  { id: 'ap-fr', name: 'AP French Language & Culture', department: 'World Languages' },
  // German
  { id: 'de1', name: 'German 1', department: 'World Languages' },
  { id: 'de2', name: 'German 2', department: 'World Languages' },
  { id: 'de3', name: 'German 3', department: 'World Languages' },
  { id: 'de4-h', name: 'Honors German 4/5', department: 'World Languages' },
  { id: 'ap-de', name: 'AP German', department: 'World Languages' },
  // Spanish
  { id: 'sp1', name: 'Spanish 1', department: 'World Languages' },
  { id: 'sp2', name: 'Spanish 2', department: 'World Languages' },
  { id: 'sp3', name: 'Spanish 3', department: 'World Languages' },
  { id: 'sp4-h-fall', name: 'Honors Spanish 4/5 (Fall)', department: 'World Languages' },
  { id: 'sp4-h-spring', name: 'Honors Spanish 4/5 (Spring)', department: 'World Languages' },
  { id: 'ap-sp', name: 'AP Spanish', department: 'World Languages' },

  // Creative Arts — Media & Performing Arts
  { id: 'anim-cp', name: 'Digital Animation (CP)', department: 'Creative Arts' },
  { id: 'anim-adv', name: 'Digital Animation (Advanced)', department: 'Creative Arts' },
  { id: 'photo-found', name: 'Digital Photography (Foundations)', department: 'Creative Arts' },
  { id: 'photo-studio', name: 'Digital Photography (Studio)', department: 'Creative Arts' },
  { id: 'photo-adv', name: 'Digital Photography (Advanced)', department: 'Creative Arts' },
  { id: 'gd-found', name: 'Digital Graphic Design (Foundations)', department: 'Creative Arts' },
  { id: 'gd-studio', name: 'Digital Graphic Design (Studio)', department: 'Creative Arts' },
  { id: 'gd-adv', name: 'Digital Graphic Design (Advanced)', department: 'Creative Arts' },
  { id: 'robotics-found', name: 'Robotics Foundations', department: 'Creative Arts' },
  { id: 'vgd-found', name: 'Video Game Design (Foundations)', department: 'Creative Arts' },
  { id: 'vgd-studio', name: 'Video Game Design (Studio)', department: 'Creative Arts' },
  { id: 'vgd-adv', name: 'Video Game Design (Advanced)', department: 'Creative Arts' },
  { id: 'music-found', name: 'Applied Music (Foundations)', department: 'Creative Arts' },
  { id: 'music-studio', name: 'Applied Music (Studio)', department: 'Creative Arts' },
  { id: 'music-adv', name: 'Applied Music (Advanced)', department: 'Creative Arts' },
  { id: 'music-hist-classic', name: 'Music History (Classical)', department: 'Creative Arts' },
  { id: 'music-hist-cont', name: 'Music History (Contemporary)', department: 'Creative Arts' },
  { id: 'world-music', name: 'World Music', department: 'Creative Arts' },
  { id: 'music-prod', name: 'Music Production', department: 'Creative Arts' },
  { id: 'vocal-ensemble', name: 'Vocal Ensemble', department: 'Creative Arts' },
  { id: 'inst-ensemble', name: 'Instrumental Ensemble', department: 'Creative Arts' },
  { id: 'film-scoring', name: 'Film Scoring', department: 'Creative Arts' },
  { id: 'songwriting', name: 'Songwriting', department: 'Creative Arts' },
  // Visual Arts
  { id: 'art-nature', name: 'Art of Nature', department: 'Creative Arts' },
  { id: 'ceramics-studio', name: 'Ceramics (Studio)', department: 'Creative Arts' },
  { id: 'ceramics-adv', name: 'Ceramics (Advanced)', department: 'Creative Arts' },
  { id: 'design-found', name: 'Design (Foundations)', department: 'Creative Arts' },
  { id: 'design-studio', name: 'Design (Studio)', department: 'Creative Arts' },
  { id: 'drawing-found', name: 'Drawing & Painting (Foundations)', department: 'Creative Arts' },
  { id: 'drawing-studio', name: 'Drawing & Painting (Studio)', department: 'Creative Arts' },
  { id: 'drawing-adv', name: 'Drawing & Painting (Advanced)', department: 'Creative Arts' },
  { id: 'screen-found', name: 'Screen Printing (Foundations)', department: 'Creative Arts' },
  { id: 'screen-studio', name: 'Screen Printing (Studio)', department: 'Creative Arts' },
  { id: 'screen-adv', name: 'Screen Printing (Advanced)', department: 'Creative Arts' },
  { id: 'intro-visual-arts', name: 'Introduction to Visual Arts', department: 'Creative Arts' },
  { id: 'telesis', name: 'Telesis Integrated Honors', department: 'Creative Arts' },

  // CS & Engineering
  { id: 'arch-eng-found', name: 'Architecture & Engineering (Foundations)', department: 'CS & Engineering' },
  { id: 'arch-eng-studio', name: 'Architecture & Engineering (Studio)', department: 'CS & Engineering' },
  { id: 'eng-fab-found', name: 'Engineering & Fabrication (Foundations)', department: 'CS & Engineering' },
  { id: 'eng-fab-studio', name: 'Engineering & Fabrication (Studio)', department: 'CS & Engineering' },
  { id: 'mobile-app', name: 'Mobile App Development', department: 'CS & Engineering' },
  { id: 'robotics', name: 'Robotics', department: 'CS & Engineering' },
  { id: 'theater-tech', name: 'Theater Technology', department: 'CS & Engineering' },

  // Farm & Food Studies
  { id: 'food-systems', name: 'CP Food Systems', department: 'Farm & Food Studies' },
  { id: 'farm-to-plate', name: 'Farm to Plate', department: 'Farm & Food Studies' },
  { id: 'farm-skills', name: 'Farm Skills Internship', department: 'Farm & Food Studies' },

  // PE & Wellness
  { id: 'wellness', name: 'Wellness', department: 'PE & Wellness' },
  { id: 'pe1', name: 'PE 1', department: 'PE & Wellness' },
  { id: 'pe2-ind', name: 'PE 2 (Individual Sports)', department: 'PE & Wellness' },
  { id: 'pe2-team', name: 'PE 2 (Team Sports)', department: 'PE & Wellness' },
  { id: 'pe2-strength', name: 'PE 2 (Strength & Conditioning)', department: 'PE & Wellness' },
  { id: 'pe2-dance', name: 'PE 2 (Dance)', department: 'PE & Wellness' },
  { id: 'unified-sports', name: 'CP Unified Sports', department: 'PE & Wellness' },

  // Flexible Pathways
  { id: 'dual-enroll', name: 'Dual Enrollment', department: 'Flexible Pathways' },
  { id: 'intro-college', name: 'Introduction to College & Careers', department: 'Flexible Pathways' },
  { id: 'independent-study', name: 'Independent Study', department: 'Flexible Pathways' },
  { id: 'internship', name: 'Internship', department: 'Flexible Pathways' },
  { id: 'swtech', name: 'Southwest Tech Program', department: 'Flexible Pathways' },
  { id: 'mountain-campus', name: 'Mountain Campus Program', department: 'Flexible Pathways' },
  { id: 'free', name: 'Free / Study Hall', department: 'Flexible Pathways' },
];

export function getCourseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getCoursesByDepartment(dept: string): Course[] {
  return COURSES.filter((c) => c.department === dept);
}
