"use client";

import { Plus, Target, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useGoalStore from "../../../store/useGoalStore.js";
import useWorkspaceStore from "../../../store/useWorkspaceStore.js";

const emptyMilestone = { title: "", progressPercentage: 0 };
const emptyGoal = {
  title: "",
  description: "",
  status: "PENDING",
  dueDate: "",
  milestones: [emptyMilestone],
};

const statusLabels = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export default function GoalsPage() {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const goals = useGoalStore((state) => state.goals);
  const isLoading = useGoalStore((state) => state.isLoading);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);
  const createGoal = useGoalStore((state) => state.createGoal);
  const deleteGoal = useGoalStore((state) => state.deleteGoal);
  const updateGoal = useGoalStore((state) => state.updateGoal);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyGoal);

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchGoals(activeWorkspace.id).catch((error) =>
        toast.error(error.message),
      );
    }
  }, [activeWorkspace?.id, fetchGoals]);

  const completionStats = useMemo(() => {
    const completed = goals.filter(
      (goal) => goal.status === "COMPLETED",
    ).length;
    return `${completed}/${goals.length}`;
  }, [goals]);

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const updateMilestone = (index, field, value) => {
    setForm((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, milestoneIndex) =>
        milestoneIndex === index ? { ...milestone, [field]: value } : milestone,
      ),
    }));
  };

  const addMilestone = () => {
    setForm((current) => ({
      ...current,
      milestones: [...current.milestones, emptyMilestone],
    }));
  };

  const removeMilestone = (index) => {
    setForm((current) => ({
      ...current,
      milestones: current.milestones.filter(
        (_, milestoneIndex) => milestoneIndex !== index,
      ),
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!activeWorkspace?.id) {
      toast.error("Select a workspace first.");
      return;
    }

    try {
      await createGoal(activeWorkspace.id, {
        ...form,
        milestones: form.milestones.filter((milestone) => milestone.title),
      });
      toast.success("Goal created.");
      setForm(emptyGoal);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleStatusChange = async (goal, status) => {
    try {
      await updateGoal(activeWorkspace.id, goal.id, { status });
      toast.success("Goal updated.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (goalId) => {
    try {
      await deleteGoal(activeWorkspace.id, goalId);
      toast.success("Goal deleted.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
            Goals
          </p>
          <h2 className="mt-2 text-3xl font-bold">Team goals and milestones</h2>
          <p className="mt-2 text-gray-400">
            Completion snapshot: {completionStats || "0/0"}
          </p>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-bold text-gray-950 transition hover:bg-orange-400"
          onClick={() => setIsModalOpen(true)}
          type="button"
        >
          <Plus size={18} />
          New Goal
        </button>
      </div>

      <div className="grid gap-4">
        {goals.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 text-center text-gray-300">
            {activeWorkspace
              ? "No goals yet."
              : "Create or select a workspace to begin."}
          </div>
        ) : (
          goals.map((goal) => (
            <article
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/10"
              key={goal.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
                    <Target size={14} />
                    {statusLabels[goal.status]}
                  </div>
                  <h3 className="text-xl font-bold">{goal.title}</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">
                    {goal.description}
                  </p>
                  <p className="mt-3 text-xs font-medium text-gray-500">
                    Due {new Date(goal.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    className="h-10 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm text-white outline-none focus:border-orange-500"
                    onChange={(event) =>
                      handleStatusChange(goal, event.target.value)
                    }
                    value={goal.status}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-red-500/50 hover:text-red-300"
                    onClick={() => handleDelete(goal.id)}
                    type="button"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {(goal.milestones || []).map((milestone) => (
                  <div
                    className="rounded-lg bg-gray-950/60 p-4"
                    key={milestone.id}
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-gray-200">
                        {milestone.title}
                      </span>
                      <span className="text-orange-300">
                        {milestone.progressPercentage}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-800">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: `${milestone.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-2xl shadow-orange-950/30"
            onSubmit={handleCreate}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold">Create goal</h3>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white"
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4">
              <input
                className="h-11 rounded-lg border border-gray-800 bg-gray-900 px-4 text-sm text-white outline-none focus:border-orange-500"
                name="title"
                onChange={updateField}
                placeholder="Goal title"
                value={form.title}
              />
              <textarea
                className="min-h-28 rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
                name="description"
                onChange={updateField}
                placeholder="Goal description"
                value={form.description}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  className="h-11 rounded-lg border border-gray-800 bg-gray-900 px-4 text-sm text-white outline-none focus:border-orange-500"
                  name="status"
                  onChange={updateField}
                  value={form.status}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  className="h-11 rounded-lg border border-gray-800 bg-gray-900 px-4 text-sm text-white outline-none focus:border-orange-500"
                  name="dueDate"
                  onChange={updateField}
                  type="date"
                  value={form.dueDate}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-300">
                    Milestones
                  </p>
                  <button
                    className="text-sm font-semibold text-orange-400"
                    onClick={addMilestone}
                    type="button"
                  >
                    Add milestone
                  </button>
                </div>
                {form.milestones.map((milestone, index) => (
                  <div
                    className="grid gap-3 sm:grid-cols-[1fr_140px_40px]"
                    key={index}
                  >
                    <input
                      className="h-11 rounded-lg border border-gray-800 bg-gray-900 px-4 text-sm text-white outline-none focus:border-orange-500"
                      onChange={(event) =>
                        updateMilestone(index, "title", event.target.value)
                      }
                      placeholder="Milestone title"
                      value={milestone.title}
                    />
                    <input
                      className="h-11 rounded-lg border border-gray-800 bg-gray-900 px-4 text-sm text-white outline-none focus:border-orange-500"
                      max="100"
                      min="0"
                      onChange={(event) =>
                        updateMilestone(
                          index,
                          "progressPercentage",
                          event.target.value,
                        )
                      }
                      type="number"
                      value={milestone.progressPercentage}
                    />
                    <button
                      className="flex h-11 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-red-300"
                      onClick={() => removeMilestone(index)}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="mt-6 h-11 w-full rounded-lg bg-orange-500 text-sm font-bold text-gray-950 transition hover:bg-orange-400 disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Creating..." : "Create goal"}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
