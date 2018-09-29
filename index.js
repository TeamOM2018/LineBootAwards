let http = require('http'),
    request = require('request'),
    schedule = require('node-schedule');
var server = http.createServer();
// var notified_id = []; // 通知済みID
var notify_time = 7 * 24 * 60 * 60 * 1000; // 通知時間(ミリ秒前)

// 環境変数
const ANNICT_URL = process.env.ANNICT_URL;
const ANNICT_TOKEN = process.env.ANNICT_TOKEN;
const IFTTT_CLOVA = process.env.IFTTT_CLOVA;
// const IFTTT_FIREBASE = process.env.IFTTT_FIREBASE;

var count = 0;


function now() {
    /*現在時刻 (UTC)*/
    var date = new Date(),
        year = date.getUTCFullYear(),
        month = date.getUTCMonth() + 1,
        day = date.getUTCDate(),
        hours = date.getUTCHours(),
        minutes = date.getUTCMinutes();
    return year + '/' + month + '/' + day + ' ' + hours + ':' + minutes;
}


function notify(body) {
    /*通知*/
    var json = JSON.parse(body),
        message = '';

    // 通知内容作成
    for (var i = 0; i < json.programs.length; i++) {
        var startTime = new Date(json.programs[i].started_at);

        if (startTime.getTime() > new Date().getTime() + notify_time) break; // 通知時間外
        // if (notified_id.indexOf(json.programs[i].id) >= 0) continue; // 通知済み

        startTime.setHours(startTime.getHours() + 9);
        console.log(startTime.toString());
        var hours = startTime.getHours(),
            minutes = startTime.getMinutes(),
            title = json.programs[i].work.title_kana,
            id = json.programs[i].id;

        message += 'このあと' + hours + '時' + minutes + '分より、' + title + 'の放送があります。';
        // notified_id.push(id); // 通知済みリストへ追加
    }
    // message = '通知読んで';
    if(count == 1) {
        message = '';
        count = 0
    } else {
        count = 1
    }
    // トリガー送信
    send_trigger(message);
}


function send_trigger(message) {
    /*IFTTTにトリガー送信*/
    // Firebase 書き換え
    // request.post({
    //     url: IFTTT_FIREBASE,
    //     headers: {
    //         'content-type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //         'value1': message
    //     })
    // }, function(error, response, body) {});

    // 通知内容がなければClova通知は無し
    if (message == '') {
        console.log('通知はありません。');
        return;
    }

    // LINE Clova
    request.post({
        url: IFTTT_CLOVA,
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            'value1': message
        })
    }, function(error, response, body) {});

    console.log(message);
}


server.on('request', function(req, res) {
    if (req.url === '/favicon.ico') return; // chromeのダブルリクエスト処理
    res.writeHead(200, {
        'Content-type': 'text/plain'
    });

    // 放送時間チェック
    request.get({
        url: ANNICT_URL,
        qs: {
            access_token: ANNICT_TOKEN,
            fields: 'id,started_at,work.title_kana,episode.number_text,channel.name',
            filter_started_at_gt: now(), // 未放送のみ
            filter_unwatched: 'true', // 未視聴のみ
            filter_rebroadcast: 'false', // 本放送のみ
            sort_started_at: 'asc' // 早い順
        }
    }, function(error, response, body) {
        // console.log(body);
        notify(body);
    });

    res.end();
})


server.listen(process.env.PORT || 3000);
console.log('server listening ...');
