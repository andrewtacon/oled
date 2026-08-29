/**
 * XinaBox OD01 extension for makecode
 * Base on OLED Package from microbit/micropython Chinese community.
 *   https://github.com/makecode-extensions/OLED
 */

// 6x8 font
const Font_5x7 = hex`000000000000005F00000007000700147F147F14242A072A12231308646237495522500005030000001C2241000041221C00082A1C2A0808083E080800503000000808080808006060000020100804023E5149453E00427F400042615149462141454B311814127F1027454545393C4A49493001710905033649494936064949291E003636000000563600000008142241141414141441221408000201510906324979413E7E1111117E7F494949363E414141227F4141221C7F494949417F090901013E414151327F0808087F00417F41002040413F017F081422417F404040407F0204027F7F0408107F3E4141413E7F090909063E4151215E7F09192946464949493101017F01013F4040403F1F2040201F7F2018207F63140814630304780403615149454300007F4141020408102041417F000004020102044040404040000102040020545454787F484444383844444420384444487F3854545418087E090102081454543C7F0804047800447D40002040443D00007F10284400417F40007C041804787C0804047838444444387C14141408081414187C7C080404084854545420043F4440203C4040207C1C2040201C3C4030403C44281028440C5050503C4464544C44000836410000007F000000413608000201020402`

//% weight=50 color=#0855AA icon="O" block="OLED"
namespace OLED {
    export enum DISPLAY_ONOFF {
        //% block="ON"
        DISPLAY_ON = 1,
        //% block="OFF"
        DISPLAY_OFF = 0
    }

    const MIN_X = 0
    const MIN_Y = 0
    let MAX_X = 127
    let MAX_Y = 63

    const WEST = 1
    const NORTH = 2
    const EAST = 3
    const SOUTH = 4

    let _I2CAddr = 60
    let _screen = pins.createBuffer(1024)
    let _buf2 = pins.createBuffer(2)
    let _buf3 = pins.createBuffer(3)
    let _buf4 = pins.createBuffer(4)
    let _buf7 = pins.createBuffer(7)
    _buf7[0] = 0x40
    let _DRAW = 1
    let _cx = 0
    let _cy = 0
    let orientation = WEST

    function cmd1(d: number) {
        let n = d % 256;
        pins.i2cWriteNumber(_I2CAddr, n, NumberFormat.UInt16BE);
    }

    function cmd2(d1: number, d2: number) {
        _buf3[0] = 0;
        _buf3[1] = d1;
        _buf3[2] = d2;
        pins.i2cWriteBuffer(_I2CAddr, _buf3);
    }

    function cmd3(d1: number, d2: number, d3: number) {
        _buf4[0] = 0;
        _buf4[1] = d1;
        _buf4[2] = d2;
        _buf4[3] = d3;
        pins.i2cWriteBuffer(_I2CAddr, _buf4);
    }

    function set_pos(col: number = 0, page: number = 0) {
        cmd1(0xb0 | page) // page number
        cmd1(0x00 | (col % 16)) // lower start column address
        cmd1(0x10 | (col >> 4)) // upper start column address    
    }

    // clear bit
    function clrbit(d: number, b: number): number {
        if (d & (1 << b))
            d -= (1 << b)
        return d
    }

    /**
     * draw / refresh screen
     */
    function draw(d: number) {
        if (d > 0) {
            if (orientation === WEST || orientation === EAST) {
                //need to switch to horizontal to match buffer setup)
                cmd2(0x20, 0x00) // SSD1306_MEMORYMODE
                // cmd1(0xc8)       // SSD1306_COMSCANDEC
            }

            set_pos()
            pins.i2cWriteBuffer(_I2CAddr, _screen)

            if (orientation === WEST || orientation === EAST) {
                //need to switch to horizontal to match buffer setup)
                cmd2(0x20, 0x01) // SSD1306_MEMORYMODE
                // cmd1(0xc0)       // SSD1306_COMSCANDEC
            }

        }
    }

