const DEFAULT_SERVICES = [
  {
    name: "Haircut",
    prefix: "A",
    description: "Standard styling and trim service.",
    slotDuration: 15,
    color: "#0f766e",
  },
  {
    name: "Beard",
    prefix: "B",
    description: "Quick beard shaping and grooming.",
    slotDuration: 10,
    color: "#f97316",
  },
  {
    name: "Priority",
    prefix: "V",
    description: "Fast-track queue for urgent or premium service.",
    slotDuration: 8,
    color: "#1d4ed8",
  },
];

function normalizeService(service = {}, fallbackSlot = 10) {
  const prefix = String(service.prefix || "")
    .trim()
    .toUpperCase()
    .slice(0, 3);

  return {
    name: String(service.name || prefix || "Service").trim(),
    prefix: prefix || "A",
    description: String(service.description || "").trim(),
    slotDuration: Number(service.slotDuration) > 0
      ? Number(service.slotDuration)
      : fallbackSlot,
    color: String(service.color || "#0f766e").trim() || "#0f766e",
  };
}

function sanitizeServices(services, fallbackSlot = 10) {
  const source = Array.isArray(services) && services.length ? services : DEFAULT_SERVICES;
  const seen = new Set();

  return source
    .map((service) => normalizeService(service, fallbackSlot))
    .filter((service) => {
      if (seen.has(service.prefix)) return false;
      seen.add(service.prefix);
      return true;
    });
}

function buildDefaultSettings() {
  return {
    shopName: "QueueCraft Studio",
    logo: "",
    openTime: "09:00",
    closeTime: "18:00",
    slotDuration: 10,
    displayNote: "Keep your token ready. You will be called shortly.",
    services: sanitizeServices(DEFAULT_SERVICES, 10),
  };
}

module.exports = {
  DEFAULT_SERVICES,
  buildDefaultSettings,
  sanitizeServices,
};
