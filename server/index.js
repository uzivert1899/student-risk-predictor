require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const Student = require("./models/Student");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch students", error: error.message });
  }
});

app.post("/api/students", async (req, res) => {
  try {
    const student = new Student(req.body);
    const savedStudent = await student.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to create student", error: error.message });
  }
});

app.delete("/api/students/reset-predictions", async (req, res) => {
  try {
    const result = await Student.updateMany(
      {},
      { $set: { predictionHistory: [] } },
    );

    res.json({
      message: "Prediction histories reset successfully",
      studentsUpdated: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reset prediction histories",
      error: error.message,
    });
  }
});

app.post("/api/students/:id/predict", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const featurePayload = {
      units_1st_approved: student.units_1st_approved,
      units_2nd_approved: student.units_2nd_approved,
      grade_1st: student.grade_1st,
      grade_2nd: student.grade_2nd,
      tuition_up_to_date: student.tuition_up_to_date,
      scholarship_holder: student.scholarship_holder,
      age_at_enrollment: student.age_at_enrollment,
      previous_qualification_grade: student.previous_qualification_grade,
      debtor: student.debtor,
    };

    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/predict`,
      featurePayload,
    );

    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({
      message: "Failed to predict student risk",
      error: error.message,
    });
  }
});

app.post("/api/students/:id/explain", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const { prediction, top_contributing_features } = req.body;

    const student_features = {
      units_1st_approved: student.units_1st_approved,
      units_2nd_approved: student.units_2nd_approved,
      grade_1st: student.grade_1st,
      grade_2nd: student.grade_2nd,
      tuition_up_to_date: student.tuition_up_to_date,
      scholarship_holder: student.scholarship_holder,
    };

    const explainPayload = {
      prediction,
      top_contributing_features,
      student_features,
    };

    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/explain`,
      explainPayload,
    );

    const explanation = response.data?.explanation ?? response.data;
    const sources = response.data?.sources ?? [];

    student.predictionHistory = student.predictionHistory || [];
    student.predictionHistory.push({
      prediction,
      top_contributing_features,
      explanation,
      sources,
      createdAt: new Date(),
    });
    await student.save();

    res.json(response.data);
  } catch (error) {
    console.error(
      "AI explain error response data:",
      JSON.stringify(error.response?.data, null, 2),
    );

    const status = error.response?.status || 500;
    res.status(status).json({
      message: "Failed to explain prediction",
      error: error.message,
    });
  }
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });
