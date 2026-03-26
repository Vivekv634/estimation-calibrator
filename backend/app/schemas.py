from marshmallow import Schema, fields, validate
from .models import VALID_CATEGORIES


class CreateTaskSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    category = fields.Str(required=True, validate=validate.OneOf(VALID_CATEGORIES))
    estimate_mins = fields.Int(required=True, validate=validate.Range(min=1, max=480))


class UpdateTaskSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=200))
    estimate_mins = fields.Int(validate=validate.Range(min=1, max=480))


class CompleteTaskSchema(Schema):
    actual_mins = fields.Int(required=True, validate=validate.Range(min=1, max=1440))
    note = fields.Str(required=True, validate=validate.Length(min=5, max=500))
