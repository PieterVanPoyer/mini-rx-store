import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const features = [
    {
        title: 'Redux Store',
        description: (
            <>
                <strong>Advanced state management:</strong> MiniRx is a full-blown Redux Store to manage global, application-wide state: It includes <strong>actions, reducers, meta reducers, memoized selectors</strong> and <strong>Redux DevTools</strong> support.
            </>
        ),
    },
    {
        title: 'Feature Stores',
        description: (
            <>
                <strong>Simple yet powerful state management</strong> with MiniRx Feature Stores: manage feature state directly with a minimum of boilerplate.
            </>
        ),
    },
    {
        title: 'RxJS',
        description: (
            <>
                <strong>RxJS-based side effects model</strong>: Let the action stream trigger side
                effects like API calls and <strong>handle race conditions</strong> with RxJS
                flattening operators.
                <br />
                State and actions are exposed as <strong>RxJS Observables</strong>.
            </>
        ),
    },
    {
        title: 'Framework-agnostic and TypeScript-friendly',
        description: (
            <>
                MiniRx works with any front-end project built with JavaScript or TypeScript
                (Angular, Svelte, React, Vue, or anything else).
                <br />
                The MiniRx API comes with TypeScript type definitions.
            </>
        ),
    },
];

function Feature({ imageUrl, title, description }) {
    const imgUrl = useBaseUrl(imageUrl);
    return (
        <div className={clsx('col col--3', styles.feature)}>
            {imgUrl && (
                <div className="text--center">
                    <img className={styles.featureImage} src={imgUrl} alt={title} />
                </div>
            )}
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
}

function Home() {
    const context = useDocusaurusContext();
    const { siteConfig = {} } = context;
    return (
        <Layout
            title={`Hello from ${siteConfig.title}`}
            description="Reactive State Management inspired by Redux"
        >
            <header className={clsx('hero hero--primary', styles.heroBanner)}>
                <div className="container">
                    <div className="mrx-flex">
                        <div className="mrx-title-container">
                            <h1 className="hero__title">{siteConfig.title}</h1>
                            <p className="hero__subtitle">{siteConfig.tagline}</p>
                            <div className="mrx-flex-buttons">
                                <Link
                                    className={clsx(
                                        'button button--outline button--secondary button--lg',
                                        styles.getStarted
                                    )}
                                    to={useBaseUrl('docs/intro')}
                                >
                                    Get Started
                                </Link>
                                <iframe src="https://ghbtns.com/github-btn.html?user=spierala&repo=mini-rx-store&type=star&count=true&size=large"></iframe>
                            </div>
                        </div>
                        <div className="mrx-schema-container">
                            <img className="mrx-schema" src="img/mini-rx-store-schema.svg" />
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {features && features.length > 0 && (
                    <section className={styles.features}>
                        <div className="container">
                            <div className="row">
                                {features.map((props, idx) => (
                                    <Feature key={idx} {...props} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </Layout>
    );
}

export default Home;
