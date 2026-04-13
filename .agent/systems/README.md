# Systems Namespace

`systems/` stores implemented reality.

Use this namespace for durable knowledge about how the project currently works.

Good system notes capture:

- current ownership boundaries
- runtime flows
- important entry points
- integration points
- operational constraints
- known debt that affects future work
- file locations that are hard to rediscover

Do not use `systems/` for:

- future design intent
- speculative plans
- one-task implementation notes
- raw session logs

Those belong in `specs/`, `tasks/`, or `state/`.

Update `systems/` during closeout when a task changes durable project behavior. Keep entries concise enough that future agents can use them quickly.
