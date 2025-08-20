import { Subject } from '@/types/user';

export const SUBJECTS_DATA: Subject[] = [
  {
    subjectId: 'quant',
    name: 'Quantitative Aptitude',
    tier: 1,
    topics: [
      {
        id: 'data_interpretation',
        name: 'Data Interpretation',
        bankingContext: 'Critical for analyzing financial statements, loan portfolios, and banking performance metrics. Banks regularly publish quarterly results with complex data tables that need quick interpretation.'
      },
      {
        id: 'arithmetic',
        name: 'Arithmetic',
        bankingContext: 'Fundamental for calculating interest rates, EMIs, loan amounts, and profit/loss scenarios in banking operations.'
      },
      {
        id: 'algebra',
        name: 'Algebra',
        bankingContext: 'Used in complex financial modeling, compound interest calculations, and investment growth projections.'
      },
      {
        id: 'geometry',
        name: 'Geometry',
        bankingContext: 'Less direct banking application but tests logical reasoning skills essential for problem-solving in banking scenarios.'
      }
    ]
  },
  {
    subjectId: 'reasoning',
    name: 'Reasoning',
    tier: 1,
    topics: [
      {
        id: 'logical_reasoning',
        name: 'Logical Reasoning',
        bankingContext: 'Essential for analyzing loan applications, identifying fraud patterns, and making sound financial decisions based on available data.'
      },
      {
        id: 'puzzles_seating',
        name: 'Puzzles & Seating Arrangement',
        bankingContext: 'Develops systematic thinking required for organizing banking operations, branch management, and customer service workflows.'
      },
      {
        id: 'blood_relations',
        name: 'Blood Relations',
        bankingContext: 'Builds analytical skills for understanding complex relationships in corporate banking and identifying beneficiaries in financial transactions.'
      }
    ]
  },
  {
    subjectId: 'english',
    name: 'English Language',
    tier: 1,
    topics: [
      {
        id: 'reading_comprehension',
        name: 'Reading Comprehension',
        bankingContext: 'Critical for understanding complex banking policies, RBI guidelines, and financial regulations that IT officers must implement.'
      },
      {
        id: 'grammar',
        name: 'Grammar',
        bankingContext: 'Essential for drafting clear technical documentation, policy documents, and communication with stakeholders in banking technology.'
      },
      {
        id: 'vocabulary',
        name: 'Vocabulary',
        bankingContext: 'Banking sector uses specialized terminology. Strong vocabulary helps in understanding and communicating complex banking and IT concepts.'
      }
    ]
  },
  {
    subjectId: 'dbms',
    name: 'Database Management System',
    tier: 2,
    topics: [
      {
        id: 'sql_basics',
        name: 'SQL Basics',
        bankingContext: 'Core banking systems rely heavily on databases. SQL skills are essential for querying customer data, transaction records, and generating reports.'
      },
      {
        id: 'normalization',
        name: 'Database Normalization',
        bankingContext: 'Critical for designing efficient banking databases that store customer information, account details, and transaction data without redundancy.'
      },
      {
        id: 'transactions_acid',
        name: 'Transactions & ACID Properties',
        bankingContext: 'Banking transactions must be ACID compliant to ensure data integrity. Understanding these properties is crucial for banking IT systems.'
      }
    ]
  },
  {
    subjectId: 'networks',
    name: 'Computer Networks',
    tier: 2,
    topics: [
      {
        id: 'osi_model',
        name: 'OSI Model',
        bankingContext: 'Banking networks must be secure and reliable. Understanding network layers helps in troubleshooting connectivity issues in banking systems.'
      },
      {
        id: 'tcp_ip',
        name: 'TCP/IP',
        bankingContext: 'All banking applications communicate over TCP/IP networks. Knowledge essential for configuring and maintaining banking network infrastructure.'
      },
      {
        id: 'network_security',
        name: 'Network Security',
        bankingContext: 'Banking networks handle sensitive financial data. Security protocols and encryption are mandatory for protecting customer information.'
      }
    ]
  }
];