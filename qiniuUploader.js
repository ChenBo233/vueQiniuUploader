/**
 * Created by chenbo on 2017/9/18.
 *
 * 1.引入： import Uploader from '@/qiniuUploader';
 * 2.初始化参数，获取七牛token(token、tokenPort必须传一个)： Uploader.init();
 * 3.上传：Uploader.upload().then((key)=>{上传成功返回七牛文件key});
 *
 * 由于每个项目需求和UI不同，所以尽量解耦，去掉了加载和上传的动画，需要的同学可以在回调中加入，或者修改源码统一实现
 */
import axios from 'axios';

let el = '';

let config = {
    token: '', //七牛token
    tokenPort: 'http://10.40.11.70:41002/dafystore_app/v1/qiniu/uptoken', //获取七牛token的接口，和token二选一
    accept: 'image/png,image/gif,image/jpg,image/jpeg', //可上传文件的类型
    begin: '', //开始上传回调
    succeed: '', //上传成功回调，等同于then
    fail: '' //上传失败回调，等同于catch
};

let init = (options) => {
    config = Object.assign(config, options);
    try {
        if (!config.token && !config.tokenPort) {
            throw '没有传入token或者tokenPort';
        } else if (config.tokenPort) {
            getToken();
        }
    }
    catch (err) {
        console.log(err);
    }
};

let getToken = () => {
    let url = config.tokenPort;
    axios.post(url)
        .then(function (res) {
            let ret = res.data;
            if (ret && ret.data) {
                config.token = ret.data;
            } else {
                console.log('fail to get token');
            }
        })
        .catch(function (error) {
            reject(error);
        });
};

let selectFile =  () => {
    return new Promise ((resolve, reject) => {
        el = el || document.createElement('input');
        el.type = 'file';
        el.accept = config.accept;
        el.click();
        el.onchange = () => {
            let file = el.files[0];
            if (el.files.length <= 0) {
                reject();
                return false;
            }
            el.value = '';
            resolve(file);
        };
    });
};

let readFile = (file) => {
    return new Promise((resolve, reject) => {
        let fr = new FileReader();
        fr.readAsDataURL(file);
        fr.onload = function () {
            resolve(this.result);
        }
    })
};

let uplodaFile = (file) => {
    return new Promise((resolve, reject) => {
        let data = new FormData();
        let qiniuUploadUrl = '';
        data.append('token', config.token);
        data.append('file', file);

        if (window.location.protocol === 'https:') {
            qiniuUploadUrl = 'https://up.qbox.me';
        } else {
            qiniuUploadUrl = 'http://up.qiniu.com';
        }
        axios.post(qiniuUploadUrl, data)
            .then((response) => {
                resolve(response);
            })
            .catch((error) => {
                reject(error);
            });
    });
};

let upload = (options) => {
    return new Promise ((resolve, reject) => {
        if (!config.token) {
            reject('没有找到token，请重试...');
            getToken();
            return false;
        }
        config = Object.assign(config, options);
        config.begin && typeof config.begin === 'function' && config.begin();
        selectFile()
            .then((file) => {
                return readFile(file);
            })
            .then ((file) => {
                return uplodaFile(file);
            })
            .then ((res) => {
                let key = res.data.key;
                config.succeed && typeof config.succeed === 'function' && config.succeed(key);
                resolve(key);
            })
            .catch((err) => {
                config.fail && typeof config.fail === 'function' && config.fail(err);
                reject(err);
            })
    });
};
export default {
    init: init,
    upload: upload
};
