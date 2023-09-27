export class EventCenter extends Laya.EventDispatcher {
    constructor() {
        super();
    }

    private static _instance: EventCenter;
    public static get I(): EventCenter {
        return this._instance || (this._instance = new EventCenter);
    }
}