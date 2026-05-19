"use client";

import { useEffect } from "react";

export type CrmRealtimeEvent = {
  type: "client.updated" | "client.activity.created";
  clientId: string;
  at: string;
  source?: "local" | "broadcast" | "websocket";
};

const EVENT_NAME = "crm:realtime";
const CHANNEL_NAME = "plandesign-crm";

function createEventBusTarget() {
  if (typeof window === "undefined") {
    return null;
  }

  const typedWindow = window as Window & { __crmRealtimeTarget?: EventTarget };
  if (!typedWindow.__crmRealtimeTarget) {
    typedWindow.__crmRealtimeTarget = new EventTarget();
  }

  return typedWindow.__crmRealtimeTarget;
}

export function publishCrmRealtimeEvent(event: CrmRealtimeEvent) {
  if (typeof window === "undefined") {
    return;
  }

  const detail = { ...event, source: event.source || "local" };
  const target = createEventBusTarget();
  if (target) {
    target.dispatchEvent(new CustomEvent<CrmRealtimeEvent>(EVENT_NAME, { detail }));
  }

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(detail);
    channel.close();
  }
}

export function useCrmRealtime(
  clientId: string,
  onEvent: (event: CrmRealtimeEvent) => void,
) {
  useEffect(() => {
    const target = createEventBusTarget();
    if (!target) {
      return;
    }

    const handleLocalEvent = (event: Event) => {
      const customEvent = event as CustomEvent<CrmRealtimeEvent>;
      if (customEvent.detail.clientId === clientId) {
        onEvent(customEvent.detail);
      }
    };

    target.addEventListener(EVENT_NAME, handleLocalEvent);

    let channel: BroadcastChannel | undefined;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (message: MessageEvent<CrmRealtimeEvent>) => {
        if (message.data.clientId === clientId) {
          onEvent({ ...message.data, source: "broadcast" });
        }
      };
    }

    return () => {
      target.removeEventListener(EVENT_NAME, handleLocalEvent);
      channel?.close();
    };
  }, [clientId, onEvent]);
}

export type CrmRealtimeTransport = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  subscribe: (clientId: string, callback: (event: CrmRealtimeEvent) => void) => () => void;
};
