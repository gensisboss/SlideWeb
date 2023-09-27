import { Direction } from "../data/Direction";
import { GameEvent } from "../data/GameEvent";
import { RoleType } from "../data/RoleType";
import { EventCenter } from "./EventCenter";
import GameControl from "./GameControl";


export default class Role extends Laya.Script {
    constructor() { super(); }

    roleType: RoleType = RoleType.role;
    rolrId: number = 0;
    curPos: Laya.Point = new Laya.Point();
    tempPos: Laya.Point = new Laya.Point();



    private _icon: Laya.Image;
    private _direction: Direction = Direction.none;
    private _moveUnitTime: number = 200;
    private _canMove: boolean = false;
    private get canMove(): boolean {
        return this._canMove;
    }
    private set canMove(value: boolean) {
        this._canMove = value;
    }
   


    onEnable(): void {
        if(!GameControl.instance.curPoints.has(this.owner.name)){
            return;
        }
        this.curPos = GameControl.instance.curPoints.get(this.owner.name);
        this._icon = this.owner.getChildByName("skin") as Laya.Image;
        this._icon.scaleX = this._icon.scaleY = 1;
        switch (this.owner.name) {
            case RoleType.role+this.curPos.x+this.curPos.y:
                this.roleType = RoleType.role;
                this._icon.skin = "test/c1.png"
                break;
            case RoleType.box+this.curPos.x+this.curPos.y:
                this.roleType = RoleType.box;
                this._icon.skin = "test/c2.png"
                break;
            case RoleType.enemy+this.curPos.x+this.curPos.y:
                this.roleType = RoleType.enemy;
                this._icon.skin = "test/t1.png"
                break;
            default:
                break;
        }
        this.canMove = true;
        EventCenter.I.on(GameEvent.ENEMY_ACTION, this, this.enemyAction);
        EventCenter.I.on(GameEvent.ENEMY_DETECT, this, this.enemyDetect);
        EventCenter.I.on(GameEvent.REPEAT_ACTION, this, this.repeatMove);
        EventCenter.I.on(GameEvent.ROLE_ACTION, this, this.roleAction);

    }

    repeatMove(target:string){
        if(target != this.owner.name){
            this.move();
        }
    }

    enemyDetect() {
        if (this.roleType == RoleType.enemy) {
            GameControl.instance.detectIsFail(this.owner.name);
        }
        this.canMove = true;   
    }

    enemyAction(target: Laya.Point) {
        this.canMove = false;
        if (this.roleType == RoleType.enemy) {
            let unit = GameControl.instance.unit;
            Laya.Tween.to(this.owner, { x: target.x * unit, y: target.y * unit }, this._moveUnitTime, null, Laya.Handler.create(this, () => {
                GameControl.instance.finishGame(false);
                this.canMove = false;
            }));
        }
    }

    roleAction(direction: Direction) {
        this._direction = direction;
        this.move();
    }
   

    createTail(){
        let posX = (this.owner as Laya.Sprite).x;
        let posY = (this.owner as Laya.Sprite).y;
        GameControl.instance.createTailEffect(posX,posY);
    }

    move() {
        if(!this.canMove){
            return;
        }
        this.canMove = false;
        this.tempPos.x = this.curPos.x;
        this.tempPos.y = this.curPos.y;
        let unit = GameControl.instance.unit;
        let offset = GameControl.instance.caculateOffset(this.curPos, this._direction)
        GameControl.instance.caculateTarget(this.roleType, this.tempPos, this._direction, offset, this.curPos);
        let dis = Math.abs(this.curPos.x - this.tempPos.x) + Math.abs(this.curPos.y - this.tempPos.y)
        Laya.timer.loop(this._moveUnitTime,this,this.createTail)
        Laya.Tween.to(this.owner, { x: this.tempPos.x * unit, y: this.tempPos.y * unit }, dis * this._moveUnitTime, null, Laya.Handler.create(this, () => {
            this.curPos.x = this.tempPos.x;
            this.curPos.y = this.tempPos.y;
            Laya.timer.clear(this,this.createTail)
            if (this.roleType == RoleType.role) {
                if (GameControl.instance.detectIsSuccess(this.owner.name)) {
                     Laya.Tween.to(this._icon,{scaleX:0,scaleY:0},this._moveUnitTime)
                     EventCenter.I.event(GameEvent.REPEAT_ACTION,[this.owner.name]);
                     return;
                }
            }
            GameControl.instance.detectAllMoveEnd();
        }));
    }

    onDisable(): void {
        EventCenter.I.off(GameEvent.ENEMY_ACTION, this, this.enemyAction);
        EventCenter.I.off(GameEvent.ENEMY_DETECT, this, this.enemyDetect);
        EventCenter.I.off(GameEvent.REPEAT_ACTION, this, this.repeatMove);
        EventCenter.I.off(GameEvent.ROLE_ACTION, this, this.roleAction);
        Laya.Pool.recover("role", this.owner);
    }
    
}


