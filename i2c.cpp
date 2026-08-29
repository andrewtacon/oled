#include "pxt.h"

namespace OLED {

    void setI2CSpeed()
    {
        uBit.i2c.setFrequency(400000);
    }

}