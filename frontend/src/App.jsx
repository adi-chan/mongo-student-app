import { useEffect, useState } from "react";

const API = "http://localhost:5000/api/students";

const emptyForm = {
  name: "",
  rollNo: "",
  branch: "",
  semester: "",
  cgpa: ""
};

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ------------------------------------------
  // GET STUDENTS
  // ------------------------------------------

  const fetchStudents = async () => {
    try {
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(data);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // ------------------------------------------
  // FORM CHANGE
  // ------------------------------------------

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

    setError("");
  };

  // ------------------------------------------
  // SUBMIT
  // ------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check all fields
    if (
      form.name.trim() === "" ||
      form.rollNo === "" ||
      form.branch.trim() === "" ||
      form.semester === "" ||
      form.cgpa === ""
    ) {
      setError("All fields are required");
      return;
    }

    const rollNo = Number(form.rollNo);
    const semester = Number(form.semester);
    const cgpa = Number(form.cgpa);

    // Number validation
    if (!Number.isInteger(rollNo) || rollNo < 1) {
      setError("Roll number must be a positive integer");
      return;
    }

    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      setError("Semester must be between 1 and 8");
      return;
    }

    if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
      setError("CGPA must be between 0 and 10");
      return;
    }

    const studentData = {
      name: form.name.trim(),
      rollNo,
      branch: form.branch.trim(),
      semester,
      cgpa
    };

    try {
      setLoading(true);

      const url = editingId
        ? `${API}/${editingId}`
        : API;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(studentData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Operation failed");
      }

      setForm(emptyForm);
      setEditingId(null);

      await fetchStudents();

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // EDIT
  // ------------------------------------------

  const handleEdit = (student) => {
    setEditingId(student._id);

    setForm({
      name: student.name ?? "",
      rollNo: student.rollNo ?? "",
      branch: student.branch ?? "",
      semester: student.semester ?? "",
      cgpa: student.cgpa ?? ""
    });

    setError("");
  };

  // ------------------------------------------
  // DELETE
  // ------------------------------------------

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API}/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete student");
      }

      await fetchStudents();

    } catch (error) {
      setError(error.message);
    }
  };

  // ------------------------------------------
  // CANCEL EDIT
  // ------------------------------------------

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  // ------------------------------------------
  // UI
  // ------------------------------------------

  return (
    <div className="container">

      <h1>Student Management System</h1>

      <form onSubmit={handleSubmit} className="student-form">

        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="rollNo"
          type="number"
          placeholder="Roll Number"
          value={form.rollNo}
          onChange={handleChange}
          min="1"
          step="1"
          required
        />

        <input
          name="branch"
          placeholder="Branch"
          value={form.branch}
          onChange={handleChange}
          required
        />

        <input
          name="semester"
          type="number"
          placeholder="Semester"
          value={form.semester}
          onChange={handleChange}
          min="1"
          max="8"
          step="1"
          required
        />

        <input
          name="cgpa"
          type="number"
          placeholder="CGPA"
          value={form.cgpa}
          onChange={handleChange}
          min="0"
          max="10"
          step="0.01"
          required
        />

        <button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : editingId
              ? "Update Student"
              : "Add Student"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
          >
            Cancel
          </button>
        )}

      </form>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      <h2>Students</h2>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Roll No</th>
            <th>Branch</th>
            <th>Semester</th>
            <th>CGPA</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan="6">
                No students found
              </td>
            </tr>
          ) : (
            students.map((student) => (
              <tr key={student._id}>
                <td>{student.name}</td>
                <td>{student.rollNo}</td>
                <td>{student.branch}</td>
                <td>{student.semester}</td>
                <td>{student.cgpa}</td>

                <td>
                  <button
                    onClick={() => handleEdit(student)}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(student._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

    </div>
  );
}

export default App;