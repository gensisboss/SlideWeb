import { Global } from "./Global";

export class Server {
    private static _instance: Server;
    public static get I(): Server {
        return this._instance || (this._instance = new Server);
    }

    private _basePath = "http://8.141.90.170:3001";


    public get(url: string, params: any, sucCallBack?: Laya.Handler, failCallBack?: Laya.Handler) {
        url = this._basePath + url;
        let arr = [];
        for (let key in params) {
            arr.push(key + "=" + params[key]);
        }
        let str = arr.join("&");
        this.request(url + "?" + str, "", "get", "json", sucCallBack, failCallBack);
    }

    public post(url: string, params: any, sucCallBack?: Laya.Handler, failCallBack?: Laya.Handler) {
        url = this._basePath + url;
        let arr = [];
        let sign = ""
        params = {
            ...params,
            sign
        }
        for (let key in params) {
            arr.push(key + "=" + params[key]);
        }
        let str = arr.join("&");
        this.request(url, str, "post", "json", sucCallBack, failCallBack)
    }

    private request(url: string, data: any, method: string, responseType: string, sucCallBack?: Laya.Handler, failCallBack?: Laya.Handler) {
        var xhr: Laya.HttpRequest = new Laya.HttpRequest();
        xhr.http.timeout = 10000;//设置超时时间；
        xhr.once(Laya.Event.COMPLETE, this, ret => {
            if (ret.success) {
                sucCallBack && sucCallBack.runWith(ret.data);
            } else {
                failCallBack && failCallBack.runWith(ret);
                this.error(url, ret);
            }
        });
        xhr.once(Laya.Event.ERROR, this, ret => {
            failCallBack && failCallBack.runWith(ret);
            this.error(url, ret);
        });
        xhr.send(url, data, method, responseType);
        console.log(`Http Send: ${url} ${data}`);
    }


    private error(url, e) {
        console.log(`Http Error: ${url} ${JSON.stringify(e)}`);
    }

    public login() {
        console.log("微信登录");
        if ( typeof(wx) != "undefined") {
            console.log("开始微信登录");
            var ths = this;
            wx.login({
                success: function (res) {
                    if (res.code) {
                        console.log("微信登录成功",res.code);
                        // 将返回的login凭证发送到后端服务端进行解码获取openid等信息
                        ths.getUserInfo(res.code);
                    }
                }
            });
        }
    }

    getUserInfo(code) {
        Laya.Browser.window.wx.request({
            url: this._basePath,
            data: {
                code: code
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                console.log("获取用户信息",res.data) //打印获取的openid和session_key信息
                wx.getUserInfo({
                    success: function(res) {
                      var userInfo = res.userInfo
                      Global.I.nickName = userInfo.nickName
                      console.log("玩家的用户信息",userInfo)
                    }
                  })
            },
        })
    }

}