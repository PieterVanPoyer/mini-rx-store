import { tap, withLatestFrom } from 'rxjs/operators';
import { Action, AppState, StoreExtension } from '../models';
import StoreCore from '../store-core';
import { beautifyActionForLogging, miniRxError } from '../utils';

const defaultOptions: Partial<ReduxDevtoolsOptions> = {
    name: 'MiniRx - Redux Dev Tools',
};

export interface ReduxDevtoolsOptions {
    name: string;
    maxAge: number;
    latency: number;
}

export class ReduxDevtoolsExtension extends StoreExtension {
    private devtoolsExtension = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
    private devtoolsConnection: any;

    constructor(private readonly options: Partial<ReduxDevtoolsOptions>) {
        super();
        
        if (!window) {
            miniRxError('The Redux DevTools are only supported in Browser environments')
        }

        this.options = {
            ...defaultOptions,
            ...this.options,
        };
    }

    init() {
        if (this.devtoolsExtension) {
            this.devtoolsConnection = this.devtoolsExtension.connect(this.options);

            StoreCore.actions$
                .pipe(
                    withLatestFrom(StoreCore.state$),
                    tap(([action, state]) => {
                        let actionForDevTools: Action = beautifyActionForLogging(action, state);
                        this.devtoolsConnection.send(actionForDevTools, state);
                    })
                )
                .subscribe();

            this.devtoolsConnection.subscribe(this.onDevToolsMessage.bind(this));
        }
    }

    private onDevToolsMessage(message: { type: string; payload: any; state: any }) {
        if (message.type === DevToolActions.DISPATCH) {
            switch (message.payload.type) {
                case DevToolActions.JUMP_TO_STATE:
                case DevToolActions.JUMP_TO_ACTION:
                    this.updateState(JSON.parse(message.state));
            }
        }
    }

    protected updateState(state: AppState) {
        StoreCore.updateState(state);
    }
}

const enum DevToolActions {
    DISPATCH = 'DISPATCH',
    JUMP_TO_STATE = 'JUMP_TO_STATE',
    JUMP_TO_ACTION = 'JUMP_TO_ACTION',
}
