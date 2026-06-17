/* Lampa.plugin */
(function () {
    'use strict';

    if (window.rus_actual_loaded) return;
    window.rus_actual_loaded = true;

    function createRow(type, title) {
        return {
            name: 'ru_' + type,
            title: title,
            screen: ['main'],
            index: -1000,

            call: function () {
                return function (call) {
                    var url;

                    if (type === 'movie') {
                        url =
                            'discover/movie' +
                            '?sort_by=popularity.desc' +
                            '&with_origin_country=RU' +
                            '&with_original_language=ru' +
                            '&without_genres=16' +
                            '&vote_count.gte=10';
                    }
                    else {
                        url =
                            'discover/tv' +
                            '?sort_by=popularity.desc' +
                            '&with_origin_country=RU' +
                            '&with_original_language=ru' +
                            '&without_genres=16,10764,10767' +
                            '&vote_count.gte=10';
                    }

                    Lampa.Api.list(
                        {
                            source: 'tmdb',
                            url: url
                        },
                        function (json) {
                            if (!json || !json.results || !json.results.length) {
                                return call();
                            }

                            json.title = title;

                            json.results = json.results
                                .filter(function (item) {
                                    return item.poster_path;
                                })
                                .filter(function (item) {
                                    return item.overview;
                                })
                                .slice(0, 20);

                            if (!json.results.length) {
                                return call();
                            }

                            json.results.forEach(function (item) {
                                item.promo = item.overview;
                                item.promo_title =
                                    item.title ||
                                    item.name ||
                                    '';
                            });

                            call(json);
                        },
                        function () {
                            call();
                        }
                    );
                };
            }
        };
    }

    Lampa.ContentRows.add(
        createRow('movie', 'Русские фильмы')
    );

    Lampa.ContentRows.add(
        createRow('tv', 'Русские сериалы')
    );

    console.log('[Rus Actual] loaded');
})();
