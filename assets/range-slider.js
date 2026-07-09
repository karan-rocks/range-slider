
/**
 * Range Slider with Popover
 * RangeSliderPopover class to convert HTML5 range input field into an interactive slider with popover
 * @version 1.0.0
 * @author Karan Singh
 * @constructor
 * @param {string|HTMLElement|Array} selector - CSS selector string, single HTMLElement, or array of HTMLElements to initialize the range popover on.
 *
 * Example usage:
 * new RangeSliderPopover('input[type="range"]');
*/

class RangeSliderPopover {
    default_slider_class = 'range-slider';
    default_popover_class = 'range-slider-popover';
    default_options = {
        popover: true
    };
    static counter = 0;
    static nodes = [];
    static selector = window.rangeSliderAutoInit ? 'input[type="range"]' : 'input.range-slider[type="range"]';
    static selectorsList = []; // used to store passed selectors for dynamic sliders.

    constructor(selector, options = {}, callback = null) {
        // return if nothing passed
        if (!selector) return;
        this.callback = callback;
        this.options = { ...this.default_options, ...options };
        let elements = this.getElements(selector);
        elements.forEach(function (elem) {
            if (RangeSliderPopover.nodes.find(node => node === elem)) {
                return;
            }
            RangeSliderPopover.nodes.push(elem);
            this.elem = elem;
            this.init();
        }.bind(this));

        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState == "visible") {
                this.updateAll();
            }
        }.bind(this), false);


        // reset the slider position when tab auto-loaded while starting the Browser
        setTimeout(function () { this.updateAll(); }.bind(this), 100)
    }

    /**
     * Get elements based on the provided selector, which can be a CSS selector string, a single HTMLElement, or an array of HTMLElements.
     * @param {string|HTMLElement|Array} selector - The selector to identify the range input elements.
     * @returns {Array} An array of valid range input elements.
     */
    getElements(selector) {
        let elements = [];
        if (Array.isArray(selector)) {
            if (selector.every(i => typeof i === "string")) {
                RangeSliderPopover.selectorsList.push(...selector);
                elements = document.querySelectorAll(selector.join(','));
            } else if (selector.every(i => (typeof i === "object") && selector.nodeType)) {
                elements = selector;
            }
        } else if ((typeof selector == 'object') && selector.nodeType) {
            elements.push(selector);
        } else if (typeof selector == 'string') {
            RangeSliderPopover.selectorsList.push(selector);
            elements = document.querySelectorAll(selector);
        }

        // ERROR: wrong selector passed

        // validate if elements are type of range
        elements.forEach(function (elem, index, array) {
            if (!elem || (elem.type !== 'range')) {
                array.splice(index, 1);
            }
        });

        return elements;
    }

    /**
     * Initialize the range popover for the current element.
     * Sets up the necessary attributes, creates the popover element, and attaches event listeners for interactivity.
     */
    init() {
        let slider = this.elem;
        RangeSliderPopover.counter++;
        let rangeElemID = 'range-slider-' + RangeSliderPopover.counter;
        slider.classList.add(this.default_slider_class);
        slider.style.anchorName = '--' + rangeElemID;
        if (!this.options.popover) {
            slider.classList.add('range-slider-no-popover');
        }

        let popover = null;
        const addPopover = !slider.classList.contains('range-slider-no-popover');
        if (addPopover) {
            let rangePopoverID = rangeElemID + '-popover';
            slider.dataset.popoverId = rangePopoverID;
            popover = document.createElement("div");
            popover.id = rangePopoverID;
            popover.classList.add(this.default_popover_class);
            popover.setAttribute("popover", "manual");
            popover.style.positionAnchor = '--' + rangeElemID;
            popover.textContent = slider.value;
            slider.after(popover);
        }

        /**
         * Event listener for the 'input' event on the slider.
         * Updates the popover content and position based on the current slider value.
         * @param {Event} event - The input event triggered by the slider.
         */
        slider.addEventListener('input', (event) => {
            const elem = event.currentTarget;
            if (popover) {
                if (!popover.matches(':popover-open')) {
                    popover.showPopover(); // Show if not already shown
                }
                popover.textContent = elem.value;
            }
            this.update(elem, popover);
            if (this.callback && typeof this.callback === 'function') {
                this.callback(elem.value);
            }
        });

        /**
         * Event listener for the 'focus' event on the slider.
         * Shows the popover when the slider receives focus and updates its position.
         */
        slider.addEventListener('focus', () => {
            if (popover) {
                popover.showPopover();
            }
            this.update(slider, popover);
        });

        /**
         * Event listener for the 'mousedown' event on the slider.
         * Shows the popover when the slider is clicked and updates its position.
         */
        slider.addEventListener('mousedown', () => {
            if (popover) {
                popover.showPopover();
            }
            this.update(slider, popover);
        });

        /**
         * Event listener for the 'mouseout' event on the slider.
         * Hides the popover when the mouse leaves the slider area.
         */
        slider.addEventListener('mouseout', () => {
            if (popover) {
                popover.hidePopover();
            }
        });

    }

    /**
     * Update the slider's fill and the popover's position based on the current slider value.
     * @param {HTMLElement} slider - The range input element to update.
     * @param {HTMLElement|null} popover - The associated popover element to update, or null to find it using the slider's dataset.
     */
    update(slider, popover = null) {
        const min = Number(slider.min ? slider.min : 0);
        const max = Number(slider.max ? slider.max : 100);
        const value = Number(slider.value ? slider.value : 0);
        const pct = ((value - min) / (max - min)) * 100;
        let pctRound = pct;
        if (!Number.isInteger(pctRound)) {
            pctRound = Math.round(pct * 100) / 100; // round to 2 decimals
        }

        slider.style.setProperty("--fill", `${pctRound}%`);

        if (!popover) {
            popover = document.getElementById(slider.dataset.popoverId);
        }

        if (popover) {
            const percent = (value - min) / (max - min);
            // Get font-size/4 to adjust the arrow in the center of track thumb
            const computedStyle = window.getComputedStyle(popover);

            // Get the 'font-size' property value (returns a string like "16px")
            const fontSizePx = computedStyle.getPropertyValue('font-size');

            // To get the numerical pixel value, you can use parseFloat()
            let fsLeft = parseFloat(fontSizePx);
            fsLeft = fsLeft + (fsLeft * 0.5); // because track thumb size is 1.5em	
            fsLeft = parseFloat(fsLeft) / 4;
            fsLeft = parseFloat(Math.round(fsLeft * 100) / 100);

            let thumbOffset = percent * (slider.offsetWidth - (popover.offsetWidth / 2) - fsLeft); // Simple approximation
            thumbOffset = parseFloat(Math.round(thumbOffset * 100) / 100);
            // Position popover relative to slider, adjusting for scrolling
            popover.style.setProperty('--left', `${thumbOffset}px`);
        }
    }

    /**
     * Update all initialized range popovers.
     * Iterates through all elements stored in the RangeSliderPopover.nodes array and calls the update method on each one to ensure they are correctly positioned and styled.
     */
    updateAll() {
        RangeSliderPopover.nodes.forEach(function (elem) {
            this.update(elem);
        }.bind(this));
    }
}

