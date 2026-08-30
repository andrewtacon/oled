/*
    This unifies the touchpin and button interfaces under one heading
    so it is easier to deal with when using them all as
    external button inputs.

    Would include logo if it was broken out and not locked onto microbit
*/

namespace controller {


    //% block="Control A"
    export const A = TouchPin.P0
    //% block="Control B"
    export const B = TouchPin.P1
    //% block="Control C"   
    export const C = TouchPin.P2
    //% block="Control B"
    export const D = Button.A
    //% block="Control E"
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
