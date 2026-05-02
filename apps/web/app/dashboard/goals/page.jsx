"use client";

import { Pencil, Plus, Target, Trash2, X } from "lucide-react";
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
  ownerId: "",
  milestones: [emptyMilestone],
};

const getDateInputValue = (date) =>
  date ? new Date(date).toISOString().slice(0, 10) : "";

const statusLabels = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export default function GoalsPage() {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const members = useWorkspaceStore((state) => state.members);
  const accentColor = activeWorkspace?.accentColor || "#f97316";
  const goals = useGoalStore((state) => state.goals);
  const isLoading = useGoalStore((state) => state.isLoading);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);
  const createGoal = useGoalStore((state) => state.createGoal);
  const deleteGoal = useGoalStore((state) => state.deleteGoal);
  const updateGoal = useGoalStore((state) => state.updateGoal);
  const createGoalUpdate = useGoalStore((state) => state.createGoalUpdate);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState(emptyGoal);
  const [updateDrafts, setUpdateDrafts] = useState({});

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchGoals(activeWorkspace.id).catch((error) =>
        toast.error(error.message),
      );
    }
  }, [activeWorkspace?.id, fetchGoals]);

  useEffect(() => {
    if (!form.ownerId && members[0]?.id) {
      setForm((current) => ({ ...current, ownerId: members[0].id }));
    }
  }, [form.ownerId, members]);

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
      const payload = {
        ...form,
        milestones: form.milestones.filter((milestone) => milestone.title),
      };

      if (editingGoal) {
        await updateGoal(activeWorkspace.id, editingGoal.id, payload);
        toast.success("Goal updated.");
      } else {
        await createGoal(activeWorkspace.id, payload);
        toast.success("Goal created.");
      }

      setForm({ ...emptyGoal, ownerId: members[0]?.id || "" });
      setEditingGoal(null);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openCreateModal = () => {
    setEditingGoal(null);
    setForm({ ...emptyGoal, ownerId: members[0]?.id || "" });
    setIsModalOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setForm({
      title: goal.title || "",
      description: goal.description || "",
      status: goal.status || "PENDING",
      dueDate: getDateInputValue(goal.dueDate),
      ownerId: goal.owner?.id || goal.ownerId || members[0]?.id || "",
      milestones:
        goal.milestones?.length > 0
          ? goal.milestones.map((milestone) => ({
              id: milestone.id,
              title: milestone.title,
              progressPercentage: milestone.progressPercentage,
            }))
          : [emptyMilestone],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    setForm({ ...emptyGoal, ownerId: members[0]?.id || "" });
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

  const handleProgressUpdate = async (goalId) => {
    const content = updateDrafts[goalId]?.trim();

    if (!content) {
      toast.error("Write a progress update first.");
      return;
    }

    try {
      await createGoalUpdate(activeWorkspace.id, goalId, { content });
      setUpdateDrafts((current) => ({ ...current, [goalId]: "" }));
      toast.success("Progress update posted.");
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
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-gray-950 transition hover:brightness-110"
          onClick={openCreateModal}
          style={{ backgroundColor: accentColor }}
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
                    Owner {goal.owner?.name || "Team member"} · Due{" "}
                    {new Date(goal.dueDate).toLocaleDateString()}
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
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-orange-500/50 hover:text-orange-300"
                    onClick={() => openEditModal(goal)}
                    type="button"
                  >
                    <Pencil size={17} />
                  </button>
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

              <div className="mt-5 rounded-xl border border-white/10 bg-gray-950/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    className="h-10 flex-1 rounded-lg border border-gray-800 bg-gray-900 px-3 text-sm text-white outline-none focus:border-orange-500"
                    onChange={(event) =>
                      setUpdateDrafts((current) => ({
                        ...current,
                        [goal.id]: event.target.value,
                      }))
                    }
                    placeholder="Post a progress update"
                    value={updateDrafts[goal.id] || ""}
                  />
                  <button
                    className="h-10 rounded-lg px-4 text-sm font-bold text-gray-950 transition hover:brightness-110"
                    onClick={() => handleProgressUpdate(goal.id)}
                    style={{ backgroundColor: accentColor }}
                    type="button"
                  >
                    Post update
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {(goal.updates || []).slice(0, 3).map((update) => (
                    <div
                      className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2"
                      key={update.id}
                    >
                      <p className="text-sm text-gray-200">{update.content}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {update.author?.name || "Team member"} ·{" "}
                        {new Date(update.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
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
              <h3 className="text-2xl font-bold">
                {editingGoal ? "Edit goal" : "Create goal"}
              </h3>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white"
                onClick={closeModal}
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
              <select
                className="h-11 rounded-lg border border-gray-800 bg-gray-900 px-4 text-sm text-white outline-none focus:border-orange-500"
                name="ownerId"
                onChange={updateField}
                value={form.ownerId}
              >
                {members.length === 0 ? (
                  <option value="">You will be the owner</option>
                ) : (
                  members.map((member) => (
                    <option key={member.id} value={member.id}>
                      Owner: {member.name}
                    </option>
                  ))
                )}
              </select>

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
              className="mt-6 h-11 w-full rounded-lg text-sm font-bold text-gray-950 transition hover:brightness-110 disabled:opacity-60"
              disabled={isLoading}
              style={{ backgroundColor: accentColor }}
              type="submit"
            >
              {isLoading
                ? editingGoal
                  ? "Saving..."
                  : "Creating..."
                : editingGoal
                  ? "Save goal"
                  : "Create goal"}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
