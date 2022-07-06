// ================================================== [50]
//     Definition

'use strict'

class QR_Code_Decode_Map {
    constructor(VER, ECL, MP) {
        const LEN = 17 + 4*VER
        this.LEN = LEN
        this.VER = VER
        this.ECL = ECL
        this.MP  = MP
        this.matrix = []

        for (let y = 0; y < LEN; y++) {
            this.matrix.push([])
            for (let x = 0; x < LEN; x++) this.matrix[y].push(0)
        }
        function Function_Pattern(qr) {
            qr.Position_Detection()
            qr.Timing()
            qr.Alignment()
        }
        Function_Pattern(this)
        this.Format_Information()
        if (7 <= VER) this.Version_Information()

        this.Masking()

        Function_Pattern(this)
        this.Format_Information()
        if (7 <= VER) this.Version_Information()
    }

    square(x, y, dxy, fill) {
        for (let dy = 0; dy < dxy; dy++)
        for (let dx = 0; dx < dxy; dx++) this.matrix[y + dy][x + dx] = fill
    }

    Position_Detection() {
        const LEN = this.LEN
        this.square(    0, 0, 8, -1)
        this.square(LEN-8, 0, 8, -1)
        this.square(0, LEN-8, 8, -1)
    }

    Timing() {
        for (let i = 8; i < this.LEN-8; i++) this.matrix[6][i] = this.matrix[i][6] = -1
    }

    Alignment() {
        const LEN = this.LEN
        const VER = this.VER
        const spacingArray = [
            16,18,20,22,24,26,28,20,22,24,24,26,28,28,22,24,24,
            26,26,28,28,24,24,26,26,26,28,28,24,26,26,26,28,28
        ]
        function rings(qr, cx, cy) {
            qr.square(cx-2, cy-2, 5, 1)
            qr.square(cx-1, cy-1, 3, 0)
            qr.square(cx-0, cy-0, 1, 1)
        }
        let E = 0
        if (VER === 1) return // 1 + VER/7
        if ( 2 <= VER && VER <=  6) E = 1
        if ( 7 <= VER && VER <= 13) E = 2
        if (14 <= VER && VER <= 20) E = 3
        if (21 <= VER && VER <= 27) E = 4
        if (28 <= VER && VER <= 34) E = 5
        if (35 <= VER && VER <= 40) E = 6
        const spacing = spacingArray[VER - 7]
        for (let i = 0, cy = LEN - 7; i < E; i++, cy -= spacing)
        for (let j = 0, cx = LEN - 7; j < E; j++, cx -= spacing)
            this.square(cx-2, cy-2, 5, -1)
        for (let i = 1, c = LEN - 7 - spacing; i < E; i++, c -= spacing) {
            rings(this, 6, c)
            rings(this, c, 6)
            this.square(6, c, 5, -1)
            this.square(c, 6, 5, -1)
        }
    }

    Format_Information() {
        for (let i = 0; i < 8; i++) {
            this.matrix[8][i] =
            this.matrix[i][8] =
            this.matrix[8][this.LEN-1-i] =
            this.matrix[this.LEN-1-i][8] = -1
        }
        this.matrix[8][8] = -1
    }

    Version_Information() {
        const LEN = this.LEN
        for (let i = 0; i < 6; i++)
        for (let j = 0; j < 3; j++)
            this.matrix[i][LEN-11+j] = this.matrix[LEN-11+j][i] = -1
    }

    Masking() {
        for (let y = 0; y < this.LEN; y++)
        for (let x = 0; x < this.LEN; x++) {
            let c = true
            switch (this.MP) {
                case 0: c = (x+y) % 2 == 0; break
                case 1: c =   y   % 2 == 0; break
                case 2: c =   x   % 3 == 0; break
                case 3: c = (x+y) % 3 == 0; break
                case 4: c = (parseInt(x/3)+parseInt(y/2)) % 2 == 0; break
                case 5: c = (  x * y  % 3 +  x * y  % 2 )     == 0; break
                case 6: c = (  x * y  % 3 +  x * y  % 2 ) % 2 == 0; break
                case 7: c = (  x * y  % 3 + (x + y) % 2 ) % 2 == 0; break
            }
            if (c) this.matrix[y][x] ^= 1
        }
    }
}

// ================================================== [50]
//     END
// ================================================== [50]