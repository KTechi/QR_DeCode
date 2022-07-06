// ================================================== [50]
//     Main

'use strict'

function paint() {
    context.clearRect(0, 0, VW, VH)
    if (display_filter <= 0) return // ================================================== 背景初期化

    if (imageObject.image === undefined) return
    context.drawImage(imageObject.image, 0, 0, imageObject.width, imageObject.height)
    if (display_filter <= 1) return // ================================================== 画像貼り付け

    imageData = context.getImageData(0, 0, VW, VH)
    data = imageData.data
    const data_bin = []
    for (let y = 0; y < VH; y++) {
        data_bin.push([])
        for (let x = 0; x < VW; x++)
            data_bin[y].push(imageData.data[4*(y*VW + x)] < 128 ? 0 : 1)
    }
    for (let y = 0; y < VH; y++)
    for (let x = 0; x < VW; x++) {
        const base = 4*(y*VW + x)
        data[base + 0] =
        data[base + 1] =
        data[base + 2] = data_bin[y][x] * 255
    }
    context.putImageData(imageData, 0, 0)
    if (display_filter <= 2) return // ================================================== 2値化

    // Search 'Position_Detection Symbol'
    imageData = context.getImageData(0, 0, VW, VH)
    data = imageData.data
    const data2 = []
    const data3 = []
    const data4 = []
    for (let y = 0; y < VH; y++) {
        data2.push([])
        data3.push([])
        data4.push([])
        for (let x = 0; x < VW; x++) {
            data2[y].push(0)
            data3[y].push(0)
            data4[y].push(0)
        }
    }

    let cell_width_sum = 0
    let cell_width_num = 0
    for (let y = 0; y < VH; y++) {
        const line = [0]
        for (let x = 0; x < VW - 1; x++) {
            if (data_bin[y][x] === data_bin[y][x+1])
                line[line.length-1]++
            else
                line.push(1)
        }

        if (line.length < 5) continue
        let x = 0
        for (let i = 4; i < line.length; i++) {
            const j = i - 4
            const a = line[j+0]
            const b = line[j+1]
            const c = line[j+2]
            const d = line[j+3]
            const e = line[j+4]
            x += a
            const avg = (a + b + c/3 + d + e) / 5
            const avg_L = avg * 0.8
            const avg_H = avg * 1.2
            if (a < avg_L || avg_H < a) continue
            if (b < avg_L || avg_H < b) continue
            if (c < 3*avg_L || 3*avg_H < c) continue
            if (d < avg_L || avg_H < d) continue
            if (e < avg_L || avg_H < e) continue
            cell_width_sum += avg
            cell_width_num += 1
            for (let x_ = x - a; x_ < x + b + c + d + e; x_++)
                data2[y][x_] += 1
        }
    }
    const avg_x = cell_width_sum / cell_width_num

    cell_width_sum = 0
    cell_width_num = 0
    for (let x = 0; x < VW; x++) {
        const line = [0]
        for (let y = 0; y < VH - 1; y++) {
            if (data_bin[y][x] === data_bin[y+1][x])
                line[line.length-1]++
            else
                line.push(1)
        }

        if (line.length < 5) continue
        let y = 0
        for (let i = 4; i < line.length; i++) {
            const j = i - 4
            const a = line[j+0]
            const b = line[j+1]
            const c = line[j+2]
            const d = line[j+3]
            const e = line[j+4]
            y += a
            const avg = (a + b + c/3 + d + e) / 5
            const avg_L = avg * 0.8
            const avg_H = avg * 1.2
            if (a < avg_L || avg_H < a) continue
            if (b < avg_L || avg_H < b) continue
            if (c < 3*avg_L || 3*avg_H < c) continue
            if (d < avg_L || avg_H < d) continue
            if (e < avg_L || avg_H < e) continue
            cell_width_sum += avg
            cell_width_num += 1
            for (let y_ = y - a; y_ < y + b + c + d + e; y_++)
                data3[y_][x] += 1
        }
    }
    const avg_y = cell_width_sum / cell_width_num

    for (let y = 0; y < VH; y++)
    for (let x = 0; x < VW; x++) {
        const base = 4*(y*VW + x)
        let r = data[base + 0]
        let g = data[base + 1]
        let b = data[base + 2]
        if (data2[y][x] === 1 && data3[y][x] === 1) { r = 255; g =   0; b =   0 }
        else if (data2[y][x] === 1)                 { r =   0; g = 255; b =   0 }
        else if (data3[y][x] === 1)                 { r =   0; g =   0; b = 255 }
        data[base + 0] = r
        data[base + 1] = g
        data[base + 2] = b
    }
    context.putImageData(imageData, 0, 0)
    if (display_filter <= 3) return // ================================================== PDS 強調
    
    imageData = context.getImageData(0, 0, VW, VH)
    data = imageData.data
    let block_num = 1
    let block_data = []
    for (let y = 0; y < VH; y++)
    for (let x = 0; x < VW; x++)
        if (data2[y][x] === 1 && data3[y][x] === 1 && data4[y][x] === 0) {
            const size = paintBlock(data2, data3, data4, x, y, 1, block_num++)
            block_data.push({
                x: x, y: y,
                id: block_num,
                size: size,
            })
        }
    for (let y = 0; y < VH; y++)
    for (let x = 0; x < VW; x++) {
        const base = 4*(y*VW + x)
        let r = data[base + 0]/2
        let g = data[base + 1]/2
        let b = data[base + 2]/2
        if      (data4[y][x] === 1) { r = 255; g = 255; b =   0 } // Y
        else if (data4[y][x] === 2) { r = 255; g =   0; b = 255 } // M
        else if (data4[y][x] === 3) { r =   0; g = 255; b = 255 } // C
        else if (data4[y][x] === 4) { r =  64; g = 255; b =   0 } // Green
        else if (data4[y][x] === 5) { r = 255; g =  64; b =   0 } // Orange
        else if (data4[y][x] === 6) { r =  64; g =   0; b = 255 } // Blue
        else if (data4[y][x] === 7) { r = 255; g =   0; b =  64 } // Red
        else if (data4[y][x] !== 0) { r = 255; g = 255; b = 255 } // White
        data[base + 0] = r
        data[base + 1] = g
        data[base + 2] = b
    }
    context.putImageData(imageData, 0, 0)
    if (display_filter <= 4) return // ================================================== PDS 抽出

    context.lineWidth = 2
    context.strokeStyle = 'rgba(128, 128, 128, 1)'
    const tmp_array = []
    for (const symbol of block_data) {
        const min =  .8 * 9*avg_x*avg_y
        const max = 1.2 * 9*avg_x*avg_y
        if (symbol.size < min || max < symbol.size) continue
        tmp_array.push(symbol)
        const x1 = symbol.x
        const y1 = symbol.y
        const x2 = x1 + 3*avg_x
        const y2 = y1 + 3*avg_y
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.moveTo(x2, y1)
        context.lineTo(x1, y2)
    }
    block_data = tmp_array
    context.stroke()

    let tmp = block_data[0]
    if (tmp.x < block_data[1].x) tmp = block_data[1]
    if (tmp.x < block_data[2].x) tmp = block_data[2]
    const pds1 = tmp

    tmp = block_data[0]
    if (tmp.y < block_data[1].y) tmp = block_data[1]
    if (tmp.y < block_data[2].y) tmp = block_data[2]
    const pds3 = tmp

    tmp = block_data[0]
    if (tmp.id == pds1.id || tmp.id == pds3.id) tmp = block_data[1]
    if (tmp.id == pds1.id || tmp.id == pds3.id) tmp = block_data[2]
    const pds2 = tmp
    console.log(pds1)
    console.log(pds2)
    console.log(pds3)
    if (display_filter <= 5) return // ================================================== PDS 特定

    const xs = []
    const ys = []
    for (let i = 0; i < 7; i++) {
        xs.push(pds2.x - 2*avg_x + i*avg_x)
        ys.push(pds2.y - 2*avg_y + i*avg_y)
    }
    const origin = {
        x: Math.round(xs[xs.length-1] + avg_x/2),
        y: Math.round(ys[ys.length-1] + avg_y/2)
    }
    for (let y = origin.y; y < pds3.y; y++)
        if (data_bin[y][origin.x] != data_bin[y+1][origin.x]) ys.push(y)
    for (let x = origin.x; x < pds1.x; x++)
        if (data_bin[origin.y][x] != data_bin[origin.y][x+1]) xs.push(x)
    for (let i = 0; i < 6; i++) {
        xs.push(xs[xs.length-1] + avg_x)
        ys.push(ys[ys.length-1] + avg_y)
    }
    for (const x of xs)
    for (const y of ys) {
        context.fillStyle = 'rgba(0, 255, 0, 1)'
        context.beginPath()
        context.arc(Math.round(x + avg_x/2), Math.round(y + avg_y/2), 2, 0, 2*Math.PI, true)
        context.fill()
    }
    if (display_filter <= 6) return // ================================================== Timing

    context.drawImage(imageObject.image, 0, 0, imageObject.width, imageObject.height)
    imageData = context.getImageData(0, 0, VW, VH)
    data = imageData.data
    const ver_x = (xs.length - 17) / 4
    const ver_y = (ys.length - 17) / 4
    if (ver_x !== ver_y || !Number.isInteger(ver_x) || !Number.isInteger(ver_y)) {
        console.log('x軸による Version 推定値', ver_x)
        console.log('y軸による Version 推定値', ver_y)
        return
    }
    const VER = ver_x
    const LEN = xs.length
    const matrix = []
    for (const y of ys) {
        matrix.push([])
        for (const x of xs) {
            const bit = 1 - data_bin[Math.round(y + avg_y/2)][Math.round(x + avg_x/2)]
            matrix[matrix.length-1].push(bit)
            context.fillStyle = bit === 1 ? 'rgba(255, 255, 255, 1)' :  'rgba(0, 0, 0, 1)'
            context.beginPath()
            context.arc(Math.round(x + avg_x/2),
                        Math.round(y + avg_y/2), 2, 0, 2*Math.PI, true)
            context.fill()
        }
    }
    const format_array = []
    for (let i = 0; i < 7; i++) format_array.push(matrix[LEN-1-i][8])
    for (let i = 0; i < 8; i++) format_array.push(matrix[8][LEN-8+i])
    let format = 0
    for (const n of format_array) {
        format += n
        format <<= 1
    }
    format >>= 1
    format ^= 21522
    format >>= 10
    const MP = format % 8
    let ECL = format >> 3
    switch (ECL) {
        case 1: ECL = 'L'; break
        case 0: ECL = 'M'; break
        case 3: ECL = 'Q'; break
        case 2: ECL = 'H'; break
    }
    if (display_filter <= 7) return // ================================================== matrix 抽出

    const qr = new QR_Code_Decode_Map(VER, ECL, MP)
    context.fillStyle = 'rgba(255, 0, 0, .5)'
    for (let y = 0; y < LEN; y++)
    for (let x = 0; x < LEN; x++) {
        if (qr.matrix[y][x] === -1) continue
        if (qr.matrix[y][x] === 0) context.fillStyle = 'rgba(0, 0, 255, .5)'
        else context.fillStyle = 'rgba(0, 255, 0, .5)'
        context.beginPath()
        context.rect(xs[x], ys[y], avg_x, avg_y)
        context.fill()
    }
    if (display_filter <= 8) return // ================================================== 有効 module 抽出

    const data_ec_array = []
    for (let x = LEN-1; 0 <= x; x-= 2) {
        if (x / 2 % 2 === 1) {
            for (let y = 0; y < LEN; y++)
            for (let z = 0; z < 2; z++) {
                if (x === 6) {
                    x++
                    continue
                }
                const check = qr.matrix[y][x-z]
                if (check === -1) continue
                const bit = matrix[y][x-z]
                data_ec_array.push(bit ^ check)
            }
        } else {
            for (let y = LEN-1; 0 <= y; y--)
            for (let z = 0; z < 2; z++) {
                if (x === 6) {
                    x++
                    continue
                }
                const check = qr.matrix[y][x-z]
                if (check === -1) continue
                const bit = matrix[y][x-z]
                data_ec_array.push(bit ^ check)
            }
        }
    }

    let mode = 0
    for (let i = 0; i < 4; i++) {
        mode += data_ec_array.shift()
        mode <<= 1
    }
    mode >>= 1

    let data_len = 0
    for (let i = 0; i < 8; i++) {
        data_len += data_ec_array.shift()
        data_len <<= 1
    }
    data_len >>= 1

    console.log('%c==============================', 'color: red')
    console.log('mode', mode)
    console.log('VER', VER)
    console.log('ECL', ECL)
    console.log('LEN', LEN)
    console.log('MP', MP)
    console.log('DATA LEN', data_len)
    console.log('==========')

    for (let y = 0; y < LEN; y++)
    for (let x = 0; x < LEN; x++) {
        const bit = matrix[y][x] ^ qr.matrix[y][x]
        if (bit === 0) context.fillStyle = 'rgba(0, 255, 0, .5)'
        else if (bit === 1) context.fillStyle = 'rgba(255, 0, 0, .5)'
        else context.fillStyle = 'rgba(0, 0, 255, .5)'
        context.beginPath()
        context.rect(xs[x], ys[y], avg_x, avg_y)
        context.fill()
    }
    
    // ==================================================
    // =============== Under Construction ===============
    // ==================================================

    let str = ''
    for (let i = 0; i < data_len; i++) {
        tmp = 0
        for (let i = 0; i < 8; i++) {
            tmp += data_ec_array.shift()
            tmp <<= 1
        }
        tmp >>= 1
        str += Byte_Code[tmp]
        // console.log(tmp, Byte_Code[tmp])
    }
    console.log(str)
    // ==================================================
    // ==================================================
}
function paintBlock(ref1, ref2, to, x, y, num1, num2) {
    let sum = 1
    to[y][x] = num2
    if (0 < x                  && ref1[y][x-1] === num1 && ref2[y][x-1] === num1 && to[y][x-1] !== num2) sum += paintBlock(ref1, ref2, to, x-1, y, num1, num2)
    if (0 < y                  && ref1[y-1][x] === num1 && ref2[y-1][x] === num1 && to[y-1][x] !== num2) sum += paintBlock(ref1, ref2, to, x, y-1, num1, num2)
    if (x + 1 < ref1[y].length && ref1[y][x+1] === num1 && ref2[y][x+1] === num1 && to[y][x+1] !== num2) sum += paintBlock(ref1, ref2, to, x+1, y, num1, num2)
    if (y + 1 < ref1   .length && ref1[y+1][x] === num1 && ref2[y+1][x] === num1 && to[y+1][x] !== num2) sum += paintBlock(ref1, ref2, to, x, y+1, num1, num2)
    return sum
}

// ================================================== [50]
//     Window

window.onload = load
window.onresize = resize
function load() {
    document.body.append(canvas)
    resize()
    console.log('Ready')
}
function resize() {
    VW = parseInt(scale * canvas.clientWidth)
    VH = parseInt(scale * canvas.clientHeight)
    canvas.width  = VW
    canvas.height = VH
    const fit_w = VW / imageObject.width
    const fit_h = VH / imageObject.height
    const fit_scale = fit_w < fit_h ? fit_w : fit_h
    imageObject.width  *= fit_scale
    imageObject.height *= fit_scale
    paint()
}
function isMobile() {
    const regexp = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    return window.navigator.userAgent.search(regexp) !== -1
}
function fit() {
    const fit_w = VW / imageObject.width
    const fit_h = VH / imageObject.height
    const fit_scale = fit_w < fit_h ? fit_w : fit_h
    imageObject.width  *= fit_scale
    imageObject.height *= fit_scale
    resize()
}

// ================================================== [50]
//     END
// ================================================== [50]