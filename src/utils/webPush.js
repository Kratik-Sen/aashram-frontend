import api from "../api/axios";

const PUSH_PREFERENCE_KEY = "aashram_push_enabled";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
};

export const isWebPushSupported = () => (
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window
);

export const getWebPushPreference = () => localStorage.getItem(PUSH_PREFERENCE_KEY) === "true";

const setWebPushPreference = (enabled) => {
  localStorage.setItem(PUSH_PREFERENCE_KEY, enabled ? "true" : "false");
};

const getExistingRegistration = () => navigator.serviceWorker.getRegistration();

const registerServiceWorker = async () => {
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
};

const areaLabel = (area = "dashboard") => area.charAt(0).toUpperCase() + area.slice(1);

export const getWebPushStatus = async () => {
  if (!isWebPushSupported()) {
    return { supported: false, enabled: false, permission: "unsupported" };
  }

  const registration = await getExistingRegistration();
  const subscription = await registration?.pushManager.getSubscription();

  return {
    supported: true,
    enabled: Boolean(subscription),
    permission: window.Notification.permission
  };
};

export const enableWebPushNotifications = async () => {
  if (!isWebPushSupported()) return false;

  const { data } = await api.get("/notifications/vapid-public-key");
  if (!data.enabled || !data.publicKey) return false;

  const permission = window.Notification.permission === "default"
    ? await window.Notification.requestPermission()
    : window.Notification.permission;

  if (permission !== "granted") {
    setWebPushPreference(false);
    return false;
  }

  const registration = await registerServiceWorker();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey)
    });
  }

  await api.post("/notifications/subscribe", subscription.toJSON());
  await registration.showNotification("Notifications enabled", {
    body: "You will receive Aashram Inventory alerts on this device.",
    tag: "aashram-notifications-enabled",
    data: { url: "/" }
  });
  setWebPushPreference(true);
  return true;
};

export const showBrowserNotification = async (event = {}) => {
  if (!("Notification" in window) || window.Notification.permission !== "granted") return false;

  const title = event.title || "Aashram Inventory updated";
  const body = event.body || `${areaLabel(event.area)} ${event.action || "updated"}`;
  const options = {
    body,
    tag: event.id || `aashram-${event.area || "inventory"}`,
    renotify: true,
    requireInteraction: false,
    data: { url: event.url || "/" }
  };

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration().then((existing) => existing || registerServiceWorker());
    await registration.showNotification(title, options);
    return true;
  }

  const notification = new window.Notification(title, options);
  notification.onclick = () => {
    window.focus();
    window.location.assign(options.data.url);
  };
  return true;
};

export const disableWebPushNotifications = async () => {
  setWebPushPreference(false);
  if (!isWebPushSupported()) return false;

  const registration = await getExistingRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return true;

  await api.post("/notifications/unsubscribe", { endpoint: subscription.endpoint }).catch(() => {});
  await subscription.unsubscribe();
  return true;
};

export const ensurePreferredWebPushNotifications = async () => {
  if (!getWebPushPreference()) return false;
  return enableWebPushNotifications();
};
