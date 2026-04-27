import logging
from typing import Callable, Any

from dataclaw_core.backend.supabase_client import SupabaseCoreClient

logger = logging.getLogger(__name__)

class RealtimeEventBus:
    """Uses Supabase realtime for signal broadcasts, UI live updates, and agent events."""
    
    def __init__(self, channel_name: str = "dataclaw_events"):
        self.sb = SupabaseCoreClient()
        self.channel_name = channel_name
        self.channel = None
        self.listeners = []
        self._initialize_channel()

    def _initialize_channel(self):
        if self.sb.is_connected and self.sb.client:
            self.channel = self.sb.get_realtime_channel(self.channel_name)
            if self.channel:
                try:
                    self.channel.on("broadcast", {"event": "*"}, self._handle_event).subscribe()
                    logger.info(f"Supabase Realtime bus running on channel: {self.channel_name}")
                except Exception as e:
                    logger.warning(f"Failed to subscribe to realtime channel: {e}")

    def _handle_event(self, payload: Any):
        logger.debug(f"Realtime Event Received: {payload}")
        for listener in self.listeners:
            try:
                listener(payload["event"], payload["payload"])
            except Exception as e:
                logger.error(f"Error in realtime listener: {e}")

    def subscribe(self, callback: Callable[[str, Any], None]):
        """Register a callback for incoming realtime events."""
        self.listeners.append(callback)

    def broadcast(self, event_name: str, payload_data: dict):
        """Broadcasts an event reliably to the UI and other nodes."""
        if self.channel:
            try:
                self.channel.send({
                    "type": "broadcast",
                    "event": event_name,
                    "payload": payload_data
                })
            except Exception as e:
                logger.error(f"Failed to broadcast over Realtime channel: {e}")
        else:
            # Fallback to local routing
            for listener in self.listeners:
                listener(event_name, payload_data)
