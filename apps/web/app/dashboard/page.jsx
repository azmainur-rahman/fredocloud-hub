"use client";

import {
  Download,
  ListChecks,
  ScrollText,
  Target,
  TriangleAlert,
} from "lucide-react";
import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useActionItemStore from "../../store/useActionItemStore.js";
import useGoalStore from "../../store/useGoalStore.js";
import useWorkspaceStore from "../../store/useWorkspaceStore.js";

const goalStatusLabels = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

const chartColors = ["#fb923c", "#f97316", "#ea580c"];

const getWeekStart = () => {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);

  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  return start;
};

const downloadCsv = (filename, rows) => {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const auditLogs = useWorkspaceStore((state) => state.auditLogs);
  const fetchAuditLogs = useWorkspaceStore((state) => state.fetchAuditLogs);
  const accentColor = activeWorkspace?.accentColor || "#f97316";
  const goals = useGoalStore((state) => state.goals);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);
  const actionItems = useActionItemStore((state) => state.actionItems);
  const fetchActionItems = useActionItemStore(
    (state) => state.fetchActionItems,
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (activeWorkspace?.id) {
      Promise.all([
        fetchGoals(activeWorkspace.id),
        fetchActionItems(activeWorkspace.id),
        fetchAuditLogs(activeWorkspace.id),
      ]).catch((error) => toast.error(error.message));
    }
  }, [activeWorkspace?.id, fetchActionItems, fetchAuditLogs, fetchGoals]);

  const analytics = useMemo(() => {
    const weekStart = getWeekStart();
    const now = new Date();
    const completedThisWeek = actionItems.filter((item) => {
      const updatedAt = new Date(item.updatedAt);

      return item.status === "DONE" && updatedAt >= weekStart;
    }).length;
    const overdueGoals = goals.filter(
      (goal) => goal.status !== "COMPLETED" && new Date(goal.dueDate) < now,
    ).length;
    const overdueItems = actionItems.filter(
      (item) => item.status !== "DONE" && new Date(item.dueDate) < now,
    ).length;
    const statusCounts = Object.keys(goalStatusLabels).map((status) => ({
      name: goalStatusLabels[status],
      value: goals.filter((goal) => goal.status === status).length,
    }));

    return {
      completedThisWeek,
      overdueCount: overdueGoals + overdueItems,
      statusCounts,
    };
  }, [actionItems, goals]);

  const exportWorkspaceData = () => {
    if (!activeWorkspace) {
      toast.error("Select a workspace first.");
      return;
    }

    const goalRows = goals.map((goal) => ({
      type: "Goal",
      title: goal.title,
      status: goal.status,
      priority: "",
      dueDate: goal.dueDate,
      parentGoal: "",
      owner: goal.owner?.name || "",
    }));
    const itemRows = actionItems.map((item) => ({
      type: "Action Item",
      title: item.title,
      status: item.status,
      priority: item.priority,
      dueDate: item.dueDate,
      parentGoal: item.goal?.title || "",
      owner: item.assignee?.name || "",
    }));

    downloadCsv(
      `${activeWorkspace.name.replaceAll(" ", "-").toLowerCase()}-export.csv`,
      [...goalRows, ...itemRows],
    );
    toast.success("CSV export ready.");
  };

  const exportAuditLogs = () => {
    if (!activeWorkspace) {
      toast.error("Select a workspace first.");
      return;
    }

    downloadCsv(
      `${activeWorkspace.name.replaceAll(" ", "-").toLowerCase()}-audit-log.csv`,
      auditLogs.map((log) => ({
        action: log.action,
        actor: log.user?.name || "",
        timestamp: log.timestamp,
        details: JSON.stringify(log.details || {}),
      })),
    );
    toast.success("Audit log export ready.");
  };

  const statCards = [
    {
      label: "Total Goals",
      value: goals.length,
      icon: Target,
    },
    {
      label: "Completed This Week",
      value: analytics.completedThisWeek,
      icon: ListChecks,
    },
    {
      label: "Overdue Count",
      value: analytics.overdueCount,
      icon: TriangleAlert,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
            Analytics
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
            {activeWorkspace?.name || "Workspace"} performance
          </h2>
          <p className="mt-2 max-w-2xl text-gray-400">
            Live workspace metrics powered by the same goal and action item data
            your team updates throughout the day.
          </p>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-gray-950 transition hover:brightness-110"
          onClick={exportWorkspaceData}
          style={{ backgroundColor: accentColor }}
          type="button"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/10"
              key={card.label}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-950"
                  style={{ backgroundColor: accentColor }}
                >
                  <Icon size={20} />
                </div>
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: accentColor, color: accentColor }}
                >
                  Live
                </span>
              </div>
              <p className="mt-5 text-sm font-medium text-gray-400">
                {card.label}
              </p>
              <p className="mt-2 text-4xl font-bold">{card.value}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/10">
          <div className="mb-6">
            <h3 className="text-xl font-bold">Goal completion chart</h3>
            <p className="mt-1 text-sm text-gray-400">
              Status distribution across active workspace goals.
            </p>
          </div>
          <div className="h-80">
            {isMounted ? (
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={analytics.statusCounts}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />
                  <XAxis dataKey="name" stroke="#9ca3af" tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    stroke="#9ca3af"
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid rgba(249, 115, 22, 0.35)",
                      borderRadius: "10px",
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill={accentColor}
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/10">
          <div className="mb-6">
            <h3 className="text-xl font-bold">Goal mix</h3>
            <p className="mt-1 text-sm text-gray-400">
              A compact view of goal state balance.
            </p>
          </div>
          <div className="h-64">
            {isMounted ? (
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={analytics.statusCounts}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {analytics.statusCounts.map((entry, index) => (
                      <Cell
                        fill={
                          index === 0
                            ? accentColor
                            : chartColors[index % chartColors.length]
                        }
                        key={entry.name}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid rgba(249, 115, 22, 0.35)",
                      borderRadius: "10px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
          <div className="mt-4 grid gap-2">
            {analytics.statusCounts.map((item, index) => (
              <div
                className="flex items-center justify-between text-sm"
                key={item.name}
              >
                <span className="flex items-center gap-2 text-gray-300">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        index === 0
                          ? accentColor
                          : chartColors[index % chartColors.length],
                    }}
                  />
                  {item.name}
                </span>
                <span className="font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ScrollText style={{ color: accentColor }} size={20} />
              <h3 className="text-xl font-bold">Audit log</h3>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Immutable timeline of recent workspace changes.
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-gray-200 transition hover:border-orange-500/60 hover:text-orange-300"
            onClick={exportAuditLogs}
            type="button"
          >
            <Download size={16} />
            Export audit CSV
          </button>
        </div>
        <div className="space-y-3">
          {auditLogs.length === 0 ? (
            <p className="rounded-lg border border-white/10 bg-gray-950/60 p-4 text-sm text-gray-400">
              No audit activity yet.
            </p>
          ) : (
            auditLogs.slice(0, 8).map((log) => (
              <div
                className="flex flex-col gap-2 rounded-lg border border-white/10 bg-gray-950/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                key={log.id}
              >
                <div>
                  <p className="text-sm font-bold text-white">
                    {log.action.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {log.user?.name || "Team member"}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
