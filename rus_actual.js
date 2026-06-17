(function () {
    'use strict';

    var ID = 'rus_actual_plugin';

    if (window[ID]) return;
    window[ID] = true;

    var DATE = new Date();
    DATE.setFullYear(DATE.getFullYear() - 1);

    var DATE_FROM =
        DATE.getFullYear() + '-' +
        ('0' + (DATE.getMonth() + 1)).slice(-2) + '-' +
        ('0' + DATE.getDate()).slice(-2);

    var BLOCKS = [
        {
            key: 'ru_movies',
            title: '🇷🇺 Русские фильмы',
            url:
                'discover/movie' +
                '?with_origin_country=RU' +
                '&primary_release_date.gte=' + DATE_FROM +
                '&sort_by=popularity.desc' +
                '&vote_count.gte=50' +
                '&without_genres=99'
        },
        {
            key: 'ru_series',
            title: '🇷🇺 Русские сериалы',
            url:
                'discover/tv' +
                '?with_origin_country=RU' +
                '&first_air_date.gte=' + DATE_FROM +
                '&sort_by=popularity.desc' +
                '&vote_count.gte=50' +
                '&without_genres=99,10764,10767'
        }
    ];

    function exists(key) {
        return document.querySelector(
            '[data-rus-block="' + key + '"]'
        );
    }

    function insertFirst(node) {
        var container =
            document.querySelector('.main__content');

        if (!container) return;

        container.insertBefore(
            node,
            container.firstElementChild
        );
    }

    function addBlock(block) {
        if (exists(block.key)) return;

        Lampa.Api.partNext({
            url: block.url,
            onComplite: function (json) {
                if (
                    !json ||
                    !json.results ||
                    !json.results.length
                ) {
                    return;
                }

                var row =
                    Lampa.InteractionCategory({
                        title: block.title,
                        results: json.results
                    });

                var element = row.render()[0];

                if (!element) return;

                element.setAttribute(
                    'data-rus-block',
                    block.key
                );

                insertFirst(element);
            }
        });
    }

    function build() {
        var activity =
            Lampa.Activity.active();

        if (
            !activity ||
            activity.component !== 'main'
        ) {
            return;
        }

        BLOCKS.forEach(addBlock);
    }

    Lampa.Listener.follow(
        'activity',
        function (e) {
            if (e.type === 'ready') {
                setTimeout(build, 300);
            }
        }
    );

    document.addEventListener(
        'visibilitychange',
        function () {
            if (!document.hidden) {
                setTimeout(build, 300);
            }
        }
    );
})();
