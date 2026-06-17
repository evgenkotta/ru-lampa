(function () {
    'use strict';

    var PLUGIN_ID = 'rus_actual_rows';

    if (window[PLUGIN_ID]) return;
    window[PLUGIN_ID] = true;

    function getDateYearAgo() {
        var d = new Date();
        d.setFullYear(d.getFullYear() - 1);

        var y = d.getFullYear();
        var m = ('0' + (d.getMonth() + 1)).slice(-2);
        var day = ('0' + d.getDate()).slice(-2);

        return y + '-' + m + '-' + day;
    }

    var DATE_FROM = getDateYearAgo();

    var SECTIONS = [
        {
            title: '🇷🇺 Русские фильмы',
            url:
                'discover/movie?' +
                'with_origin_country=RU' +
                '&primary_release_date.gte=' + DATE_FROM +
                '&sort_by=popularity.desc' +
                '&vote_count.gte=50',
            className: 'rus-actual-movies'
        },
        {
            title: '🇷🇺 Русские сериалы',
            url:
                'discover/tv?' +
                'with_origin_country=RU' +
                '&first_air_date.gte=' + DATE_FROM +
                '&sort_by=popularity.desc' +
                '&vote_count.gte=50',
            className: 'rus-actual-series'
        }
    ];

    function rowExists(className) {
        return document.querySelector('.' + className);
    }

    function createRow(section) {
        if (rowExists(section.className)) return;

        Lampa.Api.partNext({
            url: section.url,
            onComplite: function (json) {
                if (!json || !json.results || !json.results.length) return;

                var row = Lampa.InteractionCategory({
                    title: section.title,
                    results: json.results
                });

                row.addClass(section.className);

                var content = document.querySelector('.main__content');
                if (!content) return;

                var element = row.render()[0];

                if (!element) return;

                content.insertBefore(
                    element,
                    content.firstElementChild
                );
            }
        });
    }

    function addRows() {
        SECTIONS.forEach(createRow);
    }

    Lampa.Listener.follow('activity', function (event) {
        if (event.type !== 'ready') return;

        var activity = Lampa.Activity.active();
        if (!activity || activity.component !== 'main') return;

        setTimeout(addRows, 300);
    });

    Lampa.Listener.follow('full', function () {
        setTimeout(function () {
            var activity = Lampa.Activity.active();

            if (
                activity &&
                activity.component === 'main'
            ) {
                addRows();
            }
        }, 300);
    });
})();
