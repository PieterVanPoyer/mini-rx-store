import { TestBed } from '@angular/core/testing';
import { StoreModule } from '../store.module';
import {
    Action,
    Actions,
    createComponentStore,
    createEffect,
    FeatureStore,
    ImmutableStateExtension,
    LoggerExtension,
    ofType,
    Reducer,
    ReduxDevtoolsExtension,
    Store,
    StoreExtension,
    UndoExtension,
    _StoreCore,
} from 'mini-rx-store';
import { Injectable, NgModule } from '@angular/core';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { EffectsModule } from '../effects.module';
import { ComponentStoreModule } from 'mini-rx-store-ng';
import { NgReduxDevtoolsExtension } from '../ng-redux-devtools.extension';

export const loadAction: Action = {
    type: 'LOAD',
};

export const loadAction2: Action = {
    type: 'LOAD_2',
};

export const loadAction3: Action = {
    type: 'LOAD_3',
};

export const loadSuccessAction: Action = {
    type: 'LOAD_SUCCESS',
};

export const loadSuccessAction2: Action = {
    type: 'LOAD_SUCCESS_2',
};

export const loadSuccessAction3: Action = {
    type: 'LOAD_SUCCESS_3',
};

export const loadFailAction: Action = {
    type: 'LOAD_FAIL',
};

interface CounterState {
    counter: number;
}

const counterInitialState: CounterState = {
    counter: 1,
};

function counterReducer(state: CounterState = counterInitialState, action: Action) {
    switch (action.type) {
        case 'counter':
            return {
                ...state,
                counter: state.counter + 1,
            };
        default:
            return state;
    }
}

@NgModule({
    imports: [StoreModule.forFeature<CounterState>('counter4', counterReducer)],
})
class Counter4Module {}

const featureMetaReducerSpy = jest.fn();

function featureMetaReducer(reducer: Reducer<any>): Reducer<any> {
    return (state, action) => {
        featureMetaReducerSpy(state);
        return reducer(state, action);
    };
}

@NgModule({
    imports: [
        StoreModule.forFeature<CounterState>('counter5', counterReducer, {
            initialState: {
                counter: 555,
            },
            metaReducers: [featureMetaReducer],
        }),
    ],
})
class Counter5Module {}

@Injectable()
export class TodoEffects {
    loadTodos$ = createEffect(
        this.actions$.pipe(
            ofType(loadAction.type),
            mergeMap(() =>
                of('some result').pipe(
                    map((res) => loadSuccessAction),
                    catchError((err) => of(loadFailAction))
                )
            )
        )
    );

    nonDispatchingEffect$ = createEffect(
        this.actions$.pipe(
            ofType(loadAction2.type),
            mergeMap(() => of('some result').pipe(map((res) => loadSuccessAction2)))
        ),
        { dispatch: false }
    );

    constructor(private actions$: Actions) {}
}

@Injectable()
export class TodoEffectsNOK {
    // Effect is not registered because it is not using createEffect!
    loadTodos$ = this.actions$.pipe(
        ofType(loadAction3.type),
        mergeMap(() => of('some result').pipe(map((res) => loadSuccessAction3)))
    );

    constructor(private actions$: Actions) {}
}

class CounterFeatureStore extends FeatureStore<CounterState> {
    constructor() {
        super('counterFs', counterInitialState);
    }

    inc() {
        this.setState((state) => ({
            counter: state.counter + 1,
        }));
    }
}

const globalCsExtensions = [new LoggerExtension(), new ImmutableStateExtension()];

const reduxDevToolsExtension = new ReduxDevtoolsExtension({ name: 'Test Redux DevTools' });
const stateFromReduxDevTools = {
    someProp: 'someValue',
};

