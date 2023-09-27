import GameControl from "./GameControl";
import { Global } from "./Global";
import { Server } from "./Server";

export default class PageControl extends GameControl {

    /** @prop {name:cloud,tips:"云彩",type:Prefab}*/
    cloud: Laya.Prefab;
    /** @prop {name:ground,tips:"地块",type:Prefab}*/
    ground: Laya.Prefab;
    /** @prop {name:role,tips:"角色",type:Prefab}*/
    role: Laya.Prefab;
    /** @prop {name:tail,tips:"尾尘",type:Prefab}*/
    tail: Laya.Prefab;
    /** @prop {name:unit,tips:"单位长度",type:number}*/
    unit: number;

    private _mainBox: Laya.Box;
    private _loadBox: Laya.Box;
    private _rankBox: Laya.Box;
    private _rankList: Laya.List;
    private _mainRole: Laya.Image;
    protected _gameBox: Laya.Box;
    protected _mapBox: Laya.Box;
    private _gameLevel: Laya.Label;



    private _beginX = 0;
    private _isStart: boolean = false;
    private _pageSize: number = 10;
    private _offset: number = 0;
    private _getAllRankData: boolean = false;
    

    constructor() {
        super();
    }

    onEnable(): void {
        super.onEnable();
        this._mainBox = this.owner.getChildByName("main") as Laya.Box;
        this._mainRole = this._mainBox.getChildByName("moveBox").getChildByName("role") as Laya.Image;
        this._gameBox = this.owner.getChildByName("game") as Laya.Box;
        this._mapBox = this._gameBox.getChildByName("mapBox") as Laya.Box;
        this._gameLevel = this._gameBox.getChildByName("level") as Laya.Label;
        this._loadBox = this.owner.getChildByName("load") as Laya.Box;
        this._rankBox = this._gameBox.getChildByName("rankBox") as Laya.Box;
        this._rankList = this._rankBox.getChildByName("rankList") as Laya.List;
        this.adaptScreen();
        this._rankList.mouseEnabled = true;
        this._rankList.renderHandler = new Laya.Handler(this, this.onRankListRender)
        this._mainBox.visible = true;
        this._gameBox.visible = false;
        this._loadBox.visible = false;
        this._rankList.array = [];
        this._mainRole.x = 0;
        this._isStart = false;
        this._getAllRankData = false;
        this._mainBox.on(Laya.Event.MOUSE_DOWN, this, this.onMainDown)
        this._mainBox.on(Laya.Event.MOUSE_MOVE, this, this.onMainMove)
        this._rankList.scrollBar.on(Laya.Event.CHANGE, this, this.getRankData,[false])
    }

    adaptScreen(){
        if(Laya.stage.width < Laya.stage.height/2){
            //长屏幕手机
            this._gameBox.top = 100;
        }else{
            this._gameBox.top = 20;
        }
    }



    private getRankData(isForce:boolean) {
        if (isForce || !this._getAllRankData && this._rankList.scrollBar.value >= this._rankList.scrollBar.max - 50) {
            this._offset += 1;
            Server.I.post("/user/rank", { offset: this._offset, pagesize: this._pageSize }, Laya.Handler.create(this, (data) => {
                console.log("请求的排行榜数据为", data)
                if (data.array.length < this._pageSize) {
                    this._getAllRankData = true;
                }
                this._rankList.array = this._rankList.array.concat(data.array);
            }), Laya.Handler.create(this, (e) => {
                console.log("请求排行榜数据失败", e.message)
            }))
        }

    }

    private onRankListRender(item: any, index: number) {
        let rank = item.getChildByName("rank") as Laya.Label;
        rank.text = (index + 1).toString();
    }

    private onMainDown(e: Laya.Event) {
        this._beginX = e.stageX;
    }

    private onMainMove(e: Laya.Event) {
        if (!this._isStart) {
            if (e.stageX - this._beginX > 100) {
                this._isStart = true;
                this.startGame();
            }
        }

    }

    startGame(): void {
        Laya.Tween.to(this._mainRole, { x: 400 }, 1000, null, Laya.Handler.create(this, () => {
            super.startGame();
            this._mainBox.visible = false;
            this._gameBox.visible = true;
        }))
    }


    clearLastGame(): void {
        super.clearLastGame()
        this._gameLevel.text = "第" + Global.I.curLevel + "天";
        this._loadBox.visible = true;
        this._loadBox.x = 0;
        Laya.Tween.to(this._loadBox, { x: Laya.stage.displayWidth }, 2000)
    }

}