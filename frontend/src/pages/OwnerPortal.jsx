import { useEffect, useState } from "react";
import SiteShell from "../components/SiteShell.jsx";
import {
  authHeaders,
  clearStoredToken,
  getStoredToken,
  jsonRequest,
} from "../lib/api.js";

function OwnerLogin({ credentials, onChange, onSubmit, error }) {
  return (
    <SiteShell
      eyebrow="Owner controls"
      title="Shape the experience your customers feel."
      description="Brand the app, configure services, tune timings, and keep your display experience consistent."
    >
      <div className="center-panel">
        <form className="glass-panel auth-card" onSubmit={onSubmit}>
          <p className="panel-label">Owner login</p>
          <h2 className="panel-title">Configuration access</h2>

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

function ServiceEditor({ service, onChange, onRemove }) {
  return (
    <div className="service-editor">
      <div className="service-editor-grid">
        <label>
          Service name
          <input
            value={service.name}
            onChange={(event) => onChange({ ...service, name: event.target.value })}
          />
        </label>

        <label>
          Prefix
          <input
            value={service.prefix}
            maxLength={3}
            onChange={(event) =>
              onChange({
                ...service,
                prefix: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
              })
            }
          />
        </label>

        <label>
          Slot duration
          <input
            type="number"
            min="1"
            value={service.slotDuration}
            onChange={(event) =>
              onChange({ ...service, slotDuration: event.target.value })
            }
          />
        </label>

        <label>
          Color
          <input
            type="color"
            value={service.color || "#0f766e"}
            onChange={(event) => onChange({ ...service, color: event.target.value })}
          />
        </label>
      </div>

      <label>
        Description
        <input
          value={service.description}
          onChange={(event) =>
            onChange({ ...service, description: event.target.value })
          }
        />
      </label>

      <button className="ghost-button small" type="button" onClick={onRemove}>
        Remove service
      </button>
    </div>
  );
}

export default function OwnerPortal() {
  const [authenticated, setAuthenticated] = useState(Boolean(getStoredToken()));
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    try {
      const settings = await jsonRequest("/api/settings");
      setForm(settings);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadSettings();
    }
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
  };

  const save = async () => {
    if (!form) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...form,
        slotDuration: Number(form.slotDuration),
        services: (form.services || []).map((service) => ({
          ...service,
          slotDuration: Number(service.slotDuration),
        })),
      };

      const data = await jsonRequest("/api/settings", {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      setForm(data);
      setMessage("Settings saved successfully.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  if (!authenticated) {
    return (
      <OwnerLogin
        credentials={credentials}
        onChange={setCredentials}
        onSubmit={login}
        error={error}
      />
    );
  }

  if (!form) {
    return (
      <SiteShell eyebrow="Owner controls" title="Loading settings..." description="">
        <div className="glass-panel">Preparing your control center.</div>
      </SiteShell>
    );
  }

  return (
    <SiteShell
      eyebrow={form.shopName || "Owner controls"}
      title="Tune your queue, services, and brand."
      description="Keep the customer flow consistent across booking, live operations, and the TV display."
      actions={
        <div className="glass-panel compact-panel">
          <p className="panel-label">Owner actions</p>
          <button className="primary-button" type="button" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </button>
          <button className="ghost-button" type="button" onClick={logout}>
            Log out
          </button>
        </div>
      }
    >
      <div className="dashboard-grid">
        <div className="glass-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Business profile</p>
              <h2 className="panel-title">Brand and operating hours</h2>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Shop name
              <input
                value={form.shopName || ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, shopName: event.target.value }))
                }
              />
            </label>

            <label>
              Default slot duration
              <input
                type="number"
                min="1"
                value={form.slotDuration}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    slotDuration: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Opening time
              <input
                type="time"
                value={form.openTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, openTime: event.target.value }))
                }
              />
            </label>

            <label>
              Closing time
              <input
                type="time"
                value={form.closeTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, closeTime: event.target.value }))
                }
              />
            </label>
          </div>

          <label>
            Display note
            <textarea
              value={form.displayNote || ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayNote: event.target.value,
                }))
              }
              rows="3"
            />
          </label>

          {message ? <p className="message success">{message}</p> : null}
          {error ? <p className="message error">{error}</p> : null}
        </div>

        <div className="stack-column">
          <div className="glass-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-label">Service catalog</p>
                <h2 className="panel-title">Queues customers can choose</h2>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    services: [
                      ...(current.services || []),
                      {
                        name: "New Service",
                        prefix: "N",
                        description: "Describe this queue.",
                        slotDuration: current.slotDuration || 10,
                        color: "#0f766e",
                      },
                    ],
                  }))
                }
              >
                Add service
              </button>
            </div>

            <div className="editor-stack">
              {(form.services || []).map((service, index) => (
                <ServiceEditor
                  key={`${service.prefix}-${index}`}
                  service={service}
                  onChange={(nextService) =>
                    setForm((current) => ({
                      ...current,
                      services: current.services.map((item, itemIndex) =>
                        itemIndex === index ? nextService : item
                      ),
                    }))
                  }
                  onRemove={() =>
                    setForm((current) => ({
                      ...current,
                      services: current.services.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="glass-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-label">Preview</p>
                <h2 className="panel-title">What customers will feel</h2>
              </div>
            </div>

            <div className="preview-card">
              <p className="panel-label">{form.shopName}</p>
              <h3>{form.displayNote}</h3>
              <p>
                Open {form.openTime} - {form.closeTime}
              </p>
              <div className="preview-services">
                {(form.services || []).map((service) => (
                  <span
                    key={service.prefix}
                    className="pill"
                    style={{ borderColor: service.color, color: service.color }}
                  >
                    {service.name} ({service.prefix})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
