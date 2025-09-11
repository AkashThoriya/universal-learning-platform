# Data Directory

This directory contains data files and utilities for the Exam Strategy Engine.

## Directory Structure

```
lib/data/
├── exams/              # JSON files containing exam data
│   ├── README.md       # Documentation for exam data files
│   ├── cat.json        # CAT exam data
│   ├── gate-cse.json   # GATE CSE exam data
│   ├── sql-mastery.json # SQL Mastery course data
│   └── ...             # Other exam JSON files
├── index.ts            # Main data exports
├── learning-templates.ts # Learning path templates
├── onboarding.ts       # Onboarding flow data
└── ui-content.ts       # UI text and content
```

## File Types

### JSON Files (`exams/` directory)

- **Purpose**: Static exam data with complete syllabus structures
- **Format**: Structured JSON following the exam schema
- **Usage**: Imported into TypeScript modules for type-safe access

### TypeScript Files (root `data/` directory)

- **Purpose**: Utilities, templates, and dynamic data processing
- **Format**: TypeScript modules with proper type definitions
- **Usage**: Imported throughout the application for data operations

## Organization Principles

1. **Separation of Concerns**: JSON data files are separated from TypeScript utilities
2. **Type Safety**: All data is properly typed using TypeScript interfaces
3. **Maintainability**: Clear directory structure makes it easy to find and update files
4. **Scalability**: New exams can be easily added without cluttering the main directory

## Adding New Data

### For Exam Data

1. Create a new JSON file in the `exams/` directory
2. Follow the schema documented in `exams/README.md`
3. Import and register the exam in `lib/exams-data.ts`

### For Utility Data

1. Create or update TypeScript files in the root `data/` directory
2. Ensure proper type definitions
3. Export through `index.ts` if needed for broader access
