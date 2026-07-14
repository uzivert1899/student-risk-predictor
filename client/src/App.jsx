import axios from "axios";
import { AlertTriangle, CheckCircle2, Clock, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import StudentTable from "./components/StudentTable";
import AddStudentModal from "./components/AddStudentModal";

function getPredictionCounts(students) {
  const counts = { dropout: 0, enrolled: 0, graduate: 0, notChecked: 0 };
  const total = students.length;

  students.forEach((student) => {
    const latestPrediction =
      student.predictionHistory?.[student.predictionHistory.length - 1]
        ?.prediction;

    if (!latestPrediction) {
      counts.notChecked += 1;
    } else if (latestPrediction === "Dropout") {
      counts.dropout += 1;
    } else if (latestPrediction === "Enrolled") {
      counts.enrolled += 1;
    } else if (latestPrediction === "Graduate") {
      counts.graduate += 1;
    }
  });

  // safety: ensure sum equals total
  const sum =
    counts.dropout + counts.enrolled + counts.graduate + counts.notChecked;
  if (sum !== total) {
    counts.notChecked = Math.max(
      0,
      total - (counts.dropout + counts.enrolled + counts.graduate),
    );
  }

  return { counts, total };
}

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [predictionCounts, setPredictionCounts] = useState({
    dropout: 0,
    enrolled: 0,
    graduate: 0,
    notChecked: 0,
  });
  const [totalStudents, setTotalStudents] = useState(0);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await axios.get("http://localhost:5000/api/students");
      const data = response.data || [];
      setStudents(data);
      const { counts, total } = getPredictionCounts(data);
      setPredictionCounts(counts);
      setTotalStudents(total);
    } catch (error) {
      console.error("Failed to load students", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleUpdatePrediction = (studentId, result) => {
    setStudents((prev) => {
      const updated = prev.map((s) => {
        if (s._id !== studentId) return s;
        const newHistory = [
          ...(s.predictionHistory || []),
          {
            prediction: result.prediction,
            top_contributing_features: result.top_contributing_features,
            explanation: result.explanation || null,
            sources: result.sources || [],
            class_probabilities: result.class_probabilities || [],
            createdAt: new Date().toISOString(),
          },
        ];
        return { ...s, predictionHistory: newHistory };
      });

      const { counts, total } = getPredictionCounts(updated);
      setPredictionCounts(counts);
      setTotalStudents(total);

      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="flex min-h-screen flex-col gap-6 p-4 md:flex-row md:p-6 lg:p-8">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onResetPredictions={fetchStudents}
        />
        <main className="relative flex-1 overflow-hidden rounded-[30px] border border-white/10 bg-[#0F172A]/70 p-6 shadow-[0_0_60px_rgba(245,158,11,0.12)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[-8%] top-[-10%] h-48 w-48 rounded-full bg-[#B45309]/20 blur-3xl" />
            <div className="absolute right-[-5%] top-[8%] h-56 w-56 rounded-full bg-[#7F1D1D]/20 blur-3xl" />
            <div className="absolute bottom-[-8%] left-[10%] h-44 w-44 rounded-full bg-[#34D399]/15 blur-3xl" />
            <div className="absolute bottom-[12%] right-[8%] h-40 w-40 rounded-full bg-[#F43F5E]/12 blur-3xl" />
          </div>
          <div className="relative z-10">
            {activeTab === "dashboard" ? (
              <>
                <DashboardHeader
                  checked={totalStudents - predictionCounts.notChecked}
                  total={totalStudents}
                />
                <div className="mt-8 grid gap-6 md:grid-cols-4">
                  <StatCard
                    label="At Risk"
                    value={predictionCounts.dropout}
                    colorVariant="dropout"
                    icon={AlertTriangle}
                  />
                  <StatCard
                    label="Enrolled"
                    value={predictionCounts.enrolled}
                    colorVariant="enrolled"
                    icon={Clock}
                  />
                  <StatCard
                    label="On Track"
                    value={predictionCounts.graduate}
                    colorVariant="graduate"
                    icon={CheckCircle2}
                  />
                  <StatCard
                    label="Not Checked"
                    value={predictionCounts.notChecked}
                    colorVariant="notChecked"
                    icon={HelpCircle}
                  />
                </div>
                <StudentTable
                  students={students}
                  loading={loadingStudents}
                  onUpdatePrediction={handleUpdatePrediction}
                />
              </>
            ) : (
              <div className="h-full">
                <div className="mb-4 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="rounded-full bg-gradient-to-r from-[#B45309] to-[#7F1D1D] px-4 py-2 text-sm font-medium text-white shadow-[0_0_24px_rgba(180,83,9,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(127,29,29,0.25)]"
                  >
                    + Add Student
                  </button>
                </div>
                <StudentTable
                  students={students}
                  loading={loadingStudents}
                  onUpdatePrediction={handleUpdatePrediction}
                />
              </div>
            )}
          </div>
        </main>
      </div>
      <AddStudentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={() => {
          setShowAddModal(false);
          setRefreshTrigger((t) => t + 1);
          setShowAddSuccess(true);
          setTimeout(() => setShowAddSuccess(false), 2500);
        }}
      />

      {/* Success toast */}
      {showAddSuccess ? (
        <div className="fixed right-6 top-6 z-50">
          <div className="rounded-lg bg-brand px-4 py-2 text-sm text-white shadow-lg">
            Student added
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
