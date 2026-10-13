const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// MongoDB Integration
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Student Schema
const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },

    rollNo: {
      type: Number,
      required: [true, "Roll number is required"],
      unique: true,
      min: [1, "Roll number must be greater than 0"],
      validate: {
        validator: Number.isInteger,
        message: "Roll number must be an integer"
      }
    },

    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true
    },

    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: [1, "Semester must be at least 1"],
      max: [8, "Semester cannot be greater than 8"],
      validate: {
        validator: Number.isInteger,
        message: "Semester must be an integer"
      }
    },

    cgpa: {
      type: Number,
      required: [true, "CGPA is required"],
      min: [0, "CGPA cannot be negative"],
      max: [10, "CGPA cannot be greater than 10"]
    }
  },
  {
    strict: true
  }
);

const Student = mongoose.model("Student", studentSchema);

// --------------------------------------------------
// GET ALL STUDENTS
// --------------------------------------------------

app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find().sort({ rollNo: 1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch students"
    });
  }
});

// --------------------------------------------------
// GET ONE STUDENT
// --------------------------------------------------

app.get("/api/students/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid student ID"
      });
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        error: "Student not found"
      });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch student"
    });
  }
});

// --------------------------------------------------
// CREATE STUDENT
// --------------------------------------------------

app.post("/api/students", async (req, res) => {
  try {
    const { name, rollNo, branch, semester, cgpa } = req.body;

    // Check missing/null fields
    if (
      name === undefined ||
      name === null ||
      rollNo === undefined ||
      rollNo === null ||
      branch === undefined ||
      branch === null ||
      semester === undefined ||
      semester === null ||
      cgpa === undefined ||
      cgpa === null
    ) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    // Check empty strings / spaces
    if (
      typeof name !== "string" ||
      name.trim() === "" ||
      typeof branch !== "string" ||
      branch.trim() === ""
    ) {
      return res.status(400).json({
        error: "Name and branch cannot be empty"
      });
    }

    // Check numeric values
    if (
      typeof rollNo !== "number" ||
      !Number.isFinite(rollNo) ||
      !Number.isInteger(rollNo)
    ) {
      return res.status(400).json({
        error: "Roll number must be a valid integer"
      });
    }

    if (
      typeof semester !== "number" ||
      !Number.isFinite(semester) ||
      !Number.isInteger(semester)
    ) {
      return res.status(400).json({
        error: "Semester must be a valid integer"
      });
    }

    if (
      typeof cgpa !== "number" ||
      !Number.isFinite(cgpa)
    ) {
      return res.status(400).json({
        error: "CGPA must be a valid number"
      });
    }

    // Create student
    const student = await Student.create({
      name: name.trim(),
      rollNo,
      branch: branch.trim(),
      semester,
      cgpa
    });

    console.log("CREATED:", student);

    res.status(201).json(student);

  } catch (error) {
    console.error(error);

    // Duplicate roll number
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Roll number already exists"
      });
    }

    // Mongoose validation
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");

      return res.status(400).json({
        error: message
      });
    }

    res.status(400).json({
      error: "Failed to create student"
    });
  }
});

// --------------------------------------------------
// UPDATE STUDENT
// --------------------------------------------------

app.put("/api/students/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid student ID"
      });
    }

    const { name, rollNo, branch, semester, cgpa } = req.body;

    // All fields required even during update
    if (
      name === undefined ||
      name === null ||
      rollNo === undefined ||
      rollNo === null ||
      branch === undefined ||
      branch === null ||
      semester === undefined ||
      semester === null ||
      cgpa === undefined ||
      cgpa === null
    ) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    // Empty strings
    if (
      typeof name !== "string" ||
      name.trim() === "" ||
      typeof branch !== "string" ||
      branch.trim() === ""
    ) {
      return res.status(400).json({
        error: "Name and branch cannot be empty"
      });
    }

    // Numeric validation
    if (
      typeof rollNo !== "number" ||
      !Number.isFinite(rollNo) ||
      !Number.isInteger(rollNo)
    ) {
      return res.status(400).json({
        error: "Roll number must be a valid integer"
      });
    }

    if (
      typeof semester !== "number" ||
      !Number.isFinite(semester) ||
      !Number.isInteger(semester)
    ) {
      return res.status(400).json({
        error: "Semester must be a valid integer"
      });
    }

    if (
      typeof cgpa !== "number" ||
      !Number.isFinite(cgpa)
    ) {
      return res.status(400).json({
        error: "CGPA must be a valid number"
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        rollNo,
        branch: branch.trim(),
        semester,
        cgpa
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!student) {
      return res.status(404).json({
        error: "Student not found"
      });
    }

    res.json(student);

  } catch (error) {
    console.error(error);

    // Duplicate roll number
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Roll number already exists"
      });
    }

    // Mongoose validation
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");

      return res.status(400).json({
        error: message
      });
    }

    res.status(400).json({
      error: "Failed to update student"
    });
  }
});

// --------------------------------------------------
// DELETE STUDENT
// --------------------------------------------------

app.delete("/api/students/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid student ID"
      });
    }

    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        error: "Student not found"
      });
    }

    res.json({
      message: "Student deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: "Failed to delete student"
    });
  }
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});