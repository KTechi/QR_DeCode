// ================ Main ================ //

'use strict'

let version
let ec_level
let mask
let mode
const error_message = document.createElement('div')

window.addEventListener('load', function() {
    // ======== Canvas ======== //
    const canvas_container = document.getElementById('canvas-container')
    new ResizeObserver(function(mutations) {
        const w = canvas_container.clientWidth
        const h = canvas_container.clientHeight
        const size = Math.min(w, h) - 50
        canvas.style.width  = size + 'px'
        canvas.style.height = size + 'px'
    }).observe(canvas_container, { attributes: true })

    // ======== Property ======== //
    const property_container = document.getElementById('property-container')
    const new_display = function(label_text) {
        const container = document.createElement('div')
        const label     = document.createElement('div')
        const display   = document.createElement('div')
        property_container.append(container)
        container.append(label)
        container.append(display)
        container.classList = 'display-container'
        label.classList = 'label'
        label.innerText = label_text
        display.classList = 'display'
        display.innerText = '?'
        return display
    }
    version  = new_display('Version')
    ec_level = new_display('EC Level')
    mask     = new_display('Mask')
    mode     = new_display('Mode')

    property_container.append(error_message)
    error_message.classList = 'error-message'
})

function paint(image) {
    const Canvas_Size = Math.max(image.width, image.height)
    canvas.width  = Canvas_Size
    canvas.height = Canvas_Size
    context.drawImage(image, 0, 0, image.width, image.height)
    const imageData = context.getImageData(0, 0, Canvas_Size, Canvas_Size)
    const data = imageData.data
    const bin   = []
    const dataX = []
    const dataY = []
    const dataZ = []

    for (let y = 0; y < Canvas_Size; y++) {
        bin  .push([])
        dataX.push([])
        dataY.push([])
        dataZ.push([])
        for (let x = 0; x < Canvas_Size; x++) {
            const base = 4*(y*Canvas_Size + x)
            const sum = data[base] + data[base+1] + data[base+2]
            bin  [y].push(sum < 3*128 ? 0 : 1)
            dataX[y].push(0)
            dataY[y].push(0)
            dataZ[y].push(0)
        }
    }

    // Position Detection Symbol
    for (let y = 0; y < Canvas_Size; y++) {
        const line = [1]
        for (let x = 1; x < Canvas_Size; x++) {
            if (bin[y][x-1] === bin[y][x])
                line[line.length-1]++
            else
                line.push(1)
        }
        if (line.length < 5)
            continue
        let x = 0
        let dx = 0
        for (let i = 4; i < line.length; i++, x += dx) {
            const _1 = line[i-4]
            const _2 = line[i-3]
            const _3 = line[i-2]
            const _4 = line[i-1]
            const _5 = line[i-0]
            const avg = (_1 +_2 +_3 +_4 +_5) / 7
            const avg_L =  .9 * avg
            const avg_H = 1.1 * avg
            dx = _1
            if (_1 < avg_L || avg_H < _1) continue
            if (_2 < avg_L || avg_H < _2) continue
            if (_3 < 3*avg_L || 3*avg_H < _3) continue
            if (_4 < avg_L || avg_H < _4) continue
            if (_5 < avg_L || avg_H < _5) continue
            for (let x_ = x; x_ < x +_1 +_2 +_3 +_4 +_5; x_++)
                dataX[y][x_] = 1
        }
    }
    for (let x = 0; x < Canvas_Size; x++) {
        const line = [1]
        for (let y = 1; y < Canvas_Size; y++) {
            if (bin[y-1][x] === bin[y][x])
                line[line.length-1]++
            else
                line.push(1)
        }
        if (line.length < 5)
            continue
        let y = 0
        let dy = 0
        for (let i = 4; i < line.length; i++, y += dy) {
            const _1 = line[i-4]
            const _2 = line[i-3]
            const _3 = line[i-2]
            const _4 = line[i-1]
            const _5 = line[i-0]
            const avg = (_1 +_2 +_3 +_4 +_5) / 7
            const avg_L =  .9 * avg
            const avg_H = 1.1 * avg
            dy = _1
            if (_1 < avg_L || avg_H < _1) continue
            if (_2 < avg_L || avg_H < _2) continue
            if (_3 < 3*avg_L || 3*avg_H < _3) continue
            if (_4 < avg_L || avg_H < _4) continue
            if (_5 < avg_L || avg_H < _5) continue
            for (let y_ = y; y_ < y +_1 +_2 +_3 +_4 +_5; y_++)
                dataY[y_][x] = 1
        }
    }
    for (let y = 0; y < Canvas_Size; y++)
    for (let x = 0; x < Canvas_Size; x++)
        if (dataX[y][x] === 1 && dataY[y][x] === 1)
            dataZ[y][x] = 1

    const pds = func(dataZ)
    pds.sort((p1, p2) => p1.count < p2.count ? 1 : -1)
    if (pds.length < 3) return
    function swap(i, j) {
        let tmp = pds[i]
        pds[i] = pds[j]
        pds[j] = tmp
    }
    if (pds[0].x1 < pds[1].x1) swap(0, 1)
    if (pds[0].x1 < pds[2].x1) swap(0, 2)
    if (pds[1].y1 < pds[2].y1) swap(1, 2)
    let pds1 = pds[0]
    let pds2 = pds[1]
    let pds3 = pds[2]

    const x0 = pds3.x1 - Math.sqrt(pds3.count)/2
    const y0 = pds3.y1 - Math.sqrt(pds3.count)/2
    const x1 = pds3.x2 + Math.sqrt(pds3.count)/2
    const y1 = pds3.y2 + Math.sqrt(pds3.count)/2
    const x2 = pds1.x1 - Math.sqrt(pds1.count)/2
    const y2 = pds2.y1 - Math.sqrt(pds2.count)/2
    const sqrt = Math.sqrt
    const dxy = (sqrt(pds1.count)+sqrt(pds2.count)+sqrt(pds3.count))/9

    const x_coords = [parseInt(x0)]
    const y_coords = [parseInt(y0)]
    let x = x0
    let y = y0
    for (let i = 0; i < 6; i++) {
        x += dxy
        y += dxy
        x_coords.push(parseInt(x))
        y_coords.push(parseInt(y))
    }
    x = parseInt(x1)
    y = parseInt(y1)
    for (; x < x2+dxy/2; x++)
        if (bin[y][x] !== bin[y][x-1])
            x_coords.push(parseInt(x+dxy/2))
    x = parseInt(x1)
    y = parseInt(y1)
    for (; y < y2+dxy/2; y++) 
        if (bin[y][x] !== bin[y-1][x])
            y_coords.push(parseInt(y+dxy/2))
    x = x2
    y = y2
    for (let i = 0; i < 6; i++) {
        x += dxy
        y += dxy
        x_coords.push(parseInt(x))
        y_coords.push(parseInt(y))
    }

    const matrix = []
    for (let y = 0; y < y_coords.length; y++) {
        matrix.push([])
        for (let x = 0; x < x_coords.length; x++)
            matrix[y].push(1-bin[y_coords[y]][x_coords[x]])
    }

    const qr_decode = new QR_DeCode(matrix)

    const error = qr_decode.error_message
    if (error == undefined || error == '') {
        error_message.innerText = ''
        version .innerText = qr_decode.VER
        ec_level.innerText = qr_decode.ECL
        mask    .innerText = qr_decode.MP
        mode    .innerText = qr_decode.MODE
        document.getElementById('textbox').innerHTML = qr_decode.text
    } else
        error_message.innerText = qr_decode.error_message

    context.fillStyle = 'rgb(255, 0, 0)'
    for (let y = 0; y < y_coords.length; y++)
    for (let x = 0; x < x_coords.length; x++) {
        context.fillStyle = bin[y_coords[y]][x_coords[x]] == 1 ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)'
        context.beginPath()
        context.arc(x_coords[x], y_coords[y], .2*dxy, 0, 2*Math.PI, true)
        context.fill()
    }
}

