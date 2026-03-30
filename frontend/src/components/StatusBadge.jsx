const LABELS = {
  waiting: "Waiting",
  notified: "Notified",
  serving: "Serving",
  served: "Served",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status || "waiting"}`}>
      {LABELS[status] || "Waiting"}
    </span>
  );
}
