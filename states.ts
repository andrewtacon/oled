
namespace States {

    export function init() {

        //create the main loop of the program
        basic.forever(() => {
            if (StateUpdates[currentState]) StateUpdates[currentState]()
        })


        //setup the controller inputs and route to the correct functions
        controller.onPressed(
            controller.A,
            () => {
                if (AButtonPressed[currentState]) AButtonPressed[currentState]()
            }
        )

        controller.onPressed(
            controller.B,
            () => {
                if (BButtonPressed[currentState]) BButtonPressed[currentState]()
            }
        )

        controller.onPressed(
            controller.C,
            () => {
                if (CButtonPressed[currentState]) CButtonPressed[currentState]()
            }
        )

        controller.onPressed(
            controller.D,
            () => {
                if (DButtonPressed[currentState]) DButtonPressed[currentState]()
            }
        )

        controller.onPressed(
            controller.E,
            () => {
                if (EButtonPressed[currentState]) EButtonPressed[currentState]()
            }
        )

    }

    let stateCounter: number = 0
    let currentState: number = -1

    type stateFunction = {
        [id: number]: () => void
    }

    const StateUpdates: stateFunction = {}

    const AButtonPressed: stateFunction = {}
    const BButtonPressed: stateFunction = {}
    const CButtonPressed: stateFunction = {}
    const DButtonPressed: stateFunction = {}
    const EButtonPressed: stateFunction = {}

    class State {
        id: number

        constructor() {
            this.id = stateCounter++
        }

        onPressed(source: any, callback: () => void) {
            switch (source) {
                case controller.A: AButtonPressed[this.id] = callback; break;
                case controller.B: BButtonPressed[this.id] = callback; break;
                case controller.C: CButtonPressed[this.id] = callback; break;
                case controller.D: DButtonPressed[this.id] = callback; break;
                case controller.E: EButtonPressed[this.id] = callback; break;
            }
        }

        isPressed(source: any) {
            return controller.isPressed(source)
        }

        onUpdate(callback: () => void) {
            StateUpdates[this.id] = callback
        }

        onUpdateInterval(interval: number, func: () => void) {
            loops.everyInterval(
                interval,
                () => {
                    if (currentState === this.id) { func() }
                }
            )

        }

        activate() {
            currentState = this.id
        }

        isActive(): boolean {
            return currentState === this.id
        }

    }

    export function create() {
        return new State()
    }

}


