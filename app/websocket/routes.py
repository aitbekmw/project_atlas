from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.exceptions import PermissionDenied
from app.db.session import AsyncSessionLocal
from app.dependencies.websocket import get_websocket_user_id
from app.repositories.conversation import ConversationRepository
from app.repositories.job import JobRepository
from app.repositories.message import MessageRepository
from app.repositories.user import UserRepository
from app.services.conversation import ConversationService
from app.services.message import ConversationNotFound, MessageService
from app.services.user import UserService
from app.websocket.manager import manager
from app.websocket.redis import publish

router = APIRouter()


@router.websocket("/ws/chat/{conversation_id}")
async def websocket_chat(
    websocket: WebSocket,
    conversation_id: int,
):
    user_id = None

    try:
        user_id = await get_websocket_user_id(
            websocket,
        )

        async with AsyncSessionLocal() as db:

            # ==========================
            # User
            # ==========================
            user_service = UserService(
                UserRepository(db),
            )

            user = await user_service.get_by_id(
                user_id,
            )

            await user_service.set_online(
                user,
            )

            # ==========================
            # Conversation
            # ==========================
            conversation_service = ConversationService(
                ConversationRepository(db),
                JobRepository(db),
            )

            await conversation_service.check_access(
                conversation_id,
                user_id,
            )

            # ==========================
            # Connect
            # ==========================
            await manager.connect(
                conversation_id,
                websocket,
            )

            await manager.send_online(
                conversation_id,
                user_id,
            )

            # ==========================
            # Message Service
            # ==========================
            message_service = MessageService(
                MessageRepository(db),
                ConversationRepository(db),
            )

            while True:

                data = await websocket.receive_json()

                event = data.get("type")

                # ==========================
                # Typing
                # ==========================
                if event == "typing":

                    await manager.send_typing(
                        conversation_id,
                        user_id,
                    )

                    continue

                # ==========================
                # Stop Typing
                # ==========================
                if event == "stop_typing":

                    await manager.send_stop_typing(
                        conversation_id,
                        user_id,
                    )

                    continue

                # ==========================
                # Message
                # ==========================
                if event == "message":

                    text = data.get("text")

                    if not text:
                        continue

                    message = await message_service.send(
                        conversation_id=conversation_id,
                        sender_id=user_id,
                        text=text,
                    )

                    await publish(
                        {
                            "type": "message",
                            "id": message.id,
                            "conversation_id": message.conversation_id,
                            "sender_id": message.sender_id,
                            "text": message.text,
                            "created_at": str(
                                message.created_at,
                            ),
                        }
                    )

    except PermissionDenied:
        await websocket.close(
            code=1008,
        )

    except ConversationNotFound:
        await websocket.close(
            code=1008,
        )

    except WebSocketDisconnect:
        pass

    finally:
        if user_id is not None:
            try:
                async with AsyncSessionLocal() as db:

                    user_service = UserService(
                        UserRepository(db),
                    )

                    user = await user_service.get_by_id(
                        user_id,
                    )

                    await user_service.set_offline(
                        user,
                    )

                    await manager.send_offline(
                        conversation_id,
                        user_id,
                    )

            except Exception:
                pass

        manager.disconnect(
            conversation_id,
            websocket,
        )
