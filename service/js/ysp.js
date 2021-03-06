/*
*   Youtube subtitles parser
* */
var YSP = (function($) {
    "use strict";

    return {};

})(jQuery);
var YSP = (function(me, $) {
    "use strict";

    me.youtube_player = null;
    me.options = null;

    me.api = {
        init: function(player_id){
            me.options = {
                player_id: player_id,
                youtube_subtitles: {},
                transcripts: {},
                keywords: {},
                languages: [],
                parsedLanguages: null, // deffered
                parsedTranscript: $.Deferred(),
                parsedKeywords: $.Deferred()
            };
            me.youtube_player = document.getElementById(player_id);
            me.options.video_id = me.parser.getVideoId();
            if(!me.youtube_player && !me.options.video_id) {
                console.log('Player Id was wrong!');
            }

            me.api.getSubtitles();
        },

        getSubtitles: function(){
            me.parser.getLangs();
        },

        getLanguages: function(callback){
            me.options.parsedLanguages.done(function(){
                 if(callback){
                     callback({
                         languages: me.options.languages
                     });
                 }
            });
        },

        getTranscript: function(callback){
            me.options.parsedTranscript.done(function(){
                if(callback){
                    callback({
                        transcripts: me.options.transcripts
                    });
                }
            });
        },

        getKeywords: function(callback){
            me.options.parsedKeywords.done(function(){
                if(callback){
                    callback({
                        keywords: me.options.keywords
                    });
                }
            });
        }
    };

    return me;

})(YSP, jQuery);
var YspCommon = (function() {
    "use strict";

    var parseKeywords = function(_data, lang){
        var keywords = [];
        var transcript = _data.transcript;

        for (var i = 0; i < transcript.length; i++) {
            var finding_word = transcript[i];
            if(finding_word) {
                var name_clear = replacePunctuation(finding_word.w, '').toLowerCase().trim();
                if(name_clear !== '') {
                    var fuseEngine = new Fuse(transcript, {
                        keys: ['w'],
                        threshold: 0
                    });
                    var fuse_result = fuseEngine.search(name_clear);
                    var times = [];
                    for (var j = 0; j < fuse_result.length; j++) {
                        var item = fuse_result[j];
                        if(item.w && item.w.length <= name_clear.length + 2) {
                            times.push(item.s / 1000);
                            transcript[item.p - 1].w = '';
                        }
                    }

                    var keyword = {
                        name: name_clear,
                        internalName: [name_clear],
                        t: {
                            unknown: times
                        }
                    };
                    keywords.push(keyword);
                }

            }
        }

        return {
            categories: {},
            keywords: keywords,
            requestStatus: "SUCCESS",
            transcriptType: "machine"
        };
    };

    var replacePunctuation = function(str, replacement){ // from http://stackoverflow.com/a/21396529/3522596
        return str.replace(/[\$\uFFE5\^\+=`~<>{}\[\]|\u3000-\u303F!-#%-\x2A,-:;\x3F@\x5B-\x5D_\x7B}\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E3B\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]+/g, "");
    };

    return {
        parseKeywords: parseKeywords,
        replacePunctuation: replacePunctuation
    };
})();

var YSP = (function(me, $) {
    "use strict";

    me.parser = {
        getLangs: function(){
            me.options.parsedLanguages = $.ajax({
                type: 'POST',
                url: 'http://www.youtube.com/api/timedtext?v=' + me.options.video_id + '&expire=1&type=list',
                dataType: 'xml',
                success: function(data){
                    var track_doc = data.documentElement;
                    var tracks = $(track_doc).find('track');
                    var langs_promises = [];
                    for (var i = 0; i < tracks.length; i++) {
                        var track = tracks[i];
                        var lang_code = $(track).attr('lang_code');
                        var lang_name = $(track).attr('lang_translated');
                        if(lang_code){
                            var lang_obj = {};
                            lang_obj[lang_code] = lang_name;
                            me.options.languages.push(lang_obj);
                            var _promise = me.parser.getSubtitlesByLang(lang_code);
                            langs_promises.push(_promise);
                        }
                    }
                    $.when.apply(me, langs_promises).then(me.parser.parseSubtitle);
                },
                error: function(jqXHR, textStatus, errorThrown){
                    console.log(errorThrown + ': Error ' + jqXHR.status);
                }
            });
        },

        getSubtitlesByLang: function(lang){
            return $.ajax({
                type: 'POST',
                url: 'http://www.youtube.com/api/timedtext?v=' + me.options.video_id + '&lang=' + lang,
                success: function(data){
                    me.options.youtube_subtitles[lang] = data.documentElement;
                },
                error: function(jqXHR, textStatus, errorThrown){
                    console.log(errorThrown + ': Error ' + jqXHR.status);
                }
            });
        },

        parseTranscript: function(transcript_dom){
            var transcript = [];

            $(transcript_dom).find('text').each(function(){
                var text_elem = $(this);
                var text = text_elem.text();
                var words = text.split(/(?=\W)(?=\s)/);

                var start = text_elem.attr('start');
                start = (start) ? start * 1000 : 0;
                var duration = text_elem.attr('dur');
                duration = (duration) ? duration * 1000 : 0;
                var end = start + duration;

                for (var i = 0; i < words.length; i++) {
                    var name = words[i].trim();
                    var word = {
                        w: name,
                        s: start,
                        e: end,
                        p: transcript.length + 1
                    };
                    transcript.push(word);

                }
            });

            return {
                transcript: {
                    transcript: transcript,
                    transcriptType: "machine",
                    fileStatus: "MACHINECOMPLETE",
                    requestStatus: "SUCCESS"
                }
            };
        },

        startWorkerKeywordParser: function(transcripts){
            console.time('keywords_workers');
            var i = 0;
            var workers = [];

            var handleKeywordWorkerResult = function(e){
                i--;
                me.options.keywords[e.data.lang] = e.data.response;
                if(i === 0) {
                    console.timeEnd('keywords_workers');
                    me.options.parsedKeywords.resolve();
                }
            };

            for (var lang in transcripts) {
                if (transcripts.hasOwnProperty(lang)) {
                    workers[i] = new Worker('js/subtitles/parserWorker.js');
                    workers[i].onerror = function(e){
                        console.log(['ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message].join(''));
                    };
                    workers[i].onmessage = handleKeywordWorkerResult;
                    workers[i].postMessage({transcript: transcripts[lang], lang: lang});
                    i++;
                }
            }
        },

        parseSubtitle: function(){
            console.time('parseSubtitle');
            var youtubeSubtitles = me.options.youtube_subtitles;
            for (var lang in  youtubeSubtitles) {
                if (youtubeSubtitles.hasOwnProperty(lang)) {
                    var parse_result = me.parser.parseTranscript(youtubeSubtitles[lang]);
                    me.options.transcripts[lang] = parse_result.transcript;
                    if(!window.Worker){
                        me.options.keywords[lang] = YspCommon.parseKeywords(me.options.transcripts[lang], lang);
                    }
                }
            }
            if(!!window.Worker){
                me.parser.startWorkerKeywordParser(me.options.transcripts);
            }
            else {
                me.options.parsedKeywords.resolve();
            }
            me.options.parsedTranscript.resolve();
        },

        getVideoId: function(){
            var video_id = null;
            if(me.youtube_player && me.youtube_player.getVideoUrl){
                var video_url = me.youtube_player.getVideoUrl();
                video_url = video_url.substring(video_url.indexOf('&v') + 1);
                video_id = video_url.substring(video_url.indexOf('=') + 1);
                if(video_id.indexOf('&') != -1){
                    video_id = video_id.substring(0, video_id.indexOf('&'));
                }
            }
            else {
                console.log('Youtube player is not ready!');
            }
            return video_id;
        }
    };

    return me;

})(YSP, jQuery);