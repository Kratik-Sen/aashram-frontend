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

export const getWebPushStatus = async () => {
  if (!isWebPushSupported()) {
    return { supported: false, enabled: false, permission: "unsupported" };
  }

  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
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

  const registration = await navigator.serviceWorker.register("/sw.js");
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey)
    });
  }

  await api.post("/notifications/subscribe", subscription.toJSON());
  setWebPushPreference(true);
  return true;
};

export const disableWebPushNotifications = async () => {
  setWebPushPreference(false);
  if (!isWebPushSupported()) return false;

  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
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
