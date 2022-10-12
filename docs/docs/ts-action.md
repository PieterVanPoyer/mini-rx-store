---
id: ts-action
title: ts-action
slug: /ts-action
---
MiniRx supports writing and consuming actions with [ts-action](https://www.npmjs.com/package/ts-action) to reduce boilerplate code.

There are also [ts-action-operators](https://www.npmjs.com/package/ts-action-operators) to consume actions in effects.

Install the packages using npm:

`npm install ts-action ts-action-operators`

#### Create actions:

```ts title="ts-todo-actions.ts"
import { action, payload } from 'ts-action';
import { Todo } from './todo';

export const addTodo = action('ADD_TODO', payload<Todo>());
export const loadTodos = action('LOAD_TODOS');
export const loadTodosSuccess = action('LOAD_TODOS_SUCCESS', payload<Todo[]>());
export const loadTodosFail = action('LOAD_TODOS_FAIL', payload<Error>());
```

#### Dispatch an action:

```ts
store.dispatch(addTodo({id: 1, title: 'Use Redux'}))
```

#### Reducer

```ts
import { on, reducer } from 'ts-action';

export interface TodoState {
  todos: Todo[];
}

export const initialState: TodoState = {
  todos: [],
};

export const todoReducer = reducer(
  initialState,
  on(addTodo, (state, {payload}) => ({...state, todos: [...state.todos, payload]}))
);
```

#### Effects

Consume actions in effects

```ts
import { actions$ } from 'mini-rx-store';

import { mergeMap, map, catchError } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';
import { of } from 'rxjs';

import { ofType } from 'ts-action-operators';

import { loadTodos, loadTodosFail, loadTodosSuccess } from './ts-todo-actions';

const loadEffect = actions$.pipe(
  ofType(loadTodos), // Use ofType from 'ts-action-operators'
  mergeMap(() =>
    ajax('https://jsonplaceholder.typicode.com/todos').pipe(
      map(res => loadTodosSuccess(res.response)),
      catchError(err => of(loadTodosFail(err)))
    )
  )
);

// Register the effect
store.effect(loadEffect);

// Trigger the effect
store.dispatch(loadTodos())
```
