import { Feature } from '../feature';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { createFeatureSelector, createSelector } from '../selector';
import { cold, hot } from 'jest-marbles';
import Store, { actions$ } from '../store';
import { counterInitialState, counterReducer } from './_spec-helpers';

interface UserState {
    firstName: string;
    lastName: string;
    city: string;
    country: string;
    err: string;
}

const initialState: UserState = {
    firstName: 'Bruce',
    lastName: 'Willis',
    city: 'LA',
    country: 'United States',
    err: undefined,
};

const asyncUser: UserState = {
    firstName: 'Steven',
    lastName: 'Seagal',
    city: 'LA',
    country: 'United States',
    err: '',
};

function fakeApiGet(): Observable<UserState> {
    return cold('---a', { a: asyncUser });
}

function fakeApiWithError(): Observable<UserState> {
    return cold('-#');
}

const getUserFeatureState = createFeatureSelector<UserState>('user2'); // Select From App State
const getCity = createSelector(getUserFeatureState, (state) => state.city);

const getUserFeatureState2 = createFeatureSelector<UserState>(); // Select directly from Feature State by omitting the Feature name
const getCountry = createSelector(getUserFeatureState2, (state) => state.country);

Store.feature('someFeature', counterReducer);
const getSomeFeatureSelector = createFeatureSelector('someFeature');

class FeatureState extends Feature<UserState> {
    state$ = this.state$;
    firstName$ = this.select((state) => state.firstName);
    lastName$ = this.select((state) => state.lastName);
    country$ = this.select(getCountry);
    city$ = this.select(getCity, true);
    someFeatureState$ = this.select(getSomeFeatureSelector, true);

    loadFn = this.createEffect(
        (payload$) => payload$.pipe(mergeMap(() => fakeApiGet().pipe(map((user) => user)))),
        'load'
    );

    loadFnWithoutName = this.createEffect((payload$) =>
        payload$.pipe(mergeMap(() => fakeApiGet().pipe(map((user) => user))))
    );

    loadFnWithoutName2 = this.createEffect((payload$) =>
        payload$.pipe(mergeMap(() => fakeApiGet().pipe(map((user) => user))))
    );

    loadFnWithError = this.createEffect((payload$) =>
        payload$.pipe(
            mergeMap(() =>
                fakeApiWithError().pipe(
                    map((user) => user),
                    catchError((err) => of({ err: 'error' }))
                )
            )
        )
    );

    constructor() {
        super('user2', initialState);
    }

    updateFirstName(firstName) {
        this.setState({ firstName });
    }

    updateLastName(lastName) {
        this.setState({ lastName });
    }

    updateCity(city) {
        this.setState({ city }, 'updateCity');
    }

    updateCountry(country) {
        this.setState({
            ...this.state, // Test updating state using `this.state`
            country,
        });
    }

    resetState() {
        this.setState(initialState);
    }
}

const userFeature: FeatureState = new FeatureState();

describe('Feature', () => {
    it('should initialize the feature', () => {
        const spy = jest.fn();
        userFeature.state$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith(initialState);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should update state', () => {
        userFeature.updateFirstName('Nicolas');
        const spy = jest.fn();
        userFeature.firstName$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith('Nicolas');
        expect(spy).toHaveBeenCalledTimes(1);

        spy.mockReset();

        userFeature.updateLastName('Cage');
        userFeature.lastName$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith('Cage');
        expect(spy).toHaveBeenCalledTimes(1);

        spy.mockReset();

        userFeature.updateCountry('Belgium'); // Test updating state using `this.state`
        userFeature.country$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith('Belgium');
        expect(spy).toHaveBeenCalledTimes(1);

        userFeature.resetState();
    });

    it('should select state from App State', () => {
        const spy = jest.fn();
        userFeature.city$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith('LA');
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should select state from Feature State', () => {
        const spy = jest.fn();
        userFeature.country$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith('United States');
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should select state from another Feature (created with Store.feature)', () => {
        const spy = jest.fn();
        userFeature.someFeatureState$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith(counterInitialState);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should create and execute an effect', () => {
        userFeature.loadFn();
        expect(userFeature.firstName$).toBeObservable(hot('a--b', { a: 'Bruce', b: 'Steven' }));
    });

    it('should create and execute an effect and handle error', () => {
        userFeature.resetState();
        userFeature.loadFnWithError();
        expect(userFeature.state$).toBeObservable(
            hot('ab', { a: initialState, b: { ...initialState, err: 'error' } })
        );
    });

    it('should dispatch a set-state default action', () => {
        userFeature.resetState();

        const spy = jest.fn();
        actions$.subscribe(spy);
        userFeature.updateCity('NY');
        expect(spy).toHaveBeenCalledWith({
            type: '@mini-rx/user2/SET-STATE/updateCity',
            payload: { city: 'NY' },
        });
    });

    it('should append effect name to action type', () => {
        hot('a').subscribe(() => userFeature.loadFn());

        expect(actions$).toBeObservable(
            hot('a--b', {
                a: { type: '@mini-rx/user2/EFFECT/load', payload: undefined },
                b: {
                    type: '@mini-rx/user2/EFFECT/load/SET-STATE',
                    payload: asyncUser,
                },
            })
        );
    });

    it('should append default effect name to action type', () => {
        hot('a').subscribe(() => userFeature.loadFnWithoutName());

        expect(actions$).toBeObservable(
            hot('a--b', {
                a: { type: '@mini-rx/user2/EFFECT/1', payload: undefined },
                b: {
                    type: '@mini-rx/user2/EFFECT/1/SET-STATE',
                    payload: asyncUser,
                },
            })
        );
    });

    it('should increment and append default effect name to action type', () => {
        hot('a').subscribe(() => userFeature.loadFnWithoutName2());

        expect(actions$).toBeObservable(
            hot('a--b', {
                a: { type: '@mini-rx/user2/EFFECT/2', payload: undefined },
                b: {
                    type: '@mini-rx/user2/EFFECT/2/SET-STATE',
                    payload: asyncUser,
                },
            })
        );
    });

    it('should resubscribe on action stream when side effect error is not handled', () => {
        const spy = jest.fn();

        class EffectResubscribeFeature extends Feature<any> {
            loadFnWithUnhandledError = this.createEffect((payload$) =>
                payload$.pipe(
                    mergeMap(() => {
                        spy();
                        throw new Error();
                    })
                )
            );

            constructor() {
                super('EffectResubscribeFeature', {});
            }
        }

        const feature: EffectResubscribeFeature = new EffectResubscribeFeature();
        feature.loadFnWithUnhandledError();
        feature.loadFnWithUnhandledError();
        feature.loadFnWithUnhandledError();

        expect(spy).toHaveBeenCalledTimes(3);
    });
});
