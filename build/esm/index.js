
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
function noop() { }
function is_promise(value) {
    return value && typeof value === 'object' && typeof value.then === 'function';
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
function validate_store(store, name) {
    if (store != null && typeof store.subscribe !== 'function') {
        throw new Error(`'${name}' is not a store with a 'subscribe' method`);
    }
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
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
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
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
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_input_value(input, value) {
    input.value = value == null ? '' : value;
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
}
function select_value(select) {
    const selected_option = select.querySelector(':checked') || select.options[0];
    return selected_option && selected_option.__value;
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
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
function beforeUpdate(fn) {
    get_current_component().$$.before_update.push(fn);
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
    get_current_component().$$.after_update.push(fn);
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
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
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
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
    flushing = false;
    seen_callbacks.clear();
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

function handle_promise(promise, info) {
    const token = info.token = {};
    function update(type, index, key, value) {
        if (info.token !== token)
            return;
        info.resolved = value;
        let child_ctx = info.ctx;
        if (key !== undefined) {
            child_ctx = child_ctx.slice();
            child_ctx[key] = value;
        }
        const block = type && (info.current = type)(child_ctx);
        let needs_flush = false;
        if (info.block) {
            if (info.blocks) {
                info.blocks.forEach((block, i) => {
                    if (i !== index && block) {
                        group_outros();
                        transition_out(block, 1, 1, () => {
                            if (info.blocks[i] === block) {
                                info.blocks[i] = null;
                            }
                        });
                        check_outros();
                    }
                });
            }
            else {
                info.block.d(1);
            }
            block.c();
            transition_in(block, 1);
            block.m(info.mount(), info.anchor);
            needs_flush = true;
        }
        info.block = block;
        if (info.blocks)
            info.blocks[index] = block;
        if (needs_flush) {
            flush();
        }
    }
    if (is_promise(promise)) {
        const current_component = get_current_component();
        promise.then(value => {
            set_current_component(current_component);
            update(info.then, 1, info.value, value);
            set_current_component(null);
        }, error => {
            set_current_component(current_component);
            update(info.catch, 2, info.error, error);
            set_current_component(null);
            if (!info.hasCatch) {
                throw error;
            }
        });
        // if we previously had a then/catch block, destroy it
        if (info.current !== info.pending) {
            update(info.pending, 0);
            return true;
        }
    }
    else {
        if (info.current !== info.then) {
            update(info.then, 1, info.value, promise);
            return true;
        }
        info.resolved = promise;
    }
}

const globals = (typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
        ? globalThis
        : global);

function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== undefined) {
        component.$$.bound[index] = callback;
        callback(component.$$.ctx[index]);
    }
}
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
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
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
    document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
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
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (let i = 0; i < subscribers.length; i += 1) {
                    const s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
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
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

const domain = writable('');
const appKey = writable('');
const refreshToken = writable('');
const accessToken = writable('');
const searchTerm = writable('');
const format = writable('preview');
const v1 = writable(false);
const modal = writable(true);
const language = writable('en');

class API {

  accessToken = '';
  refreshToken = '';
  domain = '';
  appKey = '';
  v1 = false;

  constructor(
  ) {
    domain.subscribe(value => this.domain = value);
    appKey.subscribe(value => this.appKey = value);
    refreshToken.subscribe(value => this.refreshToken = value);
    accessToken.subscribe(value => this.accessToken = value);
    v1.subscribe(value => this.v1 = value);
  }

  get(path, parameters = {}, useAccessToken = true, additionalHeaders = null, setDefaultHeader = true, useURLSearchParams = true)  {
    return this.call('get', path, parameters, useAccessToken, additionalHeaders, setDefaultHeader, useURLSearchParams);
  }

  post(path, parameters = {}, useAccessToken = true, additionalHeaders = null, setDefaultHeader = true, useURLSearchParams = true) {
    return this.call('post', path, parameters, useAccessToken, additionalHeaders, setDefaultHeader, useURLSearchParams);
  }

  put(path, parameters = {}, useAccessToken = true, additionalHeaders = null, setDefaultHeader = true, useURLSearchParams = true) {
    return this.call('put', path, parameters, useAccessToken, additionalHeaders, setDefaultHeader, useURLSearchParams);
  }

  delete(path, parameters = {}, useAccessToken = true, additionalHeaders = null, setDefaultHeader = true, useURLSearchParams = true) {
    return this.call('delete', path, parameters, useAccessToken, additionalHeaders, setDefaultHeader, useURLSearchParams);
  }

  callAccessToken() {
    return new Promise((resolve, reject) => {
      let requestData = {
        refreshToken: this.refreshToken,
        applicationKey: this.appKey
      };

      if(this.v1) {
        requestData = {
          refreshToken: this.refreshToken,
          apiKey: this.appKey
        };
      }

      this.post('/accessToken', requestData, false)
      .then((data) => {
        if(data.success) {
          this.accessToken = data.accessToken;
          accessToken.update(() => data.accessToken);
          resolve();
        } else {
          reject();
        }
      }).catch(reject);
    })
    
  }

  call(method, path, parameters = {}, useAccessToken = true, additionalHeaders = null, setDefaultHeader = true, useURLSearchParams = true) {
    return new Promise((resolve, reject) => {
      const request = (requestData, headers) => {
        const url = 'https://' + this.domain.replace(/(http|https):\/\//, '') + (this.v1 ? '/cgi-bin/api/pixxio-api.pl/json' : '/gobackend') + path;
        if (this.v1 && this.accessToken) {
          requestData.accessToken = this.accessToken;
        }
        let params = requestData;
        if (useURLSearchParams) {
          params = new URLSearchParams();
          for (const key of Object.keys(requestData)) {
            let value = requestData[key];
            if (typeof value === 'object') {
              value = JSON.stringify(value);
            }
            params.set(key, value);
          }
          params = params.toString();
        }

        if (!headers) {
          headers = {};
        }
        if (setDefaultHeader) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        if (additionalHeaders) {
          headers = {...headers, ...additionalHeaders};
        }

        let observeCall = { url: url, request: { method: 'post', headers, body: params } };

        switch (method) {
          case 'get':
            observeCall = { url: url + '?' + params, request: { headers } };
            break;
          case 'put':
            observeCall = { url: url, request: { method: 'put', headers, body: params } };
            break;
          case 'delete':
            observeCall = { url: url, request: { method: 'delete', headers, body: params } };
            break;
        }

        fetch(observeCall.url, observeCall.request).then(data => data.json()).then((data) => {
          if (data.success === true || data.success === 'true') {
            resolve(data);
          } else {
            switch (data.errorcode) {
              case '2003':  // API v1
              case '2006':  // API v1
              case 15007:  // API v2
              case 15008:  // API v2
                // get new access Token and retry request
                this.callAccessToken().then(() => {
                  this.call(method, path, parameters).subscribe((newData) => {
                    resolve(newData);
                  });
                });
                break;
              case 5266:
                reject(data.errormessage);
                break;
              default:
                reject(data.errormessage);
                break;
            }
          }
        }).catch(error => reject());
      };

      if (useAccessToken) {
        const accessToken = this.accessToken;
        let headers = {};
        if (!this.v1) {
          headers = {  // API v2
            Authorization: 'Key ' + accessToken
          };
        } else {
          parameters.accessToken = accessToken;  // API v1
        }
        request(parameters, headers);
      } else {
        request(parameters);
      }
    });
  }
}

/* src/Logo.svelte generated by Svelte v3.35.0 */

const file$8 = "src/Logo.svelte";

function create_fragment$a(ctx) {
	let div1;
	let div0;
	let svg;
	let path0;
	let path1;
	let path2;
	let path3;
	let path4;
	let path5;
	let path6;
	let path7;

	const block = {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			svg = svg_element("svg");
			path0 = svg_element("path");
			path1 = svg_element("path");
			path2 = svg_element("path");
			path3 = svg_element("path");
			path4 = svg_element("path");
			path5 = svg_element("path");
			path6 = svg_element("path");
			path7 = svg_element("path");
			attr_dev(path0, "d", "M41.34 6.14a5.72 5.72 0 00-3.37-.97 5.54 5.54 0 00-3.33.97 4.9 4.9 0 00-1.07 1 1.58 1.58 0 00-1.58-1.59h-.18a.3.3 0 00-.3.31V24a.3.3 0 00.3.31h.42a1.61 1.61 0 001.61-1.61v-4.37a5.18 5.18 0 00.8.72 5.56 5.56 0 003.33 1 5.72 5.72 0 003.37-.96 6.59 6.59 0 002.17-2.65 8.96 8.96 0 00.76-3.79 8.85 8.85 0 00-.76-3.78 6.37 6.37 0 00-2.17-2.72zm0 9.15a4.11 4.11 0 01-1.37 1.89 3.6 3.6 0 01-2.3.69 3.63 3.63 0 01-3.69-2.58 8.39 8.39 0 01-.44-2.75 7.57 7.57 0 01.44-2.76 4.2 4.2 0 011.34-1.85 3.63 3.63 0 012.28-.66 3.96 3.96 0 012.37.69 4.3 4.3 0 011.38 1.9 7.32 7.32 0 01.44 2.68 7.45 7.45 0 01-.45 2.75z");
			add_location(path0, file$8, 6, 8, 150);
			attr_dev(path1, "d", "M47.44 19.9h1.69a.3.3 0 00.31-.3V6.18a.3.3 0 00-.31-.3h-1.69a.3.3 0 00-.31.3V19.6a.3.3 0 00.31.3z");
			add_location(path1, file$8, 7, 8, 768);
			attr_dev(path2, "d", "M81.31 15.38h1.7a.3.3 0 00.3-.31V6.26a.3.3 0 00-.3-.31h-1.7a.3.3 0 00-.3.31v8.8a.3.3 0 00.3.32z");
			add_location(path2, file$8, 8, 8, 886);
			attr_dev(path3, "d", "M64.36 5.84h-1.97a.31.31 0 00-.27.14L58.4 11l-3.75-5.02a.44.44 0 00-.24-.14h-1.96a.31.31 0 00-.24.51l4.89 6.44-5 6.6a.32.32 0 00.25.52h1.96a.23.23 0 00.24-.14l3.85-5.2 3.86 5.23a.42.42 0 00.27.14h1.96a.31.31 0 00.24-.52l-4.99-6.6 4.89-6.44a.35.35 0 00-.27-.54z");
			add_location(path3, file$8, 9, 8, 1002);
			attr_dev(path4, "d", "M77.98 5.84h-1.96a.31.31 0 00-.28.14L72.03 11l-3.75-5.02a.44.44 0 00-.24-.14h-1.97a.31.31 0 00-.24.51l4.89 6.44-5.02 6.6a.32.32 0 00.24.52h1.96a.23.23 0 00.24-.14l3.85-5.2 3.86 5.2a.42.42 0 00.27.14h1.96a.31.31 0 00.24-.52l-4.99-6.6 4.89-6.44a.31.31 0 00-.24-.51z");
			add_location(path4, file$8, 10, 8, 1283);
			attr_dev(path5, "d", "M99.2 9.04a6.16 6.16 0 00-2.33-2.62 6.94 6.94 0 00-3.65-.96 6.68 6.68 0 00-3.58.93A6.26 6.26 0 0087.27 9a8.63 8.63 0 00-.83 3.9 8.58 8.58 0 00.83 3.84 6.4 6.4 0 002.34 2.62 7.37 7.37 0 007.22.03 6.16 6.16 0 002.34-2.61 8.63 8.63 0 00.83-3.89 8.05 8.05 0 00-.8-3.85zm-2.71 7.6a3.77 3.77 0 01-3.24 1.44 3.86 3.86 0 01-3.23-1.44 6.21 6.21 0 01-1.1-3.82 7.37 7.37 0 01.48-2.72 3.8 3.8 0 011.41-1.82 4.06 4.06 0 012.41-.66 3.84 3.84 0 013.23 1.41 6.1 6.1 0 011.07 3.79 5.92 5.92 0 01-1.03 3.82z");
			add_location(path5, file$8, 11, 8, 1567);
			attr_dev(path6, "class", "logoIcon svelte-fa509d");
			attr_dev(path6, "d", "M81.31 19.77h1.7a.3.3 0 00.3-.31v-1.68a.3.3 0 00-.3-.31h-1.7a.3.3 0 00-.3.3v1.7a.3.3 0 00.3.3z");
			add_location(path6, file$8, 12, 8, 2077);
			attr_dev(path7, "class", "logoIcon svelte-fa509d");
			attr_dev(path7, "d", "M13.18 25.78a13.48 13.48 0 01-6.75-1.82l-.68-.4v-3.4H2.27l-.41-.67A12.76 12.76 0 010 12.9 13.06 13.06 0 0113.18 0a13.06 13.06 0 0113.18 12.9 13.06 13.06 0 01-13.18 12.88zm-4.61-3.8a10.27 10.27 0 004.6 1.04A10.26 10.26 0 0023.54 12.9 10.23 10.23 0 0013.18 2.8 10.26 10.26 0 002.82 12.92a10.13 10.13 0 001.07 4.51h1.86v-4.5a7.37 7.37 0 017.43-7.28 7.37 7.37 0 017.43 7.27 7.37 7.37 0 01-7.43 7.27H8.57zm4.6-13.56a4.56 4.56 0 00-4.6 4.5v4.52h4.6a4.51 4.51 0 100-9.02z");
			add_location(path7, file$8, 13, 8, 2209);
			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr_dev(svg, "viewBox", "0 0 100 25.78");
			attr_dev(svg, "class", "svelte-fa509d");
			add_location(svg, file$8, 5, 6, 77);
			attr_dev(div0, "class", "header__logo svelte-fa509d");
			add_location(div0, file$8, 4, 2, 44);
			attr_dev(div1, "class", "header svelte-fa509d");
			add_location(div1, file$8, 3, 1, 21);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, div0);
			append_dev(div0, svg);
			append_dev(svg, path0);
			append_dev(svg, path1);
			append_dev(svg, path2);
			append_dev(svg, path3);
			append_dev(svg, path4);
			append_dev(svg, path5);
			append_dev(svg, path6);
			append_dev(svg, path7);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$a.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$a($$self, $$props) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Logo", slots, []);
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Logo> was created with unknown prop '${key}'`);
	});

	return [];
}

class Logo extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Logo",
			options,
			id: create_fragment$a.name
		});
	}
}

/* src/SearchField.svelte generated by Svelte v3.35.0 */
const file$7 = "src/SearchField.svelte";

function create_fragment$9(ctx) {
	let div1;
	let div0;
	let input_1;
	let t0;
	let label;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			input_1 = element("input");
			t0 = space();
			label = element("label");
			label.textContent = "Search";
			attr_dev(input_1, "id", "pixxio-search");
			attr_dev(input_1, "type", "text");
			attr_dev(input_1, "placeholder", " ");
			attr_dev(input_1, "class", "svelte-gmuv5t");
			add_location(input_1, file$7, 19, 4, 336);
			attr_dev(label, "for", "pixxio-search");
			attr_dev(label, "class", "svelte-gmuv5t");
			add_location(label, file$7, 20, 4, 433);
			attr_dev(div0, "class", "field svelte-gmuv5t");
			add_location(div0, file$7, 18, 2, 312);
			attr_dev(div1, "class", "searchField fields svelte-gmuv5t");
			add_location(div1, file$7, 17, 0, 277);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, div0);
			append_dev(div0, input_1);
			set_input_value(input_1, /*value*/ ctx[0]);
			append_dev(div0, t0);
			append_dev(div0, label);

			if (!mounted) {
				dispose = [
					listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[2]),
					listen_dev(input_1, "input", /*input*/ ctx[1], false, false, false)
				];

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*value*/ 1 && input_1.value !== /*value*/ ctx[0]) {
				set_input_value(input_1, /*value*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$9.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$9($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("SearchField", slots, []);
	let { value = "" } = $$props;
	let timeout = null;

	const input = () => {
		if (timeout) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(
			() => {
				searchTerm.update(() => value);
			},
			200
		);
	};

	const writable_props = ["value"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SearchField> was created with unknown prop '${key}'`);
	});

	function input_1_input_handler() {
		value = this.value;
		$$invalidate(0, value);
	}

	$$self.$$set = $$props => {
		if ("value" in $$props) $$invalidate(0, value = $$props.value);
	};

	$$self.$capture_state = () => ({ searchTerm, value, timeout, input });

	$$self.$inject_state = $$props => {
		if ("value" in $$props) $$invalidate(0, value = $$props.value);
		if ("timeout" in $$props) timeout = $$props.timeout;
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [value, input, input_1_input_handler];
}

class SearchField extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$9, create_fragment$9, safe_not_equal, { value: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "SearchField",
			options,
			id: create_fragment$9.name
		});
	}

	get value() {
		throw new Error("<SearchField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<SearchField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

function lang(key) {

  let lang = 'en';
  language.subscribe(value => lang = value);

  const lines = {
    de: {
      mediaspace: 'Mediaspace (example.px.media)',
      username: 'Username oder E-Mail',
      password: 'Passwort',
      signin: 'Anmelden',
      signin_description: 'Bitte melde dich in dein pixxio System an um Dateien auszuwählen.',
      signin_error: 'Ungültiger Benutzer oder Passwort',
      cancel: 'Abbrechen',
      select: 'Auswählen',
      selected: 'ausgewählt',
      please_select: 'Format wählen',
      original: 'Original',
      preview: 'Vorschau',
      logged_in_as: 'Du bist angemeldet als: ',
      logout: 'Ausloggen'
    },
    en: {
      mediaspace: 'Mediaspace (example.px.media)',
      username: 'Username or email',
      password: 'Password',
      signin: 'Sign in',
      signin_description: 'Please sign in to your pixxio system to select files.',
      signin_error: 'Invalid username or password',
      cancel: 'Cancel',
      select: 'Select',
      selected: 'selected',
      please_select: 'Choose a format',
      original: 'Original',
      preview: 'Preview',
      logged_in_as: 'You are logged in as: ',
      logout: 'Logout'
    }
  };
  return lines[lang || 'en'][key];
}

/* src/Loading.svelte generated by Svelte v3.35.0 */
const file$6 = "src/Loading.svelte";

function create_fragment$8(ctx) {
	let div1;
	let div0;
	let svg;
	let path;

	const block = {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			svg = svg_element("svg");
			path = svg_element("path");
			attr_dev(path, "stroke", "black");
			attr_dev(path, "stroke-width", "5");
			attr_dev(path, "d", "M24.76 50.76v-13c0-7.17 5.94-13 13.25-13s13.25 5.83 13.25 13c0 7.18-5.94 13-13.25 13H26.27l-11.17.38s-3.34-8.2-3.34-12.88a26.51 26.51 0 0126.5-26.5 26.51 26.51 0 0126.5 26.5 26.51 26.51 0 01-26.5 26.5c-4.85 0-9.58-1.3-13.5-3.6z");
			attr_dev(path, "fill", "none");
			attr_dev(path, "class", "svelte-2yi7ym");
			add_location(path, file$6, 6, 86, 183);
			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr_dev(svg, "id", "pixxioIcon");
			attr_dev(svg, "viewBox", "0 0 76.52 76.52");
			attr_dev(svg, "class", "svelte-2yi7ym");
			add_location(svg, file$6, 6, 4, 101);
			attr_dev(div0, "class", "svelte-2yi7ym");
			add_location(div0, file$6, 5, 2, 91);
			attr_dev(div1, "id", "pixxio-ta-loading");
			attr_dev(div1, "class", "svelte-2yi7ym");
			add_location(div1, file$6, 4, 0, 60);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, div0);
			append_dev(div0, svg);
			append_dev(svg, path);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$8.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$8($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Loading", slots, []);
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Loading> was created with unknown prop '${key}'`);
	});

	$$self.$capture_state = () => ({ lang });
	return [];
}

class Loading extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Loading",
			options,
			id: create_fragment$8.name
		});
	}
}

/* src/Login.svelte generated by Svelte v3.35.0 */

const { Error: Error_1$2, Object: Object_1$1 } = globals;
const file$5 = "src/Login.svelte";

// (139:2) {#if !domainVal}
function create_if_block_2$2(ctx) {
	let div;
	let input;
	let t0;
	let label;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			div = element("div");
			input = element("input");
			t0 = space();
			label = element("label");
			label.textContent = `${lang("mediaspace")}`;
			attr_dev(input, "id", "pixxio-mediaspace");
			input.disabled = /*isLoading*/ ctx[3];
			attr_dev(input, "type", "text");
			attr_dev(input, "placeholder", " ");
			attr_dev(input, "class", "svelte-1jz1fis");
			add_location(input, file$5, 140, 4, 3629);
			attr_dev(label, "for", "pixxio-mediaspace");
			attr_dev(label, "class", "svelte-1jz1fis");
			add_location(label, file$5, 141, 4, 3741);
			attr_dev(div, "class", "field svelte-1jz1fis");
			add_location(div, file$5, 139, 2, 3605);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, input);
			set_input_value(input, /*mediaspace*/ ctx[4]);
			append_dev(div, t0);
			append_dev(div, label);

			if (!mounted) {
				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[14]);
				mounted = true;
			}
		},
		p: function update(ctx, dirty) {
			if (dirty & /*isLoading*/ 8) {
				prop_dev(input, "disabled", /*isLoading*/ ctx[3]);
			}

			if (dirty & /*mediaspace*/ 16 && input.value !== /*mediaspace*/ ctx[4]) {
				set_input_value(input, /*mediaspace*/ ctx[4]);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2$2.name,
		type: "if",
		source: "(139:2) {#if !domainVal}",
		ctx
	});

	return block;
}

// (153:2) {#if hasError}
function create_if_block_1$3(ctx) {
	let small;

	const block = {
		c: function create() {
			small = element("small");
			small.textContent = `${lang("signin_error")}`;
			attr_dev(small, "class", "error svelte-1jz1fis");
			add_location(small, file$5, 153, 2, 4239);
		},
		m: function mount(target, anchor) {
			insert_dev(target, small, anchor);
		},
		p: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(small);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$3.name,
		type: "if",
		source: "(153:2) {#if hasError}",
		ctx
	});

	return block;
}

// (160:2) {#if isLoading}
function create_if_block$5(ctx) {
	let loading;
	let current;
	loading = new Loading({ $$inline: true });

	const block = {
		c: function create() {
			create_component(loading.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(loading, target, anchor);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(loading.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(loading.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(loading, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$5.name,
		type: "if",
		source: "(160:2) {#if isLoading}",
		ctx
	});

	return block;
}

function create_fragment$7(ctx) {
	let div3;
	let h2;
	let t1;
	let p;
	let t3;
	let t4;
	let div0;
	let input0;
	let t5;
	let label0;
	let t7;
	let div1;
	let input1;
	let t8;
	let label1;
	let t10;
	let t11;
	let div2;
	let button0;
	let t13;
	let button1;
	let t14_value = lang("signin") + "";
	let t14;
	let t15;
	let current;
	let mounted;
	let dispose;
	let if_block0 = !/*domainVal*/ ctx[5] && create_if_block_2$2(ctx);
	let if_block1 = /*hasError*/ ctx[2] && create_if_block_1$3(ctx);
	let if_block2 = /*isLoading*/ ctx[3] && create_if_block$5(ctx);

	const block = {
		c: function create() {
			div3 = element("div");
			h2 = element("h2");
			h2.textContent = `${lang("signin")}`;
			t1 = space();
			p = element("p");
			p.textContent = `${lang("signin_description")}`;
			t3 = space();
			if (if_block0) if_block0.c();
			t4 = space();
			div0 = element("div");
			input0 = element("input");
			t5 = space();
			label0 = element("label");
			label0.textContent = `${lang("username")}`;
			t7 = space();
			div1 = element("div");
			input1 = element("input");
			t8 = space();
			label1 = element("label");
			label1.textContent = `${lang("password")}`;
			t10 = space();
			if (if_block1) if_block1.c();
			t11 = space();
			div2 = element("div");
			button0 = element("button");
			button0.textContent = `${lang("cancel")}`;
			t13 = space();
			button1 = element("button");
			t14 = text(t14_value);
			t15 = space();
			if (if_block2) if_block2.c();
			attr_dev(h2, "class", "svelte-1jz1fis");
			add_location(h2, file$5, 136, 2, 3520);
			attr_dev(p, "class", "svelte-1jz1fis");
			add_location(p, file$5, 137, 2, 3548);
			attr_dev(input0, "id", "pixxio-username");
			input0.disabled = /*isLoading*/ ctx[3];
			attr_dev(input0, "type", "text");
			attr_dev(input0, "placeholder", " ");
			attr_dev(input0, "class", "svelte-1jz1fis");
			add_location(input0, file$5, 145, 4, 3844);
			attr_dev(label0, "for", "pixxio-username");
			attr_dev(label0, "class", "svelte-1jz1fis");
			add_location(label0, file$5, 146, 4, 3952);
			attr_dev(div0, "class", "field svelte-1jz1fis");
			add_location(div0, file$5, 144, 2, 3820);
			attr_dev(input1, "id", "pixxio-password");
			input1.disabled = /*isLoading*/ ctx[3];
			attr_dev(input1, "type", "password");
			attr_dev(input1, "placeholder", " ");
			attr_dev(input1, "class", "svelte-1jz1fis");
			add_location(input1, file$5, 149, 4, 4043);
			attr_dev(label1, "for", "pixxio-password");
			attr_dev(label1, "class", "svelte-1jz1fis");
			add_location(label1, file$5, 150, 4, 4155);
			attr_dev(div1, "class", "field svelte-1jz1fis");
			add_location(div1, file$5, 148, 2, 4019);
			attr_dev(button0, "class", "button button--secondary svelte-1jz1fis");
			add_location(button0, file$5, 156, 4, 4331);
			attr_dev(button1, "class", "button svelte-1jz1fis");
			attr_dev(button1, "type", "submit");
			button1.disabled = /*isLoading*/ ctx[3];
			add_location(button1, file$5, 157, 4, 4420);
			attr_dev(div2, "class", "buttonGroup svelte-1jz1fis");
			add_location(div2, file$5, 155, 2, 4301);
			attr_dev(div3, "class", "login fields svelte-1jz1fis");
			toggle_class(div3, "no-modal", !/*$modal*/ ctx[7]);
			add_location(div3, file$5, 135, 0, 3464);
		},
		l: function claim(nodes) {
			throw new Error_1$2("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div3, anchor);
			append_dev(div3, h2);
			append_dev(div3, t1);
			append_dev(div3, p);
			append_dev(div3, t3);
			if (if_block0) if_block0.m(div3, null);
			append_dev(div3, t4);
			append_dev(div3, div0);
			append_dev(div0, input0);
			set_input_value(input0, /*username*/ ctx[0]);
			append_dev(div0, t5);
			append_dev(div0, label0);
			append_dev(div3, t7);
			append_dev(div3, div1);
			append_dev(div1, input1);
			set_input_value(input1, /*password*/ ctx[1]);
			append_dev(div1, t8);
			append_dev(div1, label1);
			append_dev(div3, t10);
			if (if_block1) if_block1.m(div3, null);
			append_dev(div3, t11);
			append_dev(div3, div2);
			append_dev(div2, button0);
			append_dev(div2, t13);
			append_dev(div2, button1);
			append_dev(button1, t14);
			append_dev(div3, t15);
			if (if_block2) if_block2.m(div3, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen_dev(input0, "input", /*input0_input_handler*/ ctx[15]),
					listen_dev(input1, "input", /*input1_input_handler*/ ctx[16]),
					listen_dev(button0, "click", /*cancel*/ ctx[10], false, false, false),
					listen_dev(
						button1,
						"click",
						function () {
							if (is_function(/*version1*/ ctx[6]
							? /*loginV1*/ ctx[9]
							: /*login*/ ctx[8])) (/*version1*/ ctx[6]
							? /*loginV1*/ ctx[9]
							: /*login*/ ctx[8]).apply(this, arguments);
						},
						false,
						false,
						false
					)
				];

				mounted = true;
			}
		},
		p: function update(new_ctx, [dirty]) {
			ctx = new_ctx;

			if (!/*domainVal*/ ctx[5]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_2$2(ctx);
					if_block0.c();
					if_block0.m(div3, t4);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (!current || dirty & /*isLoading*/ 8) {
				prop_dev(input0, "disabled", /*isLoading*/ ctx[3]);
			}

			if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
				set_input_value(input0, /*username*/ ctx[0]);
			}

			if (!current || dirty & /*isLoading*/ 8) {
				prop_dev(input1, "disabled", /*isLoading*/ ctx[3]);
			}

			if (dirty & /*password*/ 2 && input1.value !== /*password*/ ctx[1]) {
				set_input_value(input1, /*password*/ ctx[1]);
			}

			if (/*hasError*/ ctx[2]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_1$3(ctx);
					if_block1.c();
					if_block1.m(div3, t11);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (!current || dirty & /*isLoading*/ 8) {
				prop_dev(button1, "disabled", /*isLoading*/ ctx[3]);
			}

			if (/*isLoading*/ ctx[3]) {
				if (if_block2) {
					if (dirty & /*isLoading*/ 8) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block$5(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(div3, null);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}

			if (dirty & /*$modal*/ 128) {
				toggle_class(div3, "no-modal", !/*$modal*/ ctx[7]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block2);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block2);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div3);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$7.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$7($$self, $$props, $$invalidate) {
	let domainVal;
	let appKeyVal;
	let version1;
	let $domain;
	let $appKey;
	let $v1;
	let $modal;
	validate_store(domain, "domain");
	component_subscribe($$self, domain, $$value => $$invalidate(11, $domain = $$value));
	validate_store(appKey, "appKey");
	component_subscribe($$self, appKey, $$value => $$invalidate(12, $appKey = $$value));
	validate_store(v1, "v1");
	component_subscribe($$self, v1, $$value => $$invalidate(13, $v1 = $$value));
	validate_store(modal, "modal");
	component_subscribe($$self, modal, $$value => $$invalidate(7, $modal = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Login", slots, []);
	const dispatch = createEventDispatcher();
	const api = new API();
	let username = "";
	let password = "";
	let hasError = false;
	let isLoading = false;
	let mediaspace = "";

	/**
 * check if there is a refreshToken in storage
 */
	const token = sessionStorage.getItem("refreshToken");

	mediaspace = sessionStorage.getItem("domain");

	if (mediaspace) {
		domain.update(() => mediaspace);
	}

	if (token && (domainVal || mediaspace)) {
		isLoading = true;
		refreshToken.update(() => token);

		api.callAccessToken().then(() => {
			$$invalidate(3, isLoading = false);
			dispatch("authenticated");
		}).catch(e => {
			refreshToken.update(() => "");
			$$invalidate(3, isLoading = false);
		});
	}

	let handleLogin = null;

	const login = async () => {
		$$invalidate(3, isLoading = true);
		$$invalidate(2, hasError = false);

		try {
			const formData = new FormData();
			formData.set("applicationKey", appKeyVal);
			formData.set("userNameOrEmail", username);
			formData.set("password", password);
			const data = await fetch(`https://${mediaspace}/gobackend/login`, { method: "POST", body: formData });
			const response = await data.json();
			$$invalidate(3, isLoading = false);

			if (!response.success) {
				$$invalidate(2, hasError = true);
				throw new Error();
			}

			// store refreshToken 
			refreshToken.update(() => response.refreshToken);

			domain.update(() => mediaspace);
			sessionStorage.setItem("domain", mediaspace);
			sessionStorage.setItem("refreshToken", response.refreshToken);

			api.callAccessToken().then(() => {
				dispatch("authenticated");
			});
		} catch(error) {
			$$invalidate(3, isLoading = false);
			$$invalidate(2, hasError = true);
		}
	};

	const loginV1 = async () => {
		$$invalidate(3, isLoading = true);
		$$invalidate(2, hasError = false);

		try {
			const formData = new FormData();
			formData.set("apiKey", appKeyVal);
			formData.set("options", JSON.stringify({ username, password }));

			const requestData = {
				apiKey: appKeyVal,
				options: { username, password }
			};

			let params = new URLSearchParams();

			for (const key of Object.keys(requestData)) {
				let value = requestData[key];

				if (typeof value === "object") {
					value = JSON.stringify(value);
				}

				params.set(key, value);
			}

			params = params.toString();

			const data = await fetch(`${domainVal}/cgi-bin/api/pixxio-api.pl/json/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: params
			});

			const response = await data.json();
			$$invalidate(3, isLoading = false);

			if (response.success !== "true") {
				$$invalidate(2, hasError = true);
				throw new Error();
			}

			// store refreshToken 
			refreshToken.update(() => response.refreshToken);

			sessionStorage.setItem("refreshToken", response.refreshToken);

			api.callAccessToken().then(() => {
				dispatch("authenticated");
			});
		} catch(error) {
			$$invalidate(3, isLoading = false);
			$$invalidate(2, hasError = true);
		}
	};

	const cancel = () => {
		dispatch("cancel");
	};

	const writable_props = [];

	Object_1$1.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Login> was created with unknown prop '${key}'`);
	});

	function input_input_handler() {
		mediaspace = this.value;
		$$invalidate(4, mediaspace);
	}

	function input0_input_handler() {
		username = this.value;
		$$invalidate(0, username);
	}

	function input1_input_handler() {
		password = this.value;
		$$invalidate(1, password);
	}

	$$self.$capture_state = () => ({
		createEventDispatcher,
		lang,
		domain,
		appKey,
		refreshToken,
		v1,
		modal,
		API,
		Loading,
		dispatch,
		api,
		username,
		password,
		hasError,
		isLoading,
		mediaspace,
		token,
		handleLogin,
		login,
		loginV1,
		cancel,
		domainVal,
		$domain,
		appKeyVal,
		$appKey,
		version1,
		$v1,
		$modal
	});

	$$self.$inject_state = $$props => {
		if ("username" in $$props) $$invalidate(0, username = $$props.username);
		if ("password" in $$props) $$invalidate(1, password = $$props.password);
		if ("hasError" in $$props) $$invalidate(2, hasError = $$props.hasError);
		if ("isLoading" in $$props) $$invalidate(3, isLoading = $$props.isLoading);
		if ("mediaspace" in $$props) $$invalidate(4, mediaspace = $$props.mediaspace);
		if ("handleLogin" in $$props) handleLogin = $$props.handleLogin;
		if ("domainVal" in $$props) $$invalidate(5, domainVal = $$props.domainVal);
		if ("appKeyVal" in $$props) appKeyVal = $$props.appKeyVal;
		if ("version1" in $$props) $$invalidate(6, version1 = $$props.version1);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$domain*/ 2048) {
			$$invalidate(5, domainVal = $domain);
		}

		if ($$self.$$.dirty & /*$appKey*/ 4096) {
			appKeyVal = $appKey;
		}

		if ($$self.$$.dirty & /*$v1*/ 8192) {
			$$invalidate(6, version1 = $v1);
		}
	};

	return [
		username,
		password,
		hasError,
		isLoading,
		mediaspace,
		domainVal,
		version1,
		$modal,
		login,
		loginV1,
		cancel,
		$domain,
		$appKey,
		$v1,
		input_input_handler,
		input0_input_handler,
		input1_input_handler
	];
}

