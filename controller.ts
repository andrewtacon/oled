

namespace controller {


    //% block="A"
    export const A = TouchPin.P0
    //% block="B"
    export const B = TouchPin.P1
    //% block="C"   
    export const C = TouchPin.P2
    //% block="B"
    export const D = Button.A
    //% block="E"
    export const E = Button.B

    /**
    * Controller Pressed Listener
    *      */
    //% blockId="CONTROLLER_ONPRESSED" block="on %source pressed do %callback" 
    //% color.max=1 color.min=0 color.defl=1
    //% weight=71 blockGap=8 inlineInputMode=inline
    export function onPressed(source: any, callback: () => void): void {

        if (source === TouchPin.P0 || source === TouchPin.P1 || source === TouchPin.P2) {
            input.onPinPressed(source, callback)
        }

        if (source === Button.A || source === Button.B) {
            input.onButtonPressed(source, callback)
        }

    }

    /**
    * Controller Button Release
    *      */
    //% blockId="CONTROLLER_ONRELEASED" block="on %source released do %callback" 
    //% color.max=1 color.min=0 color.defl=1
    //% weight=71 blockGap=8 inlineInputMode=inline
    export function onReleased(source: any, callback: () => void): void {
        if (source === TouchPin.P0 || source === TouchPin.P1 || source === TouchPin.P2) {
            input.onPinReleased(source, callback)
        }
    }

    /**
     * Controller Button Is Pressed
     *      */
    //% blockId="CONTROLLER_ISPRESSED" block="is %source pressed?" 
    //% color.max=1 color.min=0 color.defl=1
    //% weight=71 blockGap=8 inlineInputMode=inline
    export function isPressed(source: any): boolean {
        if (source === TouchPin.P0 || source === TouchPin.P1 || source === TouchPin.P2) {
            return input.pinIsPressed(source)
        }

        if (source === Button.A || source === Button.B) {
            return input.buttonIsPressed(source)
        }

        return false
    }
}
