from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..services.websocket_manager import ws_manager
from ..services.runner_service import runner_service

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/experiments/{experiment_id}")
async def websocket_experiment_endpoint(websocket: WebSocket, experiment_id: str):
    """Real-time WebSocket endpoint streaming execution events for a specific experiment."""
    await ws_manager.connect(experiment_id, websocket)

    # Immediately push current state upon connection
    current_exp = runner_service.get_experiment(experiment_id)
    if current_exp:
        await websocket.send_json({
            "type": "initial_state",
            "status": current_exp.status,
            "data": current_exp.dict()
        })

    try:
        while True:
            # Keep connection alive; client can send pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(experiment_id, websocket)
    except Exception:
        ws_manager.disconnect(experiment_id, websocket)
