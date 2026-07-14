import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Send, X, ChevronDown } from "lucide-react";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const badgeClasses = {
  Dropout:
    "border border-[#F43F5E]/30 bg-[#F43F5E]/10 text-[#F43F5E] shadow-[0_0_20px_rgba(244,63,94,0.12)]",
  Enrolled:
    "border border-[#FBBF24]/30 bg-[#FBBF24]/10 text-[#FBBF24] shadow-[0_0_20px_rgba(251,191,36,0.12)]",
  Graduate:
    "border border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399] shadow-[0_0_20px_rgba(52,211,153,0.12)]",
};

const progressClasses = {
  Dropout: "bg-[#F43F5E]",
  Enrolled: "bg-[#FBBF24]",
  Graduate: "bg-[#34D399]",
};

function StudentTable({ students = [], loading = false, onUpdatePrediction }) {
  const [checkingStudentId, setCheckingStudentId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});

  const handleRiskCheck = async (student) => {
    setCheckingStudentId(student._id);

    try {
      const response = await axios.post(
        `${apiBaseUrl}/api/students/${student._id}/predict`,
      );
      const result = response.data;

      // update parent state
      if (onUpdatePrediction) onUpdatePrediction(student._id, result);

      const updatedStudent = {
        ...student,
        predictionHistory: [
          ...(student.predictionHistory || []),
          {
            prediction: result.prediction,
            top_contributing_features: result.top_contributing_features,
            explanation: result.explanation || null,
            sources: result.sources || [],
            class_probabilities: result.class_probabilities || [],
            createdAt: new Date().toISOString(),
          },
        ],
      };

      setSelectedStudent({ student: updatedStudent, result });
      setChatMessages([]);
    } catch (error) {
      console.error("Failed to check risk", error);
    } finally {
      setCheckingStudentId(null);
    }
  };

  const handleExplain = async (event) => {
    event.preventDefault();
    if (!chatInput.trim() || !selectedStudent) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setChatInput("");
    setChatLoading(true);

    try {
      const payload = {
        prediction: selectedStudent.result.prediction,
        top_contributing_features:
          selectedStudent.result.top_contributing_features,
        student_features: {
          units_1st_approved: selectedStudent.student.units_1st_approved,
          units_2nd_approved: selectedStudent.student.units_2nd_approved,
          grade_1st: selectedStudent.student.grade_1st,
          grade_2nd: selectedStudent.student.grade_2nd,
          tuition_up_to_date: selectedStudent.student.tuition_up_to_date,
          scholarship_holder: selectedStudent.student.scholarship_holder,
        },
      };

      const response = await axios.post(
        `${apiBaseUrl}/api/students/${selectedStudent.student._id}/explain`,
        payload,
      );

      const explanation =
        response.data?.explanation ||
        response.data?.message ||
        "No explanation available.";
      const sources = response.data?.sources || [];

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: explanation, sources },
      ]);
    } catch (error) {
      console.error("Failed to get explanation", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn’t generate an explanation right now.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      <section className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_0_45px_rgba(245,158,11,0.08)] backdrop-blur-xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            Students
          </h2>
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-slate-200">
            {students.length} total
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-2xl bg-white/10"
              />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-slate-400">
            No students available yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                    Roll Number
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-transparent">
                {students.map((student) => {
                  const latest =
                    student.predictionHistory?.[
                      student.predictionHistory.length - 1
                    ];
                  const isChecked = Boolean(latest?.prediction);
                  const studentRisk = latest || null;

                  return (
                    <tr
                      key={student._id}
                      className="transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-white">
                        {student.name}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm text-slate-400">
                        {student.rollNumber}
                      </td>
                      <td className="px-4 py-4">
                        {isChecked ? (
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${badgeClasses[studentRisk.prediction] || "bg-white/10 text-slate-300"}`}
                          >
                            {studentRisk.prediction}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                            Not Checked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleRiskCheck(student)}
                          disabled={checkingStudentId === student._id}
                          className="rounded-full bg-gradient-to-r from-[#B45309] to-[#7F1D1D] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(180,83,9,0.25)] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {checkingStudentId === student._id
                            ? "Checking..."
                            : isChecked
                              ? "View Details"
                              : "Check Risk"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedStudent ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="fixed inset-0 z-40 bg-slate-950/50"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#0B0F1E]/95 p-6 shadow-[0_0_60px_rgba(245,158,11,0.18)] backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-body text-sm text-slate-400">
                    Student profile
                  </p>
                  <h3 className="font-display text-2xl font-bold text-white">
                    {selectedStudent.student.name}
                  </h3>
                  <p className="font-mono text-sm text-slate-400">
                    {selectedStudent.student.rollNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-8 flex-1 space-y-8 overflow-y-auto pr-1">
                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Prediction
                  </p>
                  <span
                    className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${badgeClasses[selectedStudent.result.prediction] || "bg-slate-100 text-slate-600"}`}
                  >
                    {selectedStudent.result.prediction}
                  </span>
                </div>

                <div>
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Class Probabilities
                  </p>
                  <div className="space-y-3">
                    {selectedStudent.result.class_probabilities?.map(
                      (entry) => (
                        <div key={entry.class_name}>
                          <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                            <span>{entry.class_name}</span>
                            <span className="font-mono">
                              {entry.probability.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${entry.probability}%` }}
                              transition={{ duration: 0.4 }}
                              className={`h-2 rounded-full ${progressClasses[entry.class_name] || "bg-gradient-to-r from-[#B45309] to-[#7F1D1D]"}`}
                            />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Top Contributing Features
                  </p>
                  <div className="space-y-3">
                    {selectedStudent.result.top_contributing_features?.map(
                      (feature) => {
                        const width = Math.max(
                          12,
                          (feature.importance || 0) * 100,
                        );
                        return (
                          <div key={feature.feature}>
                            <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                              <span>{feature.feature}</span>
                              <span className="font-mono">
                                {feature.importance.toFixed(3)}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${width}%` }}
                                transition={{ duration: 0.4 }}
                                className="h-2 rounded-full bg-gradient-to-r from-[#B45309] to-[#7F1D1D]"
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 shadow-[0_0_25px_rgba(245,158,11,0.08)]">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Ask Why
                  </p>
                  <div className="max-h-56 space-y-3 overflow-y-auto rounded-2xl bg-[#0F172A]/70 p-3">
                    {chatMessages.length === 0 && !chatLoading ? (
                      <p className="text-sm text-slate-400">
                        Ask about the prediction or supporting signals.
                      </p>
                    ) : (
                      chatMessages.map((message, index) => (
                        <>
                          <motion.div
                            key={`${message.role}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.role === "user" ? "bg-gradient-to-r from-[#B45309] to-[#7F1D1D] text-white" : "bg-white/10 text-slate-200"}`}
                            >
                              {message.content}
                            </div>
                          </motion.div>

                          {message.role === "assistant" &&
                          message.sources &&
                          message.sources.length > 0 ? (
                            <div className="mt-2 w-full px-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedSources((prev) => ({
                                    ...prev,
                                    [index]: !prev[index],
                                  }))
                                }
                                className="flex items-center gap-2 text-sm text-slate-300"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${expandedSources[index] ? "-rotate-180" : "rotate-0"}`}
                                />
                                <span className="font-semibold">Sources</span>
                                <span className="ml-2 text-xs text-slate-400">
                                  ({message.sources.length})
                                </span>
                              </button>

                              {expandedSources[index] ? (
                                <div className="mt-2 space-y-2">
                                  {message.sources.map((src, sidx) => (
                                    <div
                                      key={`src-${index}-${sidx}`}
                                      className="rounded-lg border border-white/10 bg-[#0F172A]/70 p-3"
                                    >
                                      <p className="text-sm text-slate-300">
                                        {src.text}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-400">
                                        {src.source_file}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </>
                      ))
                    )}
                    {chatLoading ? (
                      <div className="flex justify-start">
                        <div className="rounded-2xl bg-white/10 px-3 py-2">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.1s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]" />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <form
                    onSubmit={handleExplain}
                    className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-[#0F172A]/70 px-3 py-2 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Ask why this student was flagged..."
                      className="flex-1 border-0 bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-gradient-to-r from-[#B45309] to-[#7F1D1D] p-2 text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(180,83,9,0.25)]"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default StudentTable;