// wrap in IIFE to avoid polluting global scope and to start observing for dynamic sliders immediately after the script is loaded.
(() => {
    /**
     * Callback function for handling mutations observed by the MutationObserver.
     * This function checks for added nodes and initializes a RangeSliderPopover for any new range input elements that are added to the DOM.
     * @param {Array} mutationsList - An array of MutationRecord objects representing the mutations that were observed.
     * @param {MutationObserver} observer - The MutationObserver instance that triggered the callback.
     */
    const handleDynamicSliders = function (mutationsList, observer) {
        // Use for...of to iterate over the detected mutations
        for (const mutation of mutationsList) {
            // Check if the change was adding or removing nodes
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    // check if the added node is an element and has a specific tag name
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'INPUT' && node.type === 'range') {
                        new RangeSliderPopover(RangeSliderPopover.selector);
                        if (RangeSliderPopover.selectorsList.length > 0) {
                            new RangeSliderPopover(RangeSliderPopover.selectorsList);
                        }
                    }
                });
            }
        }
    };

    /**
     * MutationObserver to watch for changes in the DOM and initialize RangeSliderPopover for dynamically added range input elements.
     * The observer is configured to watch for child node additions and subtree modifications within the document body.
     */
    const observer = new MutationObserver(handleDynamicSliders);

    /**
     * Start observing the document body for changes in child nodes and subtree modifications.
     * This allows the RangeSliderPopover to automatically initialize for any new range input elements that are added to the DOM after the initial page load.
     */
    observer.observe(document.body, {
        childList: true, // Watch for additions/removals of direct children
        subtree: true,   // Watch the entire body subtree, not just direct children
        attributes: false, // Not needed for this specific task, but an option
        characterData: false // Not needed
    });

})();


/**
 * Initialize RangeSliderPopover for existing range input elements on page load.
 * This ensures that any range inputs present in the initial HTML are properly enhanced with the popover functionality.
 */
new RangeSliderPopover(RangeSliderPopover.selector);
document.addEventListener('DOMContentLoaded', () => {
    new RangeSliderPopover(RangeSliderPopover.selector);
});
window.addEventListener('load', () => {
    new RangeSliderPopover(RangeSliderPopover.selector);
});

// 

/**
 * Global function to allow users to initialize RangeSliderPopover with a custom selector and callback function.
 * This function can be called from anywhere in the global scope to create a new RangeSliderPopover instance with the specified parameters.
 * @param {String|Object|Array} selector - A CSS selector string, a single HTMLElement, or an array of HTMLElements to target for RangeSliderPopover initialization.
 * @param {Object} options - An object containing configuration options for the RangeSliderPopover instance (e.g., { popover: false } to disable popover).
 * @param {function|null} callback - A callback function to be executed after the RangeSliderPopover is initialized.
 */
function rangeSlider(selector = null, options = {}, callback = null) {
    if(selector === null) {
        selector = 'input[type="range"]';
    }
    new RangeSliderPopover(selector, options, callback);

    // fallback when selector is not available at the time of script execution.
    if (document.readyState !== 'complete') {
        document.addEventListener('DOMContentLoaded', () => {
            new RangeSliderPopover(selector, options, callback);
        });
    }

}