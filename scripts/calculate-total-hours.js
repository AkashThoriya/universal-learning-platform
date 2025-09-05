#!/usr/bin/env node

/**
 * Script to calculate total estimated hours for exam courses
 * This script will be deleted after use
 */

const fs = require('fs');
const path = require('path');

// File paths for the exam JSON files
const examFiles = [
  'lib/data/exams/dsa-by-namastedev.json',
  'lib/data/exams/devops-mastery.json',
  'lib/data/exams/dsa-by-striver.json',
  'lib/data/exams/sql-mastery.json'
];

/**
 * Calculate total hours for a single exam
 * @param {Object} examData - The exam data object
 * @returns {number} Total estimated hours
 */
function calculateTotalHours(examData) {
  if (!examData.defaultSyllabus || !Array.isArray(examData.defaultSyllabus)) {
    return 0;
  }

  let totalHours = 0;

  examData.defaultSyllabus.forEach(subject => {
    if (subject.estimatedHours) {
      totalHours += subject.estimatedHours;
    }

    // Also check topics for additional hours
    if (subject.topics && Array.isArray(subject.topics)) {
      subject.topics.forEach(topic => {
        if (topic.estimatedHours) {
          totalHours += topic.estimatedHours;
        }
      });
    }
  });

  return totalHours;
}

/**
 * Process a single exam file
 * @param {string} filePath - Path to the exam JSON file
 */
function processExamFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    console.log(`\nProcessing: ${filePath}`);
    
    // Read the JSON file
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const examData = JSON.parse(fileContent);
    
    // Calculate total hours
    const totalHours = calculateTotalHours(examData);
    
    console.log(`- Exam: ${examData.name}`);
    console.log(`- Current total hours: ${examData.totalEstimatedHours || 'Not set'}`);
    console.log(`- Calculated total hours: ${totalHours}`);
    
    // Add total hours to the exam data
    examData.totalEstimatedHours = totalHours;
    
    // Write back to file with proper formatting
    const updatedContent = JSON.stringify(examData, null, 2);
    fs.writeFileSync(fullPath, updatedContent, 'utf8');
    
    console.log(`✅ Updated ${examData.name} with ${totalHours} total hours`);
    
    // Show breakdown by subject
    console.log(`\nSubject breakdown:`);
    examData.defaultSyllabus.forEach(subject => {
      let subjectHours = subject.estimatedHours || 0;
      
      // Add topic hours
      if (subject.topics && Array.isArray(subject.topics)) {
        subject.topics.forEach(topic => {
          if (topic.estimatedHours) {
            subjectHours += topic.estimatedHours;
          }
        });
      }
      
      console.log(`  - ${subject.name}: ${subjectHours} hours`);
    });
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Main function to process all exam files
 */
function main() {
  console.log('🚀 Starting total hours calculation for exam courses...\n');
  
  examFiles.forEach(filePath => {
    processExamFile(filePath);
  });
  
  console.log('\n✨ Total hours calculation completed for all exams!');
  console.log('\n📝 Summary:');
  
  // Generate summary
  examFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    try {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const examData = JSON.parse(fileContent);
      console.log(`- ${examData.name}: ${examData.totalEstimatedHours} hours`);
    } catch (error) {
      console.error(`Error reading ${filePath} for summary:`, error.message);
    }
  });
  
  console.log('\n🗑️  You can now delete this script as requested.');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  calculateTotalHours,
  processExamFile
};