describe(`Ng Modules`, () => {
    let actions$: Actions;
    let store: Store;

    const rootMetaReducerSpy = jest.fn();
    const configureStoreSpy = jest.spyOn(_StoreCore, 'configureStore');

    function rootMetaReducer(reducer: Reducer<any>): Reducer<any> {
        return (state, action) => {
            rootMetaReducerSpy(state);
            return reducer(state, action);
        };
    }

    const extensionSpy = jest.fn();

    class SomeExtension extends StoreExtension {
        id = 1; // id does not matter, but it has to be implemented

        init(): void {
            extensionSpy();
        }
    }

    beforeAll(() => {
        TestBed.configureTestingModule({
            imports: [
                Counter4Module,
                EffectsModule.register([TodoEffects, TodoEffectsNOK]),
                StoreModule.forRoot({
                    reducers: {
                        counter1: counterReducer,
                    },
                    initialState: {
                        counter1: { counter: 111 },
                    },
                    metaReducers: [rootMetaReducer],
                    extensions: [new SomeExtension(), reduxDevToolsExtension],
                }),
                Counter5Module,
                ComponentStoreModule.forRoot({
                    extensions: globalCsExtensions,
                }),
            ],
        });

        actions$ = TestBed.inject(Actions);
        store = TestBed.inject(Store);
    });

    it(`should provide Store`, () => {
        expect(store).toBeTruthy();
    });

    it(`should initialize Store`, () => {
        const spy = jest.fn();
        store.select((state) => state).subscribe(spy);
        expect(spy).toHaveBeenCalledWith({
            counter1: { counter: 111 }, // Reducer initial state is overwritten by initial state from forRoot config
            counter4: { counter: 1 },
            counter5: { counter: 555 }, // forFeature config initial state
        });
        expect(spy).toHaveBeenCalledTimes(1);

        expect(rootMetaReducerSpy).toHaveBeenCalledTimes(3);
        expect(featureMetaReducerSpy).toHaveBeenCalledTimes(1);
        expect(extensionSpy).toHaveBeenCalledTimes(1);
    });

    it(`should provide Actions`, () => {
        expect(actions$).toBeTruthy();
    });

    it(`should update state`, () => {
        const spy = jest.fn();
        store.dispatch({ type: 'counter' });
        store.select((state) => state).subscribe(spy);

        expect(spy).toHaveBeenCalledWith({
            counter1: { counter: 112 },
            counter4: { counter: 2 },
            counter5: { counter: 556 },
        });

        expect(rootMetaReducerSpy).toHaveBeenCalledTimes(4);
        expect(featureMetaReducerSpy).toHaveBeenCalledTimes(2);
    });

    it(`should run effect`, () => {
        const spy = jest.fn();
        actions$.subscribe(spy);

        store.dispatch(loadAction);

        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(loadAction);
        expect(spy).toHaveBeenCalledWith(loadSuccessAction);
    });

    it(`should run non-dispatching effect`, () => {
        const spy = jest.fn();
        actions$.subscribe(spy);

        store.dispatch(loadAction2);

        expect(spy).toHaveBeenCalledWith(loadAction2);
        expect(spy).not.toHaveBeenCalledWith(loadSuccessAction);
    });

    it(`should NOT run effects from TodoEffectsNOK`, () => {
        const spy = jest.fn();
        actions$.subscribe(spy);

        store.dispatch(loadAction3);

        expect(spy).toHaveBeenCalledWith(loadAction3);
        expect(spy).not.toHaveBeenCalledWith(loadSuccessAction3);
    });

    describe(`FeatureStore`, () => {
        let fs: CounterFeatureStore;

        it(`should add Feature Store`, () => {
            fs = new CounterFeatureStore();

            const spy = jest.fn();
            store.select((state) => state).subscribe(spy);

            expect(spy).toHaveBeenCalledWith({
                counter1: { counter: 112 },
                counterFs: { counter: 1 },
                counter4: { counter: 2 },
                counter5: { counter: 556 },
            });
        });

        it(`should update state`, () => {
            const spy = jest.fn();
            fs.inc();
            store.select((state) => state).subscribe(spy);

            expect(spy).toHaveBeenCalledWith({
                counter1: { counter: 112 },
                counterFs: { counter: 2 },
                counter4: { counter: 2 },
                counter5: { counter: 556 },
            });
        });
    });

    describe(`ComponentStore`, () => {
        // Just make sure that the global config is set via the ComponentStoreModule.forRoot static method
        // For the other aspects of the config we can rely on the ComponentStore tests

        it('should merge global config with local config', () => {
            const localCsExtensions = [new UndoExtension()];

            const cs = createComponentStore(undefined, { extensions: localCsExtensions });

            expect(cs['extensions'][0]).toBe(localCsExtensions[0]);
            expect(cs['extensions'][1]).toBe(globalCsExtensions[0]);
            expect(cs['extensions'][2]).toBe(globalCsExtensions[1]);
        });
    });

    describe(`Redux DevTools extension`, () => {
        it('should initialize NgReduxDevtoolsExtension', () => {
            const devToolsExtensionFromConfig: NgReduxDevtoolsExtension = configureStoreSpy.mock
                .calls[0][0]!['extensions']![1] as NgReduxDevtoolsExtension;

            // It would have been nicer to spy on addExtension, but that did not work without refactor of StoreCore (https://medium.com/@DavideRama/mock-spy-exported-functions-within-a-single-module-in-jest-cdf2b61af642)
            expect(devToolsExtensionFromConfig).toBeInstanceOf(NgReduxDevtoolsExtension);
            expect(devToolsExtensionFromConfig['options']).toEqual(
                expect.objectContaining({
                    name: 'Test Redux DevTools',
                    traceLimit: 25,
                })
            );
        });

        it('should update the Store state', () => {
            const devToolsExtensionFromConfig: NgReduxDevtoolsExtension = configureStoreSpy.mock
                .calls[0][0]!['extensions']![1] as NgReduxDevtoolsExtension;

            const spy = jest.spyOn(_StoreCore.appState, 'set');
            JSON.parse = jest.fn().mockImplementationOnce((data) => {
                return data;
            });

            devToolsExtensionFromConfig['onDevToolsMessage']({
                type: 'DISPATCH',
                payload: {
                    type: 'JUMP_TO_STATE',
                },
                state: stateFromReduxDevTools,
            });

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(stateFromReduxDevTools);

            spy.mockReset();

            devToolsExtensionFromConfig['onDevToolsMessage']({
                type: 'NOT_SUPPORTED_TYPE',
                payload: {},
                state: {},
            });

            expect(spy).toHaveBeenCalledTimes(0);
        });
    });
});
