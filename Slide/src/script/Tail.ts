import { Direction } from "../data/Direction";
import { GameEvent } from "../data/GameEvent";
import { RoleType } from "../data/RoleType";
import { EventCenter } from "./EventCenter";
import GameControl from "./GameControl";


export default class Tail extends Laya.Script {
    constructor() { super(); }


    private _liveTime: number;
    private _icon : Laya.Image;

    onEnable(): void {
        this._icon = this.owner.getChildByName("skin") as Laya.Image;
        this._icon.scale(1,1);
        this._icon.centerX = (Math.random()-0.5)*50
        this._icon.centerY = (Math.random()-0.5)*50
        this._liveTime = 1;
        Laya.timer.loop(100, this, this.tailEffect)
    }

    tailEffect() {
        this._liveTime -= 0.05;
        this._icon.rotation = Math.random() * 360;
        let param = this._liveTime;
        this._icon.scale(param, param);
        if (this._liveTime <= 0) {
            this.owner.removeSelf();
        }
    }


    onDisable(): void {
        Laya.timer.clear(this, this.tailEffect);
        Laya.Pool.recover("tail", this.owner);
    }
}


