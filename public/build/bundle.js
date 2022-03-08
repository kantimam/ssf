
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* src\lib\FallbackField.svelte generated by Svelte v3.46.4 */

    const file$3 = "src\\lib\\FallbackField.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*elementDefinition*/ ctx[0].type + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("no definition found for element type ");
    			t1 = text(t1_value);
    			add_location(div, file$3, 3, 0, 62);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*elementDefinition*/ 1 && t1_value !== (t1_value = /*elementDefinition*/ ctx[0].type + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FallbackField', slots, []);
    	let { elementDefinition } = $$props;
    	const writable_props = ['elementDefinition'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FallbackField> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('elementDefinition' in $$props) $$invalidate(0, elementDefinition = $$props.elementDefinition);
    	};

    	$$self.$capture_state = () => ({ elementDefinition });

    	$$self.$inject_state = $$props => {
    		if ('elementDefinition' in $$props) $$invalidate(0, elementDefinition = $$props.elementDefinition);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [elementDefinition];
    }

    class FallbackField extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { elementDefinition: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FallbackField",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*elementDefinition*/ ctx[0] === undefined && !('elementDefinition' in props)) {
    			console.warn("<FallbackField> was created without expected prop 'elementDefinition'");
    		}
    	}

    	get elementDefinition() {
    		throw new Error("<FallbackField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elementDefinition(value) {
    		throw new Error("<FallbackField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\lib\DynamicField.svelte generated by Svelte v3.46.4 */

    function create_fragment$4(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*selectedComponent*/ ctx[1];

    	function switch_props(ctx) {
    		return {
    			props: {
    				elementDefinition: /*elementDefinition*/ ctx[0]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*elementDefinition*/ 1) switch_instance_changes.elementDefinition = /*elementDefinition*/ ctx[0];

    			if (switch_value !== (switch_value = /*selectedComponent*/ ctx[1])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DynamicField', slots, []);
    	let { elementsMap } = $$props;
    	let { elementDefinition } = $$props;
    	const selectedComponent = elementsMap[elementDefinition.type] || FallbackField;
    	const writable_props = ['elementsMap', 'elementDefinition'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DynamicField> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('elementsMap' in $$props) $$invalidate(2, elementsMap = $$props.elementsMap);
    		if ('elementDefinition' in $$props) $$invalidate(0, elementDefinition = $$props.elementDefinition);
    	};

    	$$self.$capture_state = () => ({
    		FallbackField,
    		elementsMap,
    		elementDefinition,
    		selectedComponent
    	});

    	$$self.$inject_state = $$props => {
    		if ('elementsMap' in $$props) $$invalidate(2, elementsMap = $$props.elementsMap);
    		if ('elementDefinition' in $$props) $$invalidate(0, elementDefinition = $$props.elementDefinition);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [elementDefinition, selectedComponent, elementsMap];
    }

    class DynamicField extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { elementsMap: 2, elementDefinition: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DynamicField",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*elementsMap*/ ctx[2] === undefined && !('elementsMap' in props)) {
    			console.warn("<DynamicField> was created without expected prop 'elementsMap'");
    		}

    		if (/*elementDefinition*/ ctx[0] === undefined && !('elementDefinition' in props)) {
    			console.warn("<DynamicField> was created without expected prop 'elementDefinition'");
    		}
    	}

    	get elementsMap() {
    		throw new Error("<DynamicField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elementsMap(value) {
    		throw new Error("<DynamicField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get elementDefinition() {
    		throw new Error("<DynamicField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elementDefinition(value) {
    		throw new Error("<DynamicField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\SchemaForm.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1 } = globals;
    const file$2 = "src\\SchemaForm.svelte";
    const get_form_controls_slot_changes = dirty => ({ formSchema: dirty & /*formSchema*/ 1 });

    const get_form_controls_slot_context = ctx => ({
    	submitForm,
    	formSchema: /*formSchema*/ ctx[0]
    });

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    const get_prepend_outer_slot_changes = dirty => ({});
    const get_prepend_outer_slot_context = ctx => ({});

    // (27:29)      
    function fallback_block_1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Svelte Schema Form";
    			add_location(h1, file$2, 27, 4, 949);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1.name,
    		type: "fallback",
    		source: "(27:29)      ",
    		ctx
    	});

    	return block;
    }

    // (31:4) {#each formSchema.elements as formElement}
    function create_each_block(ctx) {
    	let dynamicfield;
    	let current;

    	dynamicfield = new DynamicField({
    			props: {
    				elementDefinition: /*formElement*/ ctx[9],
    				elementsMap: /*elementsMap*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dynamicfield.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dynamicfield, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dynamicfield_changes = {};
    			if (dirty & /*formSchema*/ 1) dynamicfield_changes.elementDefinition = /*formElement*/ ctx[9];
    			if (dirty & /*elementsMap*/ 2) dynamicfield_changes.elementsMap = /*elementsMap*/ ctx[1];
    			dynamicfield.$set(dynamicfield_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dynamicfield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dynamicfield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dynamicfield, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(31:4) {#each formSchema.elements as formElement}",
    		ctx
    	});

    	return block;
    }

    // (34:57)        
    function fallback_block$1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "submit";
    			attr_dev(button, "type", "submit");
    			add_location(button, file$2, 34, 6, 1242);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$1.name,
    		type: "fallback",
    		source: "(34:57)        ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let form;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	const prepend_outer_slot_template = /*#slots*/ ctx[3]["prepend-outer"];
    	const prepend_outer_slot = create_slot(prepend_outer_slot_template, ctx, /*$$scope*/ ctx[2], get_prepend_outer_slot_context);
    	const prepend_outer_slot_or_fallback = prepend_outer_slot || fallback_block_1(ctx);
    	let each_value = /*formSchema*/ ctx[0].elements;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const form_controls_slot_template = /*#slots*/ ctx[3]["form-controls"];
    	const form_controls_slot = create_slot(form_controls_slot_template, ctx, /*$$scope*/ ctx[2], get_form_controls_slot_context);
    	const form_controls_slot_or_fallback = form_controls_slot || fallback_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (prepend_outer_slot_or_fallback) prepend_outer_slot_or_fallback.c();
    			t0 = space();
    			form = element("form");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			if (form_controls_slot_or_fallback) form_controls_slot_or_fallback.c();
    			attr_dev(form, "class", "sf-form");
    			add_location(form, file$2, 29, 2, 989);
    			attr_dev(div, "class", "sf-wrapper");
    			add_location(div, file$2, 25, 0, 890);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (prepend_outer_slot_or_fallback) {
    				prepend_outer_slot_or_fallback.m(div, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, form);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(form, null);
    			}

    			append_dev(form, t1);

    			if (form_controls_slot_or_fallback) {
    				form_controls_slot_or_fallback.m(form, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", prevent_default(submitForm), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (prepend_outer_slot) {
    				if (prepend_outer_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						prepend_outer_slot,
    						prepend_outer_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(prepend_outer_slot_template, /*$$scope*/ ctx[2], dirty, get_prepend_outer_slot_changes),
    						get_prepend_outer_slot_context
    					);
    				}
    			}

    			if (dirty & /*formSchema, elementsMap*/ 3) {
    				each_value = /*formSchema*/ ctx[0].elements;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(form, t1);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (form_controls_slot) {
    				if (form_controls_slot.p && (!current || dirty & /*$$scope, formSchema*/ 5)) {
    					update_slot_base(
    						form_controls_slot,
    						form_controls_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(form_controls_slot_template, /*$$scope*/ ctx[2], dirty, get_form_controls_slot_changes),
    						get_form_controls_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(prepend_outer_slot_or_fallback, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(form_controls_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(prepend_outer_slot_or_fallback, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(form_controls_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (prepend_outer_slot_or_fallback) prepend_outer_slot_or_fallback.d(detaching);
    			destroy_each(each_blocks, detaching);
    			if (form_controls_slot_or_fallback) form_controls_slot_or_fallback.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function submitForm() {
    	
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SchemaForm', slots, ['prepend-outer','form-controls']);
    	let { formSchema } = $$props;
    	let { elementsMap } = $$props;
    	setContext("elementsMapContext", elementsMap);
    	setContext("formSchemaContext", formSchema);
    	const inputValuesStore = writable({});
    	const inputErrorsStore = writable({});

    	function setInputValue(key, value) {
    		inputValuesStore.update(state => Object.assign(Object.assign({}, state), { [key]: value }));
    	}

    	function setInputError(key, value) {
    		inputErrorsStore.update(state => Object.assign(Object.assign({}, state), { [key]: value }));
    	}

    	const formContext = {
    		inputValuesStore,
    		inputErrorsStore,
    		setInputValue,
    		setInputError
    	};

    	setContext("formContext", formContext);
    	const writable_props = ['formSchema', 'elementsMap'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SchemaForm> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('formSchema' in $$props) $$invalidate(0, formSchema = $$props.formSchema);
    		if ('elementsMap' in $$props) $$invalidate(1, elementsMap = $$props.elementsMap);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		writable,
    		DynamicField,
    		formSchema,
    		elementsMap,
    		inputValuesStore,
    		inputErrorsStore,
    		setInputValue,
    		setInputError,
    		submitForm,
    		formContext
    	});

    	$$self.$inject_state = $$props => {
    		if ('formSchema' in $$props) $$invalidate(0, formSchema = $$props.formSchema);
    		if ('elementsMap' in $$props) $$invalidate(1, elementsMap = $$props.elementsMap);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [formSchema, elementsMap, $$scope, slots];
    }

    class SchemaForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { formSchema: 0, elementsMap: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SchemaForm",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*formSchema*/ ctx[0] === undefined && !('formSchema' in props)) {
    			console.warn("<SchemaForm> was created without expected prop 'formSchema'");
    		}

    		if (/*elementsMap*/ ctx[1] === undefined && !('elementsMap' in props)) {
    			console.warn("<SchemaForm> was created without expected prop 'elementsMap'");
    		}
    	}

    	get formSchema() {
    		throw new Error("<SchemaForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set formSchema(value) {
    		throw new Error("<SchemaForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get elementsMap() {
    		throw new Error("<SchemaForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elementsMap(value) {
    		throw new Error("<SchemaForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var id = "contact-19915";
    var api = {
    	status: null,
    	errors: null,
    	callbacks: [
    	],
    	preprocess: [
    	],
    	actionAfterSuccess: null,
    	page: {
    		current: 1,
    		nextPage: null,
    		pages: 1,
    		labels: {
    			nextButtonLabel: "Übermitteln"
    		},
    		errorHint: "Bitte prüfen Sie %s Felder",
    		pageSummaryText: null,
    		submitButtonAlignment: "left"
    	}
    };
    var global$1 = {
    	labels: {
    		error: "Ein unbekannter Fehler ist aufgetreten, bitte versuchen Sie es später erneut. Wenn der Fehler bestehen bleibt, kontaktieren Sie uns bitte."
    	}
    };
    var action = "https://dev.bph.onl/kontakt/send/#contact-19915";
    var i18n = "de-DE";
    var elements = [
    	{
    		defaultValue: "",
    		type: "Text",
    		identifier: "name",
    		label: "Name",
    		properties: {
    			fluidAdditionalAttributes: {
    				required: "required",
    				minlength: "2",
    				maxlength: "40"
    			},
    			validationErrorMessages: [
    				{
    					code: 1221560910,
    					message: "Bitte geben Sie Ihren Namen ein"
    				},
    				{
    					code: 1221560718,
    					message: "Bitte geben Sie Ihren Namen ein"
    				},
    				{
    					code: 1347992400,
    					message: "Bitte geben Sie Ihren Namen ein"
    				},
    				{
    					code: 1347992453,
    					message: "Bitte geben Sie Ihren Namen ein"
    				},
    				{
    					code: 1238110957,
    					message: "Der Name muss zwischen 2 und 40 Zeichen betragen"
    				},
    				{
    					code: 1269883975,
    					message: "Der Name muss zwischen 2 und 40 Zeichen betragen"
    				},
    				{
    					code: 1428504122,
    					message: "Der Name muss zwischen 2 und 40 Zeichen betragen"
    				},
    				{
    					code: 1238108068,
    					message: "Der Name muss zwischen 2 und 40 Zeichen betragen"
    				},
    				{
    					code: 1238108069,
    					message: "Der Name muss zwischen 2 und 40 Zeichen betragen"
    				}
    			]
    		},
    		renderingOptions: [
    		],
    		validators: [
    			{
    				identifier: "NotEmpty",
    				code: 1221560910,
    				errorMessage: "Bitte geben Sie Ihren Namen ein"
    			},
    			{
    				options: {
    					minimum: "2",
    					maximum: "40"
    				},
    				identifier: "StringLength",
    				code: 1428504122,
    				errorMessage: "Der Name muss zwischen 2 und 40 Zeichen betragen"
    			}
    		],
    		name: "tx_form_formframework[contact-19915][name]"
    	},
    	{
    		defaultValue: "",
    		type: "Email",
    		identifier: "email",
    		label: "Email",
    		properties: {
    			fluidAdditionalAttributes: {
    				required: "required"
    			},
    			validationErrorMessages: [
    				{
    					code: 1221560910,
    					message: "Bitte geben Sie eine Email-Adresse ein"
    				},
    				{
    					code: 1221560718,
    					message: "Bitte geben Sie eine Email-Adresse ein"
    				},
    				{
    					code: 1347992400,
    					message: "Bitte geben Sie eine Email-Adresse ein"
    				},
    				{
    					code: 1347992453,
    					message: "Bitte geben Sie eine Email-Adresse ein"
    				},
    				{
    					code: 1221559976,
    					message: "Bitte geben Sie eine valide E-Mail Adresse an"
    				}
    			]
    		},
    		renderingOptions: [
    		],
    		validators: [
    			{
    				identifier: "EmailAddress",
    				code: 1221559976,
    				errorMessage: "Bitte geben Sie eine valide E-Mail Adresse an"
    			},
    			{
    				identifier: "NotEmpty",
    				code: 1221560910,
    				errorMessage: "Bitte geben Sie eine Email-Adresse ein"
    			}
    		],
    		name: "tx_form_formframework[contact-19915][email]"
    	},
    	{
    		properties: {
    			options: {
    				"1": "Kauf von Kauf von Konzertkarten",
    				"2": "Konzertabonnement",
    				"3": "Digital Concert Hall",
    				"4": "Onlineshop",
    				"5": "Archiv",
    				"6": "Fundbüro",
    				"7": "sonstiges"
    			},
    			mails: {
    				"1": "kartenbuero@berliner-philharmoniker.de",
    				"2": "abo@berliner-philharmoniker.de",
    				"3": "help@digitalconcerthall.com",
    				"4": "onlineshop@berliner-philharmoniker.de",
    				"5": "archiv@berliner-philharmoniker.de",
    				"6": "fundbuero@berliner-philharmoniker.de",
    				"7": "info@berliner-philharmoniker.de"
    			},
    			elementDescription: "Betreff mit Mail",
    			fluidAdditionalAttributes: {
    				required: "required"
    			},
    			validationErrorMessages: [
    				{
    					code: 1221560910,
    					message: "Bitte wählen Sie einen Betreff aus"
    				},
    				{
    					code: 1221560718,
    					message: "Bitte wählen Sie einen Betreff aus"
    				},
    				{
    					code: 1347992400,
    					message: "Bitte wählen Sie einen Betreff aus"
    				},
    				{
    					code: 1347992453,
    					message: "Bitte wählen Sie einen Betreff aus"
    				}
    			]
    		},
    		type: "EmailSingleSelect",
    		identifier: "contact-matter",
    		label: "betrifft",
    		renderingOptions: [
    		],
    		validators: [
    			{
    				identifier: "NotEmpty",
    				code: 1221560910,
    				errorMessage: "Bitte wählen Sie einen Betreff aus"
    			}
    		],
    		name: "tx_form_formframework[contact-19915][contact-matter]"
    	},
    	{
    		defaultValue: "",
    		type: "Textarea",
    		identifier: "message",
    		label: "Nachricht",
    		properties: {
    			fluidAdditionalAttributes: {
    				required: "required",
    				placeholder: "Ihre Nachricht hier..."
    			},
    			validationErrorMessages: [
    				{
    					code: 1221560910,
    					message: "Bitte geben Sie Ihre Nachricht ein"
    				},
    				{
    					code: 1221560718,
    					message: "Bitte geben Sie Ihre Nachricht ein"
    				},
    				{
    					code: 1347992400,
    					message: "Bitte geben Sie Ihre Nachricht ein"
    				},
    				{
    					code: 1347992453,
    					message: "Bitte geben Sie Ihre Nachricht ein"
    				}
    			]
    		},
    		renderingOptions: [
    		],
    		validators: [
    			{
    				identifier: "NotEmpty",
    				code: 1221560910,
    				errorMessage: "Bitte geben Sie Ihre Nachricht ein"
    			}
    		],
    		name: "tx_form_formframework[contact-19915][message]"
    	},
    	{
    		properties: {
    			width: "400",
    			height: 100,
    			fluidAdditionalAttributes: {
    				required: "required"
    			},
    			validationErrorMessages: [
    				{
    					code: 1221560910,
    					message: "Bitte geben Sie die Zeichen aus dem Bild ein"
    				},
    				{
    					code: 1221560718,
    					message: "Bitte geben Sie die Zeichen aus dem Bild ein"
    				},
    				{
    					code: 1347992400,
    					message: "Bitte geben Sie die Zeichen aus dem Bild ein"
    				},
    				{
    					code: 1347992453,
    					message: "Bitte geben Sie die Zeichen aus dem Bild ein"
    				}
    			],
    			refreshText: "Neues Bild generieren",
    			disableJsonResponse: true,
    			gencaptchaUri: "/gencaptcha/?uid=19915&identifier=contact-19915"
    		},
    		type: "Oncaptcha",
    		identifier: "oncaptcha-1",
    		label: "Bitte geben Sie den angezeigten Text an",
    		validators: [
    			{
    				identifier: "Oncaptcha",
    				code: 0,
    				errorMessage: 0
    			},
    			{
    				identifier: "NotEmpty",
    				code: 1221560910,
    				errorMessage: "Bitte geben Sie die Zeichen aus dem Bild ein"
    			}
    		],
    		name: "tx_form_formframework[contact-19915][oncaptcha-1]"
    	},
    	{
    		properties: {
    			fluidAdditionalAttributes: {
    				required: "required"
    			},
    			validationErrorMessages: [
    				{
    					code: 1221560910,
    					message: "Sie müssen die Datenschutzbestimmung akzeptieren"
    				},
    				{
    					code: 1221560718,
    					message: "Sie müssen die Datenschutzbestimmung akzeptieren"
    				},
    				{
    					code: 1347992400,
    					message: "Sie müssen die Datenschutzbestimmung akzeptieren"
    				},
    				{
    					code: 1347992453,
    					message: "Sie müssen die Datenschutzbestimmung akzeptieren"
    				}
    			],
    			content: "<div> <p>Ich akzeptiere die <a href=\"/datenschutz/\">Datenschutzbestimmungen</a>.</p></div>"
    		},
    		type: "Checkbox",
    		identifier: "privacy-check",
    		renderingOptions: [
    		],
    		validators: [
    			{
    				identifier: "NotEmpty",
    				code: 1221560910,
    				errorMessage: "Sie müssen die Datenschutzbestimmung akzeptieren"
    			}
    		],
    		name: "tx_form_formframework[contact-19915][privacy-check]"
    	},
    	{
    		properties: {
    			containerClassAttribute: "input",
    			elementClassAttribute: "",
    			elementErrorClassAttribute: "error",
    			renderAsHiddenField: false,
    			styleAttribute: "position:absolute; margin:0 0 0 -999em;"
    		},
    		type: "Honeypot",
    		identifier: "Q9amTSCogRZ530HUzK8hYcG",
    		label: "",
    		name: "tx_form_formframework[contact-19915][Q9amTSCogRZ530HUzK8hYcG]"
    	},
    	{
    		properties: [
    		],
    		type: "Hidden",
    		identifier: "__currentPage",
    		defaultValue: 1,
    		label: "",
    		name: "tx_form_formframework[contact-19915][__currentPage]"
    	},
    	{
    		properties: [
    		],
    		type: "Hidden",
    		identifier: "__trustedProperties",
    		defaultValue: "{\"contact-19915\":{\"name\":1,\"email\":1,\"contact-matter\":1,\"message\":1,\"oncaptcha-1\":1,\"privacy-check\":1,\"Q9amTSCogRZ530HUzK8hYcG\":1,\"__currentPage\":1}}e15a129104de936a6f8618efc00cc3d5adca3d3c",
    		label: "",
    		name: "tx_form_formframework[contact-19915][__trustedProperties]"
    	},
    	{
    		properties: [
    		],
    		type: "Hidden",
    		identifier: "__state",
    		defaultValue: "TzozOToiVFlQTzNcQ01TXEZvcm1cRG9tYWluXFJ1bnRpbWVcRm9ybVN0YXRlIjoyOntzOjI1OiIAKgBsYXN0RGlzcGxheWVkUGFnZUluZGV4IjtpOjA7czoxMzoiACoAZm9ybVZhbHVlcyI7YTowOnt9fQ==d48b984bc123981e8c4bdd84e0a06164d2ee0026",
    		label: "",
    		name: "tx_form_formframework[contact-19915][__state]"
    	}
    ];
    var formDefinitionData = {
    	id: id,
    	api: api,
    	global: global$1,
    	action: action,
    	i18n: i18n,
    	elements: elements
    };

    /* src\lib\BaseInput.svelte generated by Svelte v3.46.4 */
    const file$1 = "src\\lib\\BaseInput.svelte";

    const get_default_slot_changes = dirty => ({
    	inputValue: dirty & /*inputValue*/ 2,
    	inputError: dirty & /*inputError*/ 4
    });

    const get_default_slot_context = ctx => ({
    	formContext: /*formContext*/ ctx[3],
    	inputValue: /*inputValue*/ ctx[1],
    	inputError: /*inputError*/ ctx[2],
    	onChange: /*onChange*/ ctx[4],
    	updateError: /*updateError*/ ctx[5]
    });

    // (21:71)     
    function fallback_block(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", /*name*/ ctx[0]);
    			input.value = /*inputValue*/ ctx[1];
    			add_location(input, file$1, 21, 2, 656);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*onChange*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*name*/ 1) {
    				attr_dev(input, "name", /*name*/ ctx[0]);
    			}

    			if (dirty & /*inputValue*/ 2 && input.value !== /*inputValue*/ ctx[1]) {
    				prop_dev(input, "value", /*inputValue*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(21:71)     ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], get_default_slot_context);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, inputValue, inputError*/ 134)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[7],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[7])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty & /*name, inputValue*/ 3)) {
    					default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BaseInput', slots, ['default']);
    	let { identfier } = $$props;
    	let { name } = $$props;
    	let inputValue = "test";
    	let inputError;
    	const formContext = getContext("formContext");

    	formContext.inputValuesStore.subscribe(values => {
    		$$invalidate(1, inputValue = values[identfier] || "");
    	});

    	formContext.inputErrorsStore.subscribe(errors => {
    		$$invalidate(2, inputError = errors[identfier]);
    	});

    	function onChange(e) {
    		formContext.setInputValue(identfier, e.target.value);
    	}

    	function updateError(errorObject) {
    		formContext.setInputError(identfier, errorObject);
    	}

    	const writable_props = ['identfier', 'name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BaseInput> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('identfier' in $$props) $$invalidate(6, identfier = $$props.identfier);
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('$$scope' in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		identfier,
    		name,
    		inputValue,
    		inputError,
    		formContext,
    		onChange,
    		updateError
    	});

    	$$self.$inject_state = $$props => {
    		if ('identfier' in $$props) $$invalidate(6, identfier = $$props.identfier);
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('inputValue' in $$props) $$invalidate(1, inputValue = $$props.inputValue);
    		if ('inputError' in $$props) $$invalidate(2, inputError = $$props.inputError);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		inputValue,
    		inputError,
    		formContext,
    		onChange,
    		updateError,
    		identfier,
    		$$scope,
    		slots
    	];
    }

    class BaseInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { identfier: 6, name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BaseInput",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*identfier*/ ctx[6] === undefined && !('identfier' in props)) {
    			console.warn("<BaseInput> was created without expected prop 'identfier'");
    		}

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<BaseInput> was created without expected prop 'name'");
    		}
    	}

    	get identfier() {
    		throw new Error("<BaseInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set identfier(value) {
    		throw new Error("<BaseInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<BaseInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<BaseInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let nanoid = (size = 21) => {
      let id = '';
      let bytes = crypto.getRandomValues(new Uint8Array(size));
      while (size--) {
        let byte = bytes[size] & 63;
        if (byte < 36) {
          id += byte.toString(36);
        } else if (byte < 62) {
          id += (byte - 26).toString(36).toUpperCase();
        } else if (byte < 63) {
          id += '_';
        } else {
          id += '-';
        }
      }
      return id
    };

    /* src\lib\fields\textfield\TextField.svelte generated by Svelte v3.46.4 */

    const { console: console_1 } = globals;
    const file = "src\\lib\\fields\\textfield\\TextField.svelte";

    // (13:4) {#if floatingLabelContent !== ""}
    function create_if_block_1(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*floatingLabelContent*/ ctx[5]);
    			attr_dev(label_1, "for", /*id*/ ctx[1]);
    			attr_dev(label_1, "class", "svelte-1qgilwf");
    			add_location(label_1, file, 13, 6, 362);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*id*/ 2) {
    				attr_dev(label_1, "for", /*id*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(13:4) {#if floatingLabelContent !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (28:2) {#if inputError?.message}
    function create_if_block(ctx) {
    	let div;
    	let t_value = /*inputError*/ ctx[4].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "info-bottom svelte-1qgilwf");
    			add_location(div, file, 28, 4, 674);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*inputError*/ 16 && t_value !== (t_value = /*inputError*/ ctx[4].message + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(28:2) {#if inputError?.message}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let div1;
    	let t0;
    	let div0;
    	let t2;
    	let input;
    	let t3;
    	let mounted;
    	let dispose;
    	let if_block0 = /*floatingLabelContent*/ ctx[5] !== "" && create_if_block_1(ctx);
    	let if_block1 = /*inputError*/ ctx[4]?.message && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div0 = element("div");
    			div0.textContent = "info top";
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "info-top svelte-1qgilwf");
    			add_location(div0, file, 17, 4, 443);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", /*name*/ ctx[0]);
    			attr_dev(input, "id", /*id*/ ctx[1]);
    			input.value = /*value*/ ctx[2];
    			attr_dev(input, "class", "svelte-1qgilwf");
    			add_location(input, file, 18, 4, 485);
    			attr_dev(div1, "class", "input-wrapper svelte-1qgilwf");
    			add_location(div1, file, 11, 2, 288);
    			attr_dev(div2, "class", "text-input svelte-1qgilwf");
    			add_location(div2, file, 10, 0, 260);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div1, t2);
    			append_dev(div1, input);
    			append_dev(div2, t3);
    			if (if_block1) if_block1.m(div2, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						input,
    						"change",
    						function () {
    							if (is_function(/*onChange*/ ctx[3])) /*onChange*/ ctx[3].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(input, "invalid", /*invalid_handler*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (/*floatingLabelContent*/ ctx[5] !== "") if_block0.p(ctx, dirty);

    			if (dirty & /*name*/ 1) {
    				attr_dev(input, "name", /*name*/ ctx[0]);
    			}

    			if (dirty & /*id*/ 2) {
    				attr_dev(input, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*value*/ 4 && input.value !== /*value*/ ctx[2]) {
    				prop_dev(input, "value", /*value*/ ctx[2]);
    			}

    			if (/*inputError*/ ctx[4]?.message) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextField', slots, []);
    	let { label = "" } = $$props;
    	let { name } = $$props;
    	let { id = `text-field-${nanoid}` } = $$props;
    	let { value = "" } = $$props;
    	let { onChange } = $$props;
    	let { inputError = null } = $$props;
    	let floatingLabelContent = label;
    	const writable_props = ['label', 'name', 'id', 'value', 'onChange', 'inputError'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<TextField> was created with unknown prop '${key}'`);
    	});

    	const invalid_handler = e => console.log(e);

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(6, label = $$props.label);
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('value' in $$props) $$invalidate(2, value = $$props.value);
    		if ('onChange' in $$props) $$invalidate(3, onChange = $$props.onChange);
    		if ('inputError' in $$props) $$invalidate(4, inputError = $$props.inputError);
    	};

    	$$self.$capture_state = () => ({
    		nanoid,
    		label,
    		name,
    		id,
    		value,
    		onChange,
    		inputError,
    		floatingLabelContent
    	});

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(6, label = $$props.label);
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('value' in $$props) $$invalidate(2, value = $$props.value);
    		if ('onChange' in $$props) $$invalidate(3, onChange = $$props.onChange);
    		if ('inputError' in $$props) $$invalidate(4, inputError = $$props.inputError);
    		if ('floatingLabelContent' in $$props) $$invalidate(5, floatingLabelContent = $$props.floatingLabelContent);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		id,
    		value,
    		onChange,
    		inputError,
    		floatingLabelContent,
    		label,
    		invalid_handler
    	];
    }

    class TextField extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			label: 6,
    			name: 0,
    			id: 1,
    			value: 2,
    			onChange: 3,
    			inputError: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextField",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console_1.warn("<TextField> was created without expected prop 'name'");
    		}

    		if (/*onChange*/ ctx[3] === undefined && !('onChange' in props)) {
    			console_1.warn("<TextField> was created without expected prop 'onChange'");
    		}
    	}

    	get label() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onChange() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputError() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputError(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\lib\fields\textfield\TextFieldSsf.svelte generated by Svelte v3.46.4 */

    // (6:0) <BaseInput    name={elementDefinition.name}    identfier={elementDefinition.identifier}    let:inputValue    let:onChange    let:inputError  >
    function create_default_slot(ctx) {
    	let textfield;
    	let current;

    	textfield = new TextField({
    			props: {
    				onChange: /*onChange*/ ctx[2],
    				value: /*inputValue*/ ctx[1],
    				name: /*elementDefinition*/ ctx[0].name,
    				inputError: /*inputError*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textfield.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textfield, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const textfield_changes = {};
    			if (dirty & /*onChange*/ 4) textfield_changes.onChange = /*onChange*/ ctx[2];
    			if (dirty & /*inputValue*/ 2) textfield_changes.value = /*inputValue*/ ctx[1];
    			if (dirty & /*elementDefinition*/ 1) textfield_changes.name = /*elementDefinition*/ ctx[0].name;
    			if (dirty & /*inputError*/ 8) textfield_changes.inputError = /*inputError*/ ctx[3];
    			textfield.$set(textfield_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textfield, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(6:0) <BaseInput    name={elementDefinition.name}    identfier={elementDefinition.identifier}    let:inputValue    let:onChange    let:inputError  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let baseinput;
    	let current;

    	baseinput = new BaseInput({
    			props: {
    				name: /*elementDefinition*/ ctx[0].name,
    				identfier: /*elementDefinition*/ ctx[0].identifier,
    				$$slots: {
    					default: [
    						create_default_slot,
    						({ inputValue, onChange, inputError }) => ({
    							1: inputValue,
    							2: onChange,
    							3: inputError
    						}),
    						({ inputValue, onChange, inputError }) => (inputValue ? 2 : 0) | (onChange ? 4 : 0) | (inputError ? 8 : 0)
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(baseinput.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(baseinput, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const baseinput_changes = {};
    			if (dirty & /*elementDefinition*/ 1) baseinput_changes.name = /*elementDefinition*/ ctx[0].name;
    			if (dirty & /*elementDefinition*/ 1) baseinput_changes.identfier = /*elementDefinition*/ ctx[0].identifier;

    			if (dirty & /*$$scope, onChange, inputValue, elementDefinition, inputError*/ 31) {
    				baseinput_changes.$$scope = { dirty, ctx };
    			}

    			baseinput.$set(baseinput_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(baseinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(baseinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(baseinput, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextFieldSsf', slots, []);
    	let { elementDefinition } = $$props;
    	const writable_props = ['elementDefinition'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextFieldSsf> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('elementDefinition' in $$props) $$invalidate(0, elementDefinition = $$props.elementDefinition);
    	};

    	$$self.$capture_state = () => ({ BaseInput, TextField, elementDefinition });

    	$$self.$inject_state = $$props => {
    		if ('elementDefinition' in $$props) $$invalidate(0, elementDefinition = $$props.elementDefinition);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [elementDefinition];
    }

    class TextFieldSsf extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { elementDefinition: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextFieldSsf",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*elementDefinition*/ ctx[0] === undefined && !('elementDefinition' in props)) {
    			console.warn("<TextFieldSsf> was created without expected prop 'elementDefinition'");
    		}
    	}

    	get elementDefinition() {
    		throw new Error("<TextFieldSsf>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elementDefinition(value) {
    		throw new Error("<TextFieldSsf>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const formDefinition = formDefinitionData;
    const app = new SchemaForm({
        target: document.body,
        props: {
            formSchema: formDefinition,
            elementsMap: {
                Text: TextFieldSsf,
                Email: TextFieldSsf,
            }
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
