import { tapper } from "../internal";

let dynamicScopeValue = null;

export class DynamicScopeCascade {
    static getDynamicScope() {
        return dynamicScopeValue
    }

    #dynamicScopeVal: any
    val: () => any
    constructor(cb, dynamicScopVal = null) {
        let tempDynamicScopVal = dynamicScopeValue
        try {
            dynamicScopeValue = dynamicScopVal;
            this.#dynamicScopeVal = dynamicScopVal
            this.val = cb()
        } catch(err) {
            throw err;
        } finally {
            dynamicScopeValue = tempDynamicScopVal
        }
    }
    static of(cb, val) {
        return new DynamicScopeCascade(cb, val)
    }
    map(cb) {
        return new DynamicScopeCascade(() => cb(this.val), this.#dynamicScopeVal)
    }
    tap(cb) {
        return this.map(tapper(() => cb(this.val)))
    }
    get() {
        let a = this.val
        return this.val
    }
    get functor() {
        return DynamicScopeCascade.of
    }
}