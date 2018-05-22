/**!
 * Event
 * @author    Simon Reinisch
 * @license MIT
 */

(function eventModule(factory) {

    'use strict';
    if (typeof module != 'undefined' && typeof module.exports != 'undefined') {
        module.exports = factory();
    } else if (typeof window !== 'undefined' && window.document) {
        window['EventJS'] = factory();
    } else {
        throw new Error('event.js requires a window with a document');
    }

})(function eventFactory() {
    'use strict';

    // Options
    let eventPrefix = 'e-';
    let eventOptionsPrefix = 'eo-';

    // Saves
    let eventStore = [];

    rebind();

    function rebind() {
        eventStore = [];

        // Traverse throught all DOM-Elements
        _traverse(document.body, (element) => {

            // Get events and options
            const events = _getAttributes(element, eventPrefix);
            const options = _getAttributes(element, eventOptionsPrefix);

            // Apply all events
            _forEach(events, (type, event) => {
                let context = window;

                // Apply options
                if (options['parent']) {
                    const obj = _findChildObject(window, options['parent']);

                    if (obj && typeof obj === 'object') {
                        context = obj;
                    }
                }

                // Check and apply event
                const func = context[event];
                if (typeof func === 'function') {
                    func.bind(context);
                    element.addEventListener(type, func);

                    // Save
                    eventStore.push({
                        element,
                        type,
                        func
                    });
                }
            });

            // Remove attributes
            _forEach(events, k => element.removeAttribute(eventPrefix + k));
            _forEach(options, k => element.removeAttribute(eventOptionsPrefix + k));
        });
    }

    function destroy() {
        eventStore.forEach(e => {
            e.element.removeEventListener(e.type, e.func);
        });
    }


    /**
     * Find's an child-object
     * @param root The entry point
     * @param strpath The object path, siblings are seperated by a comma e.g: 'example.subobject.another'
     * @returns {*} The object or Null if not found
     */
    function _findChildObject(root, strpath) {
        const path = strpath.split('.');
        const pathLength = path.length;

        function resolve(r, i) {
            const obj = r[path[i]];

            if (typeof obj === 'object') {

                if (i + 1 === pathLength) {
                    return obj;
                } else {
                    return resolve(obj, i + 1);
                }

            } else {
                return null;
            }
        }

        return resolve(root, 0);
    }

    /**
     * Get all attributes with an specific prefix from an element.
     * @param element The element
     * @param prefix The prefix
     */
    function _getAttributes(element, prefix) {
        const prefixLength = prefix.length;
        const attributes = element.attributes;
        const eventAttributes = {};

        for (let a of attributes) {
            let name = a.nodeName;

            if (name.startsWith(prefix)) {

                // Cut of the 'event-' part
                name = name.substring(prefixLength);
                eventAttributes[name] = a.nodeValue;
            }
        }

        return eventAttributes;
    }

    /**
     * For each for objects
     * @param object The object
     * @param iter Function
     */
    function _forEach(object, iter) {
        for (let k in object) {
            iter(k, object[k]);
        }
    }

    /**
     * Traverses throught all children
     * @param root The entry point
     * @param fnc Handler function for each element
     */
    function _traverse(root, fnc) {
        fnc(root);

        const children = root.children;
        for (let c of children) {
            _traverse(c, fnc);
        }
    }

    // Export
    return {
        version: '0.0.1',

        // Methods
        setPrefix: (prefix) => eventPrefix = prefix,
        setOptionsPrefix: (prefix) => eventOptionsPrefix = prefix,
        rebind,
        destroy
    };
});
