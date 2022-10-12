---
id: ext-undo-extension
title: Undo Extension
sidebar_label: Undo
---

With the Undo Extension we can easily undo actions which have been dispatched to the store.

## Register the extension

Configure the store with the `UndoExtension`:

```ts 
import { UndoExtension } from 'mini-rx-store';

const store: Store = configureStore({
  extensions: [
    new UndoExtension()
  ]
});
```
## Options
The Undo Extension buffers the last 100 actions by default to be able to undo an action. You can configure the buffer like this:
```ts 
new UndoExtension({bufferSize: 200})
```

## Undo an Action (Redux API)
In order to undo an action, we need to cache the action which we want to undo. 
Later we can dispatch an `undo` action which takes the cached action as payload.

Example:
```ts
import { Action, undo } from 'mini-rx-store';
import { RemoveTodo } from './todo-actions';

const removeAction: Action = new RemoveTodo(3); // Cache the action which we want to undo
store.dispatch(removeAction); // Dispatch the action to the Store
store.dispatch(undo(removeAction)); // Undo the dispatched action
```

## Undo an setState action (Feature Store)
The Undo Extension also enables the undo functionality in Feature Stores.

Read more here [Undo setState Actions with `undo`](fs-set-state.md#undo-setstate-actions-with-undo)
