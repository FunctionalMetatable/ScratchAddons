const _realConsole$1 = window.console;
const consoleOutput = (logAuthor = "[cs]") => {
  const style = {
    leftPrefix: "background:  #ff7b26; color: white; border-radius: 0.5rem 0 0 0.5rem; padding: 0 0.5rem",
    rightPrefix:
      "background: #222; color: white; border-radius: 0 0.5rem 0.5rem 0; padding: 0 0.5rem; font-weight: bold",
    text: "",
  };
  return [`%cSA%c${logAuthor}%c`, style.leftPrefix, style.rightPrefix, style.text];
};

var initConsole = (author) => {
  const output = consoleOutput(author);

  const console = {
    ..._realConsole$1,
    log: _realConsole$1.log.bind(_realConsole$1, ...output),
    warn: _realConsole$1.warn.bind(_realConsole$1, ...output),
    error: _realConsole$1.error.bind(_realConsole$1, ...output),
  };

  return console;
};

/**
 * Wrapper class for EventTarget.
 * @extends EventTarget
 */
class Listenable extends EventTarget {
  constructor(...args) {
    super(...args);
    if (this._eventTargetKey !== null) {
      scratchAddons.eventTargets[this._eventTargetKey].push(this);
    }
  }

  /**
   * @private
   */
  dispatchEvent(...args) {
    return super.dispatchEvent(...args);
  }

  /**
   * If the subclass removes stale references using dispose(),
   * this key will be used.
   * @type {?string}
   * @private
   */
  get _eventTargetKey() {
    return null;
  }

  /**
   * Destructor of this instance.
   * @private
   */
  dispose() {
    const key = this._eventTargetKey;
    if (key === null) return;
    scratchAddons.eventTargets[key].splice(
      scratchAddons.eventTargets[key].findIndex((x) => x === this),
      1
    );
  }
}

/**
 * Authentication related utilities.
 * @extends Listenable
 */
class Auth$1 extends Listenable {
  /**
   * Fetch whether the user is logged in or not.
   * @returns {Promise<boolean>} - whether the user is logged in or not.
   */
  fetchIsLoggedIn() {
    return Promise.resolve(scratchAddons.globalState.auth.isLoggedIn);
  }
  /**
   * Fetch current username.
   * @returns {Promise<?string>} - the username.
   */
  fetchUsername() {
    return Promise.resolve(scratchAddons.globalState.auth.username);
  }
  /**
   * Fetch current user ID.
   * @returns {Promise<?number>} - the user ID.
   */
  fetchUserId() {
    return Promise.resolve(scratchAddons.globalState.auth.userId);
  }
  /**
   * Fetch X-Token used in new APIs.
   * @returns {Promise<?string>} - the X-Token.
   */
  fetchXToken() {
    return Promise.resolve(scratchAddons.globalState.auth.xToken);
  }
  /**
   * CSRF token used in APIs.
   * @type {string}
   */
  get csrfToken() {
    return scratchAddons.globalState.auth.csrfToken;
  }
  /**
   * Language of the Scratch website.
   * @type {string}
   */
  get scratchLang() {
    return scratchAddons.globalState.auth.scratchLang;
  }

  /**
   * @private
   */
  get _eventTargetKey() {
    return "auth";
  }
}

/**
 * Handles accounts.
 * @extends Listenable
 */
class Account$1 extends Listenable {
  constructor() {
    super();
  }
  /**
   * Fetches message count.
   * @returns {Promise<?number>} - current message count.
   */
  getMsgCount() {
    return scratchAddons.methods.getMsgCount();
  }
  /**
   * Fetches messages.
   * @returns {Promise<object[]>} - current messages.
   */
  getMessages(...args) {
    return scratchAddons.methods.getMessages(...args);
  }
  /**
   * Clears unread messages.
   * @returns {Promise}
   */
  clearMessages() {
    return scratchAddons.methods.clearMessages();
  }
}

/**
 * Represents information about the addon.
 * @extends Listenable
 * @property {string} id the addon's ID.
 * @property {string} browser the browser.
 * @property {boolean} disabled whether the addon is disabled or not.
 */
class Self extends Listenable {
  constructor(addonObj, info) {
    super();
    this._addonId = info.id; // In order to receive fireEvent messages from background
    this.id = info.id;
    this._addonObj = addonObj;
    this.browser = typeof InstallTrigger !== "undefined" ? "firefox" : "chrome";
    this.disabled = false;
    this.addEventListener("disabled", () => (this.disabled = true));
    this.addEventListener("reenabled", () => (this.disabled = false));
  }

  /**
   * path to the addon's directory.
   * @type {string}
   */
  get dir() {
    return `${this._addonObj._path}addons/${this.id}`;
  }

  /**
   * path to libraries directory.
   * @type {string}
   */
  get lib() {
    return `${this._addonObj._path}libraries`;
  }

  /**
   * @private
   */
  get _eventTargetKey() {
    return "self";
  }

  /**
   * Restarts this addon. Only applicable to background scripts.
   */
  restart() {}

  /**
   * Gets a list of addon IDs enabled, optionally filtered using tags.
   * @param {string=} tag - the tag for filtering.
   * @returns {Promise<string[]>} enabled addons' IDs
   */
  getEnabledAddons(tag) {
    return scratchAddons.methods.getEnabledAddons(tag);
  }
}

/**
 * Manages settings.
 * @extends Listenable
 */
class Settings extends Listenable {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
  }
  /**
   * Gets a setting.
   * @param {string} optionName - ID of the settings.
   * @throws settings ID is invalid.
   * @returns {*} setting.
   */
  get(optionName) {
    const settingsObj = scratchAddons.globalState.addonSettings[this._addonId] || {};
    const value = settingsObj[optionName];
    if (value === undefined) throw "ScratchAddons exception: invalid setting ID";
    else return value;
  }
  /**
   * @private
   */
  get _eventTargetKey() {
    return "settings";
  }
}

/**
 * An addon.
 * @property {Self} self
 * @property {Auth} auth
 * @property {Account} account
 * @property {Settings} settings
 */
class Addon {
  constructor(info) {
    this.self = new Self(this, info);
    this.auth = new Auth$1(this);
    this.account = new Account$1();
    this.settings = new Settings(this);
  }

  /**
   * @abstract
   * @private
   */
  get _path() {
    throw new Error("Subclasses must implement this.");
  }
}

/**
 * Manages object trapping.
 * @extends Listenable
 */
class Trap extends Listenable {
  constructor(tab) {
    super();
    this._react_internal_key = undefined;
    this._isWWW = tab.clientVersion === "scratch-www";
    this._getEditorMode = () => this._isWWW && tab.editorMode;
    this._waitForElement = tab.waitForElement.bind(tab);
    this._cache = Object.create(null);
  }

  /**
   * scratch-vm instance.
   * @throws when on non-project page.
   * @type {object}
   */
  get vm() {
    if (!this._getEditorMode()) throw new Error("Cannot access vm on non-project page");
    return __scratchAddonsTraps._onceMap.vm;
  }

  /**
   * @private
   */
  get REACT_INTERNAL_PREFIX() {
    return "__reactInternalInstance$";
  }

  /**
   * Gets Blockly instance actually used by Scratch.
   * This is different from window.Blockly.
   * @async
   * @throws when on non-project page.
   * @returns {Promise<object>}
   */
  async getBlockly() {
    if (this._cache.Blockly) return this._cache.Blockly;
    const editorMode = this._getEditorMode();
    if (!editorMode || editorMode === "embed") throw new Error("Cannot access Blockly on this page");
    const BLOCKS_CLASS = '[class^="gui_blocks-wrapper"]';
    let elem = document.querySelector(BLOCKS_CLASS);
    if (!elem) {
      elem = await this._waitForElement(BLOCKS_CLASS, {
        reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
      });
    }
    if (!this._react_internal_key) {
      this._react_internal_key = Object.keys(elem).find((key) => key.startsWith(this.REACT_INTERNAL_PREFIX));
    }
    const internal = elem[this._react_internal_key];
    let childable = internal;
    /* eslint-disable no-empty */
    while (((childable = childable.child), !childable || !childable.stateNode || !childable.stateNode.ScratchBlocks)) {}
    /* eslint-enable no-empty */
    return (this._cache.Blockly = childable.stateNode.ScratchBlocks);
  }

  /**
   * Gets react internal key.
   * @param {HTMLElement} elem - the reference
   * @returns {string} the key
   */
  getInternalKey(elem) {
    if (!this._react_internal_key) {
      this._react_internal_key = Object.keys(elem).find((key) => key.startsWith(this.REACT_INTERNAL_PREFIX));
    }
    return this._react_internal_key;
  }

  /**
   * Gets @scratch/paper instance.
   * @async
   * @throws when on non-project page or if paper couldn't be found.
   * @returns {Promise<object>}
   */
  async getPaper() {
    if (this._cache.paper) return this._cache.paper;
    const editorMode = this._getEditorMode();
    if (!editorMode || editorMode === "embed") throw new Error("Cannot access paper on this page");
    // We can access paper through .tool on tools, for example:
    // https://github.com/LLK/scratch-paint/blob/develop/src/containers/bit-brush-mode.jsx#L60-L62
    // It happens that paper's Tool objects contain a reference to the entirety of paper's scope.
    const modeSelector = await this._waitForElement("[class*='paint-editor_mode-selector']", {
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
    });
    const internalState = modeSelector[this.getInternalKey(modeSelector)].child;
    // .tool or .blob.tool only exists on the selected tool
    let toolState = internalState;
    let tool;
    while (toolState) {
      const toolInstance = toolState.child.stateNode;
      if (toolInstance.tool) {
        tool = toolInstance.tool;
        break;
      }
      if (toolInstance.blob && toolInstance.blob.tool) {
        tool = toolInstance.blob.tool;
        break;
      }
      toolState = toolState.sibling;
    }
    if (tool) {
      const paperScope = tool._scope;
      this._cache.paper = paperScope;
      return paperScope;
    }
    throw new Error("cannot find paper :(");
  }
}

/**
 * Handles Redux state.
 * @extends Listenable
 * @property {boolean} initialized Whether the handler is initialized or not.
 */
class ReduxHandler extends Listenable {
  constructor() {
    super();
    this.initialized = false;
    this.initialize();
  }

  /**
   * Initialize the handler. Must be called before adding events.
   */
  initialize() {
    if (!__scratchAddonsRedux.target || this.initialized) return;
    this.initialized = true;
    __scratchAddonsRedux.target.addEventListener("statechanged", ({ detail }) => {
      const newEvent = new CustomEvent("statechanged", {
        detail: {
          action: detail.action,
          prev: detail.prev,
          next: detail.next,
        },
      });
      this.dispatchEvent(newEvent);
    });
  }

  /**
   * Redux state.
   * @type {object}
   */
  get state() {
    return __scratchAddonsRedux.state;
  }

  /**
   * Dispatches redux state change.
   * @param {object} payload - payload to pass to redux.
   * @throws when Redux is unavailable.
   */
  dispatch(payload) {
    if (!__scratchAddonsRedux.dispatch) throw new Error("Redux is unavailable");
    __scratchAddonsRedux.dispatch(payload);
  }

  /**
   * Waits until a state meets the condition.
   * @param {function} condition - a function that takes redux state and returns whether to keep waiting or not.
   * @param {object=} opts - options.
   * @param {string=|string[]=} actions - the action(s) to check for.
   * @returns {Promise} a Promise resolved when the state meets the condition.
   */
  waitForState(condition, opts = {}) {
    this.initialize();
    if (!__scratchAddonsRedux.target) return Promise.reject(new Error("Redux is unavailable"));
    if (condition(__scratchAddonsRedux.state)) return Promise.resolve();
    let actions = opts.actions || null;
    if (typeof actions === "string") actions = [actions];
    return new Promise((resolve) => {
      const listener = ({ detail }) => {
        if (actions && !actions.includes(detail.action.type)) return;
        if (!condition(detail.next)) return;
        __scratchAddonsRedux.target.removeEventListener("statechanged", listener);
        setTimeout(resolve, 0);
      };
      __scratchAddonsRedux.target.addEventListener("statechanged", listener);
    });
  }
}

// From https://github.com/LLK/scratch-gui/blob/develop/src/lib/data-uri-to-blob.js
function dataURLToBlob(dataURL, returnArrayBuffer) {
  const byteString = atob(dataURL.split(",")[1]);
  const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uintArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uintArray[i] = byteString.charCodeAt(i);
  }
  if (returnArrayBuffer) return arrayBuffer;
  const blob = new Blob([arrayBuffer], { type: mimeString });
  return blob;
}

/**
 * @private
 */
var getWorkerScript = (tab, script, url) => {
  script = script.replace(/^export default (?:async )?/, "");
  script = script.replace(
    /\) +(?:=>)? +\{/,
    (match) => `${match}
  postMessage("STARTED");
  `
  );
  return `
  (async ${script})({
    addon: {
      self: {
        id: ${JSON.stringify(tab._addonId)},
        url: ${JSON.stringify(url)},
        browser: ${JSON.stringify(typeof InstallTrigger !== "undefined" ? "firefox" : "chrome")},
      },
      tab: {
        clientVersion: ${JSON.stringify(tab.clientVersion)},
      },
      console: {
        ...console,
        log: console.log.bind(
          console,
          \`%c[${tab._addonId} (worker)]\`,
          "color:darkorange; font-weight: bold;"
        ),
        warn: console.warn.bind(
          console,
          \`%c[${tab._addonId} (worker)]\`,
          "color:darkorange; font-weight: bold;"
        ),
      },
    }
  });
  `;
};

/*
  Auto-escape input to prevent XSS.
  Usage: autoescaper`trusted code ${untrusted value}`
*/

