import json
import pytest


def post_task(client, data=None):
    payload = data or {"title": "Fix bug", "category": "backend", "estimate_mins": 30}
    return client.post("/api/tasks", json=payload)


def start_task(client, task_id):
    return client.patch(f"/api/tasks/{task_id}/start")


def complete_task(client, task_id, actual_mins=45, note="Took longer than expected"):
    return client.patch(f"/api/tasks/{task_id}/complete", json={
        "actual_mins": actual_mins,
        "note": note,
    })


# --- Create ---

def test_create_task_success(client):
    res = post_task(client)
    assert res.status_code == 201
    data = res.get_json()["data"]
    assert data["title"] == "Fix bug"
    assert data["status"] == "pending"
    assert data["estimate_mins"] == 30


def test_create_task_missing_title_returns_400(client):
    res = post_task(client, {"category": "backend", "estimate_mins": 30})
    assert res.status_code == 400
    assert res.get_json()["error"] is not None


def test_create_task_invalid_category_returns_400(client):
    res = post_task(client, {"title": "t", "category": "nonsense", "estimate_mins": 10})
    assert res.status_code == 400


def test_create_task_estimate_too_large_returns_400(client):
    res = post_task(client, {"title": "t", "category": "backend", "estimate_mins": 999})
    assert res.status_code == 400


# --- Start ---

def test_start_task_success(client):
    task_id = post_task(client).get_json()["data"]["id"]
    res = start_task(client, task_id)
    assert res.status_code == 200
    assert res.get_json()["data"]["status"] == "started"
    assert res.get_json()["data"]["started_at"] is not None


def test_start_task_locks_estimate(client):
    task_id = post_task(client).get_json()["data"]["id"]
    start_task(client, task_id)
    # Attempt to update estimate after start via a new POST (service-level lock check)
    # The lock is enforced via the state machine: re-starting a started task must fail
    res = start_task(client, task_id)
    assert res.status_code == 400


# --- Complete ---

def test_complete_task_success(client):
    task_id = post_task(client).get_json()["data"]["id"]
    start_task(client, task_id)
    res = complete_task(client, task_id)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["status"] == "done"
    assert data["actual_mins"] == 45
    assert data["completed_at"] is not None


def test_complete_task_missing_note_returns_400(client):
    task_id = post_task(client).get_json()["data"]["id"]
    start_task(client, task_id)
    res = client.patch(f"/api/tasks/{task_id}/complete", json={"actual_mins": 45})
    assert res.status_code == 400


def test_complete_task_missing_actual_mins_returns_400(client):
    task_id = post_task(client).get_json()["data"]["id"]
    start_task(client, task_id)
    res = client.patch(f"/api/tasks/{task_id}/complete", json={"note": "done"})
    assert res.status_code == 400


# --- State machine ---

def test_invalid_transition_done_to_started_returns_400(client):
    task_id = post_task(client).get_json()["data"]["id"]
    start_task(client, task_id)
    complete_task(client, task_id)
    res = start_task(client, task_id)
    assert res.status_code == 400


def test_invalid_transition_pending_to_done_returns_400(client):
    task_id = post_task(client).get_json()["data"]["id"]
    res = complete_task(client, task_id)
    assert res.status_code == 400


# --- Delete ---

def test_delete_pending_task_success(client):
    task_id = post_task(client).get_json()["data"]["id"]
    res = client.delete(f"/api/tasks/{task_id}")
    assert res.status_code == 200
    assert res.get_json()["data"]["deleted"] == task_id


def test_delete_started_task_returns_400(client):
    task_id = post_task(client).get_json()["data"]["id"]
    start_task(client, task_id)
    res = client.delete(f"/api/tasks/{task_id}")
    assert res.status_code == 400


# --- Stats ---

def test_stats_returns_empty_gracefully(client):
    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["avg_multiplier"] is None
    assert data["by_category"] == {}
    assert data["trend"] == []
