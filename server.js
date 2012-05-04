var http = require('http');

var Cookpad = function() {
    this.initialize.apply(this, arguments);
};
Cookpad.unescapeUnicode = function(s) {
    return s.replace(/\\u([a-fA-F0-9]{4})/g, function(matchedString, group1) {
        return String.fromCharCode(parseInt(group1, 16));
    });
};
Cookpad.prototype = {
    _req: null,
    _res: null,
    _today: null,
    _days: 1,
    _renderItems: [], // { date: yyyyMMdd, item: str }
    _rendered: false,
    
    initialize: function(request, response, days) {
        this._req = request;
        this._res = response;
        this._days = days;
    },
    request: function() {
        this._renderItems = [];
        this._rendered = false;
        var d = new Date();
        d.setTime(d.getTime() + (9 * 60 * 60 * 1000)); // 日本時間に補正
        this._today = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        for (var i = 0, l = this._days; i < l; i++) {
            this.requestUpdateHotReceipe(0 - i);
        }
    },
    requestUpdateHotReceipe: function(day) {
        var self = this;
        var date = this.formatDateString(this._today, day);
        var option = {
            host: 'cookpad.com',
            path: '/recipe/update_hot_recipe?' + (day == 0 ? '' : 'date=' + date),
            headers: {
                Host: 'cookpad.com',
                Referer: 'http://cookpad.com/recipe/hot',
                //Cookie: hotResponse['Set-Cookie'],
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        console.log(option.path);
        http.get(option, function(res) {
            var resBody = '';
            res.setEncoding('utf8');
            res.on('data', function(data) {
                resBody += data;
            });
            res.on('end', function() {
                var tg = self.formatItem(resBody);
                self.addRenderItems(date, tg);
                if (self._renderItems.length == self._days) {
                    self.onRender();
                }
            });
        });
    },
    onRender: function() {
        if (this._rendered) return;
        this._rendered = true;
        this._res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        var line = [], i = -1;
        line[++i] = '<!DOCTYPE html>';
        line[++i] = '<html>';
        line[++i] = '<head>';
        line[++i] = '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>';
        line[++i] = '</head>';
        line[++i] = '<body>';
        this.sortRenderItem();
        for (var j = 0, l = this._renderItems.length; j < l; j++) {
            line[++i] = this._renderItems[j].item;
        }
        line[++i] = '</body>';
        line[++i] = '</html>';
        var html = line.join('\n');
        this._res.write(html);
        this._res.end();
    },
    addRenderItems: function(dateString, itemString) {
        this._renderItems.push({ date: dateString, item: itemString });
    },
    formatItem: function(s) {
        var tg;
        s.replace(
            /.+#recipe_list_wrapper"\)\.html\("(.+)<script>.+$/im,
            function(all, target) {
                tg = target;
            }
        );
        tg = Cookpad.unescapeUnicode(tg);
        tg = tg.replace(/\\n/g, '\n');
        tg = tg.replace(/\\"/g, '"');
        tg = tg.replace(/href="\//ig, 'href="http://cookpad.com\/');
        tg = tg.replace(/src="\//ig, 'src="http://cookpad.com\/');
        tg = tg.replace(/<div id='recipe_list_inner'>/g, '');
        tg = tg.replace(/<\/div>\n$/, '');
        tg = tg.replace(/<div class='clear'><\/div>/g, '');
        tg = tg.replace(/clear_wrapper /g, '');
        return tg;
    },
    formatDateString: function(date, day) {
        date.setTime(date.getTime() + (day * 86400000)); //24 * 60 * 60 * 1000
        var newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        var yyyy = newDate.getFullYear(), mm = newDate.getMonth() + 1, dd = newDate.getDate();
        return '' + yyyy + 
            (mm < 10 ? '0' : '') + mm +
            (dd < 10 ? '0' : '') + dd;
    },
    sortRenderItem: function() {
        var tmp, l = this._renderItems.length;
        for (var i = 0; i < l - 1; i++) {
            for (var j = l - 1; i < j ;j--) {
                if (this._renderItems[j].date > this._renderItems[j - 1].date){
                    tmp = this._renderItems[j - 1];
                    this._renderItems[j - 1] = this._renderItems[j];
                    this._renderItems[j] = tmp;
                }
            }
        }
    }
};

http.createServer(function (request, response) {
    //requestHot(request, response);
    var cookpad = new Cookpad(request, response, 2);
    cookpad.request();
}).listen(process.env.PORT);

console.log('Server is running.');
