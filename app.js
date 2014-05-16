var App = function() {
    var that = this;
    that.stackListTpl = doT.template($('#stack-list-tpl').html());
    that.stackIntroTpl = doT.template($('#stack-intro-tpl').html());
    
    that.storeDataJSON = null;
    that.storeDataMap = null;
    that.dataReady = false;
    that.stackId = null;

    $(document).on('click', '.run-stack', function(event) {
        var btnDom = $(event.currentTarget);
        var stackId = btnDom.data('id');
        $.cookie('stack_store_id', stackId, {
            domain: '127.0.0.1'
        });
    });

    routie(':stackId', function(stackId) {
        that.stackId = stackId;
        if (that.dataReady) {
            that.renderStackIntro(stackId);
        }
    });
};

App.prototype.getStateStoreData = function(callback) {
    var that = this;
    if (that.storeDataJSON) {
        callback(null);
    } else {
        $.ajax({
            url: 'https://api.mc3.io/stackstore/',
            dataType: 'JSON',
            type: 'POST',
            data: JSON.stringify({
                "jsonrpc": "2.0",
                "id": "CE91F8DB-41E4-4419-AD20-133D54F048D2",
                "method": "fetch_stackstore",
                "params": ["README.md"]
            }),
            success: function(result) {
                dataJSON = [
                    {
                        "id": "apache-hadoop",
                        "name": "apache-hadoop",
                        "description": "apache-hadoop",
                        "introduce": "apache-hadoop"
                    },
                    {
                        "id": "cassandra",
                        "name": "cassandra",
                        "description": "cassandra",
                        "introduce": "cassandra"
                    },
                    {
                        "id": "ghost-blog",
                        "name": "ghost-blog",
                        "description": "ghost-blog",
                        "introduce": "ghost-blog"
                    },
                    {
                        "id": "mongo-cluster",
                        "name": "mongo-cluster",
                        "description": "mongo-cluster",
                        "introduce": "mongo-cluster"
                    },
                    {
                        "id": "nginx-upstream",
                        "name": "nginx-upstream",
                        "description": "nginx-upstream",
                        "introduce": "nginx-upstream"
                    },
                    {
                        "id": "redis-cluster",
                        "name": "redis-cluster",
                        "description": "redis-cluster",
                        "introduce": "redis-cluster"
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
                console.log(error);
            }
        });
    }
};

App.prototype.renderStackList = function() {
    var that = this;
    that.getStateStoreData(function(err) {
        var htmlStr = that.stackListTpl(that.storeDataJSON);
        $('#stack-list').html(htmlStr);
    });
};

App.prototype.renderStackIntro = function(stackId) {
    var that = this;
    if (stackId === 'index') {
        $('#stack-intro').html('');
    } else {
        var stackObj = that.storeDataMap[stackId];
        if (stackObj) {
            var htmlStr = that.stackIntroTpl(stackObj);
            $('#stack-intro').html(htmlStr);
        }
    }
};

$(function() {
    var app = new App();
    app.renderStackList();
});