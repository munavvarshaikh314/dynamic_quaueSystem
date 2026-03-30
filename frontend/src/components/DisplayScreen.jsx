import { useEffect, useState } from "react";
import socket from "../socket";
import { jsonRequest } from "../lib/api.js";

function groupUpcoming(appointments, services) {
  return (services || []).map((service) => ({
    ...service,
    appointments: appointments.filter(
      (appointment) => appointment.prefix === service.prefix
    ),
  }));
}

export default function DisplayScreen() {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [shopName, setShopName] = useState("QueueCraft");
  const [displayNote, setDisplayNote] = useState("");
  const [clock, setClock] = useState(new Date());

  const loadDisplay = async () => {
    const data = await jsonRequest("/api/display");
    setAppointments(data.appointments || []);
    setServices(data.settings?.services || []);
    setShopName(data.settings?.shopName || "QueueCraft");
    setDisplayNote(data.settings?.displayNote || "");
  };

  useEffect(() => {
    loadDisplay();
    socket.connect();
    socket.on("queueUpdated", loadDisplay);

    const timer = setInterval(() => setClock(new Date()), 1000);

    return () => {
      clearInterval(timer);
      socket.off("queueUpdated", loadDisplay);
      socket.disconnect();
    };
  }, []);

  const current =
    appointments.find((item) => item.status === "serving") ||
    appointments.find((item) => item.status === "notified") ||
    appointments.find((item) => item.status === "waiting");

  const groupedServices = groupUpcoming(
    appointments.filter((item) => item.status !== "serving"),
    services
  );

  return (
    <div className="display-shell">
      <div className="display-topbar">
        <div>
          <p className="display-kicker">Live queue display</p>
          <h1>{shopName}</h1>
        </div>

        <div className="display-clock">
          {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      <section className="display-hero">
        <div className="display-current">
          <p>Now serving</p>
          <strong>{current ? current.tokenLabel : "--"}</strong>
          <span>{current ? current.serviceName : "Waiting for next token"}</span>
        </div>

        <div className="display-side-panel">
          <p className="display-kicker">Customer note</p>
          <h2>{displayNote || "Please keep your token ready."}</h2>
          <div className="display-status-row">
            <span>{appointments.filter((item) => item.status === "waiting").length} waiting</span>
            <span>{appointments.filter((item) => item.status === "notified").length} notified</span>
            <span>{appointments.filter((item) => item.status === "serving").length} in service</span>
          </div>
        </div>
      </section>

      <section className="display-grid">
        {groupedServices.map((service) => (
          <div key={service.prefix} className="display-column">
            <div className="display-column-top">
              <span
                className="display-service-dot"
                style={{ backgroundColor: service.color || "#0f766e" }}
              />
              <div>
                <p>{service.name}</p>
                <span>Queue {service.prefix}</span>
              </div>
            </div>

            <div className="display-token-stack">
              {service.appointments.length ? (
                service.appointments.slice(0, 4).map((appointment) => (
                  <div key={appointment._id} className="display-token-card">
                    <strong>{appointment.tokenLabel}</strong>
                    <span>{appointment.status}</span>
                  </div>
                ))
              ) : (
                <div className="display-token-card empty">No pending tokens</div>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
