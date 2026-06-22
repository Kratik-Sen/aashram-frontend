import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import notificationSound from "../assets/notification.mp3";
import { useAuth } from "./AuthContext";
import { eventTouchesAreas, getEventAreas, notificationAreasByPath } from "../utils/realtime";

const RealtimeContext = createContext(null);

const socketUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  return baseUrl.replace(/\/api\/?$/, "");
};

export const RealtimeProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [lastEvent, setLastEvent] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState({});
  const locationRef = useRef(location.pathname);

  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  const clearNotifications = useCallback((path) => {
    setNotificationCounts((current) => {
      if (!current[path]) return current;
      return { ...current, [path]: 0 };
    });
  }, []);

  const playNotification = useCallback(() => {
    const audio = new window.Audio(notificationSound);
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    clearNotifications(location.pathname);
  }, [clearNotifications, location.pathname]);

  useEffect(() => {
    if (!user) {
      setConnected(false);
      setLastEvent(null);
      setNotificationCounts({});
      return undefined;
    }

    const socket = io(socketUrl(), {
      transports: ["websocket", "polling"]
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("inventory:updated", (payload) => {
      const event = {
        ...payload,
        areas: getEventAreas(payload)
      };
      const currentPath = locationRef.current;

      setLastEvent(event);
      setNotificationCounts((current) => {
        const next = { ...current };
        Object.entries(notificationAreasByPath).forEach(([path, areas]) => {
          if (path !== currentPath && eventTouchesAreas(event, areas)) {
            next[path] = (next[path] || 0) + 1;
          }
        });
        return next;
      });
      playNotification();
    });

    return () => socket.disconnect();
  }, [playNotification, user]);

  const value = useMemo(
    () => ({ connected, lastEvent, notificationCounts, clearNotifications }),
    [connected, lastEvent, notificationCounts, clearNotifications]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};

export const useRealtime = () => useContext(RealtimeContext);
