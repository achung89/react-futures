import { tap } from "../utils";

let dynamicScopeValue = null;
export default class DynamicScopeCascade {
    static getDynamicScope() {
        return dynamicScopeValue
    }
    static of(...args) {
        return new DynamicScopeCascade(...args)
    }
    #dynamicScopeVal: any
    #val: () => any
    constructor(cb, dynamicScopVal = null) {
        let tempDynamicScopVal = dynamicScopeValue
        try {
            dynamicScopeValue = dynamicScopVal;
            this.#dynamicScopeVal = dynamicScopVal
            this.#val = cb()
        } finally {
            dynamicScopeValue = tempDynamicScopVal
        }
    }
    static of(cb, val) {
        return new DynamicScopeCascade(cb, val)
    }
    map(cb) {
        return new DynamicScopeCascade(() => cb(this.#val), this.#dynamicScopeVal)
    }
    tap(cb) {
        return new DynamicScopeCascade(tap(() => cb(this.#val)), this.#dynamicScopeVal)
    }
    get() {
        return this.#val
    }
    get functor() {
        return DynamicScopeCascade.of
    }
}