"""OpenAPI schema postprocessing hooks."""

BULK_OPERATION_ID = 'tasks_bulk_create'
TASK_SCHEMA_REF = '#/components/schemas/Task'


def _find_bulk_post_operation(paths):
    """Find the bulk create POST operation by operationId or path segment."""
    for path_key, path_item in paths.items():
        post = path_item.get('post') if isinstance(path_item, dict) else None
        if not post:
            continue
        op_id = post.get('operationId') or ''
        path_normalized = path_key.strip('/')
        if op_id == BULK_OPERATION_ID or 'tasks/bulk' in path_normalized:
            return post
    return None


def fix_bulk_tasks_request_body(result, generator, request, public):
    """
    Make /api/tasks/bulk/ testable and accurate in Swagger UI:
    - Find operation by operationId or path segment (tasks/bulk).
    - Keep only application/json (array body); remove form/multipart that don't apply.
    - Ensure request body example is a single-level array (fix double-wrap if present).
    - Document 201 response as plain array of Task (not PaginatedTaskList).
    """
    paths = result.get('paths') or {}
    post = _find_bulk_post_operation(paths)
    if not post:
        return result
    request_body = post.get('requestBody') or {}
    content = request_body.get('content') or {}
    json_content = content.get('application/json')
    if json_content:
        post['requestBody'] = {
            'content': {'application/json': json_content},
            'required': request_body.get('required', True),
        }
        examples = json_content.get('examples') or {}
        for ex in examples.values():
            val = ex.get('value')
            if isinstance(val, list) and len(val) == 1 and isinstance(val[0], list):
                ex['value'] = val[0]
        schema_example = json_content.get('example')
        if isinstance(schema_example, list) and len(schema_example) == 1 and isinstance(schema_example[0], list):
            json_content['example'] = schema_example[0]
    params = post.get('parameters') or []
    post['parameters'] = [p for p in params if p.get('name') not in ('limit', 'page')]
    # Bulk returns a plain array of tasks, not a paginated envelope
    responses = post.get('responses') or {}
    if '201' in responses:
        responses['201'] = {
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'array',
                        'items': {'$ref': TASK_SCHEMA_REF},
                    },
                },
            },
            'description': 'Created tasks (array of task objects).',
        }
    return result
