from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from ..schemas import CreateTaskSchema, CompleteTaskSchema
from ..services import task_service

tasks_bp = Blueprint("tasks", __name__)

create_schema = CreateTaskSchema()
complete_schema = CompleteTaskSchema()


def ok(data):
    return jsonify({"data": data, "error": None})


def err(message, status=400):
    return jsonify({"data": None, "error": message}), status


@tasks_bp.route("/tasks", methods=["POST"])
def create_task():
    try:
        data = create_schema.load(request.get_json() or {})
    except ValidationError as e:
        return err(e.messages)
    task = task_service.create_task(data)
    return ok(task.to_dict()), 201


@tasks_bp.route("/tasks", methods=["GET"])
def list_tasks():
    status_filter = request.args.get("status")
    tasks = task_service.list_tasks(status_filter)
    return ok([t.to_dict() for t in tasks])


@tasks_bp.route("/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    task = task_service.get_task(task_id)
    if not task:
        return err("Task not found", 404)
    return ok(task.to_dict())


@tasks_bp.route("/tasks/<int:task_id>/start", methods=["PATCH"])
def start_task(task_id):
    task = task_service.get_task(task_id)
    if not task:
        return err("Task not found", 404)
    try:
        task = task_service.start_task(task)
    except ValueError as e:
        return err(str(e))
    return ok(task.to_dict())


@tasks_bp.route("/tasks/<int:task_id>/complete", methods=["PATCH"])
def complete_task(task_id):
    task = task_service.get_task(task_id)
    if not task:
        return err("Task not found", 404)
    try:
        data = complete_schema.load(request.get_json() or {})
    except ValidationError as e:
        return err(e.messages)
    try:
        task = task_service.complete_task(task, data)
    except ValueError as e:
        return err(str(e))
    return ok(task.to_dict())


@tasks_bp.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = task_service.get_task(task_id)
    if not task:
        return err("Task not found", 404)
    try:
        task_service.delete_task(task)
    except ValueError as e:
        return err(str(e))
    return ok({"deleted": task_id})


@tasks_bp.route("/stats", methods=["GET"])
def get_stats():
    stats = task_service.get_stats()
    return ok(stats)
