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
};

export default useRealtimeRefresh;