const escapeHTML$1 = (str) => str.replace(/([<>'"&])/g, (_, l) => `&#${l.charCodeAt(0)};`);

const color = {
  color: "#29beb8",
  secondaryColor: "#3aa8a4",
  tertiaryColor: "#3aa8a4",
};

const ICON =
  "data:image/svg+xml;," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 386 386"><circle cx="193" cy="193" r="193" fill="#ff7b26"/><path fill="#fff" d="M253.276 243.45c-10.016 27.852-37.244 44.78-80.907 50.32a63.33 63.33 0 01-5.892.467c-2.543 3.734-5.861 6.97-9.769 9.491-10.233 6.567-19.816 9.772-29.274 9.772-19.444 0-40.376-14.564-40.376-46.555 0-2.178.094-5.01.31-8.931.095-1.68.187-2.988.218-3.952a34.65 34.65 0 01-.807-7.376v-15.062c0-2.458.249-4.916.744-7.375.036-2.085.125-4.419.28-6.97-.745-2.74-1.303-5.913-1.303-9.461 0-1.618.124-3.236.341-4.823 1.178-8.34 4.869-16.712 11.102-23.402a56.07 56.07 0 01-3.256-18.859v-15.87c0-6.443 1.271-14.471 7.504-34.45 2.605-8.59 3.442-11.265 4.59-13.755 6.109-13.755 15.32-20.632 22.018-24.024 10.946-5.477 22.7-8.278 34.918-8.278 5.644 0 11.04.592 16.187 1.712a41.705 41.705 0 017.35-3.953c3.318-1.431 6.853-2.427 10.76-3.05 9.77-1.68 20.096.405 29.089 5.882 9.458 5.789 20.312 17.8 18.978 42.51-.216 4.356-.59 10.176-1.147 17.769-.035.187-.035.373-.059.56-.495 5.508-1.21 13.723-2.17 24.584.248 4.201.154 8.9-.217 14.44a33.182 33.182 0 01-1.055 6.286c-.124.467-.249.902-.373 1.307a67.737 67.737 0 018.993 15.435c1.83 3.703 3.38 7.967 4.745 13.164.528 1.96.869 3.952 1.023 5.975 1.396 17.458.682 27.758-2.543 36.472z" style="mix-blend-mode:normal"/><path fill="#ff7b26" d="M221.91 210.395c.908 11.318.722 18.613-.547 21.899-5.278 14.965-23.01 24.36-53.19 28.194-10.186 1.28-20.367-3.557-30.554-14.508 0 1.643.363 6.57 1.094 14.785.547 6.022.453 10.948-.273 14.779-4.55 2.919-8.184 4.381-10.912 4.381-4.187 0-6.274-4.104-6.274-12.32 0-1.46.094-3.784.273-6.977.18-3.19.273-5.427.273-6.706 0-3.103-.273-5.29-.819-6.57v-15.055c0-.365.094-.775.273-1.232.18-.454.362-.866.546-1.233-.183-2.552-.094-6.476.273-11.77.362-3.285.362-5.38 0-6.295-.912-1.82-1.361-2.916-1.361-3.283.723-5.11 4.456-7.665 11.182-7.665 4.364 0 7 1.553 7.911 4.653 0 2.919.364 7.21 1.091 12.865 1.095 6.569 4.547 13.141 10.367 19.708 6.364 7.484 12.454 10.95 18.278 10.403 6.546-.725 13.093-2.278 19.64-4.652 9.092-3.287 14.546-7.117 16.367-11.496 1.268-3.286 1.907-6.75 1.907-10.403 0-11.129-4.09-19.434-12.274-24.908-3.64-2.372-10.367-4.289-20.188-5.751-5.638-.725-9.096-1.095-10.364-1.095-8.73.183-16.87-2.645-24.415-8.487-7.548-5.838-11.319-12.594-11.319-20.258v-15.874c0-3.464 2-11.586 6.004-24.36 1.814-6.026 2.816-9.215 3.002-9.583 1.634-3.83 3.724-6.385 6.27-7.664 6.18-3.1 12.727-4.653 19.64-4.653 13.455 0 23.366 5.474 29.732 16.422.547.548 1.455 1.37 2.73 2.465.179-2.552.546-6.476 1.09-11.77a1309.62 1309.62 0 00-.545-6.843c0-2.552 1.268-4.285 3.817-5.2.725-.363 1.727-.637 3.002-.82 1.817-.366 3.774.093 5.867 1.365 2.087 1.28 2.952 5.113 2.59 11.496-.183 4.014-.547 9.672-1.092 16.97-.546 6.024-1.361 15.239-2.456 27.649.364 2.919.364 6.937 0 12.043-.912 3.467-3.64 5.2-8.184 5.2-2.366 0-4.636-.637-6.819-1.913-1.091-3.464-1.634-4.93-1.634-4.382.36-4.926-.639-11.496-3.002-19.708-2.003-4.195-4.772-10.17-8.32-17.928-3.548-7.755-8.23-11.91-14.048-12.457-7.275-.548-12.001 1.917-14.184 7.39-.726 2.375-1.73 5.845-3 10.404-2.182 6.753-3.547 13.232-4.093 19.434-.182 2.01-.365 2.832-.546 2.465a228.34 228.34 0 001.91 10.95c.909 4.563 3.139 8.033 6.683 10.4 3.548 2.375 10.318 3.832 20.322 4.38 24.548 1.465 39.73 10.042 45.551 25.732.906 1.463 1.815 3.924 2.726 7.388z" style="mix-blend-mode:normal"/><path fill="#ff7b26" d="M161.5 214.5h138v113h-138z"/><path d="M194.5 232.5v15h-10v80h115v-80h-10v-15h-32v15h-31v-15z" fill="#fff"/></svg>`
  );

let vm;
const customBlocks = {};
const customBlockParamNamesIdsDefaults = Object.create(null);

const getCustomBlock = (proccode) => {
  if (!Object.prototype.hasOwnProperty.call(customBlocks, proccode)) {
    return;
  }
  return customBlocks[proccode];
};

const getArgumentId = (index) => `arg${index}`;

const getNamesIdsDefaults = (blockData) => [
  blockData.args,
  blockData.args.map((_, i) => getArgumentId(i)),
  blockData.args.map(() => ""),
];

// This needs to function exactly as Scratch does:
// https://github.com/LLK/scratch-blocks/blob/abbfe93136fef57fdfb9a077198b0bc64726f012/blocks_vertical/procedures.js#L207-L215
// Returns a list like ["%s", "%d"]
const parseArguments = (code) =>
  code
    .split(/(?=[^\\]%[nbs])/g)
    .map((i) => i.trim())
    .filter((i) => i.charAt(0) === "%")
    .map((i) => i.substring(0, 2));

// Ensures all arguments have whitespace before them so that Scratch parses it correctly.
// "test%s" -> "test %s"
const fixDisplayName = (displayName) => displayName.replace(/([^\s])(%[nbs])/g, (_, before, arg) => `${before} ${arg}`);
const compareArrays = (a, b) => JSON.stringify(a) === JSON.stringify(b);

let workspaceUpdateQueued = false;
const queueWorkspaceUpdate = () => {
  if (workspaceUpdateQueued) {
    return;
  }
  workspaceUpdateQueued = true;
  queueMicrotask(() => {
    workspaceUpdateQueued = false;
    if (vm.editingTarget) {
      vm.emitWorkspaceUpdate();
    }
  });
};

const addBlock = (proccode, { args, callback, hidden, displayName }) => {
  if (getCustomBlock(proccode)) {
    return;
  }

  // Make sure that the argument counts all appear to be consistent.
  // Any inconsistency may result in various strange behaviors, possibly including corruption.
  const procCodeArguments = parseArguments(proccode);
  if (args.length !== procCodeArguments.length) {
    throw new Error("Procedure code and argument list do not match");
  }
  if (displayName) {
    displayName = fixDisplayName(displayName);
    // Make sure that the display name has the same arguments as the actual procedure code
    const displayNameArguments = parseArguments(displayName);
    if (!compareArrays(procCodeArguments, displayNameArguments)) {
      console.warn(`block displayName ${displayName} for ${proccode} does not have matching arguments, ignoring it.`);
      displayName = proccode;
    }
  } else {
    displayName = proccode;
  }

  const blockData = {
    id: proccode,
    color: color.color,
    secondaryColor: color.secondaryColor,
    tertiaryColor: color.tertiaryColor,
    args,
    handler: callback,
    hide: !!hidden,
    displayName,
  };
  customBlocks[proccode] = blockData;
  customBlockParamNamesIdsDefaults[proccode] = getNamesIdsDefaults(blockData);
  queueWorkspaceUpdate();
};

const removeBlock = (proccode) => {
  customBlocks[proccode] = null;
  customBlockParamNamesIdsDefaults[proccode] = null;
};

const generateBlockXML = () => {
  let xml = "";
  for (const proccode of Object.keys(customBlocks)) {
    const blockData = customBlocks[proccode];
    if (blockData.hide) continue;
    const [names, ids, defaults] = getNamesIdsDefaults(blockData);
    xml +=
      '<block type="procedures_call" gap="16"><mutation generateshadows="true" warp="false"' +
      ` proccode="${escapeHTML$1(proccode)}"` +
      ` argumentnames="${escapeHTML$1(JSON.stringify(names))}"` +
      ` argumentids="${escapeHTML$1(JSON.stringify(ids))}"` +
      ` argumentdefaults="${escapeHTML$1(JSON.stringify(defaults))}"` +
      "></mutation></block>";
  }
  if (xml.length === 0) {
    const message = scratchAddons.l10n.get("noAddedBlocks", null, "No addons have added blocks.");
    return `<label text="${escapeHTML$1(message)}" showStatusButton="null" />`;
  }
  return xml;
};

const injectWorkspace = (ScratchBlocks) => {
  const BlockSvg = ScratchBlocks.BlockSvg;
  const oldUpdateColour = BlockSvg.prototype.updateColour;
  BlockSvg.prototype.updateColour = function (...args) {
    // procedures_prototype also have a procedure code but we do not want to color them.
    if (this.type === "procedures_call") {
      const block = this.procCode_ && getCustomBlock(this.procCode_);
      if (block) {
        this.colour_ = block.color;
        this.colourSecondary_ = block.secondaryColor;
        this.colourTertiary_ = block.tertiaryColor;
        this.customContextMenu = null;
      }
    }
    return oldUpdateColour.call(this, ...args);
  };

  // We use Scratch's extension category mechanism to create a new category.
  // https://github.com/LLK/scratch-gui/blob/ddd2fa06f2afa140a46ec03be91796ded861e65c/src/containers/blocks.jsx#L344
  // https://github.com/LLK/scratch-vm/blob/a0c11d6d8664a4f2d55632e70630d09ec6e9ae28/src/engine/runtime.js#L1381
  const originalGetBlocksXML = vm.runtime.getBlocksXML;
  vm.runtime.getBlocksXML = function (target) {
    const result = originalGetBlocksXML.call(this, target);
    result.unshift({
      id: "sa-blocks",
      xml:
        "<category" +
        ` name="${escapeHTML$1(scratchAddons.l10n.get("debugger/@name", null, "Debugger"))}"` +
        ' id="sa-blocks"' +
        ' colour="#ff7b26"' +
        ' secondaryColour="#ff7b26"' +
        ` iconURI="${ICON}"` +
        `>${generateBlockXML()}</category>`,
    });
    return result;
  };

  // Trick Scratch into thinking addon blocks are defined somewhere.
  // This makes Scratch's "is this procedure used anywhere" check work when addon blocks exist.
  // getDefineBlock is used in https://github.com/LLK/scratch-blocks/blob/37f12ae3e342480f4d8e7b6ba783c46e29e77988/core/block_dragger.js#L275-L297
  // and https://github.com/LLK/scratch-blocks/blob/develop/core/procedures.js
  // Only block_dragger.js should be able to reference addon blocks, but if procedures.js does
  // somehow, we shim enough of the API that things shouldn't break.
  const originalGetDefineBlock = ScratchBlocks.Procedures.getDefineBlock;
  ScratchBlocks.Procedures.getDefineBlock = function (procCode, workspace) {
    // If an actual definition with this code exists, return that instead of our shim.
    const result = originalGetDefineBlock.call(this, procCode, workspace);
    if (result) {
      return result;
    }
    const block = getCustomBlock(procCode);
    if (block) {
      return {
        workspace,
        getInput() {
          return {
            connection: {
              targetBlock() {
                return null;
              },
            },
          };
        },
      };
    }
    return result;
  };

  const originalCreateAllInputs = ScratchBlocks.Blocks["procedures_call"].createAllInputs_;
  ScratchBlocks.Blocks["procedures_call"].createAllInputs_ = function (...args) {
    const blockData = getCustomBlock(this.procCode_);
    if (blockData) {
      const originalProcCode = this.procCode_;
      this.procCode_ = blockData.displayName;
      const ret = originalCreateAllInputs.call(this, ...args);
      this.procCode_ = originalProcCode;
      return ret;
    }
    return originalCreateAllInputs.call(this, ...args);
  };

  // Workspace update may be required to make category appear in flyout
  queueWorkspaceUpdate();
};

let inited = false;
async function init(tab) {
  if (inited) {
    return;
  }
  inited = true;

  if (!tab.editorMode) {
    return;
  }

  vm = tab.traps.vm;

  const Blocks = vm.runtime.monitorBlocks.constructor;
  // Worth noting that this adds a very slight overhead to every procedure call.
  // However, it's not significant and is basically unmeasurable.
  const originalGetProcedureParamNamesIdsAndDefaults = Blocks.prototype.getProcedureParamNamesIdsAndDefaults;
  Blocks.prototype.getProcedureParamNamesIdsAndDefaults = function getProcedureParamNamesIdsAndDefaultsWrapped(name) {
    return customBlockParamNamesIdsDefaults[name] || originalGetProcedureParamNamesIdsAndDefaults.call(this, name);
  };

  const oldStepToProcedure = vm.runtime.sequencer.stepToProcedure;
  vm.runtime.sequencer.stepToProcedure = function (thread, proccode) {
    const blockData = getCustomBlock(proccode);
    if (blockData) {
      const stackFrame = thread.peekStackFrame();
      blockData.handler(stackFrame.params, thread);
      // Don't call old stepToProcedure. It won't work correctly.
      // Something to consider is that this may allow projects to figure out if a user has an addon enabled.
      return;
    }
    return oldStepToProcedure.call(this, thread, proccode);
  };

  const ScratchBlocks = await tab.traps.getBlockly();
  injectWorkspace(ScratchBlocks);
}

let initialized = false;
let hasDynamicContextMenu = false;
let contextMenus = [];

const onReactContextMenu = function (e) {
  if (!e.target) return;
  const ctxTarget = e.target.closest(".react-contextmenu-wrapper");
  if (!ctxTarget) return;
  let ctxMenu = ctxTarget.querySelector("nav.react-contextmenu");
  let type;
  const extra = {};
  if (!ctxMenu && ctxTarget.closest(".monitor-overlay")) {
    // Monitors are rendered on document.body.
    // This is internal id which is different from the actual monitor ID.
    // Optional chain just to prevent crashes when they change the internal stuff.
    const mInternalId = ctxTarget[this.traps.getInternalKey(ctxTarget)]?.return?.stateNode?.props?.id;
    if (!mInternalId) return;
    ctxMenu = Array.prototype.find.call(
      document.querySelectorAll("body > nav.react-contextmenu"),
      (candidate) => candidate[this.traps.getInternalKey(candidate)]?.return?.stateNode?.props?.id === mInternalId
    );
    if (!ctxMenu) return;
    const props = ctxTarget[this.traps.getInternalKey(ctxTarget)]?.return?.return?.return?.stateNode?.props;
    if (!props) return;
    extra.monitorParams = props.params;
    extra.opcode = props.opcode;
    extra.itemId = props.id;
    extra.targetId = props.targetId;
    type = `monitor_${props.mode}`;
  } else if (ctxTarget[this.traps.getInternalKey(ctxTarget)]?.return?.return?.return?.stateNode?.props?.dragType) {
    // SpriteSelectorItem which despite its name is used for costumes, sounds, backpacked script etc
    const props = ctxTarget[this.traps.getInternalKey(ctxTarget)].return.return.return.stateNode.props;
    type = props.dragType.toLowerCase();
    extra.name = props.name;
    extra.itemId = props.id;
    extra.index = props.index;
  } else {
    return;
  }
  const ctx = {
    menuItem: ctxMenu,
    target: ctxTarget,
    type,
    ...extra,
  };
  Array.from(ctxMenu.children).forEach((existing) => {
    if (existing.classList.contains("sa-ctx-menu")) existing.remove();
  });
  for (const item of hasDynamicContextMenu
    ? contextMenus.flatMap((menu) => (typeof menu === "function" ? menu(type, ctx) : menu))
    : contextMenus) {
    if (!item) continue;
    if (item.types && !item.types.some((itemType) => type === itemType)) continue;
    if (item.condition && !item.condition(ctx)) continue;
    const itemElem = document.createElement("div");
    const classes = ["context-menu_menu-item"];
    if (item.border) classes.push("context-menu_menu-item-bordered");
    if (item.dangerous) classes.push("context-menu_menu-item-danger");
    itemElem.className = this.scratchClass(...classes, {
      others: ["react-contextmenu-item", "sa-ctx-menu", item.className || ""],
    });
    const label = document.createElement("span");
    label.textContent = item.label;
    itemElem.append(label);
    this.displayNoneWhileDisabled(itemElem, {
      display: "block",
    });

    itemElem.addEventListener("click", (e) => {
      e.stopPropagation();
      window.dispatchEvent(
        new CustomEvent("REACT_CONTEXTMENU_HIDE", {
          detail: {
            action: "REACT_CONTEXTMENU_HIDE",
          },
        })
      );
      item.callback(ctx);
    });

    this.appendToSharedSpace({
      space: item.position,
      order: item.order,
      scope: ctxMenu,
      element: itemElem,
    });
  }
  return;
};

const initialize = (tab) => {
  if (initialized) return;
  initialized = true;
  tab
    .waitForElement("body")
    .then((body) => body.addEventListener("contextmenu", (e) => onReactContextMenu.call(tab, e), { capture: true }));
};

const addContextMenu = (tab, callback, opts) => {
  if (typeof opts === "undefined") {
    contextMenus.push(callback);
    hasDynamicContextMenu = true;
  } else {
    contextMenus.push({
      ...opts,
      callback,
    });
  }
  initialize(tab);
};

const DATA_PNG = "data:image/png;base64,";

const contextMenuCallbacks = [];
const CONTEXT_MENU_ORDER = ["editor-devtools", "block-switching", "blocks2image", "swap-local-global"];
let createdAnyBlockContextMenus = false;

/**
 * APIs specific to userscripts.
 * @extends Listenable
 * @property {?string} clientVersion - version of the renderer (scratch-www, scratchr2, etc)
 * @property {Trap} traps
 * @property {ReduxHandler} redux
 */
class Tab extends Listenable {
  constructor(info) {
    super();
    this._addonId = info.id;
    this.clientVersion = document.querySelector("meta[name='format-detection']")
      ? "scratch-www"
      : document.querySelector("script[type='text/javascript']")
      ? "scratchr2"
      : null;
    this.traps = new Trap(this);
    this.redux = new ReduxHandler();
    this._waitForElementSet = new WeakSet();
  }
  addBlock(...a) {
    init(this);
    return addBlock(...a);
  }
  removeBlock(...a) {
    return removeBlock(...a);
  }
  /**
   * Loads a script by URL.
   * @param {string} url - script URL.
   * @returns {Promise}
   */
  loadScript(url) {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = url;
      document.head.appendChild(script);
      script.onload = resolve;
    });
  }
  /**
   * Waits until an element renders, then return the element.
   * @param {string} selector - argument passed to querySelector.
   * @param {object} opts - options.
   * @param {boolean=} opts.markAsSeen - Whether it should mark resolved elements to be skipped next time or not.
   * @param {function=} opts.condition - A function that returns whether to resolve the selector or not.
   * @param {function=} opts.elementCondition - A function that returns whether to resolve the selector or not, given an element.
   * @param {function=} opts.reduxCondition - A function that returns whether to resolve the selector or not.
   * Use this as an optimization and do not rely on the behavior.
   * @param {string[]=} opts.reduxEvents - An array of redux events that must be dispatched before resolving the selector.
   * Use this as an optimization and do not rely on the behavior.
   * @returns {Promise<Element>} - element found.
   */
  waitForElement(selector, opts = {}) {
    const markAsSeen = !!opts.markAsSeen;
    if (!opts.condition || opts.condition()) {
      const firstQuery = document.querySelectorAll(selector);
      for (const element of firstQuery) {
        if (this._waitForElementSet.has(element)) continue;
        if (opts.elementCondition && !opts.elementCondition(element)) continue;
        if (markAsSeen) this._waitForElementSet.add(element);
        return Promise.resolve(element);
      }
    }
    const { reduxCondition, condition } = opts;
    let listener;
    let combinedCondition = () => {
      if (condition && !condition()) return false;
      if (this.redux.state) {
        if (reduxCondition && !reduxCondition(this.redux.state)) return false;
      }
      // NOTE: this may reach sooner than expected, if redux state is not available
      // because of timing issues. However this is just an optimization! It's fine
      // if it runs a little earlier. Just don't error out.
      return true;
    };
    if (opts.reduxEvents) {
      const oldCondition = combinedCondition;
      let satisfied = false;
      combinedCondition = () => {
        if (oldCondition && !oldCondition()) return false;
        return satisfied;
      };
      listener = ({ detail }) => {
        if (opts.reduxEvents.includes(detail.action.type)) {
          satisfied = true;
        }
      };
      this.redux.initialize();
      this.redux.addEventListener("statechanged", listener);
    }
    const promise = scratchAddons.sharedObserver.watch({
      query: selector,
      seen: markAsSeen ? this._waitForElementSet : null,
      condition: combinedCondition,
      elementCondition: opts.elementCondition || null,
    });
    if (listener) {
      promise.then((match) => {
        this.redux.removeEventListener("statechanged", listener);
        return match;
      });
    }
    return promise;
  }
  /**
   * editor mode (or null for non-editors).
   * @type {?string}
   */
  get editorMode() {
    const pathname = location.pathname.toLowerCase();
    const split = pathname.split("/").filter(Boolean);
    if (!split[0] || split[0] !== "projects") return null;
    if (split.includes("editor")) return "editor";
    if (split.includes("fullscreen")) return "fullscreen";
    if (split.includes("embed")) return "embed";
    return "projectpage";
  }

  /**
   * Copies an PNG image.
   * @param {string} dataURL - data url of the png image
   * @returns {Promise}
   */
  copyImage(dataURL) {
    if (!dataURL.startsWith(DATA_PNG)) return Promise.reject(new TypeError("Expected PNG data URL"));
    if (typeof Clipboard.prototype.write === "function") {
      // Chrome
      const blob = dataURLToBlob(dataURL);
      const items = [
        new ClipboardItem({
          "image/png": blob,
        }),
      ];
      return navigator.clipboard.write(items);
    } else {
      // Firefox needs Content Script
      return scratchAddons.methods.copyImage(dataURL).catch((err) => {
        return Promise.reject(new Error(`Error inside clipboard handler: ${err}`));
      });
    }
  }

  /**
   * Gets translation used by Scratch.
   * @param {string} key - Translation key.
   * @returns {string} Translation.
   */
  scratchMessage(key) {
    if (this.clientVersion === "scratch-www") {
      if (this.editorMode && this.redux.state) {
        if (this.redux.state.locales.messages[key]) {
          return this.redux.state.locales.messages[key];
        }
      }
      const locales = [window._locale ? window._locale.toLowerCase() : "en"];
      if (locales[0].includes("-")) locales.push(locales[0].split("-")[0]);
      if (locales.includes("pt") && !locales.includes("pt-br")) locales.push("pt-br");
      if (!locales.includes("en")) locales.push("en");
      for (const locale of locales) {
        if (window._messages[locale] && window._messages[locale][key]) {
          return window._messages[locale][key];
        }
      }
      console.warn("Unknown key: ", key);
      return "";
    }
    if (this.clientVersion === "scratchr2") {
      return window.django.gettext(key);
    }
  }

  /**
   * @private
   */
  get _eventTargetKey() {
    return "tab";
  }

  /**
   * Loads a Web Worker.
   * @async
   * @param {string} url - URL of the worker to load.
   * @returns {Promise<Worker>} - worker.
   */
  async loadWorker(url) {
    const resp = await fetch(url);
    const script = await resp.text();
    const workerScript = getWorkerScript(this, script, url);
    const blob = new Blob([workerScript], { type: "text/javascript" });
    const workerURL = URL.createObjectURL(blob);
    const worker = new Worker(workerURL);
    return new Promise((resolve) => worker.addEventListener("message", () => resolve(worker), { once: true }));
  }

  /**
   * Gets the hashed class name for a Scratch stylesheet class name.
   * @param {...*} args Unhashed class names.
   * @param {object} opts - options.
   * @param {String[]|String} opts.others - Non-Scratch class or classes to merge.
   * @returns {string} Hashed class names.
   */
  scratchClass(...args) {
    let res = "";
    args
      .filter((arg) => typeof arg === "string")
      .forEach((classNameToFind) => {
        if (scratchAddons.classNames.loaded) {
          res +=
            scratchAddons.classNames.arr.find(
              (className) =>
                className.startsWith(classNameToFind + "_") && className.length === classNameToFind.length + 6
            ) || "";
        } else {
          res += `scratchAddonsScratchClass/${classNameToFind}`;
        }
        res += " ";
      });
    if (typeof args[args.length - 1] === "object") {
      const options = args[args.length - 1];
      const classNames = Array.isArray(options.others) ? options.others : [options.others];
      classNames.forEach((string) => (res += string + " "));
    }
    res = res.slice(0, -1);
    // Sanitize just in case
    res = res.replace(/"/g, "");
    return res;
  }

  /**
   * Hides an element when the addon is disabled.
   * @param {HTMLElement} el - the element.
   * @param {object=} opts - the options.
   * @param {string=} opts.display - the fallback value for CSS display.
   */
  displayNoneWhileDisabled(el, { display = "" } = {}) {
    el.style.display = `var(--${this._addonId.replace(/-([a-z])/g, (g) =>
      g[1].toUpperCase()
    )}-_displayNoneWhileDisabledValue${display ? ", " : ""}${display})`;
  }

  /**
   * The direction of the text; i.e. rtl or ltr.
   * @type {string}
   */
  get direction() {
    // https://github.com/LLK/scratch-l10n/blob/master/src/supported-locales.js
    const rtlLocales = ["ar", "ckb", "fa", "he"];
    const lang = scratchAddons.globalState.auth.scratchLang.split("-")[0];
    return rtlLocales.includes(lang) ? "rtl" : "ltr";
  }

  /**
   * Adds an item to a shared space.
   * Defined shared spaces are:
   * stageHeader - the stage header
   * fullscreenStageHeader - the stage header for fullscreen
   * afterGreenFlag - after the green flag
   * afterStopButton - after the stop button
   * afterCopyLinkButton - after the copy link button, shown below project descriptions
   * afterSoundTab - after the sound tab in editor
   * forumsBeforePostReport - before the report button in forum posts
   * forumsAfterPostReport - after the report button in forum posts
   * beforeRemixButton - before the remix button in project page
   * studioCuratorsTab - inside the studio curators tab
   * @param {object} opts - options.
   * @param {string} opts.space - the shared space name.
   * @param {HTMLElement} element - the element to add.
   * @param {number} order - the order of the added element. Should not conflict with other addons.
   * @param {HTMLElement=} scope - if multiple shared spaces exist, the one where the shared space gets added to.
   * @returns {boolean} whether the operation was successful or not.
   */
  appendToSharedSpace({ space, element, order, scope }) {
    const q = document.querySelector.bind(document);
    const sharedSpaces = {
      stageHeader: {
        // Non-fullscreen stage header only
        element: () => q("[class^='stage-header_stage-size-row']"),
        from: () => [],
        until: () => [
          // Small/big stage buttons (for editor mode)
          q("[class^='stage-header_stage-size-toggle-group']"),
          // Full screen icon (for player mode)
          q("[class^='stage-header_stage-size-row']").lastChild,
        ],
      },
      fullscreenStageHeader: {
        // Fullscreen stage header only
        element: () => q("[class^='stage-header_stage-menu-wrapper']"),
        from: function () {
          let emptyDiv = this.element().querySelector(".sa-spacer");
          if (!emptyDiv) {
            emptyDiv = document.createElement("div");
            emptyDiv.style.marginLeft = "auto";
            emptyDiv.className = "sa-spacer";
            this.element().insertBefore(emptyDiv, this.element().lastChild);
          }
          return [emptyDiv];
        },
        until: () => [q("[class^='stage-header_stage-menu-wrapper']").lastChild],
      },
      afterGreenFlag: {
        element: () => q("[class^='controls_controls-container']"),
        from: () => [],
        until: () => [q("[class^='stop-all_stop-all']")],
      },
      afterStopButton: {
        element: () => q("[class^='controls_controls-container']"),
        from: () => [q("[class^='stop-all_stop-all']")],
        until: () => [],
      },
      beforeProjectActionButtons: {
        element: () => q(".flex-row.subactions > .flex-row.action-buttons"),
        from: () => [],
        until: () => [q(".report-button"), q(".action-buttons > div")],
      },
      afterCopyLinkButton: {
        element: () => q(".flex-row.subactions > .flex-row.action-buttons"),
        from: () => [q(".copy-link-button")],
        until: () => [],
      },
      afterSoundTab: {
        element: () => q("[class^='react-tabs_react-tabs__tab-list']"),
        from: () => [q("[class^='react-tabs_react-tabs__tab-list']").children[2]],
        until: () => [q("#s3devToolBar")],
      },
      forumsBeforePostReport: {
        element: () => scope.querySelector(".postfootright > ul"),
        from: () => [],
        until: function () {
          let reportButton = scope.querySelector(
            ".postfootright > ul > li.postreport, .postfootright > ul > li.pseudopostreport"
          );
          if (!reportButton) {
            // User is logged out, so there's no report button on the post footer
            // Create a pseudo post report button as a separator between this space
            // and the forumsAfterPostReport space.
            reportButton = Object.assign(document.createElement("li"), {
              className: "pseudopostreport",
              textContent: " 🞄 ",
            });
            this.element().appendChild(reportButton);
          }
          return [reportButton];
        },
      },
      forumsAfterPostReport: {
        element: () => scope.querySelector(".postfootright > ul"),
        from: function () {
          let reportButton = scope.querySelector(
            ".postfootright > ul > li.postreport, .postfootright > ul > li.pseudopostreport"
          );
          if (!reportButton) {
            // User is logged out. See comment on forumsBeforePostReport space
            reportButton = Object.assign(document.createElement("li"), {
              className: "pseudopostreport",
              textContent: " 🞄 ",
            });
            this.element().appendChild(reportButton);
          }
          return [reportButton];
        },
        until: () => [scope.querySelector(".postfootright > ul > li.postquote")],
      },
      beforeRemixButton: {
        element: () => q(".project-buttons"),
        from: () => [],
        until: () => [
          q(".project-buttons > .remix-button:not(.sa-remix-button)"),
          q(".project-buttons > .see-inside-button"),
        ],
      },
      studioCuratorsTab: {
        element: () => q(".studio-tabs div:nth-child(2)"),
        from: () => [],
        // .commenting-status only exists if account is muted
        until: () => [
          q(".studio-tabs div:nth-child(2) > .commenting-status"),
          q(".studio-tabs div:nth-child(2) > .studio-members"),
        ],
      },
      forumToolbarTextDecoration: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton4")],
        until: () => [q(".markItUpButton4 ~ .markItUpSeparator")],
      },
      forumToolbarLinkDecoration: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton6")],
        until: () => [q(".markItUpButton6 ~ .markItUpSeparator")],
      },
      forumToolbarFont: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton7")],
        until: () => [q(".markItUpButton7 ~ .markItUpSeparator")],
      },
      forumToolbarList: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton10")],
        until: () => [q(".markItUpButton10 ~ .markItUpSeparator")],
      },
      forumToolbarDecoration: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton12")],
        until: () => [q(".markItUpButton12 ~ .markItUpSeparator")],
      },
      forumToolbarEnvironment: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton13")],
        until: () => [q(".markItUpButton13 ~ .markItUpSeparator")],
      },
      forumToolbarScratchblocks: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton14")],
        until: () => [q(".markItUpButton14 ~ .markItUpSeparator")],
      },
      forumToolbarTools: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton16")],
        until: () => [],
      },
      assetContextMenuAfterExport: {
        element: () => scope,
        from: () => {
          return Array.prototype.filter.call(
            scope.children,
            (c) => c.textContent === this.scratchMessage("gui.spriteSelectorItem.contextMenuExport")
          );
        },
        until: () => {
          return Array.prototype.filter.call(
            scope.children,
            (c) => c.textContent === this.scratchMessage("gui.spriteSelectorItem.contextMenuDelete")
          );
        },
      },
      assetContextMenuAfterDelete: {
        element: () => scope,
        from: () => {
          return Array.prototype.filter.call(
            scope.children,
            (c) => c.textContent === this.scratchMessage("gui.spriteSelectorItem.contextMenuDelete")
          );
        },
        until: () => [],
      },
      monitor: {
        element: () => scope,
        from: () => {
          const endOfVanilla = [
            this.scratchMessage("gui.monitor.contextMenu.large"),
            this.scratchMessage("gui.monitor.contextMenu.slider"),
            this.scratchMessage("gui.monitor.contextMenu.sliderRange"),
            this.scratchMessage("gui.monitor.contextMenu.export"),
          ];
          const potential = Array.prototype.filter.call(scope.children, (c) => endOfVanilla.includes(c.textContent));
          return [potential[potential.length - 1]];
        },
        until: () => [],
      },
    };

    const spaceInfo = sharedSpaces[space];
    const spaceElement = spaceInfo.element();
    if (!spaceElement) return false;
    const from = spaceInfo.from();
    const until = spaceInfo.until();

    element.dataset.saSharedSpaceOrder = order;

    let foundFrom = false;
    if (from.length === 0) foundFrom = true;

    // insertAfter = element whose nextSibling will be the new element
    // -1 means append at beginning of space (prepend)
    // This will stay null if we need to append at the end of space
    let insertAfter = null;

    const children = Array.from(spaceElement.children);
    for (let indexString of children.keys()) {
      const child = children[indexString];
      const i = Number(indexString);

      // Find either element from "from" before doing anything
      if (!foundFrom) {
        if (from.includes(child)) {
          foundFrom = true;
          // If this is the last child, insertAfter will stay null
          // and the element will be appended at the end of space
        }
        continue;
      }

      if (until.includes(child)) {
        // This is the first SA element appended to this space
        // If from = [] then prepend, otherwise append after
        // previous child (likely a "from" element)
        if (i === 0) insertAfter = -1;
        else insertAfter = children[i - 1];
        break;
      }

      if (child.dataset.saSharedSpaceOrder) {
        if (Number(child.dataset.saSharedSpaceOrder) > order) {
          // We found another SA element with higher order number
          // If from = [] and this is the first child, prepend.
          // Otherwise, append before this child.
          if (i === 0) insertAfter = -1;
          else insertAfter = children[i - 1];
          break;
        }
      }
    }

    if (!foundFrom) return false;
    // It doesn't matter if we didn't find an "until"

    // Separators in forum post spaces
    if (space === "forumsBeforePostReport") {
      element.appendChild(document.createTextNode(" | "));
    } else if (space === "forumsAfterPostReport") {
      element.prepend(document.createTextNode("| "));
    }

    if (insertAfter === null) {
      // This might happen with until = []
      spaceElement.appendChild(element);
    } else if (insertAfter === -1) {
      // This might happen with from = []
      spaceElement.prepend(element);
    } else {
      // Works like insertAfter but using insertBefore API.
      // nextSibling cannot be null because insertAfter
      // is always set to children[i-1], so it must exist
      spaceElement.insertBefore(element, insertAfter.nextSibling);
    }
    return true;
  }

  /**
   * Type for context menu item.
   * @typedef {object} Tab~ContextMenuItem
   * @property {boolean} enabled - whether it is enabled.
   * @property {string} text - the context menu item label.
   * @property {function} callback - the function that is called when item is clicked.
   * @property {boolean} separator - whether to add a separator above the item.
   */

  /**
   * Callback to modify the context menu.
   * @callback Tab~blockContextMenuCallback
   * @param {Tab~ContextMenuItem[]} items - the items added by vanilla code or other addons.
   * @param {?object} block - the targeted block, if any.
   * @returns {Tab~ContextMenuItem[]} the array that contains values of items array as well as new items.
   */

  /**
   * Creates an item in the editor Blockly context menu.
   * @param {Tab~blockContextMenuCallback} callback Returns new menu items.
   * @param {object} conditions - Show context menu when one of these conditions meet.
   * @param {boolean=} conditions.workspace - Add to workspace context menu.
   * @param {boolean=} conditions.blocks - Add to block context menu outside the flyout.
   * @param {boolean=} conditions.flyout - Add to block context menu in flyout/palette.
   * @param {boolean=} conditions.comments - Add to comments.
   */
  createBlockContextMenu(callback, { workspace = false, blocks = false, flyout = false, comments = false } = {}) {
    contextMenuCallbacks.push({ addonId: this._addonId, callback, workspace, blocks, flyout, comments });

    // Sort to ensure userscript run order doesn't change callback order
    contextMenuCallbacks.sort((b, a) => CONTEXT_MENU_ORDER.indexOf(b.addonId) - CONTEXT_MENU_ORDER.indexOf(a.addonId));

    if (createdAnyBlockContextMenus) return;
    createdAnyBlockContextMenus = true;

    this.traps.getBlockly().then((ScratchBlocks) => {
      const oldShow = ScratchBlocks.ContextMenu.show;
      ScratchBlocks.ContextMenu.show = function (event, items, rtl) {
        const gesture = ScratchBlocks.mainWorkspace.currentGesture_;
        const block = gesture.targetBlock_;

        for (const { callback, workspace, blocks, flyout, comments } of contextMenuCallbacks) {
          let injectMenu =
            // Workspace
            (workspace && !block && !gesture.flyout_ && !gesture.startBubble_) ||
            // Block in workspace
            (blocks && block && !gesture.flyout_) ||
            // Block in flyout
            (flyout && gesture.flyout_) ||
            // Comments
            (comments && gesture.startBubble_);
          if (injectMenu) {
            try {
              items = callback(items, block);
            } catch (e) {
              console.error("Error while calling context menu callback: ", e);
            }
          }
        }

        oldShow.call(this, event, items, rtl);

        const blocklyContextMenu = ScratchBlocks.WidgetDiv.DIV.firstChild;
        items.forEach((item, i) => {
          if (i !== 0 && item.separator) {
            const itemElt = blocklyContextMenu.children[i];
            itemElt.style.paddingTop = "2px";
            itemElt.style.borderTop = "1px solid hsla(0, 0%, 0%, 0.15)";
          }
        });
      };
    });
  }

  /**
   * @typedef {object} Tab~EditorContextMenuContext
   * @property {string} type - the type of the context menu.
   * @property {HTMLElement} menuItem - the item element.
   * @property {HTMLElement} target - the target item.
   * @property {number=} index - the index, if applicable.
   */

  /**
   * Callback executed when the item is clicked.
   * @callback Tab~EditorContextMenuItemCallback
   * @param {Tab~EditorContextMenuContext} context - the context for the action.
   */

  /**
   * Callback to check if the item should be visible.
   * @callback Tab~EditorContextMenuItemCallback
   * @param {Tab~EditorContextMenuContext} context - the context for the action.
   * @returns {boolean} true to make it visible, false to hide
   */

  /**
   * Adds a context menu item for the editor.
   * @param {Tab~EditorContextMenuItemCallback} callback - the callback executed when the item is clicked.
   * @param {object} opts - the options.
   * @param {string} opts.className - the class name to add to the item.
   * @param {string[]} opts.types - which types of context menu it should add to.
   * @param {string} opts.position - the position inside the context menu.
   * @param {number} opts.order - the order within the position.
   * @param {string} opts.label - the label for the item.
   * @param {boolean=} opts.border - whether to add a border at the top or not.
   * @param {boolean=} opts.dangerous - whether to indicate the item as dangerous or not.
   * @param {Tab~EditorContextMenuItemCondition} opts.condition - a function to check if the item should be shown.
   */
  createEditorContextMenu(...args) {
    addContextMenu(this, ...args);
  }
}