class Login extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Login",
			options,
			id: create_fragment$7.name
		});
	}
}

/* src/DownloadFormats.svelte generated by Svelte v3.35.0 */

const { Error: Error_1$1 } = globals;
const file$4 = "src/DownloadFormats.svelte";

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[14] = list[i];
	return child_ctx;
}

// (72:0) {#if !hideDropdown}
function create_if_block$4(ctx) {
	let div1;
	let div0;
	let select_1;
	let if_block0_anchor;
	let if_block1_anchor;
	let t0;
	let label;
	let mounted;
	let dispose;
	let if_block0 = /*showPreview*/ ctx[4] && create_if_block_2$1(ctx);
	let if_block1 = /*showOriginal*/ ctx[3] && create_if_block_1$2(ctx);
	let each_value = /*formats*/ ctx[1];
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	const block = {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			select_1 = element("select");
			if (if_block0) if_block0.c();
			if_block0_anchor = empty();
			if (if_block1) if_block1.c();
			if_block1_anchor = empty();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t0 = space();
			label = element("label");
			label.textContent = `${lang("please_select")}`;
			attr_dev(select_1, "name", "");
			attr_dev(select_1, "id", "pixxioDownloadFormats__dropdown");
			attr_dev(select_1, "placeholder", " ");
			attr_dev(select_1, "class", "svelte-1x1v299");
			if (/*selected*/ ctx[0] === void 0) add_render_callback(() => /*select_1_change_handler*/ ctx[7].call(select_1));
			add_location(select_1, file$4, 74, 4, 1934);
			attr_dev(label, "for", "pixxioDownloadFormats__dropdown");
			attr_dev(label, "class", "svelte-1x1v299");
			add_location(label, file$4, 85, 4, 2351);
			attr_dev(div0, "class", "field svelte-1x1v299");
			add_location(div0, file$4, 73, 2, 1910);
			attr_dev(div1, "class", "downloadFormats fields svelte-1x1v299");
			add_location(div1, file$4, 72, 0, 1871);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, div0);
			append_dev(div0, select_1);
			if (if_block0) if_block0.m(select_1, null);
			append_dev(select_1, if_block0_anchor);
			if (if_block1) if_block1.m(select_1, null);
			append_dev(select_1, if_block1_anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select_1, null);
			}

			select_option(select_1, /*selected*/ ctx[0]);
			append_dev(div0, t0);
			append_dev(div0, label);

			if (!mounted) {
				dispose = [
					listen_dev(select_1, "change", /*select_1_change_handler*/ ctx[7]),
					listen_dev(select_1, "blur", /*select*/ ctx[5], false, false, false)
				];

				mounted = true;
			}
		},
		p: function update(ctx, dirty) {
			if (/*showPreview*/ ctx[4]) if_block0.p(ctx, dirty);
			if (/*showOriginal*/ ctx[3]) if_block1.p(ctx, dirty);

			if (dirty & /*formats*/ 2) {
				each_value = /*formats*/ ctx[1];
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select_1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty & /*selected, formats*/ 3) {
				select_option(select_1, /*selected*/ ctx[0]);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			destroy_each(each_blocks, detaching);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$4.name,
		type: "if",
		source: "(72:0) {#if !hideDropdown}",
		ctx
	});

	return block;
}