    /**
     * set pixel in OLED
     */
    //% blockId="OLED_PIXEL" block="set pixel at x %x|y %y|color %color"
    //% x.max=128 x.min=0 x.defl=0
    //% y.max=64 y.min=0 y.defl=0
    //% color.max=1 color.min=0 color.defl=1
    //% weight=65 blockGap=8
    export function pixel(x: number, y: number, color: number = 1) {
        //prevent out of bounds writing
        if (x > MAX_X) { return }
        if (y > MAX_Y) { return }
        if (x < 0) { return }
        if (y < 0) { return }

        let page = y >> 3
        let shift_page = y % 8
        let ind = x + (page * 128) + 1

        let b = (color) ? (_screen[ind] | (1 << shift_page)) : clrbit(_screen[ind], shift_page)
        _screen[ind] = b

        if (_DRAW) {
            set_pos(x, page)
            _buf2[0] = 0x40
            _buf2[1] = b
            pins.i2cWriteBuffer(_I2CAddr, _buf2)
        }
    }



    function char(c: string, col: number, row: number, color: number = 1) {
        let p = (Math.min(127, Math.max(c.charCodeAt(0), 32)) - 32) * 5

        // Loop through the 5 columns of the 5x7 font
        for (let i = 0; i < 5; i++) {
            let fontByte = Font_5x7[p + i]

            // Loop through the 8 vertical bits (rows) of the current font column
            for (let bit = 0; bit < 8; bit++) {
                // Determine if this specific pixel is on (1) or off (0)
                let pixelOn = (fontByte & (1 << bit)) ? 1 : 0

                // If color = 0 (inverted text), invert the pixel logic
                let drawColor = (color > 0) ? pixelOn : (pixelOn ^ 1)

                // Draw the pixel using the adaptive pixel helper
                // pixel(col + i, (row * 8) + bit, drawColor)
                if (orientation === WEST || orientation === EAST) {
                    pixel((row) + bit, (col + i), drawColor)
                } else {
                    pixel((col) + i, (row + bit), drawColor)
                }
            }

        }

    }



    /**
     * show text in OLED
     */
    //% blockId="OLED_SHOWSTRING" block="show string %s|at x %col|y %row|color %color"
    //% s.defl=''
    //% col.max=127 col.min=0 col.defl=0
    //% row.max=127 row.min=0 row.defl=0
    //% color.max=1 color.min=0 color.defl=1
    //% weight=80 blockGap=8 inlineInputMode=inline
    export function String(s: string, x: number, y: number, color: number = 1) {
        let oldDraw = _DRAW
        _DRAW = 0

        for (let n = 0; n < s.length; n++) {
            char(s.charAt(n), x, y, color)
            x += 6
            if (x > (MAX_X - 6)) break
        }

        _DRAW = oldDraw
        draw(_DRAW)

    }

    /**
     * show a number in OLED
     */
    //% blockId="OLED_NUMBER" block="show Number %num|at x %col|y %row|color %color"
    //% num.defl=0
    //% col.max=127 col.min=0 col.defl=0
    //% row.max=127 row.min=0 row.defl=0
    //% color.max=1 color.min=0 color.defl=1
    //% weight=80 blockGap=8 inlineInputMode=inline
    export function Number(num: number, x: number, y: number, color: number = 1) {
        String(num.toString(), x, y, color)
    }

    function scroll() {
        _cx = 0
        _cy++
        if (_cy > 7) {
            _cy = 7
            _screen.shift(128)
            _screen[0] = 0x40
            draw(1)
        }
    }

    /**
     * draw a horizontal line
     */
    //% blockId="OLED_HLINE" block="draw a horizontal line at x %x|y %y|length %len|color %color"
    //% x.max=127 x.min=0 x.defl=0
    //% y.max=63 y.min=0 y.defl=0
    //% len.max=128 len.min=1 len.defl=16
    //% color.max=1 color.min=0 color.defl=1
    //% weight=71 blockGap=8 inlineInputMode=inline
    export function hline(x: number, y: number, len: number, color: number = 1, skipCheck: boolean = false) {
        if ((orientation === WEST || orientation === EAST) && !skipCheck) {
            vline(y, x, len, color, true)
            return
        }
        let _sav = _DRAW
        if ((y < MIN_Y) || (y > MAX_Y)) return
        _DRAW = 0
        for (let i = x; i < (x + len); i++)
            if ((i >= MIN_X) && (i <= MAX_X))
                pixel(i, y, color)
        _DRAW = _sav
        draw(_DRAW)
    }

    /**
     * draw a vertical line
     */
    //% blockId="OLED_VLINE" block="draw a vertical line at x %x|y %y|length %len|color %color"
    //% x.max=127 x.min=0 x.defl=0
    //% y.max=63 y.min=0 y.defl=0
    //% len.max=128 len.min=1 len.defl=16
    //% color.max=1 color.min=0 color.defl=1
    //% weight=71 blockGap=8 inlineInputMode=inline
    export function vline(x: number, y: number, len: number, color: number = 1, skipCheck: boolean = false) {
        if ((orientation === WEST || orientation=== EAST)&& !skipCheck) {
            hline(y, x, len, color, true)
            return
        }

        let _sav = _DRAW
        _DRAW = 0
        if ((x < MIN_X) || (x > MAX_X)) return
        for (let i = y; i < (y + len); i++)
            if ((i >= MIN_Y) && (i <= MAX_Y))
                pixel(x, i, color)
        _DRAW = _sav
        draw(_DRAW)
    }

    /**
     * draw a rectangle
     */
    //% blockId="OLED_RECT" block="draw a rectangle at x1 %x1|y1 %y1|x2 %x2|y2 %y2|color %color"
    //% color.defl=1
    //% weight=70 blockGap=8 inlineInputMode=inline
    export function rect(x1: number, y1: number, x2: number, y2: number, color: number = 1) {
        if (x1 > x2)
            x1 = [x2, x2 = x1][0];
        if (y1 > y2)
            y1 = [y2, y2 = y1][0];
        _DRAW = 0
        hline(x1, y1, x2 - x1 + 1, color)
        hline(x1, y2, x2 - x1 + 1, color)
        vline(x1, y1, y2 - y1 + 1, color)
        vline(x2, y1, y2 - y1 + 1, color)
        _DRAW = 1
        draw(1)
    }

    /**
     * invert display
     * @param d true: invert / false: normal, eg: true
     */
    //% blockId="OLED_INVERT" block="Invert display %d"
    //% weight=62 blockGap=8
    export function invert(d: boolean = true) {
        let n = (d) ? 0xA7 : 0xA6
        cmd1(n)
    }

    /**
     * fill screen
     */
    //% blockId="OLED_FILL" block="Fill screen"
    //% weight=30 blockGap=8
    export function fill(value: number) {
        if (value < 0) { value = 0 }
        else if (value > 255) { value = 255 }
        _cx = _cy = 0
        _screen.fill(value)
        _screen[0] = 0x40
        draw(1)
    }

    /**
     * turn on/off screen
     */
    //% blockId="OLED_ON" block="Display %on"
    //% on.defl=1
    //% weight=62 blockGap=8
    export function display(on: DISPLAY_ONOFF = DISPLAY_ONOFF.DISPLAY_ON) {
        let d = (on == DISPLAY_ONOFF.DISPLAY_ON) ? 0xAF : 0xAE;
        cmd1(d)
    }

    /**
     * OLED initialize
     */
    //% blockId="OLED_init" block="Initial OLED"
    //% weight=10 blockGap=8
    export function init() {

        OLED.setI2CSpeed()

        cmd1(0xAE)       // SSD1306_DISPLAYOFF
        cmd1(0xA4)       // SSD1306_DISPLAYALLON_RESUME
        cmd2(0xD5, 0xF0) // SSD1306_SETDISPLAYCLOCKDIV
        cmd2(0xA8, 0x3F) // SSD1306_SETMULTIPLEX
        cmd2(0xD3, 0x00) // SSD1306_SETDISPLAYOFFSET
        cmd1(0 | 0x0)    // line #SSD1306_SETSTARTLINE
        cmd2(0x8D, 0x14) // SSD1306_CHARGEPUMP
        cmd2(0x20, 0x00) // SSD1306_MEMORYMODE
        cmd3(0x21, 0, 127) // SSD1306_COLUMNADDR
        cmd3(0x22, 0, 63)  // SSD1306_PAGEADDR
        cmd1(0xa0 | 0x1) // SSD1306_SEGREMAP
        cmd1(0xc8)       // SSD1306_COMSCANDEC
        cmd2(0xDA, 0x12) // SSD1306_SETCOMPINS
        cmd2(0x81, 0xCF) // SSD1306_SETCONTRAST
        cmd2(0xd9, 0xF1) // SSD1306_SETPRECHARGE
        cmd2(0xDB, 0x40) // SSD1306_SETVCOMDETECT
        cmd1(0xA6)       // SSD1306_NORMALDISPLAY
        cmd2(0xD6, 0)    // zoom off

        cmd1(0xAF)       // SSD1306_DISPLAYON
        orientNorth()
    }

    /**
     * Change orientation to west
     */
    //% blockId="OLED_west" block="OLED West Orientation"
    //% weight=10 blockGap=8
    export function orientWest() {
        orientation = WEST
        cmd2(0x20, 0x01) // SSD1306_MEMORYMODE
        cmd1(0xc0)       // SSD1306_COMSCANDEC
        cmd1(0xA1)
        MAX_Y = 63
        MAX_X = 127

        fill(0)
    }

    /**
     * Change orientation to north
     */
    //% blockId="OLED_north" block="OLED North Orientation"
    //% weight=10 blockGap=8
    export function orientNorth() {
        orientation = NORTH
        cmd2(0x20, 0x00) // SSD1306_MEMORYMODE
        cmd1(0xc8)       // SSD1306_COMSCANDEC
        cmd1(0xA1)

        MAX_X = 127
        MAX_Y = 63

        fill(0)
    }


    /**
     * Change orientation to south
     */
    //% blockId="OLED_south" block="OLED South Orientation"
    //% weight=10 blockGap=8
    export function orientSouth() {
        orientation = SOUTH
        cmd2(0x20, 0x00) // SSD1306_MEMORYMODE
        cmd1(0xc0)       // SSD1306_COMSCANDEC
        cmd1(0xA0)
        MAX_X = 127
        MAX_Y = 63

        fill(0)
    }


    /**
     * Change orientation to EAST
     */
    //% blockId="OLED_east" block="OLED East Orientation"
    //% weight=10 blockGap=8
    export function orientEast() {
        orientation = EAST
        cmd2(0x20, 0x01) // SSD1306_MEMORYMODE
        cmd1(0xc8)       // SSD1306_COMSCANDEC
        cmd1(0xA0)
        MAX_X = 127
        MAX_Y = 63
        fill(0)
    }


    init();
}  












    // // let flippedVertical = true
    // /**
    //  * Flip screen vertically
    //  */
    // //% blockId="OLED_flip_vertical" block="OLED Flip Vertical Direction"
    // //% weight=10 blockGap=8
    // export function flipVertical(change: boolean) {
    //     change ? cmd1(0xC8) : cmd1(0xC0)
    //     // flippedVertical = !flippedVertical
    //     draw(1)
    // }

    // // let flippedHorizontal = true
    // /**
    //  * Flip screen horizontally
    //  */
    // //% blockId="OLED_flip_horizontal" block="OLED Flip Horizonatal Direction"
    // //% weight=10 blockGap=8
    // export function flipHorizontal(change: boolean) {
    //     change ? cmd1(0xA0) : cmd1(0xA1)
    //     // flippedHorizontal = !flippedHorizontal
    //     draw(1)
    // }
