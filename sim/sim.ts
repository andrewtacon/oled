// /sim/sim.ts
namespace pxsim.controller {

    // 1. Define a function that changes the DOM color
    //% shim=controller::onPressed
    export function onPressed(index: number, rgb: number) {
        // Convert the number to a hex string for CSS (e.g., #FF0000)
        let hexColor = "#" + ("000000" + rgb.toString(16)).slice(-6);
        
        // Grab the SVG element by ID from the DOM
        let ledElement = document.getElementById("sim-controller-" + ["A","B","C","D"][index]);
        
        if (ledElement) {
            // Apply the visual change
            ledElement.setAttribute("fill", hexColor);
        }
    }
}