// (76:6) {#if showPreview}
function create_if_block_2$1(ctx) {
	let option;

	const block = {
		c: function create() {
			option = element("option");
			option.textContent = `${lang("preview")}`;
			option.__value = "preview";
			option.value = option.__value;
			add_location(option, file$4, 76, 6, 2073);
		},
		m: function mount(target, anchor) {
			insert_dev(target, option, anchor);
		},
		p: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(option);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2$1.name,
		type: "if",
		source: "(76:6) {#if showPreview}",
		ctx
	});

	return block;
}

// (79:6) {#if showOriginal}
function create_if_block_1$2(ctx) {
	let option;

	const block = {
		c: function create() {
			option = element("option");
			option.textContent = `${lang("original")}`;
			option.__value = "original";
			option.value = option.__value;
			add_location(option, file$4, 79, 6, 2167);
		},
		m: function mount(target, anchor) {
			insert_dev(target, option, anchor);
		},
		p: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(option);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$2.name,
		type: "if",
		source: "(79:6) {#if showOriginal}",
		ctx
	});

	return block;
}

// (82:6) {#each formats as format}
function create_each_block$2(ctx) {
	let option;
	let t_value = /*format*/ ctx[14].name + "";
	let t;
	let option_value_value;

	const block = {
		c: function create() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = /*format*/ ctx[14].id;
			option.value = option.__value;
			add_location(option, file$4, 82, 6, 2270);
		},
		m: function mount(target, anchor) {
			insert_dev(target, option, anchor);
			append_dev(option, t);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*formats*/ 2 && t_value !== (t_value = /*format*/ ctx[14].name + "")) set_data_dev(t, t_value);

			if (dirty & /*formats*/ 2 && option_value_value !== (option_value_value = /*format*/ ctx[14].id)) {
				prop_dev(option, "__value", option_value_value);
				option.value = option.__value;
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(option);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$2.name,
		type: "each",
		source: "(82:6) {#each formats as format}",
		ctx
	});

	return block;
}

