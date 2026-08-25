#include "pxt.h"

namespace OLED {
    //% block="set I2C speed to %speed Hz"
    void setI2CSpeed(int speed) {
        // Access CODAL's global I2C object and change frequency (e.g., 400000 for 400kHz)
        uBit.i2c.setFrequency(speed); 
    }
}