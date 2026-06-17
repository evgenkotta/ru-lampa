/* Lampa.plugin */
(function () {
    'use strict';

    if (window.__ru_actual_plugin) return;
    window.__ru_actual_plugin = true;

    function waitForLampa(callback) {
        if (window.Lampa) callback();
        else setTimeout(function () {
            waitForLampa(callback);
        }, 100);
    }

    waitForLampa(function () {

        function setting(name, def) {
            return Lampa.Storage.get(name, def);
        }

        function registerSettings() {
            if (!Lampa.SettingsApi) return;

            Lampa.SettingsApi.addComponent({
                component: 'ru_actual',
                name: 'Русские фильмы и сериалы',
                icon: `
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <rect
                    x="12"
                    y="12"
                    width="76"
                    height="76"
                    rx="22"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="6"
                  />
                
                  <text
                    x="50"
                    y="56"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    font-size="36"
                    font-family="Arial, sans-serif"
                    font-weight="700"
                    fill="currentColor"
                  >
                    RU
                  </text>
                </svg>
                `
            });

            Lampa.SettingsApi.addParam({
                component: 'ru_actual',
                param: {
                    name: 'ru_actual_movies',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: 'Показывать фильмы'
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'ru_actual',
                param: {
                    name: 'ru_actual_tv',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: 'Показывать сериалы'
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'ru_actual',
                param: {
                    name: 'ru_actual_animation',
                    type: 'trigger',
                    default: false
                },
                field: {
                    name: 'Показывать мультфильмы'
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'ru_actual',
                param: {
                    name: 'ru_actual_russian_only',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: 'Только русский язык'
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'ru_actual',
                param: {
                    name: 'ru_actual_votes',
                    type: 'select',
                    values: {
                        0: '0',
                        5: '5',
                        10: '10',
                        20: '20',
                        50: '50'
                    },
                    default: 20
                },
                field: {
                    name: 'Минимум голосов'
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'ru_actual',
                param: {
                    name: 'ru_actual_sort',
                    type: 'select',
                    values: {
                        popularity: 'Популярные',
                        release: 'Новые',
                        rating: 'По рейтингу'
                    },
                    default: 'popularity'
                },
                field: {
                    name: 'Сортировка'
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'ru_actual',
                param: {
                    name: 'ru_actual_limit',
                    type: 'select',
                    values: {
                        10: '10',
                        20: '20',
                        30: '30'
                    },
                    default: 20
                },
                field: {
                    name: 'Количество карточек'
                }
            });
        }

        function moveRowsToTop() {
            var body = document.querySelector('.scroll__body');
            if (!body) return;

            var rows = Array.from(
                body.querySelectorAll('.items-line')
            );

            var movies = rows.find(function (row) {
                var title = row.querySelector('.items-line__title');

                return (
                    title &&
                    title.textContent.trim() ===
                        'Русские фильмы'
                );
            });

            var tv = rows.find(function (row) {
                var title = row.querySelector('.items-line__title');

                return (
                    title &&
                    title.textContent.trim() ===
                        'Русские сериалы'
                );
            });

            if (movies && body.firstChild !== movies) {
                body.insertBefore(
                    movies,
                    body.firstChild
                );
            }

            if (tv) {
                if (movies) {
                    if (movies.nextSibling !== tv) {
                        body.insertBefore(
                            tv,
                            movies.nextSibling
                        );
                    }
                } else if (body.firstChild !== tv) {
                    body.insertBefore(
                        tv,
                        body.firstChild
                    );
                }
            }
        }

        var rowsObserver;
        var observedBody;

        function observeRows() {
            var body = document.querySelector('.scroll__body');

            if (!body) return;

            if (rowsObserver && observedBody === body) {
                moveRowsToTop();
                return;
            }

            if (rowsObserver) {
                rowsObserver.disconnect();
            }

            observedBody = body;
            rowsObserver = new MutationObserver(function () {
                moveRowsToTop();
            });

            rowsObserver.observe(body, {
                childList: true,
                subtree: true
            });

            moveRowsToTop();
        }

        function today() {
            return new Date().toISOString().slice(0, 10);
        }

        function sortBy(type) {
            switch (setting('ru_actual_sort', 'popularity')) {
                case 'release':
                    return type === 'movie'
                        ? 'primary_release_date.desc'
                        : 'first_air_date.desc';

                case 'rating':
                    return 'vote_average.desc';

                default:
                    return 'popularity.desc';
            }
        }

        function buildMovieUrl() {
            var url =
                'discover/movie' +
                '?sort_by=' + sortBy('movie') +
                '&watch_region=RU' +
                '&with_watch_monetization_types=flatrate|free' +
                '&with_origin_country=RU' +
                '&primary_release_date.lte=' + today();

            if (setting('ru_actual_russian_only', true)) {
                url += '&with_original_language=ru';
            }

            if (!setting('ru_actual_animation', false)) {
                url += '&without_genres=16';
            }

            url +=
                '&vote_count.gte=' +
                setting('ru_actual_votes', 20);

            return url;
        }

        function buildTvUrl() {
            var url =
                'discover/tv' +
                '?sort_by=' + sortBy('tv') +
                '&watch_region=RU' +
                '&with_watch_monetization_types=flatrate|free' +
                '&with_origin_country=RU' +
                '&first_air_date.lte=' + today();

            if (setting('ru_actual_russian_only', true)) {
                url += '&with_original_language=ru';
            }

            if (!setting('ru_actual_animation', false)) {
                url += '&without_genres=16';
            }

            url +=
                '&vote_count.gte=' +
                setting('ru_actual_votes', 20);

            return url;
        }

        function releaseDate(card) {
            return card.release_date || card.first_air_date || '';
        }

        function normalizeResults(results) {
            var exists = {};

            results = results.filter(function (card) {
                var title = card.title || card.name || '';
                var year = releaseDate(card).slice(0, 4);
                var key = title.toLowerCase() + '|' + year;

                if (!card.poster_path) return false;
                if (exists[key]) return false;

                exists[key] = true;

                return true;
            });

            results.sort(function (a, b) {
                return releaseDate(b).localeCompare(releaseDate(a));
            });

            return results;
        }

        function createRow(title, url) {
            return function (ready) {
                Lampa.Api.list(
                    {
                        source: 'tmdb',
                        url: url
                    },
                    function (json) {
                        json = json || {};
                        json.results = json.results || [];

                        var limit = Number(
                            setting('ru_actual_limit', 20)
                        );

                        json.results = normalizeResults(json.results)
                            .slice(0, limit);

                        json.title = title;
                        json.name = title;

                        ready(json);
                    },
                    function () {
                        ready({
                            title: title,
                            name: title,
                            results: []
                        });
                    }
                );
            };
        }

        registerSettings();

        Lampa.ContentRows.add({
            name: 'ru_actual_movies',
            title: 'Русские фильмы',
            screen: ['main'],
            index: -99999,

            call: function () {
                if (!setting('ru_actual_movies', true))
                    return [];

                return createRow(
                    'Русские фильмы',
                    buildMovieUrl()
                );
            }
        });

        Lampa.ContentRows.add({
            name: 'ru_actual_tv',
            title: 'Русские сериалы',
            screen: ['main'],
            index: -99998,

            call: function () {
                if (!setting('ru_actual_tv', true))
                    return [];

                return createRow(
                    'Русские сериалы',
                    buildTvUrl()
                );
            }
        });

        Lampa.Listener.follow('activity', function (e) {
            if (
                e &&
                e.type === 'start' &&
                e.component === 'main'
            ) {
                observeRows();
            }
        });

        observeRows();

        console.log('[Ru Actual] loaded');
    });
})();
