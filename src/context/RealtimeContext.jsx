import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const RealtimeContext = createContext(null);

const socketUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  return baseUrl.replace(/\/api\/?$/, "");
};

export const RealtimeProvider = ({ children }) => {
  const [lastEvent, setLastEvent] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(socketUrl(), {
      transports: ["websocket", "polling"]
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("inventory:updated", (payload) => setLastEvent(payload));

    return () => socket.disconnect();
  }, []);

  const value = useMemo(() => ({ connected, lastEvent }), [connected, lastEvent]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};

export const useRealtime = () => useContext(RealtimeContext);