class Auth extends Auth$1 {
  constructor(...args) {
    super(...args);
    this._refresh();
  }

  /**
   * @private
   */
  _getCookie(name) {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const cookie = cookies.find((c) => c.startsWith(`${name}=`));
    if (!cookie) return null;
    return cookie.slice(name.length + 1);
  }

  /**
   * @private
   */
  _refresh() {
    this._lastUsername = undefined;
    this._lastUserId = undefined;
    this._lastIsLoggedIn = undefined;
    this._lastXToken = undefined;
  }

  /**
   * @private
   */
  _waitUntilFetched() {
    return new Promise((resolve) => this.addEventListener("session", resolve, { once: true }));
  }

  /**
   * @private
   */
  _update(d) {
    this._lastUsername = d.user?.username || null;
    this._lastUserId = d.user?.id || null;
    this._lastIsLoggedIn = !!d.user;
    this._lastXToken = d.user?.token || null;
    this.dispatchEvent(new CustomEvent("session"));
    this.dispatchEvent(new CustomEvent("change"));
  }

  /**
   * @private
   */
  _fetchProperty(prop) {
    if (typeof this[prop] !== "undefined") return Promise.resolve(this[prop]);
    return this._waitUntilFetched().then(() => this[prop]);
  }

  /**
   * Fetch whether the user is logged in or not.
   * @returns {Promise<boolean>} - whether the user is logged in or not.
   */
  fetchIsLoggedIn() {
    return this._fetchProperty("_lastIsLoggedIn");
  }

