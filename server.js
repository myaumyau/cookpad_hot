var http = require('http');

http.createServer(function (request, response) {
    requestHot(request, response);
	//response.writeHead(200, {'Content-Type': 'text/plain'});
	//response.end('Hello World\n');
}).listen(process.env.PORT);

function unescapeUnicode(s) {
    return s.replace(/\\u([a-fA-F0-9]{4})/g, function(matchedString, group1) {
        return String.fromCharCode(parseInt(group1, 16));
    });
}
function requestHot(request, response) {
    var option1 = {
        host: 'cookpad.com',
        path: '/recipe/hot'
    };
    http.get(option1, function(res) {
		var resBody = '';
        res.setEncoding('utf8');
		//res.on('data', function(data) { resBody += data; });
		res.on('end', function() {
            requestUpdateHotReceipe(request, response, res);
	    });
    });
};
function requestUpdateHotReceipe(request, response, hotResponse) {
    var option = {
        host: 'cookpad.com',
        path: '/recipe/update_hot_recipe?',
        headers: {
            Host: 'cookpad.com',
            Referer: 'http://cookpad.com/recipe/hot',
            //Cookie: hotResponse['Set-Cookie'],
            'X-Requested-With': 'XMLHttpRequest'
        }
    };
    http.get(option, function(res) {
        var resBody = '';
        res.setEncoding('utf8');
        res.on('data', function(data) {
            resBody += data;
        });
        res.on('end', function() {
            resBody = unescapeUnicode(resBody);
            var tg;
            resBody.replace(
                /.+#recipe_list_wrapper"\)\.html\("(.+)<script>.+$/im,
                function(all, target) {
                    tg = target;
                });
            tg = tg.replace(/\\n/g, '\n');
            tg = tg.replace(/\\"/g, '"');
            tg = tg.replace(/href="\//ig, 'href="http://cookpad.com\/');
            tg = tg.replace(/src="\//ig, 'src="http://cookpad.com\/');
            
            response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            //console.log(tg);
            var line = [], i = -1;
            line[++i] = '<!DOCTYPE html>';
            line[++i] = '<html>';
            line[++i] = '<head>';
            line[++i] = '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>';
            line[++i] = '</head>';
            line[++i] = '<body>';
            line[++i] = tg;
            line[++i] = '</body>';
            line[++i] = '</html>';
            var html = line.join('\n');
            //console.log(html);
            response.write(html);
            response.end();
        });
    });
};

console.log('Server is running.');
