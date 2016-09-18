// Generated by CoffeeScript 1.10.0
(function() {
  var Log, Path, Url, all_cookies, create_img_server, crypto, encryptPass, http, https, img_server, int, log, login_next, md5, querystring, stop_img_server;

  https = require("https");

  http = require('http');

  crypto = require('crypto');

  querystring = require('querystring');

  Url = require('url');

  all_cookies = [];

  int = function(v) {
    return parseInt(v);
  };

  Path = require('path');

  Log = require('log');

  log = new Log('debug');

  encryptPass = require('./encrypt');

  md5 = function(str) {
    var md5sum;
    md5sum = crypto.createHash('md5');
    return md5sum.update(str.toString()).digest('hex');
  };

  exports.cookies = function(cookies) {
    if (cookies) {
      all_cookies = cookies;
    }
    return all_cookies;
  };

  exports.check_qq_verify = function(qq, callback) {
    var body, options;
    options = {
      host: 'ssl.ptlogin2.qq.com',
      path: "/check?pt_tea=1&uin=" + qq + "&appid=501004106&js_ver=10125&js_type=0&login_sig=&u1=http%3A%2F%2Fw.qq.com%2Fproxy.html&r=0.6569391019121522",
      headers: {
        'Cookie': "chkuin=" + qq
      }
    };
    body = '';
    return https.get(options, function(resp) {
      all_cookies = resp.headers['set-cookie'];
      resp.on('data', function(chunk) {
        return body += chunk;
      });
      return resp.on('end', function() {
        var ret;
        ret = body.match(/\'(.*?)\'/g).map(function(i) {
          var last;
          last = i.length - 2;
          return i.substr(1, last);
        });
        return callback(ret);
      });
    }).on("error", function(e) {
      return log.error(e);
    });
  };

  exports.get_verify_code = function(qq, host, port, cap_cd, callback) {
    var body, url;
    url = "http://captcha.qq.com/getimage?aid=501004106&r=0.2509327069195215&uin=" + qq + "&aid=501004106&cap_cd=" + cap_cd;
    body = '';
    return http.get(url, function(resp) {
      all_cookies = all_cookies.concat(resp.headers['set-cookie']);
      resp.setEncoding('binary');
      resp.on('data', function(chunk) {
        return body += chunk;
      });
      return resp.on('end', function() {
        create_img_server(host, port, body, resp.headers);
        return callback();
      });
    }).on("error", function(e) {
      log.error(e);
      return callback(e);
    });
  };

  exports.finish_verify_code = function() {
    return stop_img_server();
  };

  img_server = null;

  create_img_server = function(host, port, body, origin_headers) {
    var file_path, fs;
    if (img_server) {
      return;
    }
    fs = require('fs');
    file_path = Path.join(__dirname, "..", "tmp", "verifycode.jpg");
    fs.writeFileSync(file_path, body, 'binary');
    img_server = http.createServer(function(req, res) {
      res.writeHead(200, origin_headers);
      return res.end(body, 'binary');
    });
    return img_server.listen(port);
  };

  stop_img_server = function() {
    if (img_server) {
      img_server.close();
    }
    return img_server = null;
  };

  exports.encode_password = function(password, token, bits) {
    var hex2ascii;
    bits = bits.replace(/\\x/g, '');
    hex2ascii = function(hexstr) {
      return hexstr.match(/\w{2}/g).map(function(byte_str) {
        return String.fromCharCode(parseInt(byte_str, 16));
      }).join('');
    };
    bits = hex2ascii(bits);
    return encryptPass(password, bits, token);
  };

  exports.login_step1 = function(qq, encode_password, verifycode, verifySession, callback) {
    var body, c, j, len, options, path;
    if (verifySession === '') {
      for (j = 0, len = all_cookies.length; j < len; j++) {
        c = all_cookies[j];
        if (c.indexOf('verifysession') > -1) {
          verifySession = c.match(/verifysession=(.*?);.*/)[1];
        }
      }
    }
    path = "/login?u=" + qq + "&p=" + encode_password + "&verifycode=" + verifycode + "&webqq_type=10&remember_uin=1&login2qq=1&aid=501004106&u1=http%3A%2F%2Fw.qq.com%2Fproxy.html%3Flogin2qq%3D1%26webqq_type%3D10&h=1&ptredirect=0&ptlang=2052&daid=164&from_ui=1&pttype=1&dumy=&fp=loginerroralert&action=3-15-72115&mibao_css=m_webqq&t=1&g=1&js_type=0&js_ver=10125&login_sig=&pt_randsalt=0&pt_vcode_v1=0&pt_verifysession_v1=" + verifySession;
    options = {
      host: 'ssl.ptlogin2.qq.com',
      path: path,
      headers: {
        'Cookie': all_cookies
      }
    };
    body = '';
    return https.get(options, function(resp) {
      all_cookies = all_cookies.concat(resp.headers['set-cookie']);
      resp.on('data', function(chunk) {
        return body += chunk;
      });
      return resp.on('end', function() {
        var ret;
        ret = body.match(/\'(.*?)\'/g).map(function(i) {
          var last;
          last = i.length - 2;
          return i.substr(1, last);
        });
        return callback(ret);
      });
    }).on("error", function(e) {
      return log.error(e);
    });
  };

  exports.login_step2 = function(url, callback) {
    var body, options;
    url = Url.parse(url);
    options = {
      host: url.host,
      path: url.path,
      headers: {
        'Cookie': all_cookies
      }
    };
    body = '';
    return http.get(options, function(resp) {
      log.debug("response: " + resp.statusCode);
      all_cookies = all_cookies.concat(resp.headers['set-cookie']);
      return callback(true);
    }).on("error", function(e) {
      return log.error(e);
    });
  };

  exports.login_token = function(client_id, psessionid, callback) {
    var body, data, options, ptwebqq, r, req;
    if (client_id == null) {
      client_id = null;
    }
    if (psessionid == null) {
      psessionid = null;
    }
    client_id || (client_id = parseInt(Math.random() * 89999999) + 10000000);
    client_id = parseInt(client_id);
    ptwebqq = all_cookies.filter(function(item) {
      return item.match(/ptwebqq/);
    }).pop().replace(/ptwebqq\=(.*?);.*/, '$1');
    r = {
      status: "online",
      ptwebqq: ptwebqq,
      clientid: client_id,
      psessionid: psessionid
    };
    r = JSON.stringify(r);
    data = querystring.stringify({
      r: r
    });
    body = '';
    options = {
      host: 'd.web2.qq.com',
      path: '/channel/login2',
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:27.0) Gecko/20100101 Firefox/27.0',
        'Referer': 'http://d.web2.qq.com/proxy.html?v=20110331002&callback=1&id=3',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': Buffer.byteLength(data),
        'Cookie': all_cookies
      }
    };
    req = http.request(options, function(resp) {
      log.debug("login token response: " + resp.statusCode);
      resp.on('data', function(chunk) {
        return body += chunk;
      });
      return resp.on('end', function() {
        var ret;
        ret = JSON.parse(body);
        return callback(ret, client_id, ptwebqq);
      });
    });
    req.write(data);
    return req.end();
  };


  /*
      全局登录函数，如果有验证码会建立一个 http-server ，同时写入 tmp/*.jpg (osx + open. 操作)
      http-server 的端口和显示地址可配置
      @param options {account,password,port,host}
      @callback( cookies , auth_options ) if login success
   */

  exports.login = function(options, callback) {
    var auth, opt, pass, qq, ref, ref1;
    ref = [exports, options], auth = ref[0], opt = ref[1];
    ref1 = [opt.account, opt.password], qq = ref1[0], pass = ref1[1];
    log.info('登录 step0 验证码检测');
    return auth.check_qq_verify(qq, function(result) {
      var bits, need_verify, pass_encrypted, verifySession, verify_code;
      need_verify = result[0], verify_code = result[1], bits = result[2], verifySession = result[3];
      if (int(need_verify)) {
        log.info("登录 step0.5 获取验证码");
        return auth.get_verify_code(qq, opt.host, opt.port, verify_code, function(error) {
          if (process.platform === 'darwin') {
            require('child_process').exec('open tmp');
          }
          log.notice("打开该地址->", "http://" + opt.host + ":" + opt.port);
          return auth.prompt("输入验证码:", function(code) {
            var pass_encrypted;
            auth.finish_verify_code();
            verify_code = code;
            log.notice('验证码：', verify_code);
            pass_encrypted = auth.encode_password(pass, verify_code, bits);
            return login_next(qq, pass_encrypted, verify_code, verifySession, callback);
          });
        });
      } else {
        log.info("- 无需验证码");
        pass_encrypted = auth.encode_password(pass, verify_code, bits);
        return login_next(qq, pass_encrypted, verify_code, verifySession, callback);
      }
    });
  };

  login_next = function(account, pass_encrypted, verify_code, verifySession, callback) {
    var auth;
    auth = exports;
    log.info("登录 step1 密码校验");
    return auth.login_step1(account, pass_encrypted, verify_code, verifySession, function(ret) {
      if (!ret[2].match(/^http/)) {
        log.error("登录 step1 failed", ret);
        return;
      }
      log.info("登录 step2 cookie获取");
      return auth.login_step2(ret[2], function(ret) {
        log.info("登录 step3 token 获取");
        return auth.login_token(null, null, function(ret, client_id, ptwebqq) {
          var auth_options;
          if (ret.retcode === 0) {
            log.info('登录成功', account);
            auth_options = {
              psessionid: ret.result.psessionid,
              clientid: client_id,
              ptwebqq: ptwebqq,
              uin: ret.result.uin,
              vfwebqq: ret.result.vfwebqq
            };
            return callback(all_cookies, auth_options);
          } else {
            log.info("登录失败");
            return log.error(ret);
          }
        });
      });
    });
  };

  exports.prompt = function(title, callback) {
    process.stdin.resume();
    process.stdout.write(title);
    process.on("data", function(data) {
      if (data) {
        callback(data);
        return process.stdin.pause();
      }
    });
    process.stdin.on("data", function(data) {
      data = data.toString().trim();
      if (data) {
        callback(data);
        return process.stdin.pause();
      }
    });
    return process.stdin.on('end', function() {
      process.stdout.write('end');
      return callback();
    });
  };

}).call(this);
