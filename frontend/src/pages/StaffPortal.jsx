import { useEffect, useState } from "react";
import SiteShell from "../components/SiteShell.jsx";
import QueueColumn from "../components/QueueColumn.jsx";
import socket from "../socket";
import {
  authHeaders,
  clearStoredToken,
  getStoredToken,
  jsonRequest,
} from "../lib/api.js";

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card" style={{ "--stat-accent": accent }}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function StaffLogin({ credentials, onChange, onSubmit, error }) {
  return (
    <SiteShell
      eyebrow="Operations"
      title="Run the queue in real time."
      description="Staff can notify customers, pull the next token into service, and close the loop once service is complete."
    >
      <div className="center-panel">
        <form className="glass-panel auth-card" onSubmit={onSubmit}>
          <p className="panel-label">Staff login</p>
          <h2 className="panel-title">Secure access</h2>

          <label>
            Email
            <input
              type="email"
              value={credentials.email}
              onChange={(event) =>
                onChange((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="owner@company.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={credentials.password}
              onChange={(event) =>
                onChange((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="Enter password"
              required
            />
          </label>

          <button className="primary-button" type="submit">
            Sign in
          </button>

          {error ? <p className="message error">{error}</p> : null}
        </form>
      </div>
    </SiteShell>
  );
}

export default function StaffPortal() {
  const [authenticated, setAuthenticated] = useState(Boolean(getStoredToken()));
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [settings, setSettings] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    customersToday: 0,
    waiting: 0,
    notified: 0,
    serving: 0,
    served: 0,
  });
  const [filters, setFilters] = useState({ prefix: "", search: "" });
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadDashboard = async () => {
    try {
      const [settingsData, appointmentsData, statsData] = await Promise.all([
        jsonRequest("/api/settings"),
        jsonRequest("/api/admin/appointments", {
          headers: authHeaders(),
        }),
        jsonRequest("/api/admin/today-stats", {
          headers: authHeaders(),
        }),
      ]);

      setSettings(settingsData);
      setAppointments(appointmentsData);
      setStats(statsData);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
      if (loadError.message.toLowerCase().includes("token")) {
        clearStoredToken();
        setAuthenticated(false);
      }
    }
  };

  useEffect(() => {
    if (!authenticated) return;

    loadDashboard();
    socket.connect();
    socket.on("queueUpdated", loadDashboard);

    return () => {
      socket.off("queueUpdated", loadDashboard);
      socket.disconnect();
    };
  }, [authenticated]);

  const login = async (event) => {
    event.preventDefault();
    try {
      const data = await jsonRequest("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      localStorage.setItem("token", data.token);
      setAuthenticated(true);
      setError("");
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  const logout = () => {
    clearStoredToken();
    setAuthenticated(false);
    setAppointments([]);
  };

  const runAction = async (appointmentId, path, method) => {
    setBusyId(appointmentId);
    try {
      await jsonRequest(path, {
        method,
        headers: authHeaders({ "Content-Type": "application/json" }),
      });
      await loadDashboard();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusyId("");
    }
  };

  if (!authenticated) {
    return (
      <StaffLogin
        credentials={credentials}
        onChange={setCredentials}
        onSubmit={login}
        error={error}
      />
    );
  }

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesPrefix = !filters.prefix || appointment.prefix === filters.prefix;
    const haystack = `${appointment.tokenLabel} ${appointment.name} ${appointment.contactValue}`.toLowerCase();
    const matchesSearch =
      !filters.search || haystack.includes(filters.search.toLowerCase());
    return matchesPrefix && matchesSearch;
  });

  const waiting = filteredAppointments.filter((item) => item.status === "waiting");
  const notified = filteredAppointments.filter((item) => item.status === "notified");
  const serving = filteredAppointments.filter((item) => item.status === "serving");
  const served = filteredAppointments.filter((item) => item.status === "served");

  return (
    <SiteShell
      eyebrow={settings?.shopName || "Staff dashboard"}
      title="Manage queue flow without losing context."
      description="Real-time queue states, quick actions, and same-screen visibility for the whole day."
      actions={
        <div className="glass-panel compact-panel">
          <p className="panel-label">Session</p>
          <p className="mini-copy">Authenticated staff dashboard</p>
          <button className="ghost-button" type="button" onClick={logout}>
            Log out
          </button>
        </div>
      }
    >
      <div className="stack-column">
        <section className="stats-grid">
          <StatCard label="Customers today" value={stats.customersToday} accent="#0f766e" />
          <StatCard label="Waiting" value={stats.waiting} accent="#f59e0b" />
          <StatCard label="Notified" value={stats.notified} accent="#2563eb" />
          <StatCard label="Serving" value={stats.serving} accent="#7c3aed" />
          <StatCard label="Completed" value={stats.served} accent="#1f2937" />
        </section>

        <section className="glass-panel filters-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Filters</p>
              <h2 className="panel-title">Focus the live queue</h2>
            </div>
          </div>

          <div className="filter-row">
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Search token, customer, or contact"
            />

            <select
              value={filters.prefix}
              onChange={(event) =>
                setFilters((current) => ({ ...current, prefix: event.target.value }))
              }
            >
              <option value="">All services</option>
              {(settings?.services || []).map((service) => (
                <option key={service.prefix} value={service.prefix}>
                  {service.name} ({service.prefix})
                </option>
              ))}
            </select>
          </div>

          {error ? <p className="message error">{error}</p> : null}
        </section>

        <section className="queue-board">
          <QueueColumn
            title="Waiting"
            tone="amber"
            hint="Fresh bookings waiting to be notified or called."
            appointments={waiting}
            emptyMessage="No customers are waiting in line."
            renderActions={(appointment) => (
              <>
                <button
                  className="secondary-button small"
                  type="button"
                  disabled={busyId === appointment._id}
                  onClick={() =>
                    runAction(
                      appointment._id,
                      `/api/admin/appointments/${appointment._id}/notify`,
                      "POST"
                    )
                  }
                >
                  Notify
                </button>
                <button
                  className="primary-button small"
                  type="button"
                  disabled={busyId === appointment._id}
                  onClick={() =>
                    runAction(
                      appointment._id,
                      `/api/admin/appointments/${appointment._id}/call`,
                      "PUT"
                    )
                  }
                >
                  Call now
                </button>
                <button
                  className="ghost-button small"
                  type="button"
                  disabled={busyId === appointment._id}
                  onClick={() =>
                    runAction(
                      appointment._id,
                      `/api/admin/appointments/${appointment._id}`,
                      "DELETE"
                    )
                  }
                >
                  Cancel
                </button>
              </>
            )}
          />

          <QueueColumn
            title="Notified"
            tone="blue"
            hint="Customers who have been messaged and may arrive any moment."
            appointments={notified}
            emptyMessage="No notified customers right now."
            renderActions={(appointment) => (
              <>
                <button
                  className="primary-button small"
                  type="button"
                  disabled={busyId === appointment._id}
                  onClick={() =>
                    runAction(
                      appointment._id,
                      `/api/admin/appointments/${appointment._id}/call`,
                      "PUT"
                    )
                  }
                >
                  Move to chair
                </button>
                <button
                  className="ghost-button small"
                  type="button"
                  disabled={busyId === appointment._id}
                  onClick={() =>
                    runAction(
                      appointment._id,
                      `/api/admin/appointments/${appointment._id}`,
                      "DELETE"
                    )
                  }
                >
                  Cancel
                </button>
              </>
            )}
          />

          <QueueColumn
            title="Serving"
            tone="violet"
            hint="Customers currently in service."
            appointments={serving}
            emptyMessage="No one is being served right now."
            renderActions={(appointment) => (
              <button
                className="primary-button small"
                type="button"
                disabled={busyId === appointment._id}
                onClick={() =>
                  runAction(
                    appointment._id,
                    `/api/admin/appointments/${appointment._id}/serve`,
                    "PUT"
                  )
                }
              >
                Mark served
              </button>
            )}
          />
        </section>

        <section className="glass-panel compact-list">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Completed today</p>
              <h2 className="panel-title">Recently served</h2>
            </div>
            <span className="pill soft">{served.length} finished</span>
          </div>

          <div className="served-list">
            {served.length ? (
              served.slice(-6).reverse().map((appointment) => (
                <div key={appointment._id} className="served-row">
                  <span>{appointment.tokenLabel}</span>
                  <span>{appointment.serviceName}</span>
                  <span>{appointment.name}</span>
                </div>
              ))
            ) : (
              <p className="queue-empty">No completed appointments yet.</p>
            )}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
