// Script to convert JSON subtopics from string[] to Subtopic[]
const fs = require('fs');
const path = require('path');

const files = [
    'systems-dsa.json',
    'nodejs-by-namastedev.json',
    'react-by-namastedev.json'
];

files.forEach(filename => {
    const filePath = path.join(__dirname, '../lib/data/exams', filename);

    // Read the JSON file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let convertedCount = 0;

    // Transform subtopics
    data.defaultSyllabus.forEach((subject) => {
        subject.topics.forEach((topic) => {
            if (topic.subtopics && Array.isArray(topic.subtopics)) {
                topic.subtopics = topic.subtopics.map((subtopic, index) => {
                    // If it's already an object, keep it
                    if (typeof subtopic === 'object' && subtopic.id) {
                        return subtopic;
                    }

                    convertedCount++;

                    // Convert string to Subtopic object
                    return {
                        id: `${topic.id}_sub_${index}`,
                        name: subtopic, // Preserve ALL original content
                        order: index,
                        status: 'not_started',
                        needsReview: false,
                        practiceCount: 0,
                        revisionCount: 0
                    };
                });
            }
        });
    });

    // Write back to JSON file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');

    console.log(`${filename}: Converted ${convertedCount} subtopics`);
});

console.log('\\nAll conversions complete!');

console.log(`Total topics: ${data.defaultSyllabus.reduce((acc, s) => acc + s.topics.length, 0)}`);
console.log(`Total subtopics: ${data.defaultSyllabus.reduce((acc, s) =>
    acc + s.topics.reduce((t, topic) => t + (topic.subtopics?.length || 0), 0), 0)}`);
