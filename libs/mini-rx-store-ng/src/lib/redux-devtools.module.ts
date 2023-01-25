// Inspired by: Akita: https://github.com/datorama/akita/blob/master/libs/akita-ng-devtools/src/lib/ng-devtools.module.ts)
// TODO remove in one of the coming major versions

import {
    APP_INITIALIZER,
    Inject,
    Injectable,
    InjectionToken,
    Injector,
    ModuleWithProviders,
    NgModule,
} from '@angular/core';
import { NgReduxDevtoolsExtension } from './ng-redux-devtools.extension';
import { _StoreCore, ReduxDevtoolsOptions } from 'mini-rx-store';

export const DEVTOOLS_OPTIONS = new InjectionToken<ReduxDevtoolsOptions>(
    '@mini-rx/reduxDevtoolsOptions'
);

@Injectable({
    providedIn: 'root',
})
export class NgReduxDevtoolsService {
    constructor(
        private injector: Injector,
        @Inject(DEVTOOLS_OPTIONS) private options: ReduxDevtoolsOptions
    ) {
        _StoreCore.addExtension(new NgReduxDevtoolsExtension(options, injector));
    }
}

// Auto initialize the devtools
export function d() {}
export function init(devtoolsService: NgReduxDevtoolsService) {
    return d;
}

@NgModule()
/** @deprecated Use the normal `ReduxDevtoolsExtension` from mini-rx-store with the `StoreModule.forRoot` config */
export class StoreDevtoolsModule {
    /** @deprecated Use the normal `ReduxDevtoolsExtension` from mini-rx-store with the `StoreModule.forRoot` config */
    static instrument(
        config: Partial<ReduxDevtoolsOptions> = {}
    ): ModuleWithProviders<StoreDevtoolsModule> {
        return {
            ngModule: StoreDevtoolsModule,
            providers: [
                {
                    provide: DEVTOOLS_OPTIONS,
                    useValue: config,
                },
                {
                    provide: APP_INITIALIZER,
                    useFactory: init,
                    deps: [NgReduxDevtoolsService],
                    multi: true,
                },
            ],
        };
    }
}
