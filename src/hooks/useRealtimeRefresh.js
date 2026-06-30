import { useEffect, useRef } from "react";
import { useRealtime } from "../context/RealtimeContext";
import { eventTouchesAreas } from "../utils/realtime";

const useRealtimeRefresh = (areas, refresh) => {
  const { lastEvent } = useRealtime();
  const refreshRef = useRef(refresh);
  const lastHandledRef = useRef(null);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!lastEvent?.id || lastHandledRef.current === lastEvent.id) return;
    if (!eventTouchesAreas(lastEvent, areas)) return;

    lastHandledRef.current = lastEvent.id;
    refreshRef.current?.(lastEvent);
  }, [areas, lastEvent]);

  useEffect(() => {
    const handleCacheUpdate = (event) => {
      const cacheEvent = event.detail;
      if (!cacheEvent?.id || lastHandledRef.current === cacheEvent.id) return;
      if (!eventTouchesAreas(cacheEvent, areas)) return;

      lastHandledRef.current = cacheEvent.id;
      refreshRef.current?.(cacheEvent);
    };

    window.addEventListener("aashram:api-cache-updated", handleCacheUpdate);
    return () => window.removeEventListener("aashram:api-cache-updated", handleCacheUpdate);
  }, [areas]);
};

export default useRealtimeRefresh;
