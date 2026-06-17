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


        function moveComponentItemsToTop() {
            var component = activeMainComponent();
            var i;
            var title;
            var moviesIndex = -1;
            var tvIndex = -1;
            var item;

            if (!component || !isArray(component.items)) return;

            for (i = 0; i < component.items.length; i++) {
                title = component.items[i] &&
                    component.items[i].data
                    ? component.items[i].data.title
                    : '';

                if (title === 'Русские фильмы') moviesIndex = i;
                if (title === 'Русские сериалы') tvIndex = i;
            }

            if (moviesIndex > 0) {
                item = component.items.splice(moviesIndex, 1)[0];
                component.items.splice(0, 0, item);

                if (tvIndex >= 0 && tvIndex < moviesIndex) {
                    tvIndex++;
                }
            }

            tvIndex = -1;

            for (i = 0; i < component.items.length; i++) {
                title = component.items[i] &&
                    component.items[i].data
                    ? component.items[i].data.title
                    : '';

                if (title === 'Русские сериалы') tvIndex = i;
            }

            if (tvIndex > 1) {
                item = component.items.splice(tvIndex, 1)[0];
                component.items.splice(1, 0, item);
            }
        }

        function today() {
            return new Date().toISOString().slice(0, 10);
        }

        function sortBy(type) {
            return type === 'movie'
                ? 'primary_release_date.desc'
                : 'first_air_date.desc';
        }

        function buildMovieUrl() {
            var url =
                'discover/movie' +
                '?sort_by=' + sortBy('movie') +
                '&watch_region=RU' +
                '&with_watch_monetization_types=flatrate|free' +
                '&with_origin_country=RU' +
                '&with_original_language=ru' +
                '&primary_release_date.lte=' + today();

            if (!setting('ru_actual_animation', false)) {
                url += '&without_genres=16';
            }

            return url;
        }

        function buildTvUrl() {
            var url =
                'discover/tv' +
                '?sort_by=' + sortBy('tv') +
                '&watch_region=RU' +
                '&with_watch_monetization_types=flatrate|free' +
                '&with_origin_country=RU' +
                '&with_original_language=ru' +
                '&first_air_date.lte=' + today();

            if (!setting('ru_actual_animation', false)) {
                url += '&without_genres=16';
            }

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
                // if (card.adult) return false;
                if (exists[key]) return false;

                exists[key] = true;
                card.promo = card.overview;
                card.promo_title =
                    card.title || card.name;

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


        console.log('[Ru Actual] loaded');
    });
})();
