// ================ Class Definition ================ //

'use strict'

class QR_DeCode {
    constructor(matrix) {
        this.error_message = ''
        this.matrix = matrix
        this.LEN = matrix.length
        this.VER = parseInt((this.LEN - 17) / 4)
        console.log('VER:', this.VER, ' len ->', 4*this.VER + 17)
        console.log('LEN:', this.LEN)
        
        function Function_Pattern(qr) {
            qr.Position_Detection()
            qr.Timing()
            qr.Alignment()
        }
        Function_Pattern(this)

        const format = this.Format_Information()
        console.log('Format Information:', format)
        this.ECL = format[0]
        this.MP  = format[1]

        if (7 <= this.VER) {
            const version = this.Version_Information()
            console.log('Version by Matrix info:', version)
            console.log('Version by Matrix size:', this.VER)
        }

        this.Masking()
        this.Data_and_ErrorCorrection()
    }

    square(x, y, dxy) {
        for (let dy = 0; dy < dxy; dy++)
        for (let dx = 0; dx < dxy; dx++)
            this.matrix[y + dy][x + dx] = -1
    }

    Position_Detection() {
        const LEN = this.LEN
        this.square(    0, 0, 8)
        this.square(LEN-8, 0, 8)
        this.square(0, LEN-8, 8)
    }

    Timing() {
        for (let i = 8; i < this.LEN-8; i++)
            this.matrix[6][i] =
            this.matrix[i][6] = -1
    }

    Alignment() {
        const LEN = this.LEN
        const VER = this.VER
        const spacingArray = [
            16,18,20,22,24,26,28,20,22,24,24,26,28,28,22,24,24,
            26,26,28,28,24,24,26,26,26,28,28,24,26,26,26,28,28
        ]
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
            this.square(cx-2, cy-2, 5)
        for (let i = 1, c = LEN - 7 - spacing; i < E; i++, c -= spacing) {
            this.square(4, c-2, 5)
            this.square(c-2, 4, 5)
        }
    }

    Format_Information() {
        const LEN = this.LEN
        let format1 = 0
        let format2 = 0
        let nextBit = (num, y, x) => {
            const bit = this.matrix[y][x]
            this.matrix[y][x] = -1
            return (num << 1) + bit
        }

        for (let i = 0; i < 6; i++) {
            format1 = nextBit(format1, 8, i)
            format2 = nextBit(format2, LEN-1-i, 8)
        }
        format1 = nextBit(format1, 8, 7)
        format1 = nextBit(format1, 8, 8)
        format1 = nextBit(format1, 7, 8)
        this.matrix[LEN-8][8] = -1
        format2 = nextBit(format2, LEN-7, 8)
        format2 = nextBit(format2, 8, LEN-8)
        format2 = nextBit(format2, 8, LEN-7)
        for (let i = 5; 0 <= i; i--) {
            format1 = nextBit(format1, i, 8)
            format2 = nextBit(format2, 8, LEN-1-i)
        }
        format1 ^= 21522
        format2 ^= 21522
        let ret1 = format1 >> 10
        let ret2 = format2 >> 10
        console.log('Format')
        console.log('  ', ret1 >> 3, ret1 % 8)
        console.log('  ', ret2 >> 3, ret2 % 8)
        return [
            {1: 'L', 0: 'M', 3: 'Q', 2: 'H'}[ret1 >> 3], 
            ret1 % 8,
        ]
    }

    Version_Information() {
        const LEN = this.LEN
        let version1 = 0
        let version2 = 0
        let nextBit = (num, y, x) => {
            const bit = this.matrix[y][x]
            this.matrix[y][x] = -1
            return (num << 1) + bit
        }

        for (let i = 5; 0 <= i; i--)
        for (let j = 2; 0 <= j; j--) {
            version1 = nextBit(version1, i, LEN-11+j)
            version2 = nextBit(version2, LEN-11+j, i)
        }
        console.log('Version')
        console.log('  ', version1 >> 12)
        console.log('  ', version2 >> 12)
        return version1 >> 12
    }