  /**
   * Fetch current username.
   * @returns {Promise<?string>} - the username.
   */
  fetchUsername() {
    return this._fetchProperty("_lastUsername");
  }

  /**
   * Fetch current user ID.
   * @returns {Promise<?number>} - the user ID.
   */
  fetchUserId() {
    return this._fetchProperty("_lastUserId");
  }

  /**
   * Fetch X-Token used in new APIs.
   * @returns {Promise<?string>} - the X-Token.
   */
  fetchXToken() {
    return this._fetchProperty("_lastXToken");
  }

  /**
   * CSRF token used in APIs.
   * @type {string}
   */
  get csrfToken() {
    return this._getCookie("scratchcsrftoken");
  }

  /**
   * Language of the Scratch website.
   * @type {string}
   */
  get scratchLang() {
    return this._getCookie("scratchlanguage");
  }
}

class Account extends Account$1 {
  constructor(addon) {
    super();
    this._addon = addon;
  }

  /**
   * Fetches message count.
   * @returns {Promise<?number>} - current message count.
   */
  getMsgCount() {
    return this._addon.auth.fetchIsLoggedIn().then((isLoggedIn) => {
      if (!isLoggedIn) return null;
      return scratchAddons.methods.getMsgCount();
    });
  }

  /**
   * @returns {Promise} - a promise that always rejects.
   */
  getMessages() {
    return Promise.reject(new Error("This method is unavailable."));
  }

