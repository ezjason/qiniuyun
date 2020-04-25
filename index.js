const qiniu = require('qiniu');

const fs = require('fs');
const join = require('path').join;
const ProgressBar = require('./progress-bar');
var accessKey = 'L-CXiWeE0io5CopwIgU6QjEFFi5O4HevnV5nFDOs';
var secretKey = 'ksnrT6obctESJJIRr1HzC3-ogkp9meGTlMLTSCht';
var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
const pb = new ProgressBar('上传进度', 50);

const localwork = join(process.cwd(), './img');
// import bucket from 'bucket';

var options = {
    scope: '18814133535',
    returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
    callbackBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
    callbackBodyType: 'application/json'
};
var putPolicy = new qiniu.rs.PutPolicy(options);
var uploadToken = putPolicy.uploadToken(mac);
var cdnManager = new qiniu.cdn.CdnManager(mac);

// 空间对应的机房
// 机房	Zone对象
// 华东	qiniu.zone.Zone_z0


let jsonFiles = [];

function findJsonFile(path) {
    let files = fs.readdirSync(path);
    console.log('000000', files)
    files.forEach(function (item, index) {
        let fPath = join(path, item);
        let stat = fs.statSync(fPath);
        if (stat.isDirectory() === true) {  //对象描述文件系统目录
            findJsonFile(fPath);
        }
        if (stat.isFile() === true) {//  对象描述常规文件
            if (!/.*node_modules.*/.test(fPath)) {
                jsonFiles.push(fPath);
            }
        }
    });
};

findJsonFile(localwork);


const uploadFile = (name, localFile, callback = () => {
}) => {
// 文件上传
    console.log('localFile', localFile)
    formUploader.putFile(uploadToken, name, localFile, putExtra, function (respErr, respBody, respInfo) {
        // console.log('........',respErr,respInfo)
        if (respErr) {
            throw respErr;
        }
        if (respInfo.statusCode == 200) {
            console.log('respBody', respBody);
            callback()
        } else {
            console.log(respInfo.statusCode);
            // console.log(respBody);
        }
    });
};

let num = 0, total = jsonFiles.length;
pb.render({completed: num, total: total}); // 更新进度条

jsonFiles.forEach((item, key) => {
    var config = new qiniu.conf.Config();
        config.zone = qiniu.zone.Zone_z0;
    var formUploader = new qiniu.form_up.FormUploader(config);
    var putExtra = new qiniu.form_up.PutExtra();
    let name = item.replace(join(process.cwd(), './img'), '');
        name = name.replace(/\\/g, '').replace(/\//, '');
    let localFile = item.replace(join(process.cwd()), '.');

    formUploader.putFile(uploadToken, name, localFile, putExtra, function (respErr, respBody, respInfo) {
        // console.log('........',respErr,respInfo)
        if (respErr) {
            throw respErr;
        }
        if (respInfo.statusCode == 200) {
            console.log('respBody', respBody);
            var urlsToRefresh = [
                'http://q9a56mzr3.bkt.clouddn.com/' + name,
            ];
            cdnManager.refreshUrls(urlsToRefresh, function (err, reBody, reInfo) {
                if (err) {
                    throw err;
                }
                console.log(reInfo.statusCode);
                if (respInfo.statusCode == 200) {

                }
                ;
            });

            num++;
            if (num <= total) {
                pb.render({completed: num, total: total}); // 更新进度条
            }
        } else {
            console.log(respInfo.statusCode);
            // console.log(respBody);
        }
    });

});