function func(matrix) {
    const W = matrix[0].length
    const H = matrix   .length
    const stack_x = []
    const stack_y = []
    const stack_d = []
    const boxes = []
    let i = 2
    for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
        if (matrix[y][x] !== 1) continue
        let x_ = x
        let y_ = y
        let direction = 0
        stack_x.push(x)
        stack_y.push(y)
        stack_d.push(0)
        matrix[y_][x_] = i
        let box = {
            id: i, count: 1,
            x1: x, y1: y,
            x2: x, y2: y,
        }
        while (true) {
            if (100000 < stack_x.length) {
                console.log('over flow')
                return
            }
            if (4 <= direction) {
                if (stack_x.length === 0) break
                x_ = stack_x.pop()
                y_ = stack_y.pop()
                direction = stack_d.pop() + 1
                continue
            }
            let mem_x = x_
            let mem_y = y_
            if (direction === 0) y_--
            if (direction === 1) x_--
            if (direction === 2) y_++
            if (direction === 3) x_++
            if (x_ < 0 || W <= x_ || y_ < 0 || H <= y_ || matrix[y_][x_] !== 1) {
                x_ = mem_x
                y_ = mem_y
                direction++
                continue
            }
            direction = 0
            stack_x.push(x_)
            stack_y.push(y_)
            stack_d.push(direction)
            matrix[y_][x_] = i
            box.count++
            if (x_ < box.x1) box.x1 = x_
            if (y_ < box.y1) box.y1 = y_
            if (box.x2 < x_) box.x2 = x_
            if (box.y2 < y_) box.y2 = y_
        }
        boxes.push(box)
        i++
    }
    return boxes
}

// ================ Window Initialize ================ //

window.onload = load
function load() {}
function isMobile() {
    const regexp = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    return window.navigator.userAgent.search(regexp) !== -1
}