  /**
   * @returns {Promise} - a promise that always rejects.
   */
  clearMessages() {
    return Promise.reject(new Error("This method is unavailable."));
  }
}

/**
 * An addon that loads as a userscript.
 * @extends Addon
 * @property {Tab} tab
 * @property {Auth} auth
 * @property {Account} account
 */
class UserscriptAddon extends Addon {
  constructor(info) {
    super(info);
    this._addonId = info.id;
    this.__path = `${new URL(import.meta.url).origin}/`;
    this.tab = new Tab(info);
    this.auth.dispose();
    this.auth = new Auth(this);
    this.account.dispose();
    this.account = new Account(this);
    this.self.disabled = false;
    this.self.enabledLate = info.enabledLate;
  }

  /**
   * @private
   */
  get _path() {
    return this.__path;
  }
}

function __variableDynamicImportRuntime0__(path) {
  switch (path) {
    default:
      return new Promise(function (resolve, reject) {
        (typeof queueMicrotask === "function"
          ? queueMicrotask
          : setTimeout)(reject.bind(null, new Error("Unknown variable dynamic import: " + path)));
      });
  }
}

async function runAddonUserscripts({ addonId, scripts, enabledLate = false }) {
  const addonObj = new UserscriptAddon({ id: addonId, enabledLate });
  addonObj.auth._update(scratchAddons.session);
  const globalObj = Object.create(null);
  for (const scriptInfo of scripts) {
    const { url: scriptPath, runAtComplete } = scriptInfo;
    const loadUserscript = async () => {
      await scratchAddons.l10n.loadByAddonId(addonId);
      const module = await __variableDynamicImportRuntime0__(`../addons/${addonId}/${scriptPath}.js`);
      const msg = (key, placeholders) =>
        scratchAddons.l10n.get(key.startsWith("/") ? key.slice(1) : `${addonId}/${key}`, placeholders);
      msg.locale = scratchAddons.l10n.locale;
      scratchAddons.console.logForAddon(`${addonId} [page]`)(
        `Running ${`${
          new URL(import.meta.url).origin
        }/addons/${addonId}/${scriptPath}`}, runAtComplete: ${runAtComplete}, enabledLate: ${enabledLate}`
      );
      const localConsole = {
        log: scratchAddons.console.logForAddon(addonId),
        warn: scratchAddons.console.warnForAddon(addonId),
        error: scratchAddons.console.errorForAddon(addonId),
      };
      module.default({
        addon: addonObj,
        global: globalObj,
        console: { ...console, ...localConsole },
        msg,
        safeMsg: (key, placeholders) =>
          scratchAddons.l10n.escaped(key.startsWith("/") ? key.slice(1) : `${addonId}/${key}`, placeholders),
      });
    };
    if (runAtComplete && document.readyState !== "complete") {
      window.addEventListener("load", () => loadUserscript(), { once: true });
    } else {
      await loadUserscript();
    }
  }
}

