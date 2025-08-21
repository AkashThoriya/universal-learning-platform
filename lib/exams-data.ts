import { Exam } from '@/types/exam';

export const EXAMS_DATA: Exam[] = [
  {
    id: 'upsc_cse_prelims',
    name: 'UPSC CSE - Prelims',
    description: 'Union Public Service Commission Civil Services Examination - Preliminary',
    category: 'Civil Services',
    stages: [
      {
        id: 'prelims',
        name: 'Preliminary Examination',
        totalMarks: 400,
        duration: 240, // 4 hours total
        sections: [
          {
            id: 'gs_paper_1',
            name: 'General Studies Paper I',
            maxMarks: 200,
            maxTime: 120,
            negativeMarking: 0.33
          },
          {
            id: 'csat',
            name: 'Civil Services Aptitude Test (CSAT)',
            maxMarks: 200,
            maxTime: 120,
            negativeMarking: 0.33
          }
        ]
      }
    ],
    defaultSyllabus: [
      {
        id: 'history',
        name: 'History',
        tier: 1,
        estimatedHours: 120,
        topics: [
          { id: 'ancient_history', name: 'Ancient History', estimatedHours: 40 },
          { id: 'medieval_history', name: 'Medieval History', estimatedHours: 30 },
          { id: 'modern_history', name: 'Modern History', estimatedHours: 50 }
        ]
      },
      {
        id: 'geography',
        name: 'Geography',
        tier: 1,
        estimatedHours: 100,
        topics: [
          { id: 'physical_geography', name: 'Physical Geography', estimatedHours: 40 },
          { id: 'human_geography', name: 'Human Geography', estimatedHours: 30 },
          { id: 'indian_geography', name: 'Indian Geography', estimatedHours: 30 }
        ]
      },
      {
        id: 'polity',
        name: 'Indian Polity',
        tier: 1,
        estimatedHours: 80,
        topics: [
          { id: 'constitution', name: 'Constitution', estimatedHours: 30 },
          { id: 'governance', name: 'Governance', estimatedHours: 25 },
          { id: 'political_system', name: 'Political System', estimatedHours: 25 }
        ]
      },
      {
        id: 'economics',
        name: 'Economics',
        tier: 1,
        estimatedHours: 90,
        topics: [
          { id: 'basic_economics', name: 'Basic Economics', estimatedHours: 30 },
          { id: 'indian_economy', name: 'Indian Economy', estimatedHours: 40 },
          { id: 'economic_development', name: 'Economic Development', estimatedHours: 20 }
        ]
      },
      {
        id: 'environment',
        name: 'Environment & Ecology',
        tier: 2,
        estimatedHours: 60,
        topics: [
          { id: 'ecology', name: 'Ecology & Biodiversity', estimatedHours: 25 },
          { id: 'climate_change', name: 'Climate Change', estimatedHours: 20 },
          { id: 'environmental_issues', name: 'Environmental Issues', estimatedHours: 15 }
        ]
      },
      {
        id: 'science_technology',
        name: 'Science & Technology',
        tier: 2,
        estimatedHours: 70,
        topics: [
          { id: 'general_science', name: 'General Science', estimatedHours: 30 },
          { id: 'space_technology', name: 'Space Technology', estimatedHours: 20 },
          { id: 'biotechnology', name: 'Biotechnology', estimatedHours: 20 }
        ]
      },
      {
        id: 'current_affairs',
        name: 'Current Affairs',
        tier: 1,
        estimatedHours: 100,
        topics: [
          { id: 'national_current_affairs', name: 'National Current Affairs', estimatedHours: 50 },
          { id: 'international_current_affairs', name: 'International Current Affairs', estimatedHours: 30 },
          { id: 'sports_awards', name: 'Sports & Awards', estimatedHours: 20 }
        ]
      }
    ]
  },
  {
    id: 'ibps_so_it',
    name: 'IBPS SO - IT Officer',
    description: 'Institute of Banking Personnel Selection Specialist Officer - Information Technology',
    category: 'Banking',
    stages: [
      {
        id: 'prelims',
        name: 'Preliminary Examination',
        totalMarks: 125,
        duration: 45,
        sections: [
          {
            id: 'reasoning',
            name: 'Reasoning',
            maxMarks: 50,
            maxTime: 45,
            negativeMarking: 0.25
          },
          {
            id: 'english',
            name: 'English Language',
            maxMarks: 25,
            maxTime: 45,
            negativeMarking: 0.25
          },
          {
            id: 'quantitative_aptitude',
            name: 'Quantitative Aptitude',
            maxMarks: 50,
            maxTime: 45,
            negativeMarking: 0.25
          }
        ]
      },
      {
        id: 'mains',
        name: 'Main Examination',
        totalMarks: 300,
        duration: 180,
        sections: [
          {
            id: 'reasoning_computer',
            name: 'Reasoning & Computer Aptitude',
            maxMarks: 50,
            maxTime: 45,
            negativeMarking: 0.25
          },
          {
            id: 'general_banking',
            name: 'General/Economy/Banking Awareness',
            maxMarks: 50,
            maxTime: 35,
            negativeMarking: 0.25
          },
          {
            id: 'english_language',
            name: 'English Language',
            maxMarks: 50,
            maxTime: 40,
            negativeMarking: 0.25
          },
          {
            id: 'quantitative_aptitude_main',
            name: 'Quantitative Aptitude',
            maxMarks: 50,
            maxTime: 45,
            negativeMarking: 0.25
          },
          {
            id: 'professional_knowledge',
            name: 'Professional Knowledge (IT)',
            maxMarks: 60,
            maxTime: 45,
            negativeMarking: 0.25
          }
        ]
      }
    ],
    defaultSyllabus: [
      {
        id: 'quantitative_aptitude',
        name: 'Quantitative Aptitude',
        tier: 1,
        estimatedHours: 80,
        topics: [
          { id: 'data_interpretation', name: 'Data Interpretation', estimatedHours: 25 },
          { id: 'arithmetic', name: 'Arithmetic', estimatedHours: 30 },
          { id: 'algebra', name: 'Algebra', estimatedHours: 15 },
          { id: 'geometry', name: 'Geometry', estimatedHours: 10 }
        ]
      },
      {
        id: 'reasoning',
        name: 'Reasoning',
        tier: 1,
        estimatedHours: 70,
        topics: [
          { id: 'logical_reasoning', name: 'Logical Reasoning', estimatedHours: 25 },
          { id: 'puzzles_seating', name: 'Puzzles & Seating Arrangement', estimatedHours: 30 },
          { id: 'blood_relations', name: 'Blood Relations', estimatedHours: 15 }
        ]
      },
      {
        id: 'english',
        name: 'English Language',
        tier: 1,
        estimatedHours: 60,
        topics: [
          { id: 'reading_comprehension', name: 'Reading Comprehension', estimatedHours: 25 },
          { id: 'grammar', name: 'Grammar', estimatedHours: 20 },
          { id: 'vocabulary', name: 'Vocabulary', estimatedHours: 15 }
        ]
      },
      {
        id: 'computer_knowledge',
        name: 'Computer Knowledge',
        tier: 2,
        estimatedHours: 50,
        topics: [
          { id: 'computer_basics', name: 'Computer Basics', estimatedHours: 15 },
          { id: 'internet_networking', name: 'Internet & Networking', estimatedHours: 20 },
          { id: 'ms_office', name: 'MS Office', estimatedHours: 15 }
        ]
      },
      {
        id: 'professional_knowledge',
        name: 'Professional Knowledge (IT)',
        tier: 1,
        estimatedHours: 120,
        topics: [
          { id: 'programming', name: 'Programming Languages', estimatedHours: 30 },
          { id: 'database_management', name: 'Database Management', estimatedHours: 25 },
          { id: 'networking', name: 'Computer Networks', estimatedHours: 25 },
          { id: 'operating_systems', name: 'Operating Systems', estimatedHours: 20 },
          { id: 'software_engineering', name: 'Software Engineering', estimatedHours: 20 }
        ]
      },
      {
        id: 'banking_awareness',
        name: 'Banking Awareness',
        tier: 2,
        estimatedHours: 40,
        topics: [
          { id: 'banking_basics', name: 'Banking Basics', estimatedHours: 15 },
          { id: 'rbi_functions', name: 'RBI Functions', estimatedHours: 15 },
          { id: 'financial_institutions', name: 'Financial Institutions', estimatedHours: 10 }
        ]
      }
    ]
  },
  {
    id: 'ssc_cgl',
    name: 'SSC CGL',
    description: 'Staff Selection Commission Combined Graduate Level Examination',
    category: 'Government Jobs',
    stages: [
      {
        id: 'tier_1',
        name: 'Tier I',
        totalMarks: 200,
        duration: 60,
        sections: [
          {
            id: 'general_intelligence',
            name: 'General Intelligence & Reasoning',
            maxMarks: 50,
            maxTime: 60,
            negativeMarking: 0.5
          },
          {
            id: 'general_awareness',
            name: 'General Awareness',
            maxMarks: 50,
            maxTime: 60,
            negativeMarking: 0.5
          },
          {
            id: 'quantitative_aptitude',
            name: 'Quantitative Aptitude',
            maxMarks: 50,
            maxTime: 60,
            negativeMarking: 0.5
          },
          {
            id: 'english_comprehension',
            name: 'English Comprehension',
            maxMarks: 50,
            maxTime: 60,
            negativeMarking: 0.5
          }
        ]
      }
    ],
    defaultSyllabus: [
      {
        id: 'quantitative_aptitude',
        name: 'Quantitative Aptitude',
        tier: 1,
        estimatedHours: 70,
        topics: [
          { id: 'arithmetic', name: 'Arithmetic', estimatedHours: 30 },
          { id: 'algebra', name: 'Algebra', estimatedHours: 20 },
          { id: 'geometry', name: 'Geometry', estimatedHours: 20 }
        ]
      },
      {
        id: 'reasoning',
        name: 'General Intelligence & Reasoning',
        tier: 1,
        estimatedHours: 60,
        topics: [
          { id: 'logical_reasoning', name: 'Logical Reasoning', estimatedHours: 25 },
          { id: 'verbal_reasoning', name: 'Verbal Reasoning', estimatedHours: 20 },
          { id: 'non_verbal_reasoning', name: 'Non-Verbal Reasoning', estimatedHours: 15 }
        ]
      },
      {
        id: 'english',
        name: 'English Comprehension',
        tier: 1,
        estimatedHours: 50,
        topics: [
          { id: 'reading_comprehension', name: 'Reading Comprehension', estimatedHours: 20 },
          { id: 'grammar', name: 'Grammar', estimatedHours: 20 },
          { id: 'vocabulary', name: 'Vocabulary', estimatedHours: 10 }
        ]
      },
      {
        id: 'general_awareness',
        name: 'General Awareness',
        tier: 2,
        estimatedHours: 80,
        topics: [
          { id: 'history', name: 'History', estimatedHours: 25 },
          { id: 'geography', name: 'Geography', estimatedHours: 20 },
          { id: 'polity', name: 'Polity', estimatedHours: 20 },
          { id: 'economics', name: 'Economics', estimatedHours: 15 }
        ]
      }
    ]
  },
  {
    id: 'gate_cse',
    name: 'GATE - Computer Science',
    description: 'Graduate Aptitude Test in Engineering - Computer Science and Information Technology',
    category: 'Engineering',
    stages: [
      {
        id: 'gate_exam',
        name: 'GATE Examination',
        totalMarks: 100,
        duration: 180,
        sections: [
          {
            id: 'general_aptitude',
            name: 'General Aptitude',
            maxMarks: 15,
            maxTime: 180,
            negativeMarking: 0.33
          },
          {
            id: 'technical_section',
            name: 'Technical Section',
            maxMarks: 85,
            maxTime: 180,
            negativeMarking: 0.33
          }
        ]
      }
    ],
    defaultSyllabus: [
      {
        id: 'programming',
        name: 'Programming and Data Structures',
        tier: 1,
        estimatedHours: 100,
        topics: [
          { id: 'programming_concepts', name: 'Programming Concepts', estimatedHours: 30 },
          { id: 'data_structures', name: 'Data Structures', estimatedHours: 40 },
          { id: 'algorithms', name: 'Algorithms', estimatedHours: 30 }
        ]
      },
      {
        id: 'computer_organization',
        name: 'Computer Organization and Architecture',
        tier: 1,
        estimatedHours: 80,
        topics: [
          { id: 'digital_logic', name: 'Digital Logic', estimatedHours: 25 },
          { id: 'computer_organization', name: 'Computer Organization', estimatedHours: 30 },
          { id: 'memory_hierarchy', name: 'Memory Hierarchy', estimatedHours: 25 }
        ]
      },
      {
        id: 'operating_systems',
        name: 'Operating Systems',
        tier: 1,
        estimatedHours: 70,
        topics: [
          { id: 'process_management', name: 'Process Management', estimatedHours: 25 },
          { id: 'memory_management', name: 'Memory Management', estimatedHours: 25 },
          { id: 'file_systems', name: 'File Systems', estimatedHours: 20 }
        ]
      },
      {
        id: 'databases',
        name: 'Databases',
        tier: 1,
        estimatedHours: 60,
        topics: [
          { id: 'er_model', name: 'ER Model', estimatedHours: 15 },
          { id: 'relational_model', name: 'Relational Model', estimatedHours: 20 },
          { id: 'sql', name: 'SQL', estimatedHours: 15 },
          { id: 'normalization', name: 'Normalization', estimatedHours: 10 }
        ]
      },
      {
        id: 'computer_networks',
        name: 'Computer Networks',
        tier: 2,
        estimatedHours: 50,
        topics: [
          { id: 'osi_model', name: 'OSI Model', estimatedHours: 15 },
          { id: 'tcp_ip', name: 'TCP/IP', estimatedHours: 20 },
          { id: 'routing', name: 'Routing Algorithms', estimatedHours: 15 }
        ]
      },
      {
        id: 'theory_computation',
        name: 'Theory of Computation',
        tier: 2,
        estimatedHours: 60,
        topics: [
          { id: 'finite_automata', name: 'Finite Automata', estimatedHours: 20 },
          { id: 'context_free_grammar', name: 'Context Free Grammar', estimatedHours: 20 },
          { id: 'turing_machines', name: 'Turing Machines', estimatedHours: 20 }
        ]
      }
    ]
  },
  {
    id: 'cat',
    name: 'CAT',
    description: 'Common Admission Test for MBA programs',
    category: 'Management',
    stages: [
      {
        id: 'cat_exam',
        name: 'CAT Examination',
        totalMarks: 300,
        duration: 180,
        sections: [
          {
            id: 'varc',
            name: 'Verbal Ability and Reading Comprehension',
            maxMarks: 100,
            maxTime: 60,
            negativeMarking: 1
          },
          {
            id: 'dilr',
            name: 'Data Interpretation and Logical Reasoning',
            maxMarks: 100,
            maxTime: 60,
            negativeMarking: 1
          },
          {
            id: 'qa',
            name: 'Quantitative Ability',
            maxMarks: 100,
            maxTime: 60,
            negativeMarking: 1
          }
        ]
      }
    ],
    defaultSyllabus: [
      {
        id: 'quantitative_ability',
        name: 'Quantitative Ability',
        tier: 1,
        estimatedHours: 120,
        topics: [
          { id: 'arithmetic', name: 'Arithmetic', estimatedHours: 40 },
          { id: 'algebra', name: 'Algebra', estimatedHours: 30 },
          { id: 'geometry', name: 'Geometry', estimatedHours: 30 },
          { id: 'number_system', name: 'Number System', estimatedHours: 20 }
        ]
      },
      {
        id: 'data_interpretation',
        name: 'Data Interpretation and Logical Reasoning',
        tier: 1,
        estimatedHours: 100,
        topics: [
          { id: 'data_interpretation', name: 'Data Interpretation', estimatedHours: 50 },
          { id: 'logical_reasoning', name: 'Logical Reasoning', estimatedHours: 30 },
          { id: 'puzzles', name: 'Puzzles', estimatedHours: 20 }
        ]
      },
      {
        id: 'verbal_ability',
        name: 'Verbal Ability and Reading Comprehension',
        tier: 1,
        estimatedHours: 80,
        topics: [
          { id: 'reading_comprehension', name: 'Reading Comprehension', estimatedHours: 40 },
          { id: 'verbal_ability', name: 'Verbal Ability', estimatedHours: 25 },
          { id: 'grammar', name: 'Grammar', estimatedHours: 15 }
        ]
      }
    ]
  }
];

export const getExamById = (examId: string): Exam | undefined => {
  return EXAMS_DATA.find(exam => exam.id === examId);
};

export const getExamsByCategory = (category: string): Exam[] => {
  return EXAMS_DATA.filter(exam => exam.category === category);
};

export const getAllCategories = (): string[] => {
  return [...new Set(EXAMS_DATA.map(exam => exam.category))];
};

export const searchExams = (query: string): Exam[] => {
  const lowercaseQuery = query.toLowerCase();
  return EXAMS_DATA.filter(exam => 
    exam.name.toLowerCase().includes(lowercaseQuery) ||
    exam.description.toLowerCase().includes(lowercaseQuery) ||
    exam.category.toLowerCase().includes(lowercaseQuery)
  );
};