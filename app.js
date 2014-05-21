var App = function() {
    var that = this;

    $.support.cors = true;

    that.stackListTpl = doT.template($('#stack-list-tpl').html());
    that.stackIntroTpl = doT.template($('#stack-intro-tpl').html());

    that.markdownConvert = new Markdown.Converter()
    
    that.storeDataJSON = null;
    that.storeDataMap = null;
    that.dataReady = false;
    that.stackId = null;

    that.cookieDomain = 'mc3.io';
    that.apiURL = 'http://api.mc3.io/stackstore/';

    $(document).on('click', '#intro .run', function(event) {
        var btnDom = $(event.currentTarget);
        var stackId = btnDom.data('id');
        $.cookie('stack_store_id', stackId, {
            domain: that.cookieDomain
        });
    }).on('click', '#main .stack-item a', function(event) {
        $('#main').hide().removeClass('animation-show').addClass('animation-hide');
        $('#intro').show().removeClass('animation-hide').addClass('animation-show');
        $(document).scrollTop(0);
    }).on('click', '#intro .nav', function(event) {
        $('#main').show().removeClass('animation-hide').addClass('animation-show');
        $('#intro').hide().removeClass('animation-show').addClass('animation-hide');
    });

    routie(':stackId', function(stackId) {
        that.stackId = stackId;
        if (that.dataReady) {
            that.renderStackIntro(stackId);
        }
    });

    if (!that.stackId || that.stackId === 'index') {
        $('#main').show();
        $('#intro').hide();
    } else {
        $('#main').hide();
        $('#intro').show();
    }
};

App.prototype.getStateStoreData = function(callback) {
    var that = this;
    if (that.storeDataJSON) {
        callback(null);
    } else {
        $.ajax({
            url: that.apiURL,
            dataType: 'JSON',
            contentType: 'text/plain',
            type: 'POST',
            data: JSON.stringify({
                "jsonrpc": "2.0",
                "id": (new Date()).getTime(),
                "method": "fetch_stackstore",
                "params": ["README.md"]
            }),
            success: function(result) {
                dataJSON = [
                    {
                        "id": "cassandraXX",
                        "name": "cassandraXX",
                        "description": "cassandraXX",
                        "introduce": that.markdownConvert.makeHtml("![Alt text](http://visualops.files.wordpress.com/2014/05/spark-with-zk.png?w=1008)\n### Description\nextract an archive file\n\n### Parameters\n\n*   **`source`** (*required*): the archive file url\n\n\t\texample: http(s):///host/path/to/archive.tar.gz\n\n\t>note: currently supported archive format: tar, tgz, tar.gz, bz, bz2, tbz, zip (archive file must end with one of these extention name)\n\t\t\tlocal archive file `file://path/to/file` not supported in this version\n\n*   **`path`** (*required*): the path to extract the archive\n\n\t>note: the path will be auto-created if it doesn't exist\n\n*   **`checksum`** (*optional*): the url of the source checksum file or checksum value string, whose value (content) will be used to verify the integrity of the source archive\n\n\t\texample:\n\t\t\thttp(s):///host/path/to/checksum_file\n\t\t\tmd5:md5_value_string\n\t\t\tsha1:sha1_value_string\n\n*   **`if-path-absent`** (*optional*): extract the archive only if none of the specified path exists, see blow\n\n\t> note: once the source archive is successfully extracted to the specified path, the opsagent will decide whether to re-fetch and extract the source archive depending on or not:\n\t- when `if-path-absent` specified:\n\t\t- if none of the specified paths exist, the archive will be re-fetched, until some paths exist\n\t\t- if some paths exists, the archive will only be re-fetched only if `checksum` is used and its value changes between rounds\n\t- when `if-path-absent` not used:\n\t\t- if `checksum` not used, the archive will be re-fetched in every round\n\t\t- if `checksum` used, thhe archive will be re-fetched if the checksum value changes between rounds\n\t\t\t\t\t")
                    }
                ]
                that.storeDataJSON = dataJSON;
                that.storeDataMap = {};
                for (var idx in dataJSON) {
                    var stackObj = dataJSON[idx];
                    that.storeDataMap[stackObj.id] = stackObj;
                }
                if (that.stackId && !that.dataReady) {
                    that.renderStackIntro(that.stackId);
                }
                that.dataReady = true;
                callback(null);
            },
            error: function(xhr, status, error) {
                callback(true);
            }
        });
    }
};

App.prototype.renderStackList = function() {
    var that = this;
    that.getStateStoreData(function(err) {
        if (err) {
            $('#main').show();
            $('#intro').hide();
            $('#stack-list').html('<div class="service-error">Service temporarily not available :(</div>');
        } else {
            var htmlStr = that.stackListTpl(that.storeDataJSON);
            $('#stack-list').html(htmlStr);
        }
    });
};

App.prototype.renderStackIntro = function(stackId) {
    var that = this;
    $introDom = $('#intro');
    if (stackId === 'index') {
        $introDom.html('');
    } else {
        var stackObj = that.storeDataMap[stackId];
        if (stackObj) {
            var htmlStr = that.stackIntroTpl(stackObj);
            $introDom.html(htmlStr);
            var $headerDom = $('#intro .intro-header');
            var elementPosition = $headerDom.offset();
            $(window).off('scroll').on('scroll', function() {
                if ($(window).scrollTop() > elementPosition.top) {
                      $headerDom.addClass('float-panel');
                } else {
                    $headerDom.removeClass('float-panel');
                }
            });
        }
    }
};

$(function() {
    var app = new App();
    app.renderStackList();
});