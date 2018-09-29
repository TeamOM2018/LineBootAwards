var strings = require('./strings'),
    http = require('http'),
    request = require('request');
var server = http.createServer();

const BASEURL = 'https://api.annict.com/v1/works'

function filter_season() {
    /*filter_seasonオプション作成*/
    var date = new Date(),
        year = date.getFullYear(),
        month = date.getMonth(),
        str = ''

    if (month < 3) str = 'winter';
    else if (month < 6) str = 'spring';
    else if (month < 9) str = 'summer';
    else str = 'autumn';
    return year + '-' + str;
}

function get_titles(body) {
    /*jsonからタイトルゲット*/
    var json = JSON.parse(body);
    var titles = [];
    for (var i = 0; i < json.works.length; i++)
        titles.push(json.works[i].title);
    return titles;
}

server.on('request', function(req, res) {
    if (req.url === '/favicon.ico') return; // chromeのダブルリクエスト処理
    res.writeHead(200, {
        'Content-type': 'text/plain'
    });

    request.get({
        url: BASEURL,
        qs: {
            access_token: strings.token,
            filter_season: filter_season(),
            per_page: 5,
            sort_watchers_count: 'desc'
        }
    }, function(error, response, body) {
        var titles = get_titles(body);
        console.log('今期アニメの人気ランキング！！');
        for (var i = 0; i < titles.length; i++)
            console.log(i + 1 + '位 : ' + titles[i]);
    });

    res.end();
})

server.listen(process.env.PORT || 3000);
console.log('server listening ...');
