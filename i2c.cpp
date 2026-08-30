#include "pxt.h"

namespace OLED {

    //% block="I2C frequency 400,000 Hz"
    void setI2CSpeed()
    {
        uBit.i2c.setFrequency(400000);
    }

}