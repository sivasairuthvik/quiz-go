import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Quiz from '../models/Quiz.model.js';
import Question from '../models/Question.model.js';
import connectDB from '../config/database.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    // Clear existing data (optional)
    // await User.deleteMany({});
    // await Quiz.deleteMany({});
    // await Question.deleteMany({});

    // Create admin user (password: admin123)
    let admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      admin = await User.create({
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
      });
    }
    console.log('Admin user created:', admin.email, '(password: admin123)');

    // Create demo teachers (password: teacher123)
    const teachers = [];
    for (let i = 1; i <= 2; i++) {
      let teacher = await User.findOne({ email: `teacher${i}@example.com` });
      if (!teacher) {
        teacher = await User.create({
          email: `teacher${i}@example.com`,
          password: 'teacher123',
          name: `Teacher ${i}`,
          role: 'teacher',
        });
      }
      teachers.push(teacher);
      console.log(`Teacher ${i} created:`, teacher.email, '(password: teacher123)');
    }

    // Create demo students (password: student123)
    const students = [];
    for (let i = 1; i <= 10; i++) {
      let student = await User.findOne({ email: `student${i}@example.com` });
      if (!student) {
        student = await User.create({
          email: `student${i}@example.com`,
          password: 'student123',
          name: `Student ${i}`,
          role: 'student',
        });
      }
      students.push(student);
      console.log(`Student ${i} created:`, student.email, '(password: student123)');
    }

    // Create sample quizzes
    if (teachers.length > 0) {
      const teacher = teachers[0];

      for (let i = 1; i <= 4; i++) {
        const questions = [];
        
        // Create questions for each quiz
        for (let j = 1; j <= 5; j++) {
          const question = await Question.create({
            source: 'manual',
            stem: `Sample Question ${j} for Quiz ${i}: What is the answer?`,
            choices: [
              { text: 'Option A', meta: '' },
              { text: 'Option B', meta: '' },
              { text: 'Option C', meta: '' },
              { text: 'Option D', meta: '' },
            ],
            correctIndex: 0,
            marks: 2,
            difficulty: 'medium',
            topic_tags: ['sample', 'demo'],
            explanation: `This is the correct answer for question ${j}.`,
            createdBy: teacher._id,
          });
          questions.push(question._id);
        }

        const quiz = await Quiz.create({
          title: `Sample Quiz ${i}`,
          description: `This is a sample quiz number ${i} for demonstration purposes.`,
          creatorId: teacher._id,
          questions,
          settings: {
            duration_minutes: 30,
            total_marks: 10,
            pass_marks: 5,
            difficulty_overall: 'medium',
            shuffle_questions: false,
            is_published: i % 2 === 0, // Publish even-numbered quizzes
            allow_retake: false,
          },
        });

        console.log(`Quiz ${i} created:`, quiz.title);
      }
    }

    console.log('✅ Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();