function create_fragment$6(ctx) {
	let if_block_anchor;
	let if_block = !/*hideDropdown*/ ctx[2] && create_if_block$4(ctx);

	const block = {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		l: function claim(nodes) {
			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
		},
		p: function update(ctx, [dirty]) {
			if (!/*hideDropdown*/ ctx[2]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$4(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach_dev(if_block_anchor);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$6.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$6($$self, $$props, $$invalidate) {
	let hideDropdown;
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("DownloadFormats", slots, []);
	let { allowedFormats = null } = $$props;
	const dispatch = createEventDispatcher();
	const api = new API();
	let selected;
	let formats = [];
	let hasError = false;
	let isLoading = false;
	let showOriginal = allowedFormats === null || allowedFormats !== null && allowedFormats.includes("original");
	let showPreview = allowedFormats === null || allowedFormats !== null && allowedFormats.includes("preview");

	onMount(() => {
		if (allowedFormats && allowedFormats.length === 1) {
			$$invalidate(0, selected = allowedFormats[0]);
			format.update(() => allowedFormats[0]);
			$$invalidate(2, hideDropdown = true);
		} else {
			fetchDownloadFormats();
			select();
		}
	});

	const changes = () => {
		if (allowedFormats && allowedFormats.length === 1) {
			$$invalidate(0, selected = allowedFormats[0]);
			format.update(() => allowedFormats[0]);
			$$invalidate(2, hideDropdown = true);
		} else {
			fetchDownloadFormats();
			select();
		}
	};

	const select = () => {
		format.update(() => selected);
	};

	const fetchDownloadFormats = async () => {
		try {
			isLoading = true;
			const options = { responseFields: ["id", "name"] };
			const data = await api.get(`/downloadFormats`, options);

			if (!data.success) {
				throw new Error(data.errormessage);
			}

			$$invalidate(1, formats = data.downloadFormats.filter(format => allowedFormats === null || allowedFormats !== null && allowedFormats.includes(format.id)));
			isLoading = false;
		} catch(e) {
			hasError = true;
			isLoading = false;
		}
	};

	const writable_props = ["allowedFormats"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DownloadFormats> was created with unknown prop '${key}'`);
	});

	function select_1_change_handler() {
		selected = select_value(this);
		$$invalidate(0, selected);
		$$invalidate(1, formats);
	}

	$$self.$$set = $$props => {
		if ("allowedFormats" in $$props) $$invalidate(6, allowedFormats = $$props.allowedFormats);
	};

	$$self.$capture_state = () => ({
		afterUpdate,
		beforeUpdate,
		createEventDispatcher,
		onMount,
		API,
		format,
		lang,
		allowedFormats,
		dispatch,
		api,
		selected,
		formats,
		hasError,
		isLoading,
		showOriginal,
		showPreview,
		changes,
		select,
		fetchDownloadFormats,
		hideDropdown
	});

	$$self.$inject_state = $$props => {
		if ("allowedFormats" in $$props) $$invalidate(6, allowedFormats = $$props.allowedFormats);
		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
		if ("formats" in $$props) $$invalidate(1, formats = $$props.formats);
		if ("hasError" in $$props) hasError = $$props.hasError;
		if ("isLoading" in $$props) isLoading = $$props.isLoading;
		if ("showOriginal" in $$props) $$invalidate(3, showOriginal = $$props.showOriginal);
		if ("showPreview" in $$props) $$invalidate(4, showPreview = $$props.showPreview);
		if ("hideDropdown" in $$props) $$invalidate(2, hideDropdown = $$props.hideDropdown);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*allowedFormats*/ 64) {
			$$invalidate(2, hideDropdown = (allowedFormats || []).length === 1);
		}

		if ($$self.$$.dirty & /*allowedFormats*/ 64) {
			(changes());
		}
	};

	return [
		selected,
		formats,
		hideDropdown,
		showOriginal,
		showPreview,
		select,
		allowedFormats,
		select_1_change_handler
	];
}

class DownloadFormats extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$6, create_fragment$6, safe_not_equal, { allowedFormats: 6 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "DownloadFormats",
			options,
			id: create_fragment$6.name
		});
	}

	get allowedFormats() {
		throw new Error_1$1("<DownloadFormats>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set allowedFormats(value) {
		throw new Error_1$1("<DownloadFormats>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/Selection.svelte generated by Svelte v3.35.0 */
const file$3 = "src/Selection.svelte";

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[3] = list[i];
	return child_ctx;
}

// (12:2) {#each selected as file}
function create_each_block$1(ctx) {
	let li;
	let img;
	let img_src_value;
	let img_alt_value;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			li = element("li");
			img = element("img");
			attr_dev(img, "loading", "lazy");
			if (img.src !== (img_src_value = /*file*/ ctx[3].imagePath || /*file*/ ctx[3].modifiedPreviewFileURLs[0])) attr_dev(img, "src", img_src_value);
			attr_dev(img, "alt", img_alt_value = /*file*/ ctx[3].fileName);
			attr_dev(img, "class", "svelte-2dn8sz");
			add_location(img, file$3, 13, 6, 305);
			attr_dev(li, "class", "pixxioSelection__file svelte-2dn8sz");
			add_location(li, file$3, 12, 4, 226);
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);
			append_dev(li, img);

			if (!mounted) {
				dispose = listen_dev(
					li,
					"click",
					function () {
						if (is_function(/*dispatch*/ ctx[2]("deselect", /*file*/ ctx[3]))) /*dispatch*/ ctx[2]("deselect", /*file*/ ctx[3]).apply(this, arguments);
					},
					false,
					false,
					false
				);

				mounted = true;
			}
		},
		p: function update(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*selected*/ 2 && img.src !== (img_src_value = /*file*/ ctx[3].imagePath || /*file*/ ctx[3].modifiedPreviewFileURLs[0])) {
				attr_dev(img, "src", img_src_value);
			}

			if (dirty & /*selected*/ 2 && img_alt_value !== (img_alt_value = /*file*/ ctx[3].fileName)) {
				attr_dev(img, "alt", img_alt_value);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(li);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$1.name,
		type: "each",
		source: "(12:2) {#each selected as file}",
		ctx
	});

	return block;
}

// (17:2) {#if selectedFiles.length > 3}
function create_if_block$3(ctx) {
	let li;
	let t0;
	let t1_value = /*selectedFiles*/ ctx[0].length - /*selected*/ ctx[1].length + "";
	let t1;

	const block = {
		c: function create() {
			li = element("li");
			t0 = text("+ ");
			t1 = text(t1_value);
			attr_dev(li, "class", "svelte-2dn8sz");
			add_location(li, file$3, 17, 2, 457);
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);
			append_dev(li, t0);
			append_dev(li, t1);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*selectedFiles, selected*/ 3 && t1_value !== (t1_value = /*selectedFiles*/ ctx[0].length - /*selected*/ ctx[1].length + "")) set_data_dev(t1, t1_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(li);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$3.name,
		type: "if",
		source: "(17:2) {#if selectedFiles.length > 3}",
		ctx
	});

	return block;
}

function create_fragment$5(ctx) {
	let ul;
	let t;
	let each_value = /*selected*/ ctx[1];
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	let if_block = /*selectedFiles*/ ctx[0].length > 3 && create_if_block$3(ctx);

	const block = {
		c: function create() {
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t = space();
			if (if_block) if_block.c();
			attr_dev(ul, "class", "svelte-2dn8sz");
			add_location(ul, file$3, 10, 0, 190);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, ul, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			append_dev(ul, t);
			if (if_block) if_block.m(ul, null);
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*dispatch, selected*/ 6) {
				each_value = /*selected*/ ctx[1];
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ul, t);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (/*selectedFiles*/ ctx[0].length > 3) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$3(ctx);
					if_block.c();
					if_block.m(ul, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(ul);
			destroy_each(each_blocks, detaching);
			if (if_block) if_block.d();
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
	let selected;
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Selection", slots, []);
	const dispatch = createEventDispatcher();
	let { selectedFiles = [] } = $$props;
	const writable_props = ["selectedFiles"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Selection> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("selectedFiles" in $$props) $$invalidate(0, selectedFiles = $$props.selectedFiles);
	};

	$$self.$capture_state = () => ({
		createEventDispatcher,
		dispatch,
		selectedFiles,
		selected
	});

	$$self.$inject_state = $$props => {
		if ("selectedFiles" in $$props) $$invalidate(0, selectedFiles = $$props.selectedFiles);
		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*selectedFiles*/ 1) {
			$$invalidate(1, selected = selectedFiles.slice(0, 3));
		}
	};

	return [selectedFiles, selected, dispatch];
}

class Selection extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { selectedFiles: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Selection",
			options,
			id: create_fragment$5.name
		});
	}

	get selectedFiles() {
		throw new Error("<Selection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selectedFiles(value) {
		throw new Error("<Selection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/FileItem.svelte generated by Svelte v3.35.0 */
const file_1 = "src/FileItem.svelte";

// (14:0) {#if file}
function create_if_block$2(ctx) {
	let li;
	let figure;
	let div;
	let img;
	let img_src_value;
	let img_alt_value;
	let t0;
	let figcaption;
	let t1_value = /*file*/ ctx[0].fileName + "";
	let t1;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			li = element("li");
			figure = element("figure");
			div = element("div");
			img = element("img");
			t0 = space();
			figcaption = element("figcaption");
			t1 = text(t1_value);
			attr_dev(img, "loading", "lazy");
			if (img.src !== (img_src_value = /*file*/ ctx[0].imagePath || /*file*/ ctx[0].modifiedPreviewFileURLs[0])) attr_dev(img, "src", img_src_value);
			attr_dev(img, "alt", img_alt_value = /*file*/ ctx[0].fileName);
			attr_dev(img, "class", "svelte-e9o60a");
			add_location(img, file_1, 17, 6, 391);
			attr_dev(div, "class", "pixxioSquare svelte-e9o60a");
			toggle_class(div, "pixxioSquare--active", /*file*/ ctx[0].selected);
			add_location(div, file_1, 16, 4, 315);
			attr_dev(figcaption, "class", "svelte-e9o60a");
			add_location(figcaption, file_1, 19, 4, 503);
			attr_dev(figure, "class", "svelte-e9o60a");
			add_location(figure, file_1, 15, 2, 302);
			attr_dev(li, "class", "svelte-e9o60a");
			add_location(li, file_1, 14, 0, 269);
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);
			append_dev(li, figure);
			append_dev(figure, div);
			append_dev(div, img);
			append_dev(figure, t0);
			append_dev(figure, figcaption);
			append_dev(figcaption, t1);

			if (!mounted) {
				dispose = listen_dev(li, "click", /*click_handler*/ ctx[3], false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, dirty) {
			if (dirty & /*file*/ 1 && img.src !== (img_src_value = /*file*/ ctx[0].imagePath || /*file*/ ctx[0].modifiedPreviewFileURLs[0])) {
				attr_dev(img, "src", img_src_value);
			}

			if (dirty & /*file*/ 1 && img_alt_value !== (img_alt_value = /*file*/ ctx[0].fileName)) {
				attr_dev(img, "alt", img_alt_value);
			}

			if (dirty & /*file*/ 1) {
				toggle_class(div, "pixxioSquare--active", /*file*/ ctx[0].selected);
			}

			if (dirty & /*file*/ 1 && t1_value !== (t1_value = /*file*/ ctx[0].fileName + "")) set_data_dev(t1, t1_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(li);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$2.name,
		type: "if",
		source: "(14:0) {#if file}",
		ctx
	});

	return block;
}

function create_fragment$4(ctx) {
	let if_block_anchor;
	let if_block = /*file*/ ctx[0] && create_if_block$2(ctx);

	const block = {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
		},
		p: function update(ctx, [dirty]) {
			if (/*file*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$2(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach_dev(if_block_anchor);
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
	validate_slots("FileItem", slots, []);
	let { file = null } = $$props;
	let { selected = false } = $$props;
	const dispatch = createEventDispatcher();

	const select = () => {
		dispatch(!selected ? "select" : "deselect", file);
	};

	const writable_props = ["file", "selected"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FileItem> was created with unknown prop '${key}'`);
	});

	const click_handler = () => select();

	$$self.$$set = $$props => {
		if ("file" in $$props) $$invalidate(0, file = $$props.file);
		if ("selected" in $$props) $$invalidate(2, selected = $$props.selected);
	};

	$$self.$capture_state = () => ({
		createEventDispatcher,
		file,
		selected,
		dispatch,
		select
	});

	$$self.$inject_state = $$props => {
		if ("file" in $$props) $$invalidate(0, file = $$props.file);
		if ("selected" in $$props) $$invalidate(2, selected = $$props.selected);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [file, select, selected, click_handler];
}

class FileItem extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { file: 0, selected: 2 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "FileItem",
			options,
			id: create_fragment$4.name
		});
	}

	get file() {
		throw new Error("<FileItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set file(value) {
		throw new Error("<FileItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get selected() {
		throw new Error("<FileItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selected(value) {
		throw new Error("<FileItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/Files.svelte generated by Svelte v3.35.0 */

const { Error: Error_1, console: console_1$1 } = globals;
const file$2 = "src/Files.svelte";

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[37] = list[i];
	child_ctx[38] = list;
	child_ctx[39] = i;
	return child_ctx;
}

// (304:4) {:catch}
function create_catch_block(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("error");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_catch_block.name,
		type: "catch",
		source: "(304:4) {:catch}",
		ctx
	});

	return block;
}

// (283:4) {:then}
function create_then_block(ctx) {
	let section;
	let ul;
	let t0;
	let div0;
	let downloadformats;
	let updating_allowedFormats;
	let t1;
	let div1;
	let p;
	let strong;
	let t2;
	let t3;
	let t4_value = (/*max*/ ctx[1] ? "/" + /*max*/ ctx[1] : "") + "";
	let t4;
	let t5;
	let t6_value = lang("selected") + "";
	let t6;
	let t7;
	let selection;
	let updating_selectedFiles;
	let t8;
	let span;
	let t9;
	let button0;
	let t11;
	let button1;
	let t12_value = lang("select") + "";
	let t12;
	let button1_disabled_value;
	let current;
	let mounted;
	let dispose;
	let each_value = /*files*/ ctx[5];
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	function downloadformats_allowedFormats_binding(value) {
		/*downloadformats_allowedFormats_binding*/ ctx[21](value);
	}

	let downloadformats_props = {};

	if (/*allowedFormats*/ ctx[0] !== void 0) {
		downloadformats_props.allowedFormats = /*allowedFormats*/ ctx[0];
	}

	downloadformats = new DownloadFormats({
			props: downloadformats_props,
			$$inline: true
		});

	binding_callbacks.push(() => bind(downloadformats, "allowedFormats", downloadformats_allowedFormats_binding));

	function selection_selectedFiles_binding(value) {
		/*selection_selectedFiles_binding*/ ctx[22](value);
	}

	let selection_props = {};

	if (/*selectedFiles*/ ctx[2] !== void 0) {
		selection_props.selectedFiles = /*selectedFiles*/ ctx[2];
	}

	selection = new Selection({ props: selection_props, $$inline: true });
	binding_callbacks.push(() => bind(selection, "selectedFiles", selection_selectedFiles_binding));
	selection.$on("deselect", /*deselect*/ ctx[13]);

	const block = {
		c: function create() {
			section = element("section");
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t0 = space();
			div0 = element("div");
			create_component(downloadformats.$$.fragment);
			t1 = space();
			div1 = element("div");
			p = element("p");
			strong = element("strong");
			t2 = text(/*selectedCount*/ ctx[3]);
			t3 = space();
			t4 = text(t4_value);
			t5 = space();
			t6 = text(t6_value);
			t7 = space();
			create_component(selection.$$.fragment);
			t8 = space();
			span = element("span");
			t9 = space();
			button0 = element("button");
			button0.textContent = `${lang("cancel")}`;
			t11 = space();
			button1 = element("button");
			t12 = text(t12_value);
			attr_dev(ul, "class", "svelte-187qga6");
			add_location(ul, file$2, 285, 6, 7004);
			attr_dev(section, "class", "pixxioFiles__container svelte-187qga6");
			toggle_class(section, "pixxioFiles__container--maxReached", /*maxReached*/ ctx[7]);
			add_location(section, file$2, 284, 4, 6880);
			attr_dev(div0, "class", "pixxioFormats svelte-187qga6");
			add_location(div0, file$2, 292, 4, 7210);
			add_location(strong, file$2, 297, 9, 7387);
			add_location(p, file$2, 297, 6, 7384);
			set_style(span, "flex-grow", "1");
			add_location(span, file$2, 299, 6, 7560);
			attr_dev(button0, "class", "button button--secondary svelte-187qga6");
			add_location(button0, file$2, 300, 6, 7601);
			attr_dev(button1, "class", "button svelte-187qga6");
			attr_dev(button1, "type", "submit");
			button1.disabled = button1_disabled_value = !/*valid*/ ctx[8] || /*isLoading*/ ctx[6];
			add_location(button1, file$2, 301, 6, 7710);
			attr_dev(div1, "class", "buttonGroup buttonGroup--right svelte-187qga6");
			add_location(div1, file$2, 296, 4, 7333);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			append_dev(section, ul);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			insert_dev(target, t0, anchor);
			insert_dev(target, div0, anchor);
			mount_component(downloadformats, div0, null);
			insert_dev(target, t1, anchor);
			insert_dev(target, div1, anchor);
			append_dev(div1, p);
			append_dev(p, strong);
			append_dev(strong, t2);
			append_dev(p, t3);
			append_dev(p, t4);
			append_dev(p, t5);
			append_dev(p, t6);
			append_dev(div1, t7);
			mount_component(selection, div1, null);
			append_dev(div1, t8);
			append_dev(div1, span);
			append_dev(div1, t9);
			append_dev(div1, button0);
			append_dev(div1, t11);
			append_dev(div1, button1);
			append_dev(button1, t12);
			current = true;

			if (!mounted) {
				dispose = [
					listen_dev(section, "scroll", /*lazyLoad*/ ctx[11], false, false, false),
					listen_dev(button0, "click", /*click_handler*/ ctx[23], false, false, false),
					listen_dev(button1, "click", /*submit*/ ctx[14], false, false, false)
				];

				mounted = true;
			}
		},
		p: function update(ctx, dirty) {
			if (dirty[0] & /*files, select, deselect*/ 12320) {
				each_value = /*files*/ ctx[5];
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
						each_blocks[i].m(ul, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (dirty[0] & /*maxReached*/ 128) {
				toggle_class(section, "pixxioFiles__container--maxReached", /*maxReached*/ ctx[7]);
			}

			const downloadformats_changes = {};

			if (!updating_allowedFormats && dirty[0] & /*allowedFormats*/ 1) {
				updating_allowedFormats = true;
				downloadformats_changes.allowedFormats = /*allowedFormats*/ ctx[0];
				add_flush_callback(() => updating_allowedFormats = false);
			}

			downloadformats.$set(downloadformats_changes);
			if (!current || dirty[0] & /*selectedCount*/ 8) set_data_dev(t2, /*selectedCount*/ ctx[3]);
			if ((!current || dirty[0] & /*max*/ 2) && t4_value !== (t4_value = (/*max*/ ctx[1] ? "/" + /*max*/ ctx[1] : "") + "")) set_data_dev(t4, t4_value);
			const selection_changes = {};

			if (!updating_selectedFiles && dirty[0] & /*selectedFiles*/ 4) {
				updating_selectedFiles = true;
				selection_changes.selectedFiles = /*selectedFiles*/ ctx[2];
				add_flush_callback(() => updating_selectedFiles = false);
			}

			selection.$set(selection_changes);

			if (!current || dirty[0] & /*valid, isLoading*/ 320 && button1_disabled_value !== (button1_disabled_value = !/*valid*/ ctx[8] || /*isLoading*/ ctx[6])) {
				prop_dev(button1, "disabled", button1_disabled_value);
			}
		},
		i: function intro(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			transition_in(downloadformats.$$.fragment, local);
			transition_in(selection.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			transition_out(downloadformats.$$.fragment, local);
			transition_out(selection.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
			destroy_each(each_blocks, detaching);
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(div0);
			destroy_component(downloadformats);
			if (detaching) detach_dev(t1);
			if (detaching) detach_dev(div1);
			destroy_component(selection);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_then_block.name,
		type: "then",
		source: "(283:4) {:then}",
		ctx
	});

	return block;
}

// (287:8) {#each files as file}
function create_each_block(ctx) {
	let fileitem;
	let updating_file;
	let updating_selected;
	let current;

	function fileitem_file_binding(value) {
		/*fileitem_file_binding*/ ctx[19](value, /*file*/ ctx[37], /*each_value*/ ctx[38], /*file_index*/ ctx[39]);
	}

	function fileitem_selected_binding(value) {
		/*fileitem_selected_binding*/ ctx[20](value, /*file*/ ctx[37]);
	}

	let fileitem_props = {};

	if (/*file*/ ctx[37] !== void 0) {
		fileitem_props.file = /*file*/ ctx[37];
	}

	if (/*file*/ ctx[37].selected !== void 0) {
		fileitem_props.selected = /*file*/ ctx[37].selected;
	}

	fileitem = new FileItem({ props: fileitem_props, $$inline: true });
	binding_callbacks.push(() => bind(fileitem, "file", fileitem_file_binding));
	binding_callbacks.push(() => bind(fileitem, "selected", fileitem_selected_binding));
	fileitem.$on("select", /*select*/ ctx[12]);
	fileitem.$on("deselect", /*deselect*/ ctx[13]);

	const block = {
		c: function create() {
			create_component(fileitem.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(fileitem, target, anchor);
			current = true;
		},
		p: function update(new_ctx, dirty) {
			ctx = new_ctx;
			const fileitem_changes = {};

			if (!updating_file && dirty[0] & /*files*/ 32) {
				updating_file = true;
				fileitem_changes.file = /*file*/ ctx[37];
				add_flush_callback(() => updating_file = false);
			}

			if (!updating_selected && dirty[0] & /*files*/ 32) {
				updating_selected = true;
				fileitem_changes.selected = /*file*/ ctx[37].selected;
				add_flush_callback(() => updating_selected = false);
			}

			fileitem.$set(fileitem_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(fileitem.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(fileitem.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(fileitem, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block.name,
		type: "each",
		source: "(287:8) {#each files as file}",
		ctx
	});

	return block;
}

// (281:19)      <Loading></Loading>     {:then}
function create_pending_block(ctx) {
	let loading;
	let current;
	loading = new Loading({ $$inline: true });

	const block = {
		c: function create() {
			create_component(loading.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(loading, target, anchor);
			current = true;
		},
		p: noop,
		i: function intro(local) {
			if (current) return;
			transition_in(loading.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(loading.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(loading, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_pending_block.name,
		type: "pending",
		source: "(281:19)      <Loading></Loading>     {:then}",
		ctx
	});

	return block;
}

function create_fragment$3(ctx) {
	let div;
	let promise;
	let current;

	let info = {
		ctx,
		current: null,
		token: null,
		hasCatch: true,
		pending: create_pending_block,
		then: create_then_block,
		catch: create_catch_block,
		blocks: [,,,]
	};

	handle_promise(promise = /*getFiles*/ ctx[4], info);

	const block = {
		c: function create() {
			div = element("div");
			info.block.c();
			attr_dev(div, "class", "pixxioFiles svelte-187qga6");
			toggle_class(div, "no-modal", !/*$modal*/ ctx[9]);
			add_location(div, file$2, 279, 0, 6763);
		},
		l: function claim(nodes) {
			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			info.block.m(div, info.anchor = null);
			info.mount = () => div;
			info.anchor = null;
			current = true;
		},
		p: function update(new_ctx, dirty) {
			ctx = new_ctx;
			info.ctx = ctx;

			if (dirty[0] & /*getFiles*/ 16 && promise !== (promise = /*getFiles*/ ctx[4]) && handle_promise(promise, info)) ; else {
				const child_ctx = ctx.slice();
				info.block.p(child_ctx, dirty);
			}

			if (dirty[0] & /*$modal*/ 512) {
				toggle_class(div, "no-modal", !/*$modal*/ ctx[9]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(info.block);
			current = true;
		},
		o: function outro(local) {
			for (let i = 0; i < 3; i += 1) {
				const block = info.blocks[i];
				transition_out(block);
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			info.block.d();
			info.token = null;
			info = null;
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

function instance$3($$self, $$props, $$invalidate) {
	let selectedCount;
	let maxReached;
	let valid;
	let downloadFormat;
	let version1;
	let $format;
	let $v1;
	let $modal;
	validate_store(format, "format");
	component_subscribe($$self, format, $$value => $$invalidate(17, $format = $$value));
	validate_store(v1, "v1");
	component_subscribe($$self, v1, $$value => $$invalidate(18, $v1 = $$value));
	validate_store(modal, "modal");
	component_subscribe($$self, modal, $$value => $$invalidate(9, $modal = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Files", slots, []);
	const dispatch = createEventDispatcher();
	const api = new API();
	let { max = 0 } = $$props;
	let { allowedTypes = [] } = $$props;
	let { allowedFormats = null } = $$props;
	let { additionalResponseFields } = $$props;
	let hasError = false;
	let getFiles = null;
	let page = 1;
	let pageSize = 50;
	let files = [];
	let quantity = 0;
	let isLoading = false;
	let query = "";
	let selectedFiles = [];

	onMount(() => {
		$$invalidate(4, getFiles = version1 ? fetchFilesV1() : fetchFiles());

		searchTerm.subscribe(value => {
			query = value;

			if (version1) {
				fetchFilesV1();
			} else {
				fetchFiles();
			}
		});
	});

	const changes = () => {
		if (version1) {
			fetchFilesV1();
		} else {
			fetchFiles();
		}
	};

	const lazyLoad = event => {
		if (isLoading || files.length >= quantity) {
			return;
		}

		const delta = event.target.scrollHeight - event.target.scrollTop - event.target.offsetHeight;

		if (delta < event.target.offsetHeight / 2) {
			page += 1;

			if (version1) {
				fetchFilesV1(true);
			} else {
				fetchFiles(true);
			}
		}
	};

	const fetchFilesV1 = async attach => {
		try {
			$$invalidate(6, isLoading = true);
			const filter = query ? { searchTerm: query } : {};

			const options = {
				pagination: pageSize + "-" + page,
				...filter
			};

			const data = await api.get(`/files`, { options });

			if (data.success !== "true") {
				throw new Error(data.errormessage);
			}

			data.files = data.files.map(file => {
				file.selected = selectedFiles.find(f => f.id === file.id);
				return file;
			});

			if (attach) {
				$$invalidate(5, files = [...files, ...data.files]);
			} else {
				$$invalidate(5, files = data.files);
				quantity = data.quantity;
			}

			$$invalidate(6, isLoading = false);
		} catch(e) {
			hasError = true;
			$$invalidate(6, isLoading = false);
		}
	};

	const fetchFiles = async attach => {
		try {
			$$invalidate(6, isLoading = true);
			let allowedTypeFilter = [];
			let queryFilter = [];
			let filter = {};

			if (allowedTypes.length) {
				allowedTypeFilter = [
					{
						filterType: "connectorOr",
						filters: [
							...allowedTypes.map(type => ({
								filterType: "fileExtension",
								fileExtension: type
							}))
						]
					}
				];
			}

			if (query) {
				queryFilter = [{ filterType: "searchTerm", term: query }];
			}

			if (query || allowedTypes.length) {
				filter = {
					filter: {
						filterType: "connectorAnd",
						filters: [...queryFilter, ...allowedTypeFilter]
					}
				};
			}

			const options = {
				page,
				pageSize,
				responseFields: [
					"id",
					"modifiedPreviewFileURLs",
					"previewFileURL",
					"originalFileURL",
					"width",
					"height",
					"fileName",
					"fileExtension",
					"uploadDate",
					"modifyDate",
					"rating",
					"userID",
					"fileSize",
					"dominantColor",
					...additionalResponseFields
				],
				previewFileOptions: [{ height: 400, quality: 60 }],
				...filter
			};

			const data = await api.get(`/files`, options);

			if (!data.success) {
				throw new Error(data.errormessage);
			}

			data.files = data.files.map(file => {
				file.selected = selectedFiles.find(f => f.id === file.id);
				return file;
			});

			if (attach) {
				$$invalidate(5, files = [...files, ...data.files]);
			} else {
				$$invalidate(5, files = data.files);
				quantity = data.quantity;
			}

			$$invalidate(6, isLoading = false);
		} catch(e) {
			console.log(e);
			hasError = true;
			$$invalidate(6, isLoading = false);
		}
	};

	const select = event => {
		// if (max && max <= selectedFiles.length) {
		//   return;
		// }
		const file = files.find(f => f.id === event.detail.id);

		file.selected = true;
		$$invalidate(5, files);
		$$invalidate(2, selectedFiles = [event.detail, ...selectedFiles.slice(0, max - 1)]);
		markSelected();
	};

	const deselect = event => {
		$$invalidate(2, selectedFiles = selectedFiles.filter(f => f.id !== event.detail.id));
		markSelected();
	};

	const markSelected = () => {
		files.forEach(file => {
			file.selected = false;
		});

		$$invalidate(5, files);

		selectedFiles.forEach(sf => {
			const file = files.find(f => f.id == sf.id);
			file.selected = true;
			$$invalidate(5, files);
		});
	};

	const fetchDownloadFormats = async id => {
		const convert = await api.get("/files/convert", {
			ids: [id],
			downloadType: "downloadFormat",
			downloadFormatID: downloadFormat
		});

		const checkDownload = async () => {
			const download = await api.get("/files/download", { downloadID: convert.downloadID });

			if (!download.downloadURL) {
				return await new Promise(resolve => {
						setTimeout(() => checkDownload().then(result => resolve(result)), 100);
					});
			} else {
				return download.downloadURL;
			}
		};

		return await checkDownload();
	};

	const submit = async () => {
		const preparedFiles = [];
		$$invalidate(6, isLoading = true);

		for (let i = 0; i < selectedFiles.length; i += 1) {
			const file = selectedFiles[i];
			let url = "";
			let thumbnail = "";

			if (version1) {
				(url = downloadFormat === "preview"
				? file.imagePath
				: file.originalPath, thumbnail = file.imagePath);
			} else {
				url = downloadFormat === "preview"
				? file.previewFileURL
				: file.originalFileURL;

				thumbnail = file.modifiedPreviewFileURLs[0];
			}

			if (!["preview", "original"].includes(downloadFormat)) {
				// catch format
				url = await fetchDownloadFormats(file.id);
			}

			preparedFiles.push({ id: file.id, url, thumbnail, file });
		}

		$$invalidate(6, isLoading = false);
		dispatch("submit", preparedFiles);
	};

	const writable_props = ["max", "allowedTypes", "allowedFormats", "additionalResponseFields"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Files> was created with unknown prop '${key}'`);
	});

	function fileitem_file_binding(value, file, each_value, file_index) {
		each_value[file_index] = value;
		$$invalidate(5, files);
	}

	function fileitem_selected_binding(value, file) {
		if ($$self.$$.not_equal(file.selected, value)) {
			file.selected = value;
			$$invalidate(5, files);
		}
	}

	function downloadformats_allowedFormats_binding(value) {
		allowedFormats = value;
		$$invalidate(0, allowedFormats);
	}

	function selection_selectedFiles_binding(value) {
		selectedFiles = value;
		$$invalidate(2, selectedFiles);
	}

	const click_handler = () => dispatch("cancel");

	$$self.$$set = $$props => {
		if ("max" in $$props) $$invalidate(1, max = $$props.max);
		if ("allowedTypes" in $$props) $$invalidate(15, allowedTypes = $$props.allowedTypes);
		if ("allowedFormats" in $$props) $$invalidate(0, allowedFormats = $$props.allowedFormats);
		if ("additionalResponseFields" in $$props) $$invalidate(16, additionalResponseFields = $$props.additionalResponseFields);
	};

	$$self.$capture_state = () => ({
		afterUpdate,
		beforeUpdate,
		createEventDispatcher,
		onMount,
		DownloadFormats,
		Selection,
		FileItem,
		Loading,
		searchTerm,
		format,
		v1,
		modal,
		API,
		lang,
		dispatch,
		api,
		max,
		allowedTypes,
		allowedFormats,
		additionalResponseFields,
		hasError,
		getFiles,
		page,
		pageSize,
		files,
		quantity,
		isLoading,
		query,
		selectedFiles,
		changes,
		lazyLoad,
		fetchFilesV1,
		fetchFiles,
		select,
		deselect,
		markSelected,
		fetchDownloadFormats,
		submit,
		selectedCount,
		maxReached,
		valid,
		$format,
		downloadFormat,
		version1,
		$v1,
		$modal
	});

	$$self.$inject_state = $$props => {
		if ("max" in $$props) $$invalidate(1, max = $$props.max);
		if ("allowedTypes" in $$props) $$invalidate(15, allowedTypes = $$props.allowedTypes);
		if ("allowedFormats" in $$props) $$invalidate(0, allowedFormats = $$props.allowedFormats);
		if ("additionalResponseFields" in $$props) $$invalidate(16, additionalResponseFields = $$props.additionalResponseFields);
		if ("hasError" in $$props) hasError = $$props.hasError;
		if ("getFiles" in $$props) $$invalidate(4, getFiles = $$props.getFiles);
		if ("page" in $$props) page = $$props.page;
		if ("pageSize" in $$props) pageSize = $$props.pageSize;
		if ("files" in $$props) $$invalidate(5, files = $$props.files);
		if ("quantity" in $$props) quantity = $$props.quantity;
		if ("isLoading" in $$props) $$invalidate(6, isLoading = $$props.isLoading);
		if ("query" in $$props) query = $$props.query;
		if ("selectedFiles" in $$props) $$invalidate(2, selectedFiles = $$props.selectedFiles);
		if ("selectedCount" in $$props) $$invalidate(3, selectedCount = $$props.selectedCount);
		if ("maxReached" in $$props) $$invalidate(7, maxReached = $$props.maxReached);
		if ("valid" in $$props) $$invalidate(8, valid = $$props.valid);
		if ("downloadFormat" in $$props) downloadFormat = $$props.downloadFormat;
		if ("version1" in $$props) version1 = $$props.version1;
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*selectedFiles*/ 4) {
			$$invalidate(3, selectedCount = selectedFiles.length);
		}

		if ($$self.$$.dirty[0] & /*selectedCount, max*/ 10) {
			$$invalidate(7, maxReached = selectedCount >= max && max);
		}

		if ($$self.$$.dirty[0] & /*selectedCount, $format*/ 131080) {
			$$invalidate(8, valid = selectedCount >= 1 && $format);
		}

		if ($$self.$$.dirty[0] & /*$format*/ 131072) {
			downloadFormat = $format;
		}

		if ($$self.$$.dirty[0] & /*$v1*/ 262144) {
			version1 = $v1;
		}

		if ($$self.$$.dirty[0] & /*allowedTypes*/ 32768) {
			(changes());
		}
	};

	return [
		allowedFormats,
		max,
		selectedFiles,
		selectedCount,
		getFiles,
		files,
		isLoading,
		maxReached,
		valid,
		$modal,
		dispatch,
		lazyLoad,
		select,
		deselect,
		submit,
		allowedTypes,
		additionalResponseFields,
		$format,
		$v1,
		fileitem_file_binding,
		fileitem_selected_binding,
		downloadformats_allowedFormats_binding,
		selection_selectedFiles_binding,
		click_handler
	];
}

class Files extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(
			this,
			options,
			instance$3,
			create_fragment$3,
			safe_not_equal,
			{
				max: 1,
				allowedTypes: 15,
				allowedFormats: 0,
				additionalResponseFields: 16
			},
			[-1, -1]
		);

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Files",
			options,
			id: create_fragment$3.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*additionalResponseFields*/ ctx[16] === undefined && !("additionalResponseFields" in props)) {
			console_1$1.warn("<Files> was created without expected prop 'additionalResponseFields'");
		}
	}

	get max() {
		throw new Error_1("<Files>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set max(value) {
		throw new Error_1("<Files>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get allowedTypes() {
		throw new Error_1("<Files>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set allowedTypes(value) {
		throw new Error_1("<Files>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get allowedFormats() {
		throw new Error_1("<Files>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set allowedFormats(value) {
		throw new Error_1("<Files>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get additionalResponseFields() {
		throw new Error_1("<Files>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set additionalResponseFields(value) {
		throw new Error_1("<Files>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/User.svelte generated by Svelte v3.35.0 */
const file$1 = "src/User.svelte";

function create_fragment$2(ctx) {
	let small;
	let t0_value = lang("logged_in_as") + "";
	let t0;
	let t1;
	let t2;
	let t3;
	let a0;
	let t4;
	let a0_href_value;
	let t5;
	let a1;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			small = element("small");
			t0 = text(t0_value);
			t1 = space();
			t2 = text(/*username*/ ctx[0]);
			t3 = text(" in ");
			a0 = element("a");
			t4 = text(/*$domain*/ ctx[1]);
			t5 = text(". ");
			a1 = element("a");
			a1.textContent = "Ausloggen";
			attr_dev(a0, "href", a0_href_value = "https://" + /*$domain*/ ctx[1]);
			attr_dev(a0, "target", "_blank");
			attr_dev(a0, "class", "svelte-5rqqc0");
			add_location(a0, file$1, 25, 44, 485);
			attr_dev(a1, "href", "#");
			attr_dev(a1, "class", "svelte-5rqqc0");
			add_location(a1, file$1, 25, 103, 544);
			attr_dev(small, "class", "svelte-5rqqc0");
			add_location(small, file$1, 25, 0, 441);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, small, anchor);
			append_dev(small, t0);
			append_dev(small, t1);
			append_dev(small, t2);
			append_dev(small, t3);
			append_dev(small, a0);
			append_dev(a0, t4);
			append_dev(small, t5);
			append_dev(small, a1);

			if (!mounted) {
				dispose = listen_dev(a1, "click", /*logout*/ ctx[2], false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*username*/ 1) set_data_dev(t2, /*username*/ ctx[0]);
			if (dirty & /*$domain*/ 2) set_data_dev(t4, /*$domain*/ ctx[1]);

			if (dirty & /*$domain*/ 2 && a0_href_value !== (a0_href_value = "https://" + /*$domain*/ ctx[1])) {
				attr_dev(a0, "href", a0_href_value);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(small);
			mounted = false;
			dispose();
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
	let $domain;
	validate_store(domain, "domain");
	component_subscribe($$self, domain, $$value => $$invalidate(1, $domain = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("User", slots, []);
	const api = new API();
	let username = "";

	const fetchUser = async () => {
		api.get("/users/current").then(user => {
			$$invalidate(0, username = user.user.displayName);
		});
	};

	fetchUser();
	const dispatch = createEventDispatcher();

	const logout = () => {
		dispatch("logout");
	};

	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<User> was created with unknown prop '${key}'`);
	});

	$$self.$capture_state = () => ({
		API,
		lang,
		domain,
		createEventDispatcher,
		api,
		username,
		fetchUser,
		dispatch,
		logout,
		$domain
	});

	$$self.$inject_state = $$props => {
		if ("username" in $$props) $$invalidate(0, username = $$props.username);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [username, $domain, logout];
}

class User extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "User",
			options,
			id: create_fragment$2.name
		});
	}
}

/* src/Upload.svelte generated by Svelte v3.35.0 */

const { Object: Object_1, console: console_1 } = globals;

// (24:0) {#if loading}
function create_if_block_1$1(ctx) {
	let loading_1;
	let current;
	loading_1 = new Loading({ $$inline: true });

	const block = {
		c: function create() {
			create_component(loading_1.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(loading_1, target, anchor);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(loading_1.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(loading_1.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(loading_1, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$1.name,
		type: "if",
		source: "(24:0) {#if loading}",
		ctx
	});

	return block;
}

// (28:0) {#if loading}
function create_if_block$1(ctx) {
	const block = { c: noop, m: noop, d: noop };

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$1.name,
		type: "if",
		source: "(28:0) {#if loading}",
		ctx
	});

	return block;
}

function create_fragment$1(ctx) {
	let t;
	let if_block1_anchor;
	let current;
	let if_block0 = /*loading*/ ctx[0] && create_if_block_1$1(ctx);
	let if_block1 = /*loading*/ ctx[0] && create_if_block$1(ctx);

	const block = {
		c: function create() {
			if (if_block0) if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			if_block1_anchor = empty();
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert_dev(target, t, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert_dev(target, if_block1_anchor, anchor);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (/*loading*/ ctx[0]) {
				if (if_block0) {
					if (dirty & /*loading*/ 1) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_1$1(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(t.parentNode, t);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (/*loading*/ ctx[0]) {
				if (if_block1) ; else {
					if_block1 = create_if_block$1(ctx);
					if_block1.c();
					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block0);
			current = false;
		},
		d: function destroy(detaching) {
			if (if_block0) if_block0.d(detaching);
			if (detaching) detach_dev(t);
			if (if_block1) if_block1.d(detaching);
			if (detaching) detach_dev(if_block1_anchor);
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
	validate_slots("Upload", slots, []);
	const api = new API();
	let loading = false;
	let { config = {} } = $$props;
	console.log(config);

	const upload = async () => {
		$$invalidate(0, loading = true);
		const formData = new FormData();

		Object.keys(config).forEach(key => {
			formData.set(key, config[key]);
		});

		const response = api.post("/files", formData, true, null, false, false);
		$$invalidate(0, loading = false);
		return response;
	};

	onMount(async () => {
		await upload();
	});

	const writable_props = ["config"];

	Object_1.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Upload> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("config" in $$props) $$invalidate(1, config = $$props.config);
	};

	$$self.$capture_state = () => ({
		onMount,
		API,
		Loading,
		api,
		loading,
		config,
		upload
	});

	$$self.$inject_state = $$props => {
		if ("loading" in $$props) $$invalidate(0, loading = $$props.loading);
		if ("config" in $$props) $$invalidate(1, config = $$props.config);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [loading, config];
}

class Upload extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { config: 1 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Upload",
			options,
			id: create_fragment$1.name
		});
	}

	get config() {
		throw new Error("<Upload>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set config(value) {
		throw new Error("<Upload>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/App.svelte generated by Svelte v3.35.0 */
const file = "src/App.svelte";

// (70:0) {#if show}
function create_if_block(ctx) {
	let main;
	let div;
	let header;
	let t0;
	let t1;
	let current_block_type_index;
	let if_block2;
	let t2;
	let current;
	let if_block0 = /*standalone*/ ctx[5] && create_if_block_6(ctx);
	let if_block1 = /*isAuthenticated*/ ctx[9] && /*mode*/ ctx[8] == "get" && create_if_block_5(ctx);
	const if_block_creators = [create_if_block_2, create_if_block_3, create_if_block_4];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (!/*isAuthenticated*/ ctx[9]) return 0;
		if (/*mode*/ ctx[8] == "get") return 1;
		if (/*mode*/ ctx[8] == "upload") return 2;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx))) {
		if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	let if_block3 = /*isAuthenticated*/ ctx[9] && create_if_block_1(ctx);

	const block = {
		c: function create() {
			main = element("main");
			div = element("div");
			header = element("header");
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (if_block2) if_block2.c();
			t2 = space();
			if (if_block3) if_block3.c();
			attr_dev(header, "class", "svelte-l5fo31");
			add_location(header, file, 72, 2, 1715);
			attr_dev(div, "class", "container svelte-l5fo31");
			toggle_class(div, "container--enlarge", /*enlarge*/ ctx[11]);
			add_location(div, file, 71, 1, 1654);
			attr_dev(main, "class", "svelte-l5fo31");
			toggle_class(main, "no-modal", !/*config*/ ctx[6].modal);
			add_location(main, file, 70, 0, 1615);
		},
		m: function mount(target, anchor) {
			insert_dev(target, main, anchor);
			append_dev(main, div);
			append_dev(div, header);
			if (if_block0) if_block0.m(header, null);
			append_dev(header, t0);
			if (if_block1) if_block1.m(header, null);
			append_dev(div, t1);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].m(div, null);
			}

			append_dev(div, t2);
			if (if_block3) if_block3.m(div, null);
			current = true;
		},
		p: function update(ctx, dirty) {
			if (/*standalone*/ ctx[5]) {
				if (if_block0) {
					if (dirty & /*standalone*/ 32) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_6(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(header, t0);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (/*isAuthenticated*/ ctx[9] && /*mode*/ ctx[8] == "get") {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty & /*isAuthenticated, mode*/ 768) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block_5(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(header, null);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if (~current_block_type_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				}
			} else {
				if (if_block2) {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
				}

				if (~current_block_type_index) {
					if_block2 = if_blocks[current_block_type_index];

					if (!if_block2) {
						if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block2.c();
					} else {
						if_block2.p(ctx, dirty);
					}

					transition_in(if_block2, 1);
					if_block2.m(div, t2);
				} else {
					if_block2 = null;
				}
			}

			if (/*isAuthenticated*/ ctx[9]) {
				if (if_block3) {
					if_block3.p(ctx, dirty);

					if (dirty & /*isAuthenticated*/ 512) {
						transition_in(if_block3, 1);
					}
				} else {
					if_block3 = create_if_block_1(ctx);
					if_block3.c();
					transition_in(if_block3, 1);
					if_block3.m(div, null);
				}
			} else if (if_block3) {
				group_outros();

				transition_out(if_block3, 1, 1, () => {
					if_block3 = null;
				});

				check_outros();
			}

			if (dirty & /*enlarge*/ 2048) {
				toggle_class(div, "container--enlarge", /*enlarge*/ ctx[11]);
			}

			if (dirty & /*config*/ 64) {
				toggle_class(main, "no-modal", !/*config*/ ctx[6].modal);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			transition_in(if_block2);
			transition_in(if_block3);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			transition_out(if_block2);
			transition_out(if_block3);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(main);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].d();
			}

			if (if_block3) if_block3.d();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block.name,
		type: "if",
		source: "(70:0) {#if show}",
		ctx
	});

	return block;
}

// (74:3) {#if standalone}
function create_if_block_6(ctx) {
	let logo;
	let current;
	logo = new Logo({ $$inline: true });

	const block = {
		c: function create() {
			create_component(logo.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(logo, target, anchor);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(logo.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(logo.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(logo, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_6.name,
		type: "if",
		source: "(74:3) {#if standalone}",
		ctx
	});

	return block;
}

// (77:3) {#if isAuthenticated && mode == 'get'}
function create_if_block_5(ctx) {
	let searchfield;
	let updating_value;
	let current;

	function searchfield_value_binding(value) {
		/*searchfield_value_binding*/ ctx[16](value);
	}

	let searchfield_props = {};

	if (/*searchQuery*/ ctx[10] !== void 0) {
		searchfield_props.value = /*searchQuery*/ ctx[10];
	}

	searchfield = new SearchField({ props: searchfield_props, $$inline: true });
	binding_callbacks.push(() => bind(searchfield, "value", searchfield_value_binding));

	const block = {
		c: function create() {
			create_component(searchfield.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(searchfield, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const searchfield_changes = {};

			if (!updating_value && dirty & /*searchQuery*/ 1024) {
				updating_value = true;
				searchfield_changes.value = /*searchQuery*/ ctx[10];
				add_flush_callback(() => updating_value = false);
			}

			searchfield.$set(searchfield_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(searchfield.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(searchfield.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(searchfield, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_5.name,
		type: "if",
		source: "(77:3) {#if isAuthenticated && mode == 'get'}",
		ctx
	});

	return block;
}

// (91:29) 
function create_if_block_4(ctx) {
	let section;
	let upload;
	let updating_config;
	let current;

	function upload_config_binding(value) {
		/*upload_config_binding*/ ctx[21](value);
	}

	let upload_props = {};

	if (/*uploadConfig*/ ctx[4] !== void 0) {
		upload_props.config = /*uploadConfig*/ ctx[4];
	}

	upload = new Upload({ props: upload_props, $$inline: true });
	binding_callbacks.push(() => bind(upload, "config", upload_config_binding));

	const block = {
		c: function create() {
			section = element("section");
			create_component(upload.$$.fragment);
			add_location(section, file, 91, 2, 2352);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			mount_component(upload, section, null);
			current = true;
		},
		p: function update(ctx, dirty) {
			const upload_changes = {};

			if (!updating_config && dirty & /*uploadConfig*/ 16) {
				updating_config = true;
				upload_changes.config = /*uploadConfig*/ ctx[4];
				add_flush_callback(() => updating_config = false);
			}

			upload.$set(upload_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(upload.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(upload.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
			destroy_component(upload);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_4.name,
		type: "if",
		source: "(91:29) ",
		ctx
	});

	return block;
}

// (87:26) 
function create_if_block_3(ctx) {
	let section;
	let files;
	let updating_allowedTypes;
	let updating_allowedFormats;
	let updating_additionalResponseFields;
	let updating_max;
	let current;

	function files_allowedTypes_binding(value) {
		/*files_allowedTypes_binding*/ ctx[17](value);
	}

	function files_allowedFormats_binding(value) {
		/*files_allowedFormats_binding*/ ctx[18](value);
	}

	function files_additionalResponseFields_binding(value) {
		/*files_additionalResponseFields_binding*/ ctx[19](value);
	}

	function files_max_binding(value) {
		/*files_max_binding*/ ctx[20](value);
	}

	let files_props = {};

	if (/*allowedTypes*/ ctx[1] !== void 0) {
		files_props.allowedTypes = /*allowedTypes*/ ctx[1];
	}

	if (/*allowedFormats*/ ctx[2] !== void 0) {
		files_props.allowedFormats = /*allowedFormats*/ ctx[2];
	}

	if (/*additionalResponseFields*/ ctx[3] !== void 0) {
		files_props.additionalResponseFields = /*additionalResponseFields*/ ctx[3];
	}

	if (/*max*/ ctx[0] !== void 0) {
		files_props.max = /*max*/ ctx[0];
	}

	files = new Files({ props: files_props, $$inline: true });
	binding_callbacks.push(() => bind(files, "allowedTypes", files_allowedTypes_binding));
	binding_callbacks.push(() => bind(files, "allowedFormats", files_allowedFormats_binding));
	binding_callbacks.push(() => bind(files, "additionalResponseFields", files_additionalResponseFields_binding));
	binding_callbacks.push(() => bind(files, "max", files_max_binding));
	files.$on("cancel", /*cancel*/ ctx[14]);
	files.$on("submit", /*submit*/ ctx[15]);

	const block = {
		c: function create() {
			section = element("section");
			create_component(files.$$.fragment);
			attr_dev(section, "class", "pixxioSectionFiles");
			add_location(section, file, 87, 2, 2071);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			mount_component(files, section, null);
			current = true;
		},
		p: function update(ctx, dirty) {
			const files_changes = {};

			if (!updating_allowedTypes && dirty & /*allowedTypes*/ 2) {
				updating_allowedTypes = true;
				files_changes.allowedTypes = /*allowedTypes*/ ctx[1];
				add_flush_callback(() => updating_allowedTypes = false);
			}

			if (!updating_allowedFormats && dirty & /*allowedFormats*/ 4) {
				updating_allowedFormats = true;
				files_changes.allowedFormats = /*allowedFormats*/ ctx[2];
				add_flush_callback(() => updating_allowedFormats = false);
			}

			if (!updating_additionalResponseFields && dirty & /*additionalResponseFields*/ 8) {
				updating_additionalResponseFields = true;
				files_changes.additionalResponseFields = /*additionalResponseFields*/ ctx[3];
				add_flush_callback(() => updating_additionalResponseFields = false);
			}

			if (!updating_max && dirty & /*max*/ 1) {
				updating_max = true;
				files_changes.max = /*max*/ ctx[0];
				add_flush_callback(() => updating_max = false);
			}

			files.$set(files_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(files.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(files.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
			destroy_component(files);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_3.name,
		type: "if",
		source: "(87:26) ",
		ctx
	});

	return block;
}

// (83:2) {#if !isAuthenticated}
function create_if_block_2(ctx) {
	let section;
	let login;
	let current;
	login = new Login({ $$inline: true });
	login.$on("cancel", /*cancel*/ ctx[14]);
	login.$on("authenticated", /*authenticated*/ ctx[12]);

	const block = {
		c: function create() {
			section = element("section");
			create_component(login.$$.fragment);
			attr_dev(section, "class", "pixxioSectionLogin");
			add_location(section, file, 83, 2, 1921);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section, anchor);
			mount_component(login, section, null);
			current = true;
		},
		p: noop,
		i: function intro(local) {
			if (current) return;
			transition_in(login.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(login.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(section);
			destroy_component(login);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2.name,
		type: "if",
		source: "(83:2) {#if !isAuthenticated}",
		ctx
	});

	return block;
}

// (96:2) {#if isAuthenticated}
function create_if_block_1(ctx) {
	let user;
	let current;
	user = new User({ $$inline: true });
	user.$on("logout", /*logout*/ ctx[13]);

	const block = {
		c: function create() {
			create_component(user.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(user, target, anchor);
			current = true;
		},
		p: noop,
		i: function intro(local) {
			if (current) return;
			transition_in(user.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(user.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(user, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1.name,
		type: "if",
		source: "(96:2) {#if isAuthenticated}",
		ctx
	});

	return block;
}

function create_fragment(ctx) {
	let t0;
	let link0;
	let link1;
	let style;
	let current;
	let if_block = /*show*/ ctx[7] && create_if_block(ctx);

	const block = {
		c: function create() {
			if (if_block) if_block.c();
			t0 = space();
			link0 = element("link");
			link1 = element("link");
			style = element("style");
			style.textContent = "/* Global CSS via SASS */\n#pixxio-integration {\n  font-family: 'Heebo', Arial, Helvetica, sans-serif;\n  font-size: 16px;\n  all: initial; }";
			attr_dev(link0, "rel", "preconnect");
			attr_dev(link0, "href", "https://fonts.gstatic.com");
			attr_dev(link0, "crossorigin", "");
			add_location(link0, file, 105, 2, 2562);
			attr_dev(link1, "href", "https://fonts.googleapis.com/css2?family=Heebo:wght@400;700&family=Work+Sans:wght@400;500&display=swap");
			attr_dev(link1, "rel", "stylesheet");
			add_location(link1, file, 106, 2, 2633);
			attr_dev(style, "lang", "scss");
			add_location(style, file, 108, 2, 2770);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert_dev(target, t0, anchor);
			append_dev(document.head, link0);
			append_dev(document.head, link1);
			append_dev(document.head, style);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (/*show*/ ctx[7]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*show*/ 128) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(t0.parentNode, t0);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach_dev(t0);
			detach_dev(link0);
			detach_dev(link1);
			detach_dev(style);
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
	let enlarge;
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("App", slots, []);
	let { standalone = false } = $$props;

	let { config = {
		appUrl: "",
		appKey: "",
		v1: false,
		modal: true,
		language: "en"
	} } = $$props;

	let { show = false } = $$props;
	let { max = 0 } = $$props;
	let { allowedTypes = [] } = $$props;
	let { allowedFormats = null } = $$props;
	let { additionalResponseFields = [] } = $$props;
	let { mode = "get" } = $$props;
	let { uploadConfig = {} } = $$props;
	const dispatch = createEventDispatcher();

	onMount(async () => {
		domain.update(() => config.appUrl);
		appKey.update(() => config.appKey);
		v1.update(() => config.v1 || false);
		modal.update(() => config.modal);
		language.update(() => config.language);
	});

	let loading = false;
	let isAuthenticated = false;
	let searchQuery = "";

	// authenticated
	const authenticated = () => {
		$$invalidate(9, isAuthenticated = true);
	};

	const logout = () => {
		$$invalidate(9, isAuthenticated = false);
		sessionStorage.removeItem("refreshToken");
		sessionStorage.removeItem("domain");
		domain.update(() => "");
		refreshToken.update(() => "");
	};

	const cancel = () => {
		dispatch("cancel");
	};

	const submit = ({ detail }) => {
		dispatch("submit", detail);
	};

	const writable_props = [
		"standalone",
		"config",
		"show",
		"max",
		"allowedTypes",
		"allowedFormats",
		"additionalResponseFields",
		"mode",
		"uploadConfig"
	];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
	});

	function searchfield_value_binding(value) {
		searchQuery = value;
		$$invalidate(10, searchQuery);
	}

	function files_allowedTypes_binding(value) {
		allowedTypes = value;
		$$invalidate(1, allowedTypes);
	}

	function files_allowedFormats_binding(value) {
		allowedFormats = value;
		$$invalidate(2, allowedFormats);
	}

	function files_additionalResponseFields_binding(value) {
		additionalResponseFields = value;
		$$invalidate(3, additionalResponseFields);
	}

	function files_max_binding(value) {
		max = value;
		$$invalidate(0, max);
	}

	function upload_config_binding(value) {
		uploadConfig = value;
		$$invalidate(4, uploadConfig);
	}

	$$self.$$set = $$props => {
		if ("standalone" in $$props) $$invalidate(5, standalone = $$props.standalone);
		if ("config" in $$props) $$invalidate(6, config = $$props.config);
		if ("show" in $$props) $$invalidate(7, show = $$props.show);
		if ("max" in $$props) $$invalidate(0, max = $$props.max);
		if ("allowedTypes" in $$props) $$invalidate(1, allowedTypes = $$props.allowedTypes);
		if ("allowedFormats" in $$props) $$invalidate(2, allowedFormats = $$props.allowedFormats);
		if ("additionalResponseFields" in $$props) $$invalidate(3, additionalResponseFields = $$props.additionalResponseFields);
		if ("mode" in $$props) $$invalidate(8, mode = $$props.mode);
		if ("uploadConfig" in $$props) $$invalidate(4, uploadConfig = $$props.uploadConfig);
	};

	$$self.$capture_state = () => ({
		Logo,
		SearchField,
		Login,
		Files,
		User,
		createEventDispatcher,
		onMount,
		domain,
		appKey,
		v1,
		modal,
		refreshToken,
		language,
		Loading,
		Upload,
		standalone,
		config,
		show,
		max,
		allowedTypes,
		allowedFormats,
		additionalResponseFields,
		mode,
		uploadConfig,
		dispatch,
		loading,
		isAuthenticated,
		searchQuery,
		authenticated,
		logout,
		cancel,
		submit,
		enlarge
	});

	$$self.$inject_state = $$props => {
		if ("standalone" in $$props) $$invalidate(5, standalone = $$props.standalone);
		if ("config" in $$props) $$invalidate(6, config = $$props.config);
		if ("show" in $$props) $$invalidate(7, show = $$props.show);
		if ("max" in $$props) $$invalidate(0, max = $$props.max);
		if ("allowedTypes" in $$props) $$invalidate(1, allowedTypes = $$props.allowedTypes);
		if ("allowedFormats" in $$props) $$invalidate(2, allowedFormats = $$props.allowedFormats);
		if ("additionalResponseFields" in $$props) $$invalidate(3, additionalResponseFields = $$props.additionalResponseFields);
		if ("mode" in $$props) $$invalidate(8, mode = $$props.mode);
		if ("uploadConfig" in $$props) $$invalidate(4, uploadConfig = $$props.uploadConfig);
		if ("loading" in $$props) loading = $$props.loading;
		if ("isAuthenticated" in $$props) $$invalidate(9, isAuthenticated = $$props.isAuthenticated);
		if ("searchQuery" in $$props) $$invalidate(10, searchQuery = $$props.searchQuery);
		if ("enlarge" in $$props) $$invalidate(11, enlarge = $$props.enlarge);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*isAuthenticated*/ 512) {
			$$invalidate(11, enlarge = isAuthenticated);
		}
	};

	return [
		max,
		allowedTypes,
		allowedFormats,
		additionalResponseFields,
		uploadConfig,
		standalone,
		config,
		show,
		mode,
		isAuthenticated,
		searchQuery,
		enlarge,
		authenticated,
		logout,
		cancel,
		submit,
		searchfield_value_binding,
		files_allowedTypes_binding,
		files_allowedFormats_binding,
		files_additionalResponseFields_binding,
		files_max_binding,
		upload_config_binding
	];
}

class App extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance, create_fragment, safe_not_equal, {
			standalone: 5,
			config: 6,
			show: 7,
			max: 0,
			allowedTypes: 1,
			allowedFormats: 2,
			additionalResponseFields: 3,
			mode: 8,
			uploadConfig: 4
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "App",
			options,
			id: create_fragment.name
		});
	}

	get standalone() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set standalone(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get config() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set config(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get show() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set show(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get max() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set max(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get allowedTypes() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set allowedTypes(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get allowedFormats() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set allowedFormats(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get additionalResponseFields() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set additionalResponseFields(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get mode() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set mode(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get uploadConfig() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set uploadConfig(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

class PIXXIO {
	constructor(config = {}, lang = 'en') {
		this.config = config;
		this.runningPromise;
		this.boot();
		this.app = new App({
			target: this.element,
			props: {
				standalone: true,
				config
			}
		});
	}
	boot() {
		if (!this.config.element) {
			const root = document.createElement('div');
			root.id = 'pixxio-integration';
			document.body.appendChild(root);
			this.element = root;
		} else {
			this.element = this.config.element;
		}
	};
	destroy() {
		this.app.$set({ show: false });
		this.element.parentNode.removeChild(this.element);
	}
	destroyMedia() {
		this.app.$set({ show: false });
	}
	getMedia(config) {
		this.runningPromise = new Promise((resolve, reject) => {
			this.app.$set({ mode: 'get' });
			if(config.max) {
				this.app.$set({ max: config.max });
			}

			this.app.$set({ allowedTypes: config.allowedTypes ?  config.allowedTypes : [] });
			this.app.$set({ allowedFormats: config.allowedFormats ? config.allowedFormats : null});
			this.app.$set({ additionalResponseFields: config.additionalResponseFields ? config.additionalResponseFields : []});
			
			this.app.$set({ show: true });
			this.app.$on('submit', (event) => {
				this.app.$set({ show: false });
				resolve(event.detail);
			});
			this.app.$on('cancel', () => {
				this.app.$set({ show: false });
				reject();
			});
		});

		return this.runningPromise;
	}

	pushMedia(config) {
		return new Promise((resolve, reject) => {
			this.app.$set({ mode: 'upload' });
			this.app.$set({ uploadConfig: config });
			this.app.$set({ show: true });
			this.app.$on('uploaded', (event) => {
				this.app.$set({ show: false });
				resolve(event.detail);
			});
			this.app.$on('cancel', () => {
				this.app.$set({ show: false });
				reject();
			});
		});
	}
}

window.PIXXIO = PIXXIO;

export default PIXXIO;
//# sourceMappingURL=index.js.map
