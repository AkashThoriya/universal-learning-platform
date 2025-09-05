#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Calculate total estimated hours from all subjects and their topics
 * @param {Array} subjects - Array of subjects from defaultSyllabus
 * @returns {number} - Total calculated hours
 */
function calculateTotalHours(subjects) {
  let totalHours = 0;
  
  for (const subject of subjects) {
    // Add subject-level estimated hours
    if (subject.estimatedHours) {
      totalHours += subject.estimatedHours;
    }
    
    // Add topic-level estimated hours if they exist
    if (subject.topics && Array.isArray(subject.topics)) {
      for (const topic of subject.topics) {
        if (topic.estimatedHours) {
          totalHours += topic.estimatedHours;
        }
      }
    }
  }
  
  return totalHours;
}

/**
 * Process a single exam file to add totalEstimatedHours
 * @param {string} filePath - Path to the exam JSON file
 */
function processExamFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const exam = JSON.parse(data);
    
    console.log(`\nProcessing: ${filePath}`);
    console.log(`- Exam: ${exam.name}`);
    
    // Check if exam has defaultSyllabus with estimatedHours
    if (!exam.defaultSyllabus || !Array.isArray(exam.defaultSyllabus)) {
      console.log(`❌ Skipped - No defaultSyllabus found`);
      return;
    }
    
    // Check if any subject has estimatedHours
    const hasEstimatedHours = exam.defaultSyllabus.some(subject => 
      subject.estimatedHours || 
      (subject.topics && subject.topics.some(topic => topic.estimatedHours))
    );
    
    if (!hasEstimatedHours) {
      console.log(`❌ Skipped - No estimatedHours found in subjects or topics`);
      return;
    }
    
    // Check if totalEstimatedHours already exists
    if (exam.totalEstimatedHours !== undefined) {
      console.log(`⚠️  Already has totalEstimatedHours: ${exam.totalEstimatedHours}`);
      return;
    }
    
    // Calculate total hours
    const calculatedHours = calculateTotalHours(exam.defaultSyllabus);
    
    if (calculatedHours === 0) {
      console.log(`❌ Skipped - Calculated 0 hours`);
      return;
    }
    
    // Add totalEstimatedHours to exam object
    exam.totalEstimatedHours = calculatedHours;
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(exam, null, 2));
    
    console.log(`✅ Updated ${exam.name} with ${calculatedHours} total hours`);
    
    // Show subject breakdown
    console.log('\nSubject breakdown:');
    for (const subject of exam.defaultSyllabus) {
      let subjectTotal = subject.estimatedHours || 0;
      if (subject.topics) {
        const topicTotal = subject.topics.reduce((sum, topic) => sum + (topic.estimatedHours || 0), 0);
        subjectTotal += topicTotal;
      }
      if (subjectTotal > 0) {
        console.log(`  - ${subject.name}: ${subjectTotal} hours`);
      }
    }
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Main execution
const examsDir = path.join(__dirname, '..', 'lib', 'data', 'exams');

console.log('🚀 Starting total hours calculation for all exam courses...\n');

try {
  const files = fs.readdirSync(examsDir);
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  
  if (jsonFiles.length === 0) {
    console.log('❌ No JSON files found in exams directory');
    process.exit(1);
  }
  
  for (const file of jsonFiles) {
    const filePath = path.join(examsDir, file);
    processExamFile(filePath);
  }
  
  console.log('\n✨ Total hours calculation completed for all qualifying exams!');
  console.log('\n🗑️  You can now delete this script as requested.');
  
} catch (error) {
  console.error('Error reading exams directory:', error.message);
  process.exit(1);
}
