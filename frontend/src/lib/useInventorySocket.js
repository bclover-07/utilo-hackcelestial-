"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "./socket";

export function useInventorySocket(onInventoryChanged) {
  const [isConnected, setIsConnected] = useState(() => {
    if (typeof window === "undefined") return false;
    const socket = getSocket();
    return Boolean(socket?.connected);
  });
  const [lastEvent, setLastEvent] = useState(null);
  const callbackRef = useRef(onInventoryChanged);

  useEffect(() => {
    callbackRef.current = onInventoryChanged;
  }, [onInventoryChanged]);

  const debounceTimerRef = useRef(null);

  const triggerChange = useCallback((payload) => {
    setLastEvent({ time: new Date(), ...payload });
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (typeof callbackRef.current === "function") {
        callbackRef.current(payload);
      }
    }, 300);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

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
