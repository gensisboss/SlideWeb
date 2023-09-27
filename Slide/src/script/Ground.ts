/**
 * 掉落盒子脚本，实现盒子碰撞及回收流程
 */
export default class Ground extends Laya.Script {
    /**地面等级 */
    private _icon: Laya.Image;

    constructor() { super(); }
    onEnable(): void {
        this._icon = this.owner.getChildByName("skin") as Laya.Image;
        this._icon.skin = "test/b"+this.owner.name+".png"
    }

   
    onDisable(): void {
        //盒子被移除时，回收盒子到对象池，方便下次复用，减少对象创建开销。
        Laya.Pool.recover("ground", this.owner);
    }
}