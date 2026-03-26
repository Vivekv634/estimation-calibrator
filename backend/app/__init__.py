import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from .db import db

load_dotenv()


def create_app(config_override=None):
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///dev.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    if config_override:
        app.config.update(config_override)

    CORS(app)
    db.init_app(app)

    from .routes.tasks import tasks_bp
    from .routes.ai import ai_bp
    from . import models

    with app.app_context():
        db.create_all()

    app.register_blueprint(tasks_bp, url_prefix="/api")
    app.register_blueprint(ai_bp, url_prefix="/api")

    return app
