import { motion } from "framer-motion";
import axios from "axios";
import { useState } from "react";
import { X } from "lucide-react";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AddStudentModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    rollNumber: "",
    units_1st_approved: "",
    units_2nd_approved: "",
    grade_1st: "",
    grade_2nd: "",
    tuition_up_to_date: false,
    scholarship_holder: false,
    age_at_enrollment: "",
    previous_qualification_grade: "",
    debtor: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.rollNumber.trim()) e.rollNumber = "Required";
    [
      "units_1st_approved",
      "units_2nd_approved",
      "grade_1st",
      "grade_2nd",
      "age_at_enrollment",
      "previous_qualification_grade",
    ].forEach((k) => {
      if (form[k] === "" || form[k] === null) {
        e[k] = "Required";
      } else if (isNaN(Number(form[k]))) {
        e[k] = "Must be a number";
      }
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        rollNumber: form.rollNumber,
        units_1st_approved: Number(form.units_1st_approved),
        units_2nd_approved: Number(form.units_2nd_approved),
        grade_1st: Number(form.grade_1st),
        grade_2nd: Number(form.grade_2nd),
        tuition_up_to_date: form.tuition_up_to_date ? 1 : 0,
        scholarship_holder: form.scholarship_holder ? 1 : 0,
        age_at_enrollment: Number(form.age_at_enrollment),
        previous_qualification_grade: Number(form.previous_qualification_grade),
        debtor: form.debtor ? 1 : 0,
      };

      await axios.post(`${apiBaseUrl}/api/students`, payload);
      // reset form
      setForm({
        name: "",
        rollNumber: "",
        units_1st_approved: "",
        units_2nd_approved: "",
        grade_1st: "",
        grade_2nd: "",
        tuition_up_to_date: false,
        scholarship_holder: false,
        age_at_enrollment: "",
        previous_qualification_grade: "",
        debtor: false,
      });
      setSubmitting(false);
      onAdd();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#020617]/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0F172A]/90 p-6 shadow-[0_0_60px_rgba(245,158,11,0.22)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-white">
            Add Student
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-300 transition hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Name
            </label>
            <input
              className="w-full rounded-md border border-slate-200 px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Roll Number
            </label>
            <input
              className="w-full rounded-md border border-white/10 bg-[#0B1220] px-3 py-2 font-mono text-white outline-none placeholder:text-slate-500"
              value={form.rollNumber}
              onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
            />
            {errors.rollNumber && (
              <p className="mt-1 text-xs text-red-500">{errors.rollNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Units 1st sem (approved)
              </label>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={form.units_1st_approved}
                onChange={(e) =>
                  setForm({ ...form, units_1st_approved: e.target.value })
                }
              />
              {errors.units_1st_approved && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.units_1st_approved}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Units 2nd sem (approved)
              </label>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={form.units_2nd_approved}
                onChange={(e) =>
                  setForm({ ...form, units_2nd_approved: e.target.value })
                }
              />
              {errors.units_2nd_approved && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.units_2nd_approved}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Grade 1st sem
              </label>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={form.grade_1st}
                onChange={(e) =>
                  setForm({ ...form, grade_1st: e.target.value })
                }
              />
              {errors.grade_1st && (
                <p className="mt-1 text-xs text-red-500">{errors.grade_1st}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Grade 2nd sem
              </label>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={form.grade_2nd}
                onChange={(e) =>
                  setForm({ ...form, grade_2nd: e.target.value })
                }
              />
              {errors.grade_2nd && (
                <p className="mt-1 text-xs text-red-500">{errors.grade_2nd}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Age at enrollment
              </label>
              <input
                type="number"
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={form.age_at_enrollment}
                onChange={(e) =>
                  setForm({ ...form, age_at_enrollment: e.target.value })
                }
              />
              {errors.age_at_enrollment && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.age_at_enrollment}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Previous qualification grade
              </label>
              <input
                type="number"
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={form.previous_qualification_grade}
                onChange={(e) =>
                  setForm({
                    ...form,
                    previous_qualification_grade: e.target.value,
                  })
                }
              />
              {errors.previous_qualification_grade && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.previous_qualification_grade}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.tuition_up_to_date}
                onChange={(e) =>
                  setForm({ ...form, tuition_up_to_date: e.target.checked })
                }
              />
              <span className="text-sm text-slate-600">Tuition up to date</span>
            </label>

            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.scholarship_holder}
                onChange={(e) =>
                  setForm({ ...form, scholarship_holder: e.target.checked })
                }
              />
              <span className="text-sm text-slate-600">Scholarship holder</span>
            </label>
          </div>

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.debtor}
              onChange={(e) => setForm({ ...form, debtor: e.target.checked })}
            />
            <span className="text-sm text-slate-600">Debtor</span>
          </label>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-slate-300 transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-gradient-to-r from-[#B45309] to-[#7F1D1D] px-4 py-2 text-white shadow-[0_0_24px_rgba(180,83,9,0.25)]"
            >
              {submitting ? "Adding..." : "Add Student"}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
