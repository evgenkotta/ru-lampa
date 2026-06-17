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
                    font-size="38"
                    font-family="Arial, sans-serif"
                    font-weight="700"
                    fill="currentColor"
                  >
                    RU
                  </text>
                </svg>`
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

        function buildMovieUrl() {
            var url =
                'discover/movie' +
                '?watch_region=RU' +
                '&with_origin_country=RU';

            if (setting('ru_actual_russian_only', true)) {
                url += '&with_original_language=ru';
            }

            if (!setting('ru_actual_animation', false)) {
                url += '&without_genres=16';
            }

            url +=
                '&vote_count.gte=' +
                setting('ru_actual_votes', 20);

            switch (setting('ru_actual_sort', 'popularity')) {
                case 'release':
                    url += '&sort_by=primary_release_date.desc';
                    break;

                case 'rating':
                    url += '&sort_by=vote_average.desc';
                    break;

                default:
                    url += '&sort_by=popularity.desc';
            }

            return url;
        }

        function buildTvUrl() {
            var url =
                'discover/tv' +
                '?watch_region=RU' +
                '&with_origin_country=RU';

            if (setting('ru_actual_russian_only', true)) {
                url += '&with_original_language=ru';
            }

            if (!setting('ru_actual_animation', false)) {
                url += '&without_genres=16';
            }

            url +=
                '&vote_count.gte=' +
                setting('ru_actual_votes', 20);

            switch (setting('ru_actual_sort', 'popularity')) {
                case 'release':
                    url += '&sort_by=first_air_date.desc';
                    break;

                case 'rating':
                    url += '&sort_by=vote_average.desc';
                    break;

                default:
                    url += '&sort_by=popularity.desc';
            }

            return url;
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

                        json.results = json.results.slice(0, limit);

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
            index: -1000,

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
            index: -999,

            call: function () {
                if (!setting('ru_actual_tv', true))
                    return [];

                return createRow(
                    'Русские сериалы',
                    buildTvUrl()
                );
            }
        });

        console.log('[Ru Actual] loaded');
    });
})();
