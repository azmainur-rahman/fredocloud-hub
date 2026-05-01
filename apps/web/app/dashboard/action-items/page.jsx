"use client";

import { Columns3, List, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useActionItemStore from "../../../store/useActionItemStore.js";
import useGoalStore from "../../../store/useGoalStore.js";
import useWorkspaceStore from "../../../store/useWorkspaceStore.js";

const emptyActionItem = {
  title: "",
  priority: "MEDIUM",
  status: "TODO",
  dueDate: "",
  goalId: "",
};

const statusLabels = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityLabels = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const priorityClasses = {
  LOW: "border-emerald-500/30 text-emerald-300",
  MEDIUM: "border-orange-500/30 text-orange-300",
  HIGH: "border-red-500/30 text-red-300",
};

export default function ActionItemsPage() {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const accentColor = activeWorkspace?.accentColor || "#f97316";
  const goals = useGoalStore((state) => state.goals);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);
  const actionItems = useActionItemStore((state) => state.actionItems);
  const isLoading = useActionItemStore((state) => state.isLoading);
  const fetchActionItems = useActionItemStore(
    (state) => state.fetchActionItems,
  );
  const createActionItem = useActionItemStore(
    (state) => state.createActionItem,
  );
  const updateActionItem = useActionItemStore(
    (state) => state.updateActionItem,
  );
  const deleteActionItem = useActionItemStore(
    (state) => state.deleteActionItem,
  );
  const [view, setView] = useState("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyActionItem);

  useEffect(() => {
    if (activeWorkspace?.id) {
      Promise.all([
        fetchActionItems(activeWorkspace.id),
        fetchGoals(activeWorkspace.id),
      ]).catch((error) => toast.error(error.message));
    }
  }, [activeWorkspace?.id, fetchActionItems, fetchGoals]);

  useEffect(() => {
    if (!form.goalId && goals[0]?.id) {
      setForm((current) => ({ ...current, goalId: goals[0].id }));
    }
  }, [form.goalId, goals]);

  const groupedItems = useMemo(
    () =>
      Object.keys(statusLabels).reduce(
        (columns, status) => ({
          ...columns,
          [status]: actionItems.filter((item) => item.status === status),
        }),
        {},
      ),
    [actionItems],
  );

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!activeWorkspace?.id) {
      toast.error("Select a workspace first.");
      return;
    }

    if (!form.goalId) {
      toast.error("Create a goal before adding action items.");
      return;
    }

    try {
      await createActionItem(activeWorkspace.id, form);
      toast.success("Action item created.");
      setForm({ ...emptyActionItem, goalId: goals[0]?.id || "" });
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleStatusChange = async (actionItem, status) => {
    try {
      await updateActionItem(activeWorkspace.id, actionItem.id, { status });
      toast.success("Action item updated.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (actionItemId) => {
    try {
      await deleteActionItem(activeWorkspace.id, actionItemId);
      toast.success("Action item deleted.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const ActionItemCard = ({ item }) => (
    <article className="rounded-xl border border-white/10 bg-gray-950/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-white">{item.title}</h3>
          <p className="mt-2 text-xs text-gray-500">
            Goal: {item.goal?.title || "Unlinked"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Due {new Date(item.dueDate).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-1 text-xs font-semibold ${
            priorityClasses[item.priority]
          }`}
        >
          {priorityLabels[item.priority]}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          className="h-9 rounded-lg border border-gray-800 bg-gray-900 px-3 text-xs font-semibold text-white outline-none focus:border-orange-500"
          onChange={(event) => handleStatusChange(item, event.target.value)}
          value={item.status}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-red-500/50 hover:text-red-300"
          onClick={() => handleDelete(item.id)}
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
            Action Items
          </p>
          <h2 className="mt-2 text-3xl font-bold">Execution board</h2>
          <p className="mt-2 text-gray-400">
            Switch between an operational list and a focused Kanban board.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
            <button
              className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
                view === "list"
                  ? "text-gray-950"
                  : "text-gray-300 hover:text-orange-300"
              }`}
              onClick={() => setView("list")}
              style={
                view === "list" ? { backgroundColor: accentColor } : undefined
              }
              type="button"
            >
              <List size={16} />
              List
            </button>
            <button
              className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
                view === "kanban"
                  ? "text-gray-950"
                  : "text-gray-300 hover:text-orange-300"
              }`}
              onClick={() => setView("kanban")}
              style={
                view === "kanban" ? { backgroundColor: accentColor } : undefined
              }
              type="button"
            >
              <Columns3 size={16} />
              Kanban
            </button>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-gray-950 transition hover:brightness-110"
            onClick={() => setIsModalOpen(true)}
            style={{ backgroundColor: accentColor }}
            type="button"
          >
            <Plus size={18} />
            New Item
          </button>
        </div>
      </div>

      {actionItems.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 text-center text-gray-300">
          {activeWorkspace
            ? "No action items yet."
            : "Create or select a workspace to begin."}
        </div>
      ) : view === "list" ? (
        <div className="grid gap-3">
          {actionItems.map((item) => (
            <ActionItemCard item={item} key={item.id} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div
              className="min-h-80 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              key={status}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold">{label}</h3>
                <span className="rounded-full bg-orange-500/10 px-2 py-1 text-xs font-semibold text-orange-300">
                  {groupedItems[status]?.length || 0}
                </span>
              </div>
              <div className="space-y-3">
                {(groupedItems[status] || []).map((item) => (
                  <ActionItemCard item={item} key={item.id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-2xl shadow-orange-950/30"
            onSubmit={handleCreate}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold">Create action item</h3>
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
                placeholder="Action item title"
                value={form.title}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  className="h-11 rounded-lg border border-gray-800 bg-gray-900 px-4 text-sm text-white outline-none focus:border-orange-500"
                  name="goalId"
                  onChange={updateField}
                  value={form.goalId}
                >
                  {goals.length === 0 ? (
                    <option value="">Create a goal first</option>
                  ) : (
                    goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))
                  )}
                </select>
                <input
                  className="h-11 rounded-lg border border-gray-800 bg-gray-900 px-4 text-sm text-white outline-none focus:border-orange-500"
                  name="dueDate"
                  onChange={updateField}
                  type="date"
                  value={form.dueDate}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  className="h-11 rounded-lg border border-gray-800 bg-gray-900 px-4 text-sm text-white outline-none focus:border-orange-500"
                  name="priority"
                  onChange={updateField}
                  value={form.priority}
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
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
              </div>
            </div>

            <button
              className="mt-6 h-11 w-full rounded-lg text-sm font-bold text-gray-950 transition hover:brightness-110 disabled:opacity-60"
              disabled={isLoading}
              style={{ backgroundColor: accentColor }}
              type="submit"
            >
              {isLoading ? "Creating..." : "Create action item"}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
