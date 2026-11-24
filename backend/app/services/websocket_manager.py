import json
from typing import Dict, List, Any
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        # Maps experiment_id to list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, experiment_id: str, websocket: WebSocket):
        await websocket.accept()
        if experiment_id not in self.active_connections:
            self.active_connections[experiment_id] = []
        self.active_connections[experiment_id].append(websocket)

    def disconnect(self, experiment_id: str, websocket: WebSocket):
        if experiment_id in self.active_connections:
            if websocket in self.active_connections[experiment_id]:
                self.active_connections[experiment_id].remove(websocket)
            if not self.active_connections[experiment_id]:
                del self.active_connections[experiment_id]

    async def broadcast_to_experiment(self, experiment_id: str, payload: Dict[str, Any]):
        """Broadcasts an execution event to all WebSockets listening on experiment_id."""
        if experiment_id in self.active_connections:
            dead_connections = []
            for ws in self.active_connections[experiment_id]:
                try:
                    await ws.send_text(json.dumps(payload))
                except Exception:
                    dead_connections.append(ws)

            for ws in dead_connections:
                self.disconnect(experiment_id, ws)

ws_manager = WebSocketManager()