function r(r, n) {
  var t = Object.keys(r);
  if (Object.getOwnPropertySymbols) {
    var e = Object.getOwnPropertySymbols(r);
    n &&
      (e = e.filter(function (n) {
        return Object.getOwnPropertyDescriptor(r, n).enumerable;
      })),
      t.push.apply(t, e);
  }
  return t;
}
function n(n) {
  for (var t = 1; t < arguments.length; t++) {
    var e = null != arguments[t] ? arguments[t] : {};
    t % 2
      ? r(Object(e), !0).forEach(function (r) {
          o(n, r, e[r]);
        })
      : Object.getOwnPropertyDescriptors
      ? Object.defineProperties(n, Object.getOwnPropertyDescriptors(e))
      : r(Object(e)).forEach(function (r) {
          Object.defineProperty(n, r, Object.getOwnPropertyDescriptor(e, r));
        });
  }
  return n;
}
function t(r, n) {
  if (!(r instanceof n)) throw new TypeError("Cannot call a class as a function");
}
function e(r, n) {
  for (var t = 0; t < n.length; t++) {
    var e = n[t];
    (e.enumerable = e.enumerable || !1),
      (e.configurable = !0),
      "value" in e && (e.writable = !0),
      Object.defineProperty(r, e.key, e);
  }
}
function o(r, n, t) {
  return (
    n in r ? Object.defineProperty(r, n, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : (r[n] = t), r
  );
}
function i(r, n) {
  return (
    (function (r) {
      if (Array.isArray(r)) return r;
    })(r) ||
    (function (r, n) {
      var t = null == r ? null : ("undefined" != typeof Symbol && r[Symbol.iterator]) || r["@@iterator"];
      if (null == t) return;
      var e,
        o,
        i = [],
        a = !0,
        u = !1;
      try {
        for (t = t.call(r); !(a = (e = t.next()).done) && (i.push(e.value), !n || i.length !== n); a = !0);
      } catch (r) {
        (u = !0), (o = r);
      } finally {
        try {
          a || null == t.return || t.return();
        } finally {
          if (u) throw o;
        }
      }
      return i;
    })(r, n) ||
    (function (r, n) {
      if (!r) return;
      if ("string" == typeof r) return a(r, n);
      var t = Object.prototype.toString.call(r).slice(8, -1);
      "Object" === t && r.constructor && (t = r.constructor.name);
      if ("Map" === t || "Set" === t) return Array.from(r);
      if ("Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)) return a(r, n);
    })(r, n) ||
    (function () {
      throw new TypeError(
        "Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
      );
    })()
  );
}
function a(r, n) {
  (null == n || n > r.length) && (n = r.length);
  for (var t = 0, e = new Array(n); t < n; t++) e[t] = r[t];
  return e;
}
function u(r) {
  for (
    var n = function (r) {
        return /\s/.test(r);
      },
      t = [],
      e = {},
      o = 0,
      i = null,
      a = !1,
      u = 0;
    u < r.length;

  ) {
    if (a && (n(r[u]) || "{" === r[u])) (a = !1), (i = r.slice(o, u)), "{" === r[u] && u--;
    else if (!a && !n(r[u])) {
      var c = "{" === r[u];
      if (i && c) {
        var s = l(r, u);
        if (-1 === s) throw new Error('Unbalanced curly braces in string: "'.concat(r, '"'));
        (e[i] = r.slice(u + 1, s)), (u = s), (i = null);
      } else i && (t.push(i), (i = null)), (a = !0), (o = u);
    }
    u++;
  }
  return a && (i = r.slice(o)), i && t.push(i), { args: t, cases: e };
}
function l(r, n) {
  for (var t = 0, e = n + 1; e < r.length; e++) {
    var o = r.charAt(e);
    if ("}" === o) {
      if (0 === t) return e;
      t--;
    } else "{" === o && t++;
  }
  return -1;
}
function c(r) {
  return s(r.slice(1, -1), ",", 3);
}
function s(r, n, t) {
  var e = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : [];
  if (!r) return e;
  if (1 === t) return e.push(r), e;
  var o = r.indexOf(n);
  if (-1 === o) return e.push(r), e;
  var i = r.substring(0, o).trim(),
    a = r.substring(o + n.length + 1).trim();
  return e.push(i), s(a, n, t - 1, e);
}
function f(r) {
  return r.reduce(function (r, n) {
    return r.concat(Array.isArray(n) ? f(n) : n);
  }, []);
}
function h(r) {
  var n = {};
  return function () {
    for (var t = arguments.length, e = new Array(t), o = 0; o < t; o++) e[o] = arguments[o];
    var i = e.length
      ? e
          .map(function (r) {
            return null === r
              ? "null"
              : void 0 === r
              ? "undefined"
              : "function" == typeof r
              ? r.toString()
              : r instanceof Date
              ? r.toISOString()
              : JSON.stringify(r);
          })
          .join("|")
      : "_(no-args)_";
    if (Object.prototype.hasOwnProperty.call(n, i)) return n[i];
    var a = r.apply(void 0, e);
    return (n[i] = a), a;
  };
}
var v,
  p = (function () {
    function r(n) {
      var e = this,
        i = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      t(this, r),
        o(
          this,
          "format",
          h(function (r) {
            var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
            return f(e.process(r, n)).join("");
          })
        ),
        (this.locale = n),
        (this.typeHandlers = i);
    }
    var n, a;
    return (
      (n = r),
      (a = [
        {
          key: "process",
          value: function (r) {
            var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
            if (!r) return [];
            var t = r.indexOf("{");
            if (-1 !== t) {
              var e = l(r, t);
              if (-1 === e) throw new Error('Unbalanced curly braces in string: "'.concat(r, '"'));
              var o = r.substring(t, e + 1);
              if (o) {
                var a = [],
                  u = r.substring(0, t);
                u && a.push(u);
                var s = c(o),
                  f = i(s, 3),
                  h = f[0],
                  v = f[1],
                  p = f[2],
                  g = n[h];
                null == g && (g = "");
                var y = v && this.typeHandlers[v];
                a.push(y ? y(g, p, this.locale, n, this.process.bind(this)) : g);
                var b = r.substring(e + 1);
                return b && a.push(this.process(b, n)), a;
              }
            }
            return [r];
          },
        },
      ]),
      a && e(n.prototype, a),
      r
    );
  })(),
  g = 0;
function y(r, n) {
  for (var t = 0, e = "", o = 0, i = {}; t < r.length; ) {
    if ("#" !== r[t] || o) e += r[t];
    else {
      var a = "__hashToken".concat(g++);
      (e += "{".concat(a, ", number}")), (i[a] = n);
    }
    "{" === r[t] ? o++ : "}" === r[t] && o--, t++;
  }
  return { caseBody: e, numberValues: i };
}
function b(r) {
  var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "",
    e = arguments.length > 2 ? arguments[2] : void 0,
    o = arguments.length > 3 ? arguments[3] : void 0,
    i = arguments.length > 4 ? arguments[4] : void 0,
    a = u(t),
    l = a.args,
    c = a.cases,
    s = parseInt(r);
  l.forEach(function (r) {
    r.startsWith("offset:") && (s -= parseInt(r.slice("offset:".length)));
  });
  var f = [];
  if ("PluralRules" in Intl) {
    (void 0 !== v && v.resolvedOptions().locale === e) || (v = new Intl.PluralRules(e));
    var h = v.select(s);
    "other" !== h && f.push(h);
  }
  1 === s && f.push("one"), f.push("=".concat(s), "other");
  for (var p = 0; p < f.length; p++) {
    var g = f[p];
    if (g in c) {
      var b = y(c[g], s),
        d = b.caseBody,
        O = b.numberValues;
      return i(d, n(n({}, o), O));
    }
  }
  return r;
}

// This library is shared between background and userscript.
// Subclasses are responsible for implementing methods to load translations.

class LocalizationProvider extends EventTarget {
  constructor() {
    super();
    this.messages = {};
    this._reconfigure();
  }

  _reconfigure() {
    const locale = this.locale;
    this._date = new Intl.DateTimeFormat(locale);
    this._datetime = new Intl.DateTimeFormat(locale, {
      timeStyle: "short",
      dateStyle: "short",
    });
    this.formatter = new p(locale, {
      plural: b,
    });
  }

  _get(key, placeholders, messageHandler, fallback) {
    messageHandler = messageHandler || ((m) => m);
    if (Object.prototype.hasOwnProperty.call(this.messages, key)) {
      const message = messageHandler(this.messages[key]);
      return this.formatter.format(message, placeholders);
    }
    console.warn("Key missing:", key);
    return fallback || key;
  }

  get(key, placeholders = {}, fallback = "") {
    return this._get(key, placeholders, null, fallback);
  }

  escaped(key, placeholders = {}, fallback = "") {
    return this._get(key, placeholders, (message) => escapeHTML$1(message), fallback);
  }

  get locale() {
    return this.messages._locale || "en";
  }

  get localeName() {
    return this.messages._locale_name || "English";
  }

  date(dateObj) {
    return this._date.format(dateObj);
  }

  datetime(dateObj) {
    return this._datetime.format(dateObj);
  }
}

class UserscriptLocalizationProvider extends LocalizationProvider {
  constructor(urls) {
    super();
    this._urls = new Set(urls);
    this.generalLoaded = false;
  }

  async loadByAddonId(addonId) {
    if (addonId !== "_general" && !this.generalLoaded) {
      await this.loadByAddonId("_general");
    }
    let addonMessages = {};
    for (const dir of this._urls) {
      let resp;
      let messages = {};
      const url = `${dir}/${addonId}.json`;
      try {
        resp = await fetch(url);
        messages = await resp.json();
      } catch (_) {
        if (addonId === "_general") {
          this._urls.delete(dir);
        }
        continue;
      }
      addonMessages = Object.assign(messages, addonMessages);
      this.messages = Object.assign(messages, this.messages);
    }
    if (addonId === "_general") {
      this._reconfigure();
      this.generalLoaded = true;
    }
  }
}

function Module(_cs_) {
  window.scratchAddons = {};
  scratchAddons.classNames = { loaded: false };
  scratchAddons.eventTargets = {
    auth: [],
    settings: [],
    tab: [],
    self: [],
  };
  scratchAddons.session = {};
  const consoleOutput = (logAuthor = "[page]") => {
    const style = {
      // Remember to change these as well on cs.js
      leftPrefix: "background:  #ff7b26; color: white; border-radius: 0.5rem 0 0 0.5rem; padding: 0 0.5rem",
      rightPrefix:
        "background: #222; color: white; border-radius: 0 0.5rem 0.5rem 0; padding: 0 0.5rem; font-weight: bold",
      text: "",
    };
    return [`%cSA%c${logAuthor}%c`, style.leftPrefix, style.rightPrefix, style.text];
  };
  scratchAddons.console = {
    log: _realConsole.log.bind(_realConsole, ...consoleOutput()),
    warn: _realConsole.warn.bind(_realConsole, ...consoleOutput()),
    error: _realConsole.error.bind(_realConsole, ...consoleOutput()),
    logForAddon: (addonId) => _realConsole.log.bind(_realConsole, ...consoleOutput(addonId)),
    warnForAddon: (addonId) => _realConsole.warn.bind(_realConsole, ...consoleOutput(addonId)),
    errorForAddon: (addonId) => _realConsole.error.bind(_realConsole, ...consoleOutput(addonId)),
  };

  const pendingPromises = {};
  pendingPromises.msgCount = [];

  const page = {
    _globalState: null,
    get globalState() {
      return this._globalState;
    },
    set globalState(val) {
      this._globalState = scratchAddons.globalState = val;
    },

    l10njson: null, // Only set once
    addonsWithUserscripts: null, // Only set once

    _dataReady: false,
    get dataReady() {
      return this._dataReady;
    },
    set dataReady(val) {
      this._dataReady = val;
      onDataReady(); // Assume set to true
      this.refetchSession();
    },

    runAddonUserscripts, // Gets called by cs.js when addon enabled late

    fireEvent(info) {
      if (info.addonId) {
        if (info.name === "disabled") {
          document.documentElement.style.setProperty(
            `--${info.addonId.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}-_displayNoneWhileDisabledValue`,
            "none"
          );
        } else if (info.name === "reenabled") {
          document.documentElement.style.removeProperty(
            `--${info.addonId.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}-_displayNoneWhileDisabledValue`
          );
        }

        // Addon specific events, like settings change and self disabled
        const eventTarget = scratchAddons.eventTargets[info.target].find(
          (eventTarget) => eventTarget._addonId === info.addonId
        );
        if (eventTarget) eventTarget.dispatchEvent(new CustomEvent(info.name));
      } else {
        // Global events, like auth change
        scratchAddons.eventTargets[info.target].forEach((eventTarget) =>
          eventTarget.dispatchEvent(new CustomEvent(info.name))
        );
      }
    },
    isFetching: false,
    async refetchSession() {
      let res;
      let d;
      if (this.isFetching) return;
      this.isFetching = true;
      scratchAddons.eventTargets.auth.forEach((auth) => auth._refresh());
      try {
        res = await fetch("https://scratch.mit.edu/session/", {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        });
        d = await res.json();
      } catch (e) {
        d = {};
        scratchAddons.console.warn("Session fetch failed: ", e);
        if ((res && !res.ok) || !res) setTimeout(() => this.refetchSession(), 60000);
      }
      scratchAddons.session = d;
      scratchAddons.eventTargets.auth.forEach((auth) => auth._update(d));
      this.isFetching = false;
    },
  };
  Comlink.expose(page, Comlink.windowEndpoint(comlinkIframe4.contentWindow, comlinkIframe3.contentWindow));

  class SharedObserver {
    constructor() {
      this.inactive = true;
      this.pending = new Set();
      this.observer = new MutationObserver((mutation, observer) => {
        for (const item of this.pending) {
          if (item.condition && !item.condition()) continue;
          for (const match of document.querySelectorAll(item.query)) {
            if (item.seen?.has(match)) continue;
            if (item.elementCondition && !item.elementCondition(match)) continue;
            item.seen?.add(match);
            this.pending.delete(item);
            item.resolve(match);
            break;
          }
        }
        if (this.pending.size === 0) {
          this.inactive = true;
          this.observer.disconnect();
        }
      });
    }

    /**
     * Watches an element.
     * @param {object} opts - options
     * @param {string} opts.query - query.
     * @param {WeakSet=} opts.seen - a WeakSet that tracks whether an element has already been seen.
     * @param {function=} opts.condition - a function that returns whether to resolve the selector or not.
     * @param {function=} opts.elementCondition - A function that returns whether to resolve the selector or not, given an element.
     * @returns {Promise<Node>} Promise that is resolved with modified element.
     */
    watch(opts) {
      if (this.inactive) {
        this.inactive = false;
        this.observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
        });
      }
      return new Promise((resolve) =>
        this.pending.add({
          resolve,
          ...opts,
        })
      );
    }
  }

  async function requestMsgCount() {
    let count = null;
    if (scratchAddons.session.user?.username) {
      const username = scratchAddons.session.user.username;
      try {
        const resp = await fetch(`https://api.scratch.mit.edu/users/${username}/messages/count`);
        count = (await resp.json()).count || 0;
      } catch (e) {
        scratchAddons.console.warn("Could not fetch message count: ", e);
      }
    }
    pendingPromises.msgCount.forEach((resolve) => resolve(count));
    pendingPromises.msgCount = [];
  }

  function onDataReady() {
    const addons = page.addonsWithUserscripts;

    scratchAddons.l10n = new UserscriptLocalizationProvider(page.l10njson);

    scratchAddons.methods = {};
    scratchAddons.methods.getMsgCount = () => {
      let promiseResolver;
      const promise = new Promise((resolve) => (promiseResolver = resolve));
      pendingPromises.msgCount.push(promiseResolver);
      // 1 because the array was just pushed
      if (pendingPromises.msgCount.length === 1) requestMsgCount();
      return promise;
    };
    scratchAddons.methods.copyImage = async (dataURL) => {
      return _cs_.copyImage(dataURL);
    };
    scratchAddons.methods.getEnabledAddons = (tag) => _cs_.getEnabledAddons(tag);

    scratchAddons.sharedObserver = new SharedObserver();

    const runUserscripts = () => {
      for (const addon of addons) {
        if (addon.scripts.length) runAddonUserscripts(addon);
      }
    };

    // Note: we currently load userscripts and locales after head loaded
    // We could do that before head loaded just fine, as long as we don't
    // actually *run* the addons before document.head is defined.
    if (document.head) runUserscripts();
    else {
      const observer = new MutationObserver(() => {
        if (document.head) {
          runUserscripts();
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { subtree: true, childList: true });
    }
  }

  function bodyIsEditorClassCheck() {
    const pathname = location.pathname.toLowerCase();
    const split = pathname.split("/").filter(Boolean);
    if (!split[0] || split[0] !== "projects") return;
    if (split.includes("editor") || split.includes("fullscreen")) document.body.classList.add("sa-body-editor");
    else document.body.classList.remove("sa-body-editor");
  }
  if (!document.body) document.addEventListener("DOMContentLoaded", bodyIsEditorClassCheck);
  else bodyIsEditorClassCheck();

  const originalReplaceState = history.replaceState;
  history.replaceState = function () {
    const oldUrl = location.href;
    const newUrl = arguments[2] ? new URL(arguments[2], document.baseURI).href : oldUrl;
    const returnValue = originalReplaceState.apply(history, arguments);
    _cs_.url = newUrl;
    for (const eventTarget of scratchAddons.eventTargets.tab) {
      eventTarget.dispatchEvent(new CustomEvent("urlChange", { detail: { oldUrl, newUrl } }));
    }
    bodyIsEditorClassCheck();
    return returnValue;
  };

  const originalPushState = history.pushState;
  history.pushState = function () {
    const oldUrl = location.href;
    const newUrl = arguments[2] ? new URL(arguments[2], document.baseURI).href : oldUrl;
    const returnValue = originalPushState.apply(history, arguments);
    _cs_.url = newUrl;
    for (const eventTarget of scratchAddons.eventTargets.tab) {
      eventTarget.dispatchEvent(new CustomEvent("urlChange", { detail: { oldUrl, newUrl } }));
    }
    bodyIsEditorClassCheck();
    return returnValue;
  };

  // replaceState or pushState will not trigger onpopstate.
  window.addEventListener("popstate", () => {
    const newUrl = (_cs_.url = location.href);
    for (const eventTarget of scratchAddons.eventTargets.tab) {
      // There isn't really a way to get the previous URL from popstate event.
      eventTarget.dispatchEvent(new CustomEvent("urlChange", { detail: { oldUrl: "", newUrl } }));
    }
    bodyIsEditorClassCheck();
  });

  function loadClasses() {
    scratchAddons.classNames.arr = [
      ...new Set(
        [...document.styleSheets]
          .filter(
            (styleSheet) =>
              !(
                styleSheet.ownerNode.textContent.startsWith(
                  "/* DO NOT EDIT\n@todo This file is copied from GUI and should be pulled out into a shared library."
                ) &&
                (styleSheet.ownerNode.textContent.includes("input_input-form") ||
                  styleSheet.ownerNode.textContent.includes("label_input-group_"))
              )
          )
          .map((e) => {
            try {
              return [...e.cssRules];
            } catch (e) {
              return [];
            }
          })
          .flat()
          .map((e) => e.selectorText)
          .filter((e) => e)
          .map((e) => e.match(/(([\w-]+?)_([\w-]+)_([\w\d-]+))/g))
          .filter((e) => e)
          .flat()
      ),
    ];
    scratchAddons.classNames.loaded = true;

    const fixPlaceHolderClasses = () =>
      document.querySelectorAll("[class*='scratchAddonsScratchClass/']").forEach((el) => {
        [...el.classList]
          .filter((className) => className.startsWith("scratchAddonsScratchClass"))
          .map((className) => className.substring(className.indexOf("/") + 1))
          .forEach((classNameToFind) =>
            el.classList.replace(
              `scratchAddonsScratchClass/${classNameToFind}`,
              scratchAddons.classNames.arr.find(
                (className) =>
                  className.startsWith(classNameToFind + "_") && className.length === classNameToFind.length + 6
              ) || `scratchAddonsScratchClass/${classNameToFind}`
            )
          );
      });

    fixPlaceHolderClasses();
    new MutationObserver(() => fixPlaceHolderClasses()).observe(document.documentElement, {
      attributes: false,
      childList: true,
      subtree: true,
    });
  }

  if (document.querySelector("title")) loadClasses();
  else {
    const stylesObserver = new MutationObserver((mutationsList) => {
      if (document.querySelector("title")) {
        stylesObserver.disconnect();
        loadClasses();
      }
    });
    stylesObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (location.pathname === "/discuss/3/topic/add/") {
    const checkUA = () => {
      if (!window.mySettings) return false;
      const ua = window.mySettings.markupSet.find((x) => x.className);
      ua.openWith = window._simple_http_agent = ua.openWith.replace("version", "versions");
      const textarea = document.getElementById("id_body");
      if (textarea?.value) {
        textarea.value = ua.openWith;
        return true;
      }
    };
    if (!checkUA()) window.addEventListener("DOMContentLoaded", () => checkUA(), { once: true });
  }
}

try {
  if (window.parent.location.origin !== "https://scratch.mit.edu") throw "Scratch Addons: not first party iframe";
} catch {
  throw "Scratch Addons: not first party iframe";
}

if (document.documentElement instanceof SVGElement) throw "Top-level SVG document (this can be ignored)";

let pseudoUrl; // Fake URL to use if response code isn't 2xx

const console$1 = initConsole();
let receivedResponse = false;
const onMessageBackgroundReady = (request, sender, sendResponse) => {
  if (request === "backgroundListenerReady" && !receivedResponse) {
    chrome.runtime.sendMessage({ contentScriptReady: { url: location.href } }, onResponse);
  }
};
chrome.runtime.onMessage.addListener(onMessageBackgroundReady);
const onResponse = (res) => {
  if (res && !receivedResponse) {
    console$1.log("[Message from background]", res);
    chrome.runtime.onMessage.removeListener(onMessageBackgroundReady);
    if (res.httpStatusCode === null || String(res.httpStatusCode)[0] === "2") {
      onInfoAvailable(res);
      receivedResponse = true;
    } else {
      pseudoUrl = `https://scratch.mit.edu/${res.httpStatusCode}/`;
      console$1.log(`Status code was not 2xx, replacing URL to ${pseudoUrl}`);
      chrome.runtime.sendMessage({ contentScriptReady: { url: pseudoUrl } }, onResponse);
    }
  }
};
chrome.runtime.sendMessage({ contentScriptReady: { url: location.href } }, onResponse);

const DOLLARS = ["$1", "$2", "$3", "$4", "$5", "$6", "$7", "$8", "$9"];

const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

let globalState = null;

const csUrlObserver = new EventTarget();

const _page_ = Module();

let initialUrl = location.href;
let path = new URL(initialUrl).pathname.substring(1);
if (path[path.length - 1] !== "/") path += "/";
const pathArr = path.split("/");
if (pathArr[0] === "scratch-addons-extension") {
  if (pathArr[1] === "settings") {
    let url = chrome.runtime.getURL(`webpages/settings/index.html${window.location.search}`);
    if (location.hash) url += location.hash;
    chrome.runtime.sendMessage({ replaceTabWithUrl: url });
  }
}

if (path === "discuss/3/topic/add/") {
  window.addEventListener("load", () => forumWarning("forumWarning"));
} else if (path.startsWith("discuss/topic/")) {
  window.addEventListener("load", () => {
    if (document.querySelector('div.linkst > ul > li > a[href="/discuss/18/"]')) {
      forumWarning("forumWarningGeneral");
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console$1.log("[Message from background]", request);
  if (request === "getInitialUrl") {
    sendResponse(pseudoUrl || initialUrl);
  } else if (request === "getLocationHref") {
    sendResponse(location.href);
  }
});

function addStyle(addon) {
  const allStyles = [...document.querySelectorAll(".scratch-addons-style")];
  const addonStyles = allStyles.filter((el) => el.getAttribute("data-addon-id") === addon.addonId);

  const appendByIndex = (el, index) => {
    // Append a style element in the correct place preserving order
    const nextElement = allStyles.find((el) => Number(el.getAttribute("data-addon-index") > index));
    if (nextElement) document.documentElement.insertBefore(el, nextElement);
    else {
      if (document.body) document.documentElement.insertBefore(el, document.body);
      else document.documentElement.appendChild(el);
    }
  };

  for (let userstyle of addon.styles) {
    if (addon.injectAsStyleElt) {
      // If an existing style is already appended, just enable it instead
      const existingEl = addonStyles.find((style) => style.textContent === userstyle);
      if (existingEl) {
        existingEl.disabled = false;
        continue;
      }

      const style = document.createElement("style");
      style.classList.add("scratch-addons-style");
      style.setAttribute("data-addon-id", addon.addonId);
      style.setAttribute("data-addon-index", addon.index);
      style.textContent = userstyle;
      appendByIndex(style, addon.index);
    } else {
      const existingEl = addonStyles.find((style) => style.href === userstyle);
      if (existingEl) {
        existingEl.disabled = false;
        continue;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.setAttribute("data-addon-id", addon.addonId);
      link.setAttribute("data-addon-index", addon.index);
      link.classList.add("scratch-addons-style");
      link.href = userstyle;
      appendByIndex(link, addon.index);
    }
  }
}
function removeAddonStyles(addonId) {
  // Instead of actually removing the style/link element, we just disable it.
  // That way, if the addon needs to be reenabled, it can just enable that style/link element instead of readding it.
  // This helps with load times for link elements.
  document.querySelectorAll(`[data-addon-id='${addonId}']`).forEach((style) => (style.disabled = true));
}

function injectUserstyles(addonsWithUserstyles) {
  for (const addon of addonsWithUserstyles || []) {
    addStyle(addon);
  }
}

const textColorLib = __scratchAddonsTextColor;
const existingCssVariables = [];
function setCssVariables(addonSettings, addonsWithUserstyles) {
  const hyphensToCamelCase = (s) => s.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  const setVar = (addonId, varName, value) => {
    const realVarName = `--${hyphensToCamelCase(addonId)}-${varName}`;
    document.documentElement.style.setProperty(realVarName, value);
    existingCssVariables.push(realVarName);
  };

  const removeVar = (addonId, varName) =>
    document.documentElement.style.removeProperty(`--${hyphensToCamelCase(addonId)}-${varName}`);

  // First remove all CSS variables, we add them all back anyway
  existingCssVariables.forEach((varName) => document.documentElement.style.removeProperty(varName));
  existingCssVariables.length = 0;

  const addonIds = addonsWithUserstyles.map((obj) => obj.addonId);

  // Set variables for settings
  for (const addonId of addonIds) {
    for (const settingName of Object.keys(addonSettings[addonId] || {})) {
      const value = addonSettings[addonId][settingName];
      if (typeof value === "string" || typeof value === "number") {
        setVar(addonId, hyphensToCamelCase(settingName), addonSettings[addonId][settingName]);
      }
    }
  }

  // Set variables for customCssVariables
  const getColor = (addonId, obj) => {
    if (typeof obj !== "object") return obj;
    let hex;
    switch (obj.type) {
      case "settingValue":
        return addonSettings[addonId][obj.settingId];
      case "ternary":
        // this is not even a color lol
        return getColor(addonId, obj.source) ? obj.true : obj.false;
      case "map":
        return obj.options[getColor(addonId, obj.source)];
      case "textColor": {
        hex = getColor(addonId, obj.source);
        let black = getColor(addonId, obj.black);
        let white = getColor(addonId, obj.white);
        let threshold = getColor(addonId, obj.threshold);
        return textColorLib.textColor(hex, black, white, threshold);
      }
      case "multiply": {
        hex = getColor(addonId, obj.source);
        return textColorLib.multiply(hex, obj);
      }
      case "brighten": {
        hex = getColor(addonId, obj.source);
        return textColorLib.brighten(hex, obj);
      }
      case "alphaBlend": {
        let opaqueHex = getColor(addonId, obj.opaqueSource);
        let transparentHex = getColor(addonId, obj.transparentSource);
        return textColorLib.alphaBlend(opaqueHex, transparentHex);
      }
      case "makeHsv": {
        let hSource = getColor(addonId, obj.h);
        let sSource = getColor(addonId, obj.s);
        let vSource = getColor(addonId, obj.v);
        return textColorLib.makeHsv(hSource, sSource, vSource);
      }
      case "recolorFilter": {
        hex = getColor(addonId, obj.source);
        return textColorLib.recolorFilter(hex);
      }
    }
  };

  for (const addon of addonsWithUserstyles) {
    const addonId = addon.addonId;
    for (const customVar of addon.cssVariables) {
      const varName = customVar.name;
      const varValue = getColor(addonId, customVar.value);
      if (varValue === null && customVar.dropNull) {
        removeVar(addonId, varName);
      } else {
        setVar(addonId, varName, varValue);
      }
    }
  }
}

function waitForDocumentHead() {
  if (document.head) return Promise.resolve();
  else {
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (document.head) {
          resolve();
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { subtree: true, childList: true });
    });
  }
}

function getL10NURLs() {
  const langCode = /scratchlanguage=([\w-]+)/.exec(document.cookie)?.[1] || "en";
  const urls = [chrome.runtime.getURL(`addons-l10n/${langCode}`)];
  if (langCode === "pt") {
    urls.push(chrome.runtime.getURL(`addons-l10n/pt-br`));
  }
  if (langCode.includes("-")) {
    urls.push(chrome.runtime.getURL(`addons-l10n/${langCode.split("-")[0]}`));
  }
  const enJSON = chrome.runtime.getURL("addons-l10n/en");
  if (!urls.includes(enJSON)) urls.push(enJSON);
  return urls;
}

async function onInfoAvailable({ globalState: globalStateMsg, addonsWithUserscripts, addonsWithUserstyles }) {
  // In order for the "everLoadedAddons" not to change when "addonsWithUserscripts" changes, we stringify and parse
  const everLoadedAddons = JSON.parse(JSON.stringify(addonsWithUserscripts));
  const disabledDynamicAddons = [];
  globalState = globalStateMsg;
  setCssVariables(globalState.addonSettings, addonsWithUserstyles);
  // Just in case, make sure the <head> loaded before injecting styles
  waitForDocumentHead().then(() => injectUserstyles(addonsWithUserstyles));

  _page_.globalState = globalState;
  _page_.l10njson = getL10NURLs();
  _page_.addonsWithUserscripts = addonsWithUserscripts;
  _page_.dataReady = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.newGlobalState) {
      _page_.globalState = request.newGlobalState;
      globalState = request.newGlobalState;
      setCssVariables(request.newGlobalState.addonSettings, addonsWithUserstyles);
    } else if (request.fireEvent) {
      _page_.fireEvent(request.fireEvent);
    } else if (request.dynamicAddonEnabled) {
      const { scripts, userstyles, cssVariables, addonId, injectAsStyleElt, index, dynamicEnable, dynamicDisable } =
        request.dynamicAddonEnabled;
      addStyle({ styles: userstyles, addonId, injectAsStyleElt, index });
      if (everLoadedAddons.find((addon) => addon.addonId === addonId)) {
        if (!dynamicDisable) return;
        // Addon was reenabled
        _page_.fireEvent({ name: "reenabled", addonId, target: "self" });
      } else {
        if (!dynamicEnable) return;
        // Addon was not injected in page yet
        _page_.runAddonUserscripts({ addonId, scripts, enabledLate: true });
      }

      addonsWithUserscripts.push({ addonId, scripts });
      addonsWithUserstyles.push({ styles: userstyles, cssVariables, addonId, injectAsStyleElt, index });
      setCssVariables(globalState.addonSettings, addonsWithUserstyles);
      everLoadedAddons.push({ addonId, scripts });
    } else if (request.dynamicAddonDisable) {
      const { addonId } = request.dynamicAddonDisable;
      disabledDynamicAddons.push(addonId);

      let addonIndex = addonsWithUserscripts.findIndex((a) => a.addonId === addonId);
      if (addonIndex !== -1) addonsWithUserscripts.splice(addonIndex, 1);
      addonIndex = addonsWithUserstyles.findIndex((a) => a.addonId === addonId);
      if (addonIndex !== -1) addonsWithUserstyles.splice(addonIndex, 1);

      removeAddonStyles(addonId);
      _page_.fireEvent({ name: "disabled", addonId, target: "self" });
      setCssVariables(globalState.addonSettings, addonsWithUserstyles);
    } else if (request.updateUserstylesSettingsChange) {
      const { userstyles, addonId, injectAsStyleElt, index } = request.updateUserstylesSettingsChange;
      // Removing the addon styles and readding them works since the background
      // will send a different array for the new valid userstyles.
      // Try looking for the "userscriptMatches" function.
      removeAddonStyles(addonId);
      addStyle({ styles: userstyles, addonId, injectAsStyleElt, index });
    } else if (request === "getRunningAddons") {
      const userscripts = addonsWithUserscripts.map((obj) => obj.addonId);
      const userstyles = addonsWithUserstyles.map((obj) => obj.addonId);
      sendResponse({ userscripts, userstyles, disabledDynamicAddons });
    } else if (request === "refetchSession") {
      _page_.refetchSession();
    }
  });
}

const escapeHTML = (str) => str.replace(/([<>'"&])/g, (_, l) => `&#${l.charCodeAt(0)};`);

if (location.pathname.startsWith("/discuss/")) {
  // We do this first as sb2 runs fast.
  const preserveBlocks = () => {
    document.querySelectorAll("pre.blocks").forEach((el) => {
      el.setAttribute("data-original", el.innerText);
    });
  };
  if (document.readyState !== "loading") {
    setTimeout(preserveBlocks, 0);
  } else {
    window.addEventListener("DOMContentLoaded", preserveBlocks, { once: true });
  }
}

function forumWarning(key) {
  let postArea = document.querySelector("form#post > label");
  if (postArea) {
    var errorList = document.querySelector("form#post > label > ul");
    if (!errorList) {
      let typeArea = postArea.querySelector("strong");
      errorList = document.createElement("ul");
      errorList.classList.add("errorlist");
      postArea.insertBefore(errorList, typeArea);
    }
    let addonError = document.createElement("li");
    let reportLink = document.createElement("a");
    const uiLanguage = chrome.i18n.getUILanguage();
    const localeSlash = uiLanguage.startsWith("en") ? "" : `${uiLanguage.split("-")[0]}/`;
    const utm = `utm_source=extension&utm_medium=forumwarning&utm_campaign=v${chrome.runtime.getManifest().version}`;
    reportLink.href = `https://scratchaddons.com/${localeSlash}feedback/?ext_version=${
      chrome.runtime.getManifest().version
    }&${utm}`;
    reportLink.target = "_blank";
    reportLink.innerText = chrome.i18n.getMessage("reportItHere");
    let text1 = document.createElement("span");
    text1.innerHTML = escapeHTML(chrome.i18n.getMessage(key, DOLLARS)).replace("$1", reportLink.outerHTML);
    addonError.appendChild(text1);
    errorList.appendChild(addonError);
  }
}

const showBanner = () => {
  const makeBr = () => document.createElement("br");

  const notifOuterBody = document.createElement("div");
  const notifInnerBody = Object.assign(document.createElement("div"), {
    id: "sa-notification",
    style: `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 700px;
      max-height: 270px;
      display: flex;
      align-items: center;
      padding: 10px;
      border-radius: 10px;
      background-color: #222;
      color: white;
      z-index: 99999;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      text-shadow: none;
      box-shadow: 0 0 20px 0px #0000009e;
      line-height: 1em;`,
  });
  /*
    const notifImageLink = Object.assign(document.createElement("a"), {
      href: "https://www.youtube.com/watch?v=9y4IsQLz3rk",
      target: "_blank",
      rel: "noopener",
      referrerPolicy: "strict-origin-when-cross-origin",
    });
    // Thumbnails were 100px height
    */
  const notifImage = Object.assign(document.createElement("img"), {
    // alt: chrome.i18n.getMessage("hexColorPickerAlt"),
    src: chrome.runtime.getURL("/images/cs/dark-www.gif"),
    style: "height: 175px; border-radius: 5px; padding: 20px",
  });
  const notifText = Object.assign(document.createElement("div"), {
    id: "sa-notification-text",
    style: "margin: 12px;",
  });
  const notifTitle = Object.assign(document.createElement("span"), {
    style: "font-size: 18px; line-height: 24px; display: inline-block; margin-bottom: 12px;",
    textContent: chrome.i18n.getMessage("extensionUpdate"),
  });
  const notifClose = Object.assign(document.createElement("img"), {
    style: `
      float: right;
      cursor: pointer;
      width: 24px;`,
    title: chrome.i18n.getMessage("close"),
    src: chrome.runtime.getURL("../images/cs/close.svg"),
  });
  notifClose.addEventListener("click", () => notifInnerBody.remove(), { once: true });

  const NOTIF_TEXT_STYLE = "display: block; font-size: 14px; color: white !important;";

  const notifInnerText0 = Object.assign(document.createElement("span"), {
    style: NOTIF_TEXT_STYLE + "font-weight: bold;",
    textContent: chrome.i18n
      .getMessage("extensionHasUpdated", DOLLARS)
      .replace(/\$(\d+)/g, (_, i) => [chrome.runtime.getManifest().version][Number(i) - 1]),
  });
  const notifInnerText1 = Object.assign(document.createElement("span"), {
    style: NOTIF_TEXT_STYLE,
    innerHTML: escapeHTML(chrome.i18n.getMessage("extensionUpdateInfo1_v1_23", DOLLARS)).replace(
      /\$(\d+)/g,
      (_, i) =>
        [
          /*
            Object.assign(document.createElement("b"), { textContent: chrome.i18n.getMessage("newFeature") }).outerHTML,
            Object.assign(document.createElement("b"), { textContent: chrome.i18n.getMessage("newFeatureName") })
              .outerHTML,
            */
          Object.assign(document.createElement("a"), {
            href: "https://scratch.mit.edu/scratch-addons-extension/settings?source=updatenotif",
            target: "_blank",
            textContent: chrome.i18n.getMessage("scratchAddonsSettings"),
          }).outerHTML,
        ][Number(i) - 1]
    ),
  });
  const notifInnerText2 = Object.assign(document.createElement("span"), {
    style: NOTIF_TEXT_STYLE,
    textContent: chrome.i18n.getMessage("extensionUpdateInfo2_v1_23"),
  });
  const notifFooter = Object.assign(document.createElement("span"), {
    style: NOTIF_TEXT_STYLE,
  });
  const uiLanguage = chrome.i18n.getUILanguage();
  const localeSlash = uiLanguage.startsWith("en") ? "" : `${uiLanguage.split("-")[0]}/`;
  const utm = `utm_source=extension&utm_medium=updatenotification&utm_campaign=v${
    chrome.runtime.getManifest().version
  }`;
  const notifFooterChangelog = Object.assign(document.createElement("a"), {
    href: `https://scratchaddons.com/${localeSlash}changelog?${utm}`,
    target: "_blank",
    textContent: chrome.i18n.getMessage("notifChangelog"),
  });
  const notifFooterFeedback = Object.assign(document.createElement("a"), {
    href: `https://scratchaddons.com/${localeSlash}feedback/?ext_version=${
      chrome.runtime.getManifest().version
    }&${utm}`,
    target: "_blank",
    textContent: chrome.i18n.getMessage("feedback"),
  });
  const notifFooterTranslate = Object.assign(document.createElement("a"), {
    href: "https://scratchaddons.com/translate",
    target: "_blank",
    textContent: chrome.i18n.getMessage("translate"),
  });
  const notifFooterLegal = Object.assign(document.createElement("small"), {
    textContent: chrome.i18n.getMessage("notAffiliated"),
  });
  notifFooter.appendChild(notifFooterChangelog);
  notifFooter.appendChild(document.createTextNode(" | "));
  notifFooter.appendChild(notifFooterFeedback);
  notifFooter.appendChild(document.createTextNode(" | "));
  notifFooter.appendChild(notifFooterTranslate);
  notifFooter.appendChild(makeBr());
  notifFooter.appendChild(notifFooterLegal);

  notifText.appendChild(notifTitle);
  notifText.appendChild(notifClose);
  notifText.appendChild(makeBr());
  notifText.appendChild(notifInnerText0);
  notifText.appendChild(makeBr());
  notifText.appendChild(notifInnerText1);
  notifText.appendChild(makeBr());
  notifText.appendChild(notifInnerText2);
  notifText.appendChild(makeBr());
  notifText.appendChild(notifFooter);

  // notifImageLink.appendChild(notifImage);

  notifInnerBody.appendChild(notifImage);
  notifInnerBody.appendChild(notifText);

  notifOuterBody.appendChild(notifInnerBody);

  document.body.appendChild(notifOuterBody);
};

const handleBanner = async () => {
  const currentVersion = chrome.runtime.getManifest().version;
  const [major, minor, _] = currentVersion.split(".");
  const currentVersionMajorMinor = `${major}.${minor}`;
  // Making this configurable in the future?
  // Using local because browser extensions may not be updated at the same time across browsers
  const settings = await promisify(chrome.storage.local.get.bind(chrome.storage.local))(["bannerSettings"]);
  const force = !settings || !settings.bannerSettings;

  if (force || settings.bannerSettings.lastShown !== currentVersionMajorMinor || location.hash === "#sa-update-notif") {
    console$1.log("Banner shown.");
    await promisify(chrome.storage.local.set.bind(chrome.storage.local))({
      bannerSettings: Object.assign({}, settings.bannerSettings, { lastShown: currentVersionMajorMinor }),
    });
    showBanner();
  }
};

if (document.readyState !== "loading") {
  handleBanner();
} else {
  window.addEventListener("DOMContentLoaded", handleBanner, { once: true });
}

const isProfile = pathArr[0] === "users" && pathArr[2] === "";
const isStudio = pathArr[0] === "studios";
const isProject = pathArr[0] === "projects";

if (isProfile || isStudio || isProject) {
  const shouldCaptureComment = (value) => {
    const regex = / scratch[ ]?add[ ]?ons/;
    // Trim like scratchr2
    const trimmedValue = " " + value.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    const limitedValue = trimmedValue.toLowerCase().replace(/[^a-z /]+/g, "");
    return regex.test(limitedValue);
  };
  const extensionPolicyLink = document.createElement("a");
  extensionPolicyLink.href = "https://scratch.mit.edu/discuss/topic/284272/";
  extensionPolicyLink.target = "_blank";
  extensionPolicyLink.innerText = chrome.i18n.getMessage("captureCommentPolicy");
  Object.assign(extensionPolicyLink.style, {
    textDecoration: "underline",
    color: "white",
  });
  const errorMsgHtml = escapeHTML(chrome.i18n.getMessage("captureCommentError", DOLLARS)).replace(
    "$1",
    extensionPolicyLink.outerHTML
  );
  const sendAnywayMsg = chrome.i18n.getMessage("captureCommentPostAnyway");
  const confirmMsg = chrome.i18n.getMessage("captureCommentConfirm");

  window.addEventListener("load", () => {
    if (isProfile) {
      window.addEventListener(
        "click",
        (e) => {
          const path = e.composedPath();
          if (
            path[1] &&
            path[1] !== document &&
            path[1].getAttribute("data-control") === "post" &&
            path[1].hasAttribute("data-commentee-id")
          ) {
            const form = path[3];
            if (form.tagName !== "FORM") return;
            if (form.hasAttribute("data-sa-send-anyway")) {
              form.removeAttribute("data-sa-send-anyway");
              return;
            }
            const textarea = form.querySelector("textarea[name=content]");
            if (!textarea) return;
            if (shouldCaptureComment(textarea.value)) {
              e.stopPropagation();
              e.preventDefault(); // Avoid location.hash being set to null

              form.querySelector("[data-control=error] .text").innerHTML = errorMsgHtml + " ";
              const sendAnyway = document.createElement("a");
              sendAnyway.onclick = () => {
                const res = confirm(confirmMsg);
                if (res) {
                  form.setAttribute("data-sa-send-anyway", "");
                  form.querySelector("[data-control=post]").click();
                }
              };
              sendAnyway.textContent = sendAnywayMsg;
              Object.assign(sendAnyway.style, {
                textDecoration: "underline",
                color: "white",
              });
              form.querySelector("[data-control=error] .text").appendChild(sendAnyway);
              form.querySelector(".control-group").classList.add("error");
            }
          }
        },
        { capture: true }
      );
    } else if (isProject || isStudio) {
      // For projects, we want to be careful not to hurt performance.
      // Let's capture the event in the comments container instead
      // of the whole window. There will be a new comment container
      // each time the user goes inside the project then outside.
      let observer;
      const waitForContainer = () => {
        if (document.querySelector(".comments-container, .studio-compose-container")) return Promise.resolve();
        return new Promise((resolve) => {
          observer = new MutationObserver((mutationsList) => {
            if (document.querySelector(".comments-container, .studio-compose-container")) {
              resolve();
              observer.disconnect();
            }
          });
          observer.observe(document.documentElement, { childList: true, subtree: true });
        });
      };
      const getEditorMode = () => {
        // From addon-api/content-script/Tab.js
        const pathname = location.pathname.toLowerCase();
        const split = pathname.split("/").filter(Boolean);
        if (!split[0] || split[0] !== "projects") return null;
        if (split.includes("editor")) return "editor";
        if (split.includes("fullscreen")) return "fullscreen";
        if (split.includes("embed")) return "embed";
        return "projectpage";
      };
      const addListener = () =>
        document.querySelector(".comments-container, .studio-compose-container").addEventListener(
          "click",
          (e) => {
            const path = e.composedPath();
            // When clicking the post button, e.path[0] might
            // be <span>Post</span> or the <button /> element
            const possiblePostBtn = path[0].tagName === "SPAN" ? path[1] : path[0];
            if (!possiblePostBtn) return;
            if (possiblePostBtn.tagName !== "BUTTON") return;
            if (!possiblePostBtn.classList.contains("compose-post")) return;
            const form = path[0].tagName === "SPAN" ? path[3] : path[2];
            if (!form) return;
            if (form.tagName !== "FORM") return;
            if (!form.classList.contains("full-width-form")) return;
            // Remove error when about to send comment anyway, if it exists
            form.parentNode.querySelector(".sa-compose-error-row")?.remove();
            if (form.hasAttribute("data-sa-send-anyway")) {
              form.removeAttribute("data-sa-send-anyway");
              return;
            }
            const textarea = form.querySelector("textarea[name=compose-comment]");
            if (!textarea) return;
            if (shouldCaptureComment(textarea.value)) {
              e.stopPropagation();
              const errorRow = document.createElement("div");
              errorRow.className = "flex-row compose-error-row sa-compose-error-row";
              const errorTip = document.createElement("div");
              errorTip.className = "compose-error-tip";
              const span = document.createElement("span");
              span.innerHTML = errorMsgHtml + " ";
              const sendAnyway = document.createElement("a");
              sendAnyway.onclick = () => {
                const res = confirm(confirmMsg);
                if (res) {
                  form.setAttribute("data-sa-send-anyway", "");
                  possiblePostBtn.click();
                }
              };
              sendAnyway.textContent = sendAnywayMsg;
              errorTip.appendChild(span);
              errorTip.appendChild(sendAnyway);
              errorRow.appendChild(errorTip);
              form.parentNode.prepend(errorRow);

              // Hide error after typing like scratch-www does
              textarea.addEventListener(
                "input",
                () => {
                  errorRow.remove();
                },
                { once: true }
              );
              // Hide error after clicking cancel like scratch-www does
              form.querySelector(".compose-cancel").addEventListener(
                "click",
                () => {
                  errorRow.remove();
                },
                { once: true }
              );
            }
          },
          { capture: true }
        );

      const check = async () => {
        if (
          // Note: do not use pathArr here below! pathArr is calculated
          // on load, pathname can change dynamically with replaceState
          (isStudio && location.pathname.split("/")[3] === "comments") ||
          (isProject && getEditorMode() === "projectpage")
        ) {
          await waitForContainer();
          addListener();
        } else {
          observer?.disconnect();
        }
      };
      check();
      csUrlObserver.addEventListener("change", (e) => check());
    }
  });
}
