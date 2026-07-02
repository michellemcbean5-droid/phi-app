"""
Tracks live WebSocket connections per driver and broadcasts agent/GPS events
to them in real time.

Used by the `/ws/{driver_id}` endpoint in main.py, and by the CrewAI
task_callback hooks in tasks.py which push agent activity and financial
events to the relevant driver's connection as soon as they happen — REST
polling is too slow for live GPS/ETA updates and in-cab AI chat.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger("phi.websocket")


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = {}
        self._loop: asyncio.AbstractEventLoop | None = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Capture the running event loop at app startup.

        CrewAI's task_callback fires from a worker thread (BackgroundTasks
        runs sync functions off-loop), so broadcasting from there needs a
        thread-safe hop back onto this loop — see broadcast_to_driver_sync.
        """
        self._loop = loop

    async def connect(self, driver_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(driver_id, []).append(websocket)
        logger.info("Driver %s connected (%d active socket(s))", driver_id, len(self._connections[driver_id]))

    def disconnect(self, driver_id: str, websocket: WebSocket) -> None:
        sockets = self._connections.get(driver_id)
        if not sockets:
            return
        if websocket in sockets:
            sockets.remove(websocket)
        if not sockets:
            self._connections.pop(driver_id, None)
        logger.info("Driver %s disconnected", driver_id)

    async def broadcast_to_driver(self, driver_id: str, message: dict[str, Any]) -> None:
        """Send a JSON message to every socket a driver currently has open.

        Dead sockets (send failures) are dropped silently — the client is
        expected to reconnect, at which point it'll resync via REST.
        """
        sockets = self._connections.get(driver_id, [])
        dead: list[WebSocket] = []
        for socket in sockets:
            try:
                await socket.send_json(message)
            except Exception:
                dead.append(socket)
        for socket in dead:
            self.disconnect(driver_id, socket)

    def broadcast_to_driver_sync(self, driver_id: str, message: dict[str, Any]) -> None:
        """Thread-safe variant of broadcast_to_driver for callers with no
        running event loop of their own (e.g. CrewAI's task_callback)."""
        if self._loop is None:
            logger.warning("No event loop bound yet — dropping message for driver %s", driver_id)
            return
        asyncio.run_coroutine_threadsafe(self.broadcast_to_driver(driver_id, message), self._loop)

    def is_connected(self, driver_id: str) -> bool:
        return bool(self._connections.get(driver_id))


# Module-level singleton — one process, one connection table. Matches the
# in-memory _job_store pattern already used in main.py.
manager = ConnectionManager()
