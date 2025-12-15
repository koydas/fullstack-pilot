"""Lightweight monitoring middleware for the services API."""

from __future__ import annotations

import logging
import time
from typing import Optional

from flask import Flask, g, request

LOGGER_NAME = "service_api.monitoring"


def _elapsed_ms(start_time: Optional[float]) -> float:
    """Compute the elapsed request time in milliseconds."""
    if start_time is None:
        return 0.0
    return (time.perf_counter() - start_time) * 1000


def register_monitoring(app: Flask) -> None:
    """Register request timing and logging hooks on the Flask app."""

    logger = logging.getLogger(LOGGER_NAME)

    @app.before_request
    def _start_timer() -> None:
        g.request_start_time = time.perf_counter()

    @app.after_request
    def _log_response(response):
        duration_ms = _elapsed_ms(g.get("request_start_time"))
        logger.info(
            "Handled %s %s -> %s in %.2f ms",
            request.method,
            request.path,
            response.status_code,
            duration_ms,
        )
        return response

    @app.teardown_request
    def _log_exception(exc):
        if exc is None:
            return

        duration_ms = _elapsed_ms(g.get("request_start_time"))
        logger.error(
            "Unhandled error for %s %s after %.2f ms",
            request.method,
            request.path,
            duration_ms,
            exc_info=exc,
        )

