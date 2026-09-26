"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "./socket";

export function useInventorySocket(onInventoryChanged) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const callbackRef = useRef(onInventoryChanged);
  callbackRef.current = onInventoryChanged;

  const debounceTimerRef = useRef(null);

  const triggerChange = useCallback((payload) => {
    setLastEvent({ time: new Date(), ...payload });
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (typeof callbackRef.current === "function") {
        callbackRef.current();
      }
    }, 300);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (socket.connected) {
      setIsConnected(true);
    }

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleInventoryChanged = (data) => {
      triggerChange(data || { type: "generic" });
    };

    const handleNotificationNew = (notif) => {
      if (
        notif?.kind?.startsWith("inventory") ||
        notif?.kind === "rental_expiry" ||
        notif?.kind === "rental_completed" ||
        notif?.kind === "offline_deal"
      ) {
        triggerChange({ type: "notification", notif });
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("inventory_changed", handleInventoryChanged);
    socket.on("notification_new", handleNotificationNew);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("inventory_changed", handleInventoryChanged);
      socket.off("notification_new", handleNotificationNew);
    };
  }, [triggerChange]);

  return { isConnected, lastEvent };
}
