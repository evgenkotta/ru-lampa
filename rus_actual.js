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


        function today() {
            return new Date().toISOString().slice(0, 10);
        }

        function sortBy(type) {
            return type === 'movie'
                ? 'primary_release_date.desc'
                : 'first_air_date.desc';
        }

        function buildUrl(type) {
            var isMovie = type === 'movie';
            var url =
                'discover/' + type +
                '?sort_by=' + sortBy(type) +
                '&watch_region=RU' +
                '&with_watch_monetization_types=flatrate|free' +
                '&with_origin_country=RU' +
                '&with_original_language=ru' +
                '&' + (
                    isMovie
                        ? 'primary_release_date.lte='
                        : 'first_air_date.lte='
                ) + today();

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
                card.promo_title = card.title || card.name;

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
            index: 0,

            call: function () {
                if (!setting('ru_actual_movies', true))
                    return [];

                return createRow(
                    'Русские фильмы',
                    buildUrl('movie')
                );
            }
        });

        Lampa.ContentRows.add({
            name: 'ru_actual_tv',
            title: 'Русские сериалы',
            screen: ['main'],
            index: 1,

            call: function () {
                if (!setting('ru_actual_tv', true))
                    return [];

                return createRow(
                    'Русские сериалы',
                    buildUrl('tv')
                );
            }
        });


        function placeRowsAfterWatching() {
            var active = Lampa.Activity && Lampa.Activity.active
                ? Lampa.Activity.active()
                : null;
            var component = active && active.activity
                ? active.activity.component
                : null;

            if (!component || !component.items) return;

            var items = component.items;
            var watching = -1;
            var movies = -1;
            var tv = -1;

            items.forEach(function (item, i) {
                var title = item && item.data ? item.data.title : '';

                if (title === 'Сейчас смотрят') watching = i;
                if (title === 'Русские фильмы') movies = i;
                if (title === 'Русские сериалы') tv = i;
            });

            if (watching === -1 || movies === -1 || tv === -1) return;

            var moviesItem = items.splice(movies, 1)[0];
            if (movies < watching) watching--;
            items.splice(watching + 1, 0, moviesItem);

            tv = items.findIndex(function (item) {
                return item && item.data && item.data.title === 'Русские сериалы';
            });

            var tvItem = items.splice(tv, 1)[0];
            movies = items.findIndex(function (item) {
                return item && item.data && item.data.title === 'Русские фильмы';
            });
            items.splice(movies + 1, 0, tvItem);
        }

        Lampa.Listener.follow('activity', function (e) {
            if (e && e.type === 'start' && e.component === 'main') {
                setTimeout(placeRowsAfterWatching, 0);
                setTimeout(placeRowsAfterWatching, 300);
            }
        });

        console.log('[Ru Actual] loaded');
    });
})();
