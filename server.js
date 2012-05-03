var http = require('http');

function unescapeUnicode(s) {
    return s.replace(/\\u([a-fA-F0-9]{4})/g, function(matchedString, group1) {
        return String.fromCharCode(parseInt(group1, 16));
    });
}

http.createServer(function (request, response) {
    var option1 = {
        host: 'cookpad.com',
        path: '/recipe/hot'
	};
	http.get(option1, function(res1) {
		var res1Body = '';
        res1.setEncoding('utf8');
		res1.on('data', function(data1) { res1Body += data1; });
		res1.on('end', function() {
            var option2 = {
                host: 'cookpad.com',
                path: '/recipe/update_hot_recipe?',
                headers: {
                    Host: 'cookpad.com',
                    Referer: 'http://cookpad.com/recipe/hot',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };
            http.get(option2, function(res2) {
                var res2Body = '';
                res2.setEncoding('utf8');
                res2.on('data', function(data2) {
                    res2Body += data2;
                });
                res2.on('end', function() {
                    res2Body = unescapeUnicode(res2Body);
                    var tg;
                    res2Body.replace(
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
		});
	});
	
	//response.writeHead(200, {'Content-Type': 'text/plain'});
	//response.end('Hello World\n');
}).listen(process.env.PORT);


console.log('Server is running.');
