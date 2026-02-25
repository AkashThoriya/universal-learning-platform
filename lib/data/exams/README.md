# Goal Data Files

This directory contains JSON data files for all supported goals in the Universal Learning Platform.

## Structure

Each JSON file represents a complete goal with:

- **Goal metadata**: ID, name, description, category
- **Stages**: Different phases of the goal (e.g., Prelims, Mains, Interview)
- **Sections**: Subdivisions within each stage
- **Default syllabus**: Complete syllabus structure with subjects, topics, and estimated study hours

## File Naming Convention

Files should be named using kebab-case following the pattern: `{goal-identifier}.json`

Examples:

- `upsc-cse-prelims.json` - UPSC Civil Services Examination (Prelims)
- `sql-mastery.json` - SQL Mastery Course
- `devops-mastery.json` - DevOps Mastery Course

## Adding New Goals

1. Create a new JSON file following the existing structure
2. Add the import statement in `lib/goals-data.ts`
3. Add the goal to the `EXAMS_DATA` array
4. Update documentation if needed

## JSON Schema

Each goal JSON file should follow this structure:

```json
{
  "id": "unique_exam_identifier",
  "name": "Human Readable Goal Name",
  "description": "Detailed description of the goal",
  "category": "Category (e.g., Technology, Banking, Civil Services)",
  "stages": [
    {
      "id": "stage_id",
      "name": "Stage Name",
      "totalMarks": 100,
      "duration": 120,
      "sections": [
        {
          "id": "section_id",
          "name": "Section Name",
          "maxMarks": 50,
          "maxTime": 60,
          "negativeMarking": 0.25
        }
      ]
    }
  ],
  "defaultSyllabus": [
    {
      "id": "subject_id",
      "name": "Subject Name",
      "tier": 1,
      "estimatedHours": 40,
      "topics": [
        {
          "id": "topic_id",
          "name": "Topic Name",
          "estimatedHours": 10
        }
      ]
    }
  ]
}
```

## Categories

Current supported categories:

- **Computer Science**: Programming (React, etc.), DevOps, Database courses, Data Structures & Algorithms
- **Banking**: Banking sector competitive goals
- **Civil Services**: Government service goals
- **Engineering**: Technical engineering goals
- **Management**: Business management goals
- **Medical**: Medical entrance goals
- **Entrance**: General entrance examinations
