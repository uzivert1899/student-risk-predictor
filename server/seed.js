require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("./models/Student");

const sampleStudents = [
  {
    name: "Mateo Alvarez",
    rollNumber: "202310101",
    units_1st_approved: 9,
    units_2nd_approved: 8,
    grade_1st: 58,
    grade_2nd: 54,
    tuition_up_to_date: 0,
    scholarship_holder: 0,
    age_at_enrollment: 19,
    previous_qualification_grade: 11,
    debtor: 1,
  },
  {
    name: "Lina Patel",
    rollNumber: "202310102",
    units_1st_approved: 10,
    units_2nd_approved: 9,
    grade_1st: 62,
    grade_2nd: 57,
    tuition_up_to_date: 0,
    scholarship_holder: 0,
    age_at_enrollment: 20,
    previous_qualification_grade: 13,
    debtor: 1,
  },
  {
    name: "Jorge Ramirez",
    rollNumber: "202310103",
    units_1st_approved: 8,
    units_2nd_approved: 10,
    grade_1st: 55,
    grade_2nd: 61,
    tuition_up_to_date: 0,
    scholarship_holder: 1,
    age_at_enrollment: 22,
    previous_qualification_grade: 10,
    debtor: 1,
  },
  {
    name: "Aisha Thompson",
    rollNumber: "202310201",
    units_1st_approved: 15,
    units_2nd_approved: 16,
    grade_1st: 90,
    grade_2nd: 94,
    tuition_up_to_date: 1,
    scholarship_holder: 1,
    age_at_enrollment: 18,
    previous_qualification_grade: 18,
    debtor: 0,
  },
  {
    name: "Daniel Kim",
    rollNumber: "202310202",
    units_1st_approved: 16,
    units_2nd_approved: 15,
    grade_1st: 88,
    grade_2nd: 91,
    tuition_up_to_date: 1,
    scholarship_holder: 1,
    age_at_enrollment: 19,
    previous_qualification_grade: 17,
    debtor: 0,
  },
  {
    name: "Sofia Chen",
    rollNumber: "202310203",
    units_1st_approved: 15,
    units_2nd_approved: 14,
    grade_1st: 85,
    grade_2nd: 89,
    tuition_up_to_date: 1,
    scholarship_holder: 0,
    age_at_enrollment: 21,
    previous_qualification_grade: 16,
    debtor: 0,
  },
  {
    name: "Noah Brooks",
    rollNumber: "202310301",
    units_1st_approved: 13,
    units_2nd_approved: 14,
    grade_1st: 78,
    grade_2nd: 80,
    tuition_up_to_date: 0,
    scholarship_holder: 1,
    age_at_enrollment: 24,
    previous_qualification_grade: 14,
    debtor: 1,
  },
  {
    name: "Maya Gomez",
    rollNumber: "202310302",
    units_1st_approved: 14,
    units_2nd_approved: 13,
    grade_1st: 74,
    grade_2nd: 76,
    tuition_up_to_date: 1,
    scholarship_holder: 0,
    age_at_enrollment: 23,
    previous_qualification_grade: 15,
    debtor: 0,
  },
];

async function seedStudents() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Student.deleteMany({});
    const insertedStudents = await Student.insertMany(sampleStudents);

    console.log(`Inserted ${insertedStudents.length} students`);
  } catch (error) {
    console.error("Failed to seed students:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedStudents();
