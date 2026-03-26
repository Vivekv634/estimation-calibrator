import traceback
from flask import Blueprint, jsonify
from ..services import ai_service

ai_bp = Blueprint("ai", __name__)


def ok(data):
    return jsonify({"data": data, "error": None})


def err(message, status=500):
    return jsonify({"data": None, "error": message}), status


@ai_bp.route("/ai/insights", methods=["POST"])
def insights():
    try:
        result = ai_service.get_insights()
        return jsonify(result)
    except ValueError as e:
        return err(str(e))
    except Exception as e:
        traceback.print_exc()
        return err(str(e))
