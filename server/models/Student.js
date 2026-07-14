const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: String,
  rollNumber: String,
  units_1st_approved: Number,
  units_2nd_approved: Number,
  grade_1st: Number,
  grade_2nd: Number,
  tuition_up_to_date: Number,
  scholarship_holder: Number,
  age_at_enrollment: Number,
  previous_qualification_grade: Number,
  debtor: Number,
  predictionHistory: [
    {
      prediction: String,
      top_contributing_features: [mongoose.Schema.Types.Mixed],
      explanation: mongoose.Schema.Types.Mixed,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Student", studentSchema);
