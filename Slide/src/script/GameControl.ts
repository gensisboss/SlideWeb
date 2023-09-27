import { Direction } from "../data/Direction";
import { GameEvent } from "../data/GameEvent";
import { GroundType } from "../data/GroundType";
import { RoleType } from "../data/RoleType";
import { EventCenter } from "./EventCenter";
import { Global } from "./Global";
import { Server } from "./Server";

export default class GameControl extends Laya.Script {
    /**设置单例的引用方式，方便其他类引用 */
    static instance: GameControl;

    cloud: Laya.Prefab;
    ground: Laya.Prefab;
    role: Laya.Prefab;
    tail: Laya.Prefab;
    unit: number;

    protected _mapBox: Laya.Box;
    protected _gameBox: Laya.Box;

    private _beginPos: Laya.Point;
    private _minSlideDis: number = 50;
    private _mapData: any;
    private _roleNums: number = 0;
    private _directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]
    private _targetPoint: Laya.Point;
    private _moveEnds: number = 0;

    curPoints: Map<string, Laya.Point> = new Map();


    constructor() {
        super();
        GameControl.instance = this;
        Laya.MouseManager.multiTouchEnabled = false;
    }


    onEnable(): void {
        Laya.timer.loop(3000, this, () => {
            this.createCloudEffect();
        })
        Server.I.login();
        Server.I.post("/user/search", { nickname: Global.I.nickName }, Laya.Handler.create(this, (data) => {
            console.log("请求的数据为", data)
            Global.I.curLevel = data.level;
        }), Laya.Handler.create(this, (e) => {
            console.log("请求失败", e.message)
            Global.I.curLevel = 1;
        }))

    }

    onKeyUp(e: Laya.Event): void {
        let direction = Direction.none;
        switch (e.keyCode) {
            case Laya.Keyboard.LEFT:
                direction = Direction.left;
                break;
            case Laya.Keyboard.RIGHT:
                direction = Direction.right;
                break;
            case Laya.Keyboard.UP:
                direction = Direction.up;
                break;
            case Laya.Keyboard.DOWN:
                direction = Direction.down;
                break;
            default:
                direction = Direction.none;
                break;
        }
        if (direction != Direction.none) {
            EventCenter.I.event(GameEvent.ROLE_ACTION, direction)
        }

    }


    onStageMouseDown(e: Laya.Event): void {
        this._beginPos = new Laya.Point(e.stageX, e.stageY);
    }

    onStageMouseMove(e: Laya.Event): void {
        if (this._beginPos) {
            let direction = Direction.none;
            let offsetX = e.stageX - this._beginPos.x;
            let offsetY = e.stageY - this._beginPos.y;
            if (Math.abs(offsetX) > Math.abs(offsetY)) {
                if (Math.abs(offsetX) >= this._minSlideDis) {
                    direction = offsetX > 0 ? Direction.right : Direction.left;
                }
            } else {
                if (Math.abs(offsetY) >= this._minSlideDis) {
                    direction = offsetY > 0 ? Direction.down : Direction.up;
                }
            }
            if (direction != Direction.none) {
                this._beginPos = null;
                EventCenter.I.event(GameEvent.ROLE_ACTION, direction)
            }
        }
    }



    invertMatrix(matrix) {
        let row = matrix.length;
        let col = matrix[0].length;
        let ans = Array.from(new Array(row), () => new Array(col));
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[0].length; j++) {
                ans[i][j] = matrix[j][i];
            }
        }
        return ans;
    }

    createMap() {
        this.curPoints = new Map();
        let level = Global.I.curLevel;
        this._roleNums = 0;
        let data = Global.I.mapData["level" + level];
        this._mapData = this.invertMatrix(data.map);
        let row = this._mapData.length;
        let col = this._mapData[0].length;
        this._mapBox.size(row * this.unit, col * this.unit);
        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {
                this.createGround(i, j, this._mapData[i][j]);
            }
        }
        let roles = data.role;
        if (roles) {
            for (let i = 0; i < roles.length; i++) {
                this._roleNums++;
                this.creteRole(roles[i][0], roles[i][1], RoleType.role);
            }
        }

        let boxs = data.box;
        if (boxs) {
            for (let i = 0; i < boxs.length; i++) {
                this.creteRole(boxs[i][0], boxs[i][1], RoleType.box);
            }
        }

        let enemys = data.enemy;
        if (enemys) {
            for (let i = 0; i < enemys.length; i++) {
                this.creteRole(enemys[i][0], enemys[i][1], RoleType.enemy);
            }
        }

    }

    createCloudEffect() {
        let ranNum = Math.round(Math.random() * 5 - 2);
        if (ranNum > 0) {
            for (let i = 0; i < ranNum; i++) {
                let ranHeight = Math.random() * Laya.stage.height - 300;
                if (ranHeight > 0) {
                    let cloud: Laya.Sprite = Laya.Pool.getItemByCreateFun("cloud", this.cloud.create, this.cloud);
                    cloud.pos(-300, ranHeight);
                    this._gameBox.addChild(cloud);
                    Laya.Tween.to(cloud, { x: Laya.stage.width + 300 }, Math.random() * 3000 + 5000, null, Laya.Handler.create(this, () => {
                        cloud.removeSelf();
                        Laya.Pool.recover("cloud", cloud);
                    }))
                }

            }
        }


    }

    createTailEffect(posX: number, posY: number) {
        let tail: Laya.Sprite = Laya.Pool.getItemByCreateFun("tail", this.tail.create, this.tail);
        tail.pos(posX, posY);
        this._mapBox.addChild(tail);
    }

    creteRole(posX: number, posY: number, type: RoleType) {
        //使用对象池创建角色
        let point = new Laya.Point(posX, posY);
        let flyer: Laya.Sprite = Laya.Pool.getItemByCreateFun("role", this.role.create, this.role);
        flyer.name = type + posX + posY;
        flyer.pos(posX * this.unit, posY * this.unit);
        this.curPoints.set(flyer.name, point)
        this._mapBox.addChild(flyer);
    }

    createGround(row: number, col: number, value: number): void {
        //使用对象池创建地面
        if (value > 0) {
            let ground: Laya.Sprite = Laya.Pool.getItemByCreateFun("ground", this.ground.create, this.ground);
            ground.name = value.toString();
            ground.pos(row * this.unit, col * this.unit);
            if (value == GroundType.finish) {
                this._targetPoint = new Laya.Point(row, col);
            }
            this._mapBox.addChild(ground);
        }

    }




    detectIsContinue(begin: Laya.Point, end: Laya.Point, direction: Direction) {
        let flag = true;
        switch (direction) {
            case Direction.up:
                for (let i = begin.y; i > end.y; i--) {
                    if (this._mapData[begin.x][i] == GroundType.unwalk) {
                        flag = false;
                        break;
                    }
                }
                break;
            case Direction.down:
                for (let i = begin.y; i < end.y; i++) {
                    if (this._mapData[begin.x][i] == GroundType.unwalk) {
                        flag = false;
                        break;
                    }
                }
                break;
            case Direction.left:
                for (let i = begin.x; i > end.x; i--) {
                    if (this._mapData[i][begin.y] == GroundType.unwalk) {
                        flag = false;
                        break;
                    }
                }
                break;
            case Direction.right:
                for (let i = begin.x; i < end.x; i++) {
                    if (this._mapData[i][begin.y] == GroundType.unwalk) {
                        flag = false;
                        break;
                    }
                }
                break;
            default:
                break;
        }
        return flag;
    }


    caculateOffset(point: Laya.Point, direction: Direction) {
        let offset = 1;
        switch (direction) {
            case Direction.up:
                this.curPoints.forEach((value) => {
                    if (value.y < point.y && value.x == point.x && this.detectIsContinue(point, value, direction)) {
                        offset++;
                    }
                })
                break;
            case Direction.down:
                this.curPoints.forEach((value) => {
                    if (value.y > point.y && value.x == point.x && this.detectIsContinue(point, value, direction)) {
                        offset++;
                    }
                })
                break;
            case Direction.left:
                this.curPoints.forEach((value) => {
                    if (value.x < point.x && value.y == point.y && this.detectIsContinue(point, value, direction)) {
                        offset++;
                    }
                })
                break;
            case Direction.right:
                this.curPoints.forEach((value) => {
                    if (value.x > point.x && value.y == point.y && this.detectIsContinue(point, value, direction)) {
                        offset++;
                    }
                })
                break;
            default:
                break;
        }
        return offset;
    }

    detectCrossTarget(point: Laya.Point, direction: Direction, begin: Laya.Point) {
        switch (direction) {
            case Direction.up:
                if (begin.y > this._targetPoint.y && point.y < this._targetPoint.y && point.x == this._targetPoint.x) {
                    point.y = this._targetPoint.y;
                }
                break;
            case Direction.down:
                if (begin.y < this._targetPoint.y && point.y > this._targetPoint.y && point.x == this._targetPoint.x) {
                    point.y = this._targetPoint.y;
                }
                break;
            case Direction.left:
                if (point.y == this._targetPoint.y && begin.x > this._targetPoint.x && point.x < this._targetPoint.x) {
                    point.x = this._targetPoint.x;
                }
                break;
            case Direction.right:
                if (point.y == this._targetPoint.y && begin.x < this._targetPoint.x && point.x > this._targetPoint.x) {
                    point.x = this._targetPoint.x;
                }
                break;
            default:
                break;
        }
    }


    caculateTarget(type: RoleType, point: Laya.Point, direction: Direction, offset: number, begin: Laya.Point) {
        let row = this._mapData.length;
        let col = this._mapData[0].length;
        if (point.x >= row || point.x < 0 || point.y >= col || point.y < 0 || this._mapData[point.x][point.y] == GroundType.unwalk) {
            switch (direction) {
                case Direction.up:
                    point.y += offset;
                    break;
                case Direction.down:
                    point.y -= offset;
                    break;
                case Direction.left:
                    point.x += offset;
                    break;
                case Direction.right:
                    point.x -= offset;
                    break;
                default:
                    break;
            }
            if (type == RoleType.role) {
                this.detectCrossTarget(point, direction, begin);
            }
            return point;
        }
        switch (direction) {
            case Direction.up:
                point.y--;
                break;
            case Direction.down:
                point.y++;
                break;
            case Direction.left:
                point.x--;
                break;
            case Direction.right:
                point.x++;
                break;
            default:
                break;
        }
        return this.caculateTarget(type, point, direction, offset, begin)
    }

    //检测当前角色是否失败
    detectIsFail(name: string) {
        let point = this.curPoints.get(name);
        if (point) {
            this.curPoints.forEach((value, key) => {
                if (key.includes("role")) {
                    for (let i = 0; i < this._directions.length; i++) {
                        if (point.x + this._directions[i][0] == value.x
                            && point.y + this._directions[i][1] == value.y) {
                            EventCenter.I.event(GameEvent.ENEMY_ACTION, value)
                            return true;
                        }
                    }
                }
            })
        }
        return false;
    }

    //检测所有玩家是否都移动结束
    detectAllMoveEnd() {
        this._moveEnds++;
        if (this._moveEnds >= this.curPoints.size) {
            this._moveEnds = 0;
            EventCenter.I.event(GameEvent.ENEMY_DETECT)
        }
    }

    //检测当前角色是否胜利
    detectIsSuccess(name: string) {
        let point = this.curPoints.get(name);
        if (point) {
            if (this._mapData[point.x][point.y] == GroundType.finish) {
                this._roleNums--;
                this.curPoints.delete(name);
                if (this._roleNums <= 0) {
                    this.finishGame(true);
                }
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }

    }

    startGame() {
        this.nextGame(false);
    }

    finishGame(isWin: boolean) {
        Laya.timer.clear(this, this.nextGame);
        Laya.timer.once(500, this, this.nextGame, [isWin]);
    }

    //下一关
    nextGame(isWin: boolean) {
        if (isWin) {
            Global.I.curLevel++;
            Server.I.post("/user/update", { nickname: Global.I.nickName, level: Global.I.curLevel })
        }
        this.clearLastGame();
        this.createMap();

    }


    clearLastGame() {
        this._moveEnds = 0;
        this._targetPoint = null;
        this._mapData = null;
        this.curPoints = null;
        this._mapBox.removeChildren();
    }


}