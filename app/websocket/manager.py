from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[
            int,
            list[WebSocket],
        ] = defaultdict(list)

    async def connect(
        self,
        conversation_id: int,
        websocket: WebSocket,
    ):
        await websocket.accept()

        self.active_connections[conversation_id].append(websocket)

    def disconnect(
        self,
        conversation_id: int,
        websocket: WebSocket,
    ):
        if conversation_id not in self.active_connections:
            return

        if websocket in self.active_connections[conversation_id]:
            self.active_connections[conversation_id].remove(websocket)

        if not self.active_connections[conversation_id]:
            del self.active_connections[conversation_id]

    async def send_to_room(
        self,
        conversation_id: int,
        payload: dict,
    ):
        if conversation_id not in self.active_connections:
            return

        disconnected = []

        for websocket in self.active_connections[conversation_id]:
            try:
                await websocket.send_json(payload)

            except Exception:
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect(
                conversation_id,
                websocket,
            )

    async def send_typing(
        self,
        conversation_id: int,
        user_id: int,
    ):
        await self.send_to_room(
            conversation_id,
            {
                "type": "typing",
                "user_id": user_id,
            },
        )

    async def send_stop_typing(
        self,
        conversation_id: int,
        user_id: int,
    ):
        await self.send_to_room(
            conversation_id,
            {
                "type": "stop_typing",
                "user_id": user_id,
            },
        )

    async def send_online(
        self,
        conversation_id: int,
        user_id: int,
    ):
        await self.send_to_room(
            conversation_id,
            {
                "type": "online",
                "user_id": user_id,
            },
        )

    async def send_offline(
        self,
        conversation_id: int,
        user_id: int,
    ):
        await self.send_to_room(
            conversation_id,
            {
                "type": "offline",
                "user_id": user_id,
            },
        )

    async def send_to_user(
        self,
        websocket: WebSocket,
        payload: dict,
    ):
        await websocket.send_json(payload)

    def room_size(
        self,
        conversation_id: int,
    ) -> int:
        return len(
            self.active_connections.get(
                conversation_id,
                [],
            )
        )


manager = ConnectionManager()
