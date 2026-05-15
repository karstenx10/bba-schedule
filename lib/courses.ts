// BBA Course Catalog — 2026-27
// Organized by department and course name

export interface Course {
  id: string;
  name: string;
  department: string;
  canBeCD?: boolean;
}

export const DEPARTMENTS = [
  'English',
  'Social Studies',
  'Mathematics',
  'Science',
  'World Languages',
  'Creative Arts: Media & Performing',
  'Creative Arts: Visual & Design',
  'CS & Engineering',
  'Farm & Food Studies',
  'PE & Wellness',
  'Flexible Pathways',
] as const;

export const COURSES: Course[] = [
  // English
  { id: 'eng1-cp', name: 'CP Humanities 1 (English)', department: 'English' },
  { id: 'eng2-cp', name: 'CP English 2: Literature and Composition', department: 'English' },
  { id: 'eng2-h', name: 'Honors English 2: Literature and Composition', department: 'English' },
  { id: 'eng-outdoor', name: 'CP/Honors Literature, Leadership, and Learning in the Outdoors', department: 'English' },
  { id: 'eng-env-chem', name: 'CP/Honors Environmental Chemistry and Literature', department: 'English' },
  { id: 'eng-cons-bio', name: 'CP/Honors Conservation Biology and Environmental Literacy', department: 'English' },
  { id: 'eng3-cp', name: 'CP English 3: Self, Society, and Identity', department: 'English' },
  { id: 'eng3-h', name: 'Honors English 3: Self, Society, and Identity', department: 'English' },
  { id: 'american-studies-eng', name: 'CP/Honors American Studies (English)', department: 'English' },
  { id: 'ap-lang', name: 'AP English Language and Composition', department: 'English' },
  { id: 'ap-lit', name: 'AP English Literature and Composition', department: 'English' },
  { id: 'creative-writing', name: 'CP Creative Writing', department: 'English' },
  { id: 'eng4-cp', name: 'CP English 4', department: 'English' },
  { id: 'holocaust-eng', name: 'CP Holocaust Studies (English)', department: 'English' },
  { id: 'myth-memoir', name: 'CP Myth and Memoir: Telling Stories', department: 'English' },
  { id: 'neurodiversity-eng', name: 'CP Neurodiversity Studies (English)', department: 'English' },
  { id: 'eld-1', name: 'English Language Arts 1 (ELD)', department: 'English' },
  { id: 'eld-2', name: 'English Language Arts 2 (ELD)', department: 'English' },
  { id: 'eld-3', name: 'English Language Arts 3 (ELD)', department: 'English' },
  { id: 'eld-4', name: 'English Language Arts 4 (ELD)', department: 'English' },
  { id: 'lang-lit', name: 'The Language of Literature', department: 'English' },

  // Social Studies
  { id: 'ss1-cp', name: 'CP Humanities 1 (Social Studies)', department: 'Social Studies' },
  { id: 'ss2-civics', name: 'CP SS 2: Civics, Democracy and Social Change', department: 'Social Studies' },
  { id: 'ss3-world', name: 'CP SS 3: The United States and the World', department: 'Social Studies' },
  { id: 'gov-h', name: 'Honors U.S. Government and Politics', department: 'Social Studies' },
  { id: 'american-studies-ss', name: 'CP/Honors American Studies (Social Studies)', department: 'Social Studies' },
  { id: 'ap-ush', name: 'AP United States History', department: 'Social Studies' },
  { id: 'ancient-world-h', name: 'CP/Honors Ancient World History', department: 'Social Studies' },
  { id: 'climate-change', name: 'CP Climate, Leadership and Change', department: 'Social Studies' },
  { id: 'cons-bio-ss', name: 'CP/Honors Conservation Biology and Environmental Literacy (SS)', department: 'Social Studies' },
  { id: 'contemporary-issues', name: 'CP Contemporary Issues', department: 'Social Studies' },
  { id: 'entrepreneurship', name: 'CP/Honors Entrepreneurship', department: 'Social Studies' },
  { id: 'food-systems-ss', name: 'CP Food Systems (Social Studies)', department: 'Social Studies' },
  { id: 'holocaust-ss', name: 'CP Holocaust Studies (Social Studies)', department: 'Social Studies' },
  { id: 'medieval-history', name: 'CP Medieval History', department: 'Social Studies' },
  { id: 'ap-micro', name: 'AP Microeconomics', department: 'Social Studies' },
  { id: 'military-history', name: 'CP Military History', department: 'Social Studies' },
  { id: 'mun-h', name: 'Honors Model United Nations', department: 'Social Studies' },
  { id: 'psych-cp', name: 'CP Psychology', department: 'Social Studies' },
  { id: 'ap-psych', name: 'AP Psychology', department: 'Social Studies' },
  { id: 'small-biz', name: 'CP Small Business Start-up, Management and Economics', department: 'Social Studies' },

  // Mathematics
  { id: 'math-stem-found', name: 'Foundations of STEM (Math)', department: 'Mathematics' },
  { id: 'alg1-cp', name: 'CP Algebra 1', department: 'Mathematics' },
  { id: 'alg1-h', name: 'Honors Algebra 1', department: 'Mathematics' },
  { id: 'geom-conceptual', name: 'Conceptual Geometry', department: 'Mathematics' },
  { id: 'geom-cp', name: 'CP Geometry', department: 'Mathematics' },
  { id: 'geom-h', name: 'Honors Geometry', department: 'Mathematics' },
  { id: 'alg2-cp', name: 'CP Algebra 2', department: 'Mathematics' },
  { id: 'alg2-h', name: 'Honors Algebra 2', department: 'Mathematics' },
  { id: 'precalc-cp', name: 'CP Pre-Calculus', department: 'Mathematics' },
  { id: 'precalc-h', name: 'Honors Pre-Calculus', department: 'Mathematics' },
  { id: 'calc-h', name: 'Honors Calculus', department: 'Mathematics' },
  { id: 'ap-calc-ab', name: 'AP Calculus AB', department: 'Mathematics' },
  { id: 'ap-calc-bc', name: 'AP Calculus BC', department: 'Mathematics' },
  { id: 'data-science', name: 'CP/Honors Data Science', department: 'Mathematics' },
  { id: 'personal-finance', name: 'Personal Finance', department: 'Mathematics' },
  { id: 'stats-cp', name: 'CP/Honors Statistics', department: 'Mathematics' },
  { id: 'ap-stats', name: 'AP Statistics', department: 'Mathematics' },

  // Science
  { id: 'sci-stem-found', name: 'Foundations of STEM (Science)', department: 'Science' },
  { id: 'sci-found', name: 'CP Foundations of Science', department: 'Science' },
  { id: 'phys1-h', name: 'Honors Physics 1', department: 'Science' },
  { id: 'chem-cp', name: 'CP Chemistry', department: 'Science' },
  { id: 'chem-h', name: 'Honors Chemistry', department: 'Science' },
  { id: 'ap-chem', name: 'AP Chemistry', department: 'Science' },
  { id: 'sci-env-chem', name: 'CP/Honors Environmental Chemistry and Literature (Science)', department: 'Science' },
  { id: 'sci-cons-bio', name: 'CP/Honors Conservation Biology and Environmental Literacy (Science)', department: 'Science' },
  { id: 'bio-cp', name: 'CP Biology', department: 'Science' },
  { id: 'bio-h', name: 'Honors Biology', department: 'Science' },
  { id: 'ap-bio', name: 'AP Biology', department: 'Science' },
  { id: 'phys2-ap', name: 'Honors/AP Physics 2', department: 'Science' },
  { id: 'phys-c', name: 'AP Physics C: Mechanics', department: 'Science' },
  { id: 'anat-phys', name: 'CP/Honors Anatomy and Physiology', department: 'Science' },
  { id: 'forensics', name: 'Forensic Science', department: 'Science' },
  { id: 'biotech', name: 'CP/Honors Introduction to Biotechnology', department: 'Science' },
  { id: 'astronomy', name: 'CP/Honors Modern Astronomy', department: 'Science' },

  // World Languages
  { id: 'fr1', name: 'French 1', department: 'World Languages' },
  { id: 'fr2', name: 'French 2', department: 'World Languages' },
  { id: 'fr3', name: 'French 3', department: 'World Languages' },
  { id: 'fr4h', name: 'Honors French 4/5', department: 'World Languages' },
  { id: 'ap-fr', name: 'AP French', department: 'World Languages' },
  { id: 'de1', name: 'German 1', department: 'World Languages' },
  { id: 'de2', name: 'German 2', department: 'World Languages' },
  { id: 'de3', name: 'German 3', department: 'World Languages' },
  { id: 'de4h', name: 'Honors German 4/5', department: 'World Languages' },
  { id: 'ap-de', name: 'AP German', department: 'World Languages' },
  { id: 'sp1', name: 'Spanish 1', department: 'World Languages' },
  { id: 'sp2', name: 'Spanish 2', department: 'World Languages' },
  { id: 'sp3', name: 'Spanish 3', department: 'World Languages' },
  { id: 'sp4h', name: 'Honors Spanish 4/5', department: 'World Languages' },
  { id: 'ap-sp', name: 'AP Spanish', department: 'World Languages' },

  // Creative Arts: Media & Performing
  { id: 'dance-found', name: 'Dance: Foundations', department: 'Creative Arts: Media & Performing' },
  { id: 'dance-studio', name: 'Dance: Studio', department: 'Creative Arts: Media & Performing' },
  { id: 'dance-adv', name: 'Dance: CP Advanced Projects', department: 'Creative Arts: Media & Performing' },
  { id: 'film-cinematography', name: 'Film Production: Cinematography', department: 'Creative Arts: Media & Performing' },
  { id: 'film-acting', name: 'Film Production: Acting', department: 'Creative Arts: Media & Performing' },
  { id: 'film-directing', name: 'Film Production: Directing', department: 'Creative Arts: Media & Performing' },
  { id: 'film-musical', name: 'Film Production: Musical Theater', department: 'Creative Arts: Media & Performing' },
  { id: 'film-writing', name: 'Film Production: Writing for Stage/Screen', department: 'Creative Arts: Media & Performing' },
  { id: 'tech-theater', name: 'Technical Theater', department: 'Creative Arts: Media & Performing' },
  { id: 'anim-found', name: 'Digital Animation: Foundations', department: 'Creative Arts: Media & Performing' },
  { id: 'anim-studio', name: 'Digital Animation: Studio', department: 'Creative Arts: Media & Performing' },
  { id: 'anim-adv', name: 'Digital Animation: CP Advanced Projects', department: 'Creative Arts: Media & Performing' },
  { id: 'music-found', name: 'Applied Music: Foundations', department: 'Creative Arts: Media & Performing' },
  { id: 'music-studio', name: 'Applied Music: Studio', department: 'Creative Arts: Media & Performing' },
  { id: 'music-adv', name: 'Applied Music: CP Advanced Projects', department: 'Creative Arts: Media & Performing' },
  { id: 'music-theory', name: 'CP/Honors Music Theory', department: 'Creative Arts: Media & Performing' },
  { id: 'music-prod-found', name: 'Music Production: Foundations', department: 'Creative Arts: Media & Performing' },
  { id: 'music-prod-studio', name: 'Music Production: Studio', department: 'Creative Arts: Media & Performing' },
  { id: 'vocal-ensemble', name: 'Vocal Music Ensemble', department: 'Creative Arts: Media & Performing' },
  { id: 'inst-ensemble', name: 'Instrumental Music Ensemble', department: 'Creative Arts: Media & Performing' },

  // Creative Arts: Visual & Design
  { id: 'art-nature', name: 'Art of Nature', department: 'Creative Arts: Visual & Design' },
  { id: 'ceramics-found', name: 'Ceramics: Foundations', department: 'Creative Arts: Visual & Design' },
  { id: 'ceramics-studio', name: 'Ceramics: Studio', department: 'Creative Arts: Visual & Design' },
  { id: 'ceramics-adv', name: 'Ceramics: CP Advanced Projects', department: 'Creative Arts: Visual & Design' },
  { id: 'design-found', name: 'Design: Foundations', department: 'Creative Arts: Visual & Design' },
  { id: 'design-studio', name: 'Design: Studio', department: 'Creative Arts: Visual & Design' },
  { id: 'design-adv', name: 'Design: CP Advanced Projects', department: 'Creative Arts: Visual & Design' },
  { id: 'visual-art-found', name: 'Visual Art: Foundations in Painting/Drawing', department: 'Creative Arts: Visual & Design' },
  { id: 'visual-art-studio', name: 'Visual Art: Studio Drawing/Painting', department: 'Creative Arts: Visual & Design' },
  { id: 'visual-art-adv', name: 'Visual Art: CP Advanced Projects', department: 'Creative Arts: Visual & Design' },
  { id: 'woodworking-found', name: 'Woodworking: Foundations', department: 'Creative Arts: Visual & Design' },
  { id: 'woodworking-studio', name: 'Woodworking: Studio', department: 'Creative Arts: Visual & Design' },
  { id: 'jewelry-making', name: 'DE Introduction to Jewelry Making', department: 'Creative Arts: Visual & Design' },

  // CS & Engineering
  { id: 'prog1', name: 'CP Programming 1', department: 'CS & Engineering' },
  { id: 'prog2', name: 'CP Programming 2', department: 'CS & Engineering' },
  { id: 'ap-cs-a', name: 'AP Computer Science A', department: 'CS & Engineering' },
  { id: 'robotics-found', name: 'Robotics: Foundations', department: 'CS & Engineering' },
  { id: 'robotics-adv', name: 'CP/Honors Advanced Robotics', department: 'CS & Engineering' },
  { id: 'cad', name: 'CP Engineering Through CAD', department: 'CS & Engineering' },
  { id: 'adv-eng', name: 'CP Advanced Engineering', department: 'CS & Engineering' },

  // Farm & Food Studies
  { id: 'farm-ethnobotany', name: 'CP Ethnobotany: Plants and Humans', department: 'Farm & Food Studies' },
  { id: 'farm-to-plate', name: 'Farm to Plate', department: 'Farm & Food Studies' },
  { id: 'farm-food-systems', name: 'CP Food Systems', department: 'Farm & Food Studies' },
  { id: 'sustainable-ag', name: 'CP Sustainable Agriculture', department: 'Farm & Food Studies' },

  // PE & Wellness
  { id: 'wellness', name: 'Wellness', department: 'PE & Wellness' },
  { id: 'thrive', name: 'CP Thrive: Mind, Body, and Soul', department: 'PE & Wellness' },
  { id: 'group-fitness', name: 'Group Fitness: Cardio, Core, Strength', department: 'PE & Wellness' },
  { id: 'personal-fitness', name: 'Personal Fitness', department: 'PE & Wellness' },
  { id: 'sport-education', name: 'Sport Education', department: 'PE & Wellness' },
  { id: 'sports-medicine', name: 'CP Sports Medicine', department: 'PE & Wellness' },
  { id: 'vermont-place', name: 'Vermont: A Study of Place', department: 'PE & Wellness' },
  { id: 'yoga', name: 'Yoga', department: 'PE & Wellness' },

  // Flexible Pathways
  { id: 'dual-enroll', name: 'Dual Enrollment (General)', department: 'Flexible Pathways' },
  { id: 'college-careers', name: 'Introduction to College and Careers', department: 'Flexible Pathways' },
  { id: 'internship', name: 'Work-Based Learning: Internships', department: 'Flexible Pathways' },
  { id: 'trades', name: 'Tools, Techniques, and the Trades', department: 'Flexible Pathways' },
  { id: 'free', name: 'Free / Study Hall', department: 'Flexible Pathways' },
  { id: 'swtech', name: 'Southwest Tech Program', department: 'Flexible Pathways' },
];

export function getCourseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getCoursesByDepartment(dept: string): Course[] {
  return COURSES.filter((c) => c.department === dept);
}