    Masking() {
        for (let y = 0; y < this.LEN; y++)
        for (let x = 0; x < this.LEN; x++) {
            if (this.matrix[y][x] === -1) continue
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

    Data_and_ErrorCorrection() {
        function bit_shift(n) {
            let num = 0
            for (let i = 0; i < n; i++)
                num = (num << 1) + bits.shift()
            return num
        }
        const data_ec_words = [0]
        let flag = 0
        let b_i = 0 // bit index
        let y0 = this.LEN - 1
        let dy = -1
        for (let X = this.LEN - 1; 0 <= X; X -= 2) {
            y0 = flag === 0 ? this.LEN - 1 : 0
            dy = flag === 0 ? -1 : +1
            for (let Y = y0; 0 <= Y && Y < this.LEN; Y += dy)
            for (let x = 0; x < 2; x++) {
                if (this.matrix[Y][X-x] === -1)
                    continue
                const L = data_ec_words.length
                data_ec_words[L-1] <<= 1
                data_ec_words[L-1] += this.matrix[Y][X-x]
                b_i++
                if (8 <= b_i) {
                    data_ec_words.push(0)
                    b_i = 0
                }
            }
            if (X === 8) X = 7
            flag = 1 - flag
        }

        const Block_Info = Block_List[this.VER][this.ECL]
        const data_blocks = []
        const ec_blocks   = []
        for (const block of Block_Info)
        for (let i = 0; i < block.block_num; i++) {
            data_blocks.push([block.data_codewords_num])
            ec_blocks  .push([block.  ec_codewords_num])
        }
        let LEN = data_blocks.length

        // Data Blocks
        while (data_blocks[LEN-1].length <= data_blocks[LEN-1][0])
            for (let i = 0; i < LEN; i++)
                if (data_blocks[i].length <= data_blocks[i][0])
                    data_blocks[i].push(data_ec_words.shift())
        for (const block of data_blocks)
            block.shift()

        // EC Blocks
        while (ec_blocks[LEN-1].length <= ec_blocks[LEN-1][0])
            for (let i = 0; i < LEN; i++)
                if (ec_blocks[i].length <= ec_blocks[i][0])
                    ec_blocks[i].push(data_ec_words.shift())
        for (const block of ec_blocks)
            block.shift()

        // Blocks -> bits
        const bits = []
        for (const block of data_blocks)
        for (const Byte of block)
            for (let i = 0; i < 8; i++)
                bits.push((Byte >> 7-i) % 2)

        // MODE
        this.MODE = bit_shift(4)

        if (this.MODE === 1) {// Number Mode
            // 01234567 -> 012 345 67
            let css = 0
            if      (this.VER <=  9) css = 10
            else if (this.VER <= 26) css = 12
            else if (this.VER <= 40) css = 14
            let strLEN = bit_shift(css)

            // bits -> Data Array
            this.text = ''
            for (let i = 0; i < parseInt(strLEN/3); i++)
                this.text += bit_shift(10).toString().padStart(3, '0')

            if (strLEN % 3 == 1) this.text += bit_shift(4)
            if (strLEN % 3 == 2) this.text += bit_shift(7).toString().padStart(2, '0')
        } else if (this.MODE === 2) {// Character and Number Mode
            // AC-42 -> AC -4 2
            let css = 0
            if      (this.VER <=  9) css =  9
            else if (this.VER <= 26) css = 11
            else if (this.VER <= 40) css = 13
            let strLEN = bit_shift(css)

            // bits -> Data Array
            this.text = ''
            for (let i = 0; i < parseInt(strLEN/2); i++) {
                let num = bit_shift(11)
                this.text += Character_Code[parseInt(num/45)] + Character_Code[num%45]
            }
            if (strLEN % 2 === 1)
                this.text += Character_Code[bit_shift(6)]
        } else if (this.MODE === 3) {// Connect Mode
            this.error_message = 'Connect Mode is NOT implemented yet.'
        } else if (this.MODE === 4) {// Byte Mode
            // Hello! -> H e l l o !
            let css = 0
            if      (this.VER <=  9) css =  8
            else if (this.VER <= 40) css = 16
            let strLEN = bit_shift(css)

            // bits -> Data Array
            this.text = ''
            for (let i = 0; i < strLEN; i++)
                this.text += Byte_Code[bit_shift(8)]
        } else if (this.MODE === 7) {// ECI Mode
            this.error_message = 'ECI Mode is NOT implemented yet.'
        } else if (this.MODE === 8) {// Kanji Mode
            this.error_message = 'Kanji Mode is NOT implemented yet.'
        } else {
            this.error_message = 'This Mode is NOT implemented.'
        }
    }
}