/**
 * SSD1306 Extension for Microbit v2
 * Includes Unified Controller Namespace
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
    let _screen = pins.createBuffer(1025)
    let _buf2 = pins.createBuffer(2)
    let _buf3 = pins.createBuffer(3)
    let _buf4 = pins.createBuffer(4)
    let _buf7 = pins.createBuffer(7)
    _buf7[0] = 0x40
    let _DRAW = 1
    let _cx = 0
    let _cy = 0

    let orientation = NORTH
    let color = 1

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
     * Plot a pixel
     */
    //% blockId="OLED_PIXEL" block="Plot pixel at x %x|y %y|color %color"
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
     * Print text
     */
    //% blockId="OLED_SHOWSTRING" block="Print text %s|at x %x|y %y|color %color"
    //% s.defl=''
    //% x.max=127 x.min=0 x.defl=0
    //% y.max=127 y.min=0 y.defl=0
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
     * Print a number
     */
    //% blockId="OLED_NUMBER" block="Print number %num|at x %x|y %y|color %color"
    //% num.defl=0   
    //% x.max=127 x.min=0 x.defl=0
    //% y.max=127 y.min=0 y.defl=0
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
     * Draw a straight line
     */
    //% blockId="OLED_LINE" block="Draw a line between x1 %x|y1 %y| and x2 %x2|y2 %y2|color %color"
    //% x1.max=127 x1.min=0 x1.defl=0
    //% y1.max=127 y1.min=0 y1.defl=0
    //% x2.max=127 x2.min=0 x2.defl=0
    //% y2.max=127 y2.min=0 y2.defl=0
    //% color.max=1 color.min=0 color.defl=1
    //% weight=71 blockGap=8 inlineInputMode=inline
    export function line(x1: number, y1: number, x2: number, y2: number, color: number = 1) {
        let _sav = _DRAW
        if ((y1 < MIN_Y) || (y1 > MAX_Y)) return
        if ((y2 < MIN_Y) || (y2 > MAX_Y)) return
        if ((x1 < MIN_X) || (x1 > MAX_X)) return
        if ((x2 < MIN_X) || (x2 > MAX_X)) return

        _DRAW = 0

        // Calculate total distances
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(x2 - x1) === 0 ? Math.abs(y2 - y1) : Math.abs(y2 - y1); // Guarding 0 distance

        // Determine the step direction for X and Y axes
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;

        // Initial error term
        let err = dx - dy;

        while (true) {
            // Store current pixel coordinate
            pixel(x1, y1, color);

            // Break loop when destination point is reached
            if (x1 === x2 && y1 === y2) break;

            const e2 = 2 * err;

            // Adjust X coordinate and error
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }

            // Adjust Y coordinate and error
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }
        }

        _DRAW = _sav
        draw(_DRAW)
    }



    /**
     * Draw a rectangle
     */
    //% blockId="OLED_RECT" block="Draw a rectangle between x1 %x1|y1 %y1| to x2 %x2|y2 %y2|color %color"
    //% x1.max=127 x1.min=0 x1.defl=0
    //% y1.max=127 y1.min=0 y1.defl=0
    //% x2.max=127 x2.min=0 x2.defl=0
    //% y2.max=127 y2.min=0 y2.defl=0
    //% color.max=1 color.min=0 color.defl=1
    //% weight=70 blockGap=8 inlineInputMode=inline
    export function rect(x1: number, y1: number, x2: number, y2: number, color: number = 1) {
        if (x1 > x2)
            x1 = [x2, x2 = x1][0];
        if (y1 > y2)
            y1 = [y2, y2 = y1][0];
        _DRAW = 0
        line(x1, y1, x1, y2, color)
        line(x1, y1, x2, y1, color)
        line(x2, y2, x1, y2, color)
        line(x2, y2, x2, y1, color)
        _DRAW = 1
        draw(1)
    }


    /**
     * Draw a circle
     */
    //% blockId="OLED_CIRCLE" block="Draw a circle at x %xc|y %yc| with radius %r| q1 %t1|q2 %q2|q3 %q3|q4 %q4| color %color"
    //% xc.max=127 xc.min=0 xc.defl=0
    //% yc.max=127 yc.min=0 yc.defl=0
    //% color.max=1 color.min=0 color.defl=1
    //% q1.defl=true
    //% q2.defl=true
    //% q3.defl=true
    //% q4.defl=true
    //% weight=70 blockGap=8 inlineInputMode=inline
    export function circle(xc: number, yc: number, r: number, q1: boolean = true, q2: boolean = true, q3: boolean = true, q4: boolean = true, color: number = 1) {
        let x = 0;
        let y = r;
        let d = 3 - 2 * r;

        // Helper function to plot all 8 symmetric points
        function plotSymmetricPoints(xc: number, yc: number, x: number, y: number) {
            if (q1) {
                pixel(xc + x, yc + y, color);
                pixel(xc + y, yc + x, color);
            }
            if (q2) {
                pixel(xc - x, yc + y, color);
                pixel(xc - y, yc + x, color);
            }

            if (q3) {
                pixel(xc - x, yc - y, color);
                pixel(xc - y, yc - x, color);
            }

            if (q4) {
                pixel(xc + x, yc - y, color);
                pixel(xc + y, yc - x, color);
            }
        }

        _DRAW = 0
        // Plot initial point at the top of the circle
        plotSymmetricPoints(xc, yc, x, y);

        // Loop through the first octant
        while (x <= y) {
            x++;

            if (d < 0) {
                d = d + 4 * x + 6;
            } else {
                y--;
                d = d + 4 * (x - y) + 10;
            }

            plotSymmetricPoints(xc, yc, x, y);
        }

        _DRAW = 1
        draw(1)
    }


    /**
     * Draw an image
     */
    //% blockId="OLED_IMAGE" block="Draw image %image| at x %x|y %y|scale %scale|color %color"
    //% x.max=127 x.min=0 x1.defl=0
    //% y.max=127 y.min=0 y1.defl=0
    //% scale.min=1 scale.defl=1
    //% color.max=1 color.min=0 color.defl=1
    //% weight=70 blockGap=8 inlineInputMode=inline
    export function image(image: string, x: number, y: number, scale: number = 1, color: number = 1) {

        let rotate = false
        if (orientation === WEST || orientation === EAST) {
            rotate = true
        }

        let start = x
        image = image.trim()
        let inverse = color === 1 ? 0 : 1

        _DRAW = 0
        for (let i = 0; i < image.length; i++) {
            switch (image[i]) {
                case "\n":
                    x = start
                    y += scale
                    break;
                case ".":
                    for (let k = 0; k < scale; k++) {
                        for (let l = 0; l < scale; l++) {
                            if (rotate) {
                                pixel(y + k, x + l, inverse)
                            } else {
                                pixel(x + k, y + l, inverse)
                            }
                        }
                    }
                    x += scale
                    break
                case "#":
                    for (let k = 0; k < scale; k++) {
                        for (let l = 0; l < scale; l++) {
                            if (rotate) {
                                pixel(y + k, x + l, color)
                            } else {
                                pixel(x + k, y + l, color)
                            }
                        }
                    }
                    x += scale
                    break
            }
        }
        _DRAW = 1
        draw(1)


    }



    /**
     * Invert display
     * @param d true: invert / false: normal, eg: true
     */
    //% blockId="OLED_INVERT" block="Invert display %d"
    //% weight=62 blockGap=8
    export function invert(d: boolean = true) {
        let n = (d) ? 0xA7 : 0xA6
        cmd1(n)
    }




    /**
     * Fill screen
     */
    //% blockId="OLED_FILL" block="Fill screen with color %color"
    //% color.max=1 color.min=0 color.defl=1
    //% weight=30 blockGap=8
    export function fill(color: number) {
        if (color < 0) { color = 0 }
        else if (color > 255) { color = 255 }
        _cx = _cy = 0
        _screen.fill(color)
        _screen[0] = 0x40
        draw(1)
    }

    /**
     * Turn on/off screen
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
    //% blockId="OLED_INIT" block="Initial OLED"
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
     * Set display orientation (0,1,2,3)
     */
    //% blockId="OLED_ORIENT" block="Orient display %d"
    //% d.defl = 0
    //% weight=62 blockGap=8
    export function orientDisplay(direction: number) {
        direction = Math.round(direction % 4)
        switch (direction) {
            case 0: orientNorth(); break;
            case 1: orientEast(); break;
            case 2: orientSouth(); break;
            case 3: orientWest(); break;
        }
    }


    function orientWest() {
        orientation = WEST
        cmd2(0x20, 0x01) // SSD1306_MEMORYMODE
        cmd1(0xc0)       // SSD1306_COMSCANDEC
        cmd1(0xA1)
        MAX_Y = 63
        MAX_X = 127

        fill(0)
    }

    function orientNorth() {
        orientation = NORTH
        cmd2(0x20, 0x00) // SSD1306_MEMORYMODE
        cmd1(0xc8)       // SSD1306_COMSCANDEC
        cmd1(0xA1)

        MAX_X = 127
        MAX_Y = 63

        fill(0)
    }

    function orientSouth() {
        orientation = SOUTH
        cmd2(0x20, 0x00) // SSD1306_MEMORYMODE
        cmd1(0xc0)       // SSD1306_COMSCANDEC
        cmd1(0xA0)
        MAX_X = 127
        MAX_Y = 63

        fill(0)
    }

    function orientEast() {
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




// /**
//  * draw a horizontal line
//  */
// //% blockId="OLED_HLINE" block="draw a horizontal line at x %x|y %y|length %len|color %color"
// //% x.max=127 x.min=0 x.defl=0
// //% y.max=63 y.min=0 y.defl=0
// //% len.max=128 len.min=1 len.defl=16
// //% color.max=1 color.min=0 color.defl=1
// //% weight=71 blockGap=8 inlineInputMode=inline
// export function hline(x: number, y: number, len: number, color: number = 1, skipCheck: boolean = false) {
//     if ((orientation === WEST || orientation === EAST) && !skipCheck) {
//         vline(y, x, len, color, true)
//         return
//     }
//     let _sav = _DRAW
//     if ((y < MIN_Y) || (y > MAX_Y)) return
//     _DRAW = 0
//     for (let i = x; i < (x + len); i++)
//         if ((i >= MIN_X) && (i <= MAX_X))
//             pixel(i, y, color)
//     _DRAW = _sav
//     draw(_DRAW)
// }

// /**
//  * draw a vertical line
//  */
// //% blockId="OLED_VLINE" block="draw a vertical line at x %x|y %y|length %len|color %color"
// //% x.max=127 x.min=0 x.defl=0
// //% y.max=63 y.min=0 y.defl=0
// //% len.max=128 len.min=1 len.defl=16
// //% color.max=1 color.min=0 color.defl=1
// //% weight=71 blockGap=8 inlineInputMode=inline
// export function vline(x: number, y: number, len: number, color: number = 1, skipCheck: boolean = false) {
//     if ((orientation === WEST || orientation === EAST) && !skipCheck) {
//         hline(y, x, len, color, true)
//         return
//     }

//     let _sav = _DRAW
//     _DRAW = 0
//     if ((x < MIN_X) || (x > MAX_X)) return
//     for (let i = y; i < (y + len); i++)
//         if ((i >= MIN_Y) && (i <= MAX_Y))
//             pixel(x, i, color)
//     _DRAW = _sav
//     draw(_DRAW)
// }

// /**
//  * draw a rectangle
//  */
// //% blockId="OLED_RECT" block="draw a rectangle at x1 %x1|y1 %y1|x2 %x2|y2 %y2|color %color"
// //% color.defl=1
// //% weight=70 blockGap=8 inlineInputMode=inline
// export function rect(x1: number, y1: number, x2: number, y2: number, color: number = 1) {
//     if (x1 > x2)
//         x1 = [x2, x2 = x1][0];
//     if (y1 > y2)
//         y1 = [y2, y2 = y1][0];
//     _DRAW = 0
//     hline(x1, y1, x2 - x1 + 1, color)
//     hline(x1, y2, x2 - x1 + 1, color)
//     vline(x1, y1, y2 - y1 + 1, color)
//     vline(x2, y1, y2 - y1 + 1, color)
//     _DRAW = 1
//     draw(1)
// }

