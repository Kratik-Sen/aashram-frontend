export const notificationAreasByPath = {
  "/": ["dashboard"],
  "/items": ["items", "stock"],
  "/purchases": ["purchases"],
  "/issues": ["issues"],
  "/issue-by-admin": ["issues"],
  "/donations": ["donations"],
  "/requests": ["requests"],
  "/suppliers": ["suppliers"],
  "/departments": ["departments"],
  "/reports": ["reports"],
  "/users": ["users"]
};

export const getEventAreas = (event) => {
  const areas = [
    event?.area,
    ...(Array.isArray(event?.areas) ? event.areas : [])
  ].filter(Boolean);

  return [...new Set(areas)];
};

export const eventTouchesAreas = (event, areas = []) => {
  const eventAreas = getEventAreas(event);
  return areas.some((area) => eventAreas.includes(area));
};
