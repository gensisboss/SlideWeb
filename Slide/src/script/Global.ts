
export class Global {
    private static _instance: Global;
    public static get I(): Global {
        window["global"] = this._instance;
        return this._instance || (this._instance = new Global);
    }
    mapData: any;
    curLevel: number = 1;
    nickName: string = "龚港浩";

}