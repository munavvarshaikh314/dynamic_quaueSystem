import { useEffect, useState } from "react";
import SiteShell from "../components/SiteShell.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import socket from "../socket";
import { jsonRequest } from "../lib/api.js";

function ServiceTile({ service, waitingCount, active, onSelect }) {
  return (
    <button
      type="button"
      className={`service-tile ${active ? "active" : ""}`}
      style={{ "--service-color": service.color || "#0f766e" }}
      onClick={() => onSelect(service.prefix)}
    >
      <div className="service-tile-top">
        <span className="service-prefix">{service.prefix}</span>
        <span className="service-wait">{waitingCount} waiting</span>
      </div>
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <span className="service-meta">{service.slotDuration} min slot</span>
    </button>
  );
}

function SnapshotCard({ label, value, muted }) {
  return (
    <div className={`snapshot-card ${muted ? "muted" : ""}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

export default function CustomerPortal() {
  const [settings, setSettings] = useState(null);
  const [snapshot, setSnapshot] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", prefix: "A" });
  const [result, setResult] = useState(null);
  const [lookup, setLookup] = useState({ prefix: "A", tokenNumber: "" });
  const [lookupResult, setLookupResult] = useState(null);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(false);
  const [checking, setChecking] = useState(false);

  const loadPublicData = async () => {
    try {
      const [settingsData, displayData] = await Promise.all([
        jsonRequest("/api/settings"),
        jsonRequest("/api/display"),
      ]);

      setSettings(settingsData);
      setSnapshot(displayData.appointments || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    loadPublicData();
    socket.connect();
    socket.on("queueUpdated", loadPublicData);

    return () => {
      socket.off("queueUpdated", loadPublicData);
      socket.disconnect();
    };
  }, []);

  const services = settings?.services || [];
  const currentToken =
    snapshot.find((item) => item.status === "serving") ||
    snapshot.find((item) => item.status === "notified") ||
    snapshot.find((item) => item.status === "waiting");

  const submitBooking = async (event) => {
    event.preventDefault();
    setBooking(true);
    setError("");

    try {
      const data = await jsonRequest("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          contactType: "phone",
          contactValue: form.phone,
          prefix: form.prefix,
        }),
      });

      setResult(data);
      setLookup({
        prefix: data.tokenLabel.split("-")[0],
        tokenNumber: String(data.tokenNumber),
      });
      setLookupResult(data);
      setForm((current) => ({ ...current, name: "", phone: "" }));
      await loadPublicData();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBooking(false);
    }
  };

  const checkToken = async (event) => {
    event.preventDefault();
    if (!lookup.prefix || !lookup.tokenNumber) return;

    setChecking(true);
    setError("");

    try {
      const data = await jsonRequest(
        `/api/appointments/${lookup.prefix}/${lookup.tokenNumber}`
      );
      setLookupResult(data);
    } catch (lookupError) {
      setLookupResult(null);
      setError(lookupError.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <SiteShell
      eyebrow={settings?.shopName || "Dynamic queue booking"}
      title="Book faster, wait smarter."
      description="Give customers a polished token experience with clear service choices, live queue visibility, and fast self-check updates."
      actions={
        <div className="glass-panel compact-panel">
          <p className="panel-label">Live status</p>
          <SnapshotCard
            label="Now serving"
            value={currentToken ? currentToken.tokenLabel : "No active token"}
          />
          <SnapshotCard
            label="Open hours"
            value={
              settings
                ? `${settings.openTime} - ${settings.closeTime}`
                : "Loading..."
            }
            muted
          />
        </div>
      }
    >
      <section className="dashboard-grid">
        <div className="glass-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Choose service</p>
              <h2 className="panel-title">Customer booking</h2>
            </div>
            {settings?.displayNote ? (
              <span className="pill soft">{settings.displayNote}</span>
            ) : null}
          </div>

          <div className="service-grid">
            {services.map((service) => (
              <ServiceTile
                key={service.prefix}
                service={service}
                waitingCount={
                  snapshot.filter(
                    (item) =>
                      item.prefix === service.prefix && item.status !== "served"
                  ).length
                }
                active={form.prefix === service.prefix}
                onSelect={(prefix) => setForm((current) => ({ ...current, prefix }))}
              />
            ))}
          </div>

          <form className="booking-form" onSubmit={submitBooking}>
            <label>
              Customer name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Enter full name"
                required
              />
            </label>

            <label>
              Mobile number
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="10 digit mobile number"
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={booking}>
              {booking ? "Booking token..." : "Book token"}
            </button>
          </form>

          {error ? <p className="message error">{error}</p> : null}

          {result ? (
            <div className="receipt-card">
              <div>
                <p className="panel-label">Booking confirmed</p>
                <h3>{result.tokenLabel}</h3>
              </div>
              <p>{result.serviceName}</p>
              <p>
                Expected time{" "}
                {new Date(result.appointmentTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <StatusBadge status={result.status} />
            </div>
          ) : null}
        </div>

        <div className="stack-column">
          <div className="glass-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-label">Track token</p>
                <h2 className="panel-title">Self status lookup</h2>
              </div>
            </div>

            <form className="tracker-form" onSubmit={checkToken}>
              <label>
                Prefix
                <select
                  value={lookup.prefix}
                  onChange={(event) =>
                    setLookup((current) => ({
                      ...current,
                      prefix: event.target.value,
                    }))
                  }
                >
                  {services.map((service) => (
                    <option key={service.prefix} value={service.prefix}>
                      {service.name} ({service.prefix})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Token number
                <input
                  value={lookup.tokenNumber}
                  onChange={(event) =>
                    setLookup((current) => ({
                      ...current,
                      tokenNumber: event.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder="Example: 12"
                  required
                />
              </label>

              <button className="secondary-button" type="submit" disabled={checking}>
                {checking ? "Checking..." : "Check token"}
              </button>
            </form>

            {lookupResult ? (
              <div className="tracker-result">
                <div>
                  <p className="panel-label">Latest status</p>
                  <h3>{lookupResult.tokenLabel}</h3>
                </div>
                <p>{lookupResult.serviceName}</p>
                <p>
                  Scheduled{" "}
                  {new Date(lookupResult.appointmentTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <StatusBadge status={lookupResult.status} />
              </div>
            ) : null}
          </div>

          <div className="glass-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-label">Queue snapshot</p>
                <h2 className="panel-title">What customers see right now</h2>
              </div>
            </div>

            <div className="snapshot-grid">
              <SnapshotCard
                label="Now serving"
                value={currentToken ? currentToken.tokenLabel : "Waiting room clear"}
              />
              <SnapshotCard
                label="Active queues"
                value={services.length ? String(services.length) : "0"}
              />
              <SnapshotCard
                label="People waiting"
                value={String(snapshot.filter((item) => item.status === "waiting").length)}
              />
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
