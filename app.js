var App = function() {
    var that = this;

    that.cookieDomain = '.mc3.io';
    that.apiURL = 'http://api.mc3.io/stackstore/';
    that.launchURL = 'http://ide.mc3.io/';

    $.support.cors = true;

    that.stackListTpl = doT.template($('#stack-list-tpl').html());
    that.stackIntroTpl = doT.template($('#stack-intro-tpl').html());

    that.markdownConvert = new Markdown.Converter()
    
    that.storeDataJSON = null;
    that.storeDataMap = null;
    that.dataReady = false;
    that.stackId = null;

    $(document).on('click', '#intro .run', function(event) {
        var btnDom = $(event.currentTarget);
        var stackId = btnDom.data('id');
        var stackIdStamp = stackId + '#' + (new Date()).getTime();
        $.cookie('stack_store_id', stackIdStamp, {
            domain: that.cookieDomain
        });
    }).on('click', '#main .stack-item a', function(event) {
        that.switchTo('intro');
        $(document).scrollTop(0);
    }).on('click', '#intro .nav', function(event) {
        that.switchTo('main');
    });

    routie(':stackId', function(stackId) {
        that.stackId = stackId;
        if (that.dataReady) {
            that.renderStackIntro(stackId);
        }
    });

    if (!that.stackId || that.stackId === 'index') {
        that.switchTo('main');
    } else {
        that.switchTo('intro');
    }
};

App.prototype.switchTo = function(page) {
    if (page === 'intro') {
        $('#main').hide().removeClass('animation-show').addClass('animation-hide');
        $('#intro').show().removeClass('animation-hide').addClass('animation-show');
    } else {
        $('#main').show().removeClass('animation-hide').addClass('animation-show');
        $('#intro').hide().removeClass('animation-show').addClass('animation-hide');
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
                "params": ["description.json"]
            }),
            success: function(result) {
                try {
                    var resultData = result.result;
                    var returnCode = resultData[0];
                    if (!returnCode) {
                        var returnData = resultData[1];
                        that.storeDataJSON = JSON.parse(returnData);
                        that.storeDataMap = {};
                        for (var idx in that.storeDataJSON) {
                            var stackObj = that.storeDataJSON[idx];
                            stackObj.introduce = that.markdownConvert.makeHtml(stackObj.introduce);
                            stackObj.launch_url = that.launchURL;
                            that.storeDataMap[stackObj.id] = stackObj;
                        }
                        if (that.stackId && !that.dataReady) {
                            that.renderStackIntro(that.stackId);
                        }
                        that.dataReady = true;
                        callback(null);
                    } else {
                        callback(true);
                    }
                } catch(err) {
                    callback(true);
                }
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
            that.renderErrorInfo('Service temporarily not available :(');
        } else {
            var htmlStr = that.stackListTpl(that.storeDataJSON);
            $('#stack-list').html(htmlStr);
        }
    });
};

App.prototype.renderErrorInfo = function(infoTxt) {
    var that = this;
    that.switchTo('main');
    $('#stack-list').html('<div class="service-error">' + infoTxt + '</div>');
};

App.prototype.renderStackIntro = function(stackId) {
    var that = this;
    $introDom = $('#intro');
    if (stackId === 'index') {
        $introDom.html('');
        that.switchTo('main');
    } else {
        var stackObj = that.storeDataMap[stackId];
        if (stackObj) {
            var htmlStr = that.stackIntroTpl(stackObj);
            $introDom.html(htmlStr);
            var $headerDom = $('#intro .intro-header');
            var $introContentDom = $('#intro .intro');
            var elementPosition = $introContentDom.offset();
            $(window).off('scroll').on('scroll', function() {
                var windowScrollTop = $(window).scrollTop();
                if (windowScrollTop > elementPosition.top) {
                      $headerDom.addClass('float-panel');
                } else {
                    $headerDom.removeClass('float-panel');
                }
            });
            that.switchTo('intro');
        } else {
            that.renderErrorInfo('Page not found :(');
        }
    }
};

$(function() {
    var app = new App();
    app.renderStackList();
});