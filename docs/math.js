// ================================================== [50]
//     Definition

'use strict'

function modulo(a, b) {
    if (a.toString(2).length < b.toString(2).length) return a
    let c = b << a.toString(2).length - b.toString(2).length
    return modulo(a^c, b)
}

function xor(a, b) { // a.length < b.length
    const array = []
    for (let i = 0       ; i < a.length; i++) array.push(b[i] ^ a[i])
    for (let i = a.length; i < b.length; i++) array.push(b[i]       )
    return array
}

function GaloisMod(a, b) { // a mod b  // ガロア体 関数剰余
    // A / B = P * B + Q  -->  return Q
    // a: 被除算関数の係数（降順、真数領域）
    // b: 　除算関数の係数（降順、指数領域）
    // step 1: B に A の最高次数の係数を乗じる（指数領域）: \times A[0]
    // step 2: aを指数領域にして、bに加算　-->　bを真数領域にする
    // step 3: それぞれの排他的論理和があまりとなる
    const bb = b.map(x => (x + LOG_A[a[0]]) % 255).map(x => A_EXP[x])
    a.shift()
    return a.length <= b.length ? xor(bb, a) : GaloisMod(xor(bb, a), b)
}

// ================================================== [50]
//     END
// ================================================== [50]