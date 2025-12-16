from __future__ import annotations

import os

from flask import Flask

from .db import ServicesRepository
from .monitoring import register_monitoring
from .routes import services_bp


def create_app() -> Flask:
    app = Flask(__name__)

    app.config["POSTGRES_DSN"] = os.environ.get("POSTGRES_DSN")
    repository = ServicesRepository(app.config["POSTGRES_DSN"])
    repository.init_schema()

    app.config["REPOSITORY"] = repository

    app.register_blueprint(services_bp)
    register_monitoring(app)
    return app
