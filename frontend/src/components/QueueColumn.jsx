import StatusBadge from "./StatusBadge.jsx";

function maskContact(contactValue = "") {
  if (contactValue.length < 4) return contactValue;
  return `${contactValue.slice(0, 2)}••••${contactValue.slice(-2)}`;
}

export default function QueueColumn({
  title,
  tone,
  hint,
  appointments,
  emptyMessage,
  renderActions,
}) {
  return (
    <section className={`queue-column tone-${tone}`}>
      <div className="queue-column-header">
        <div>
          <p className="queue-title">{title}</p>
          <p className="queue-hint">{hint}</p>
        </div>
        <span className="queue-count">{appointments.length}</span>
      </div>

      <div className="queue-stack">
        {appointments.length ? (
          appointments.map((appointment) => (
            <article key={appointment._id} className="queue-card">
              <div className="queue-card-top">
                <div>
                  <p className="queue-token">{appointment.tokenLabel}</p>
                  <p className="queue-service">{appointment.serviceName}</p>
                </div>
                <StatusBadge status={appointment.status} />
              </div>

              <div className="queue-meta">
                <span>{appointment.name}</span>
                <span>{maskContact(appointment.contactValue)}</span>
              </div>

              <div className="queue-meta">
                <span>
                  {new Date(appointment.appointmentTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>Queue {appointment.prefix}</span>
              </div>

              {renderActions ? (
                <div className="queue-actions">{renderActions(appointment)}</div>
              ) : null}
            </article>
          ))
        ) : (
          <div className="queue-empty">{emptyMessage}</div>
        )}
      </div>
    </section>
  );
}
