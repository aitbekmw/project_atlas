from fastapi import WebSocket

from app.core.security import decode_access_token


async def get_websocket_user_id(
    websocket: WebSocket,
) -> int:
    token = websocket.query_params.get("token")

    if not token:
        raise PermissionError("Token not provided")

    payload = decode_access_token(token)

    if payload is None:
        raise PermissionError("Invalid token")

    user_id = payload.get("sub")

    if user_id is None:
        raise PermissionError("Invalid token")

    return int(user_id)
