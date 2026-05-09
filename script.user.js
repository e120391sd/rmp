// ==UserScript==
// @name         Gear set manager
// @version      1.2
// @description  Hordes.io script
// @match        https://hordes.io/play
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    const clientCmdHeader = 5;
    const serverEntityDeltaHeader = 7;
    const savedGearSetsKey = "savedGearSets";
    const uiRowId = "gearSetRow";
    const stashUIRowId = "stashGearSetRow";

    const configEquipDelay = 250;
    const configStashDelay = 250;
    const configUnstashDelay = 500;
    const configStashCharms = false;
    const configRetryDelay = 1000;
    const configMaxRetryAmount = 1;

    const itemEquipSlots = {
        hammer: [101], bow: [101], staff: [101], sword: [101],
        armlet: [102],
        armor: [103],
        bag: [104],
        boot: [105],
        glove:  [106],
        ring: [107],
        amulet: [108],
        quiver: [109], shield: [109], totem: [109], orb: [109],
        charm:  [110, 111],
    };
    const equipSlotMin = 101;

    let inventorySlots = new Map();
    let loadedItems = new Map();
    let stashSlots = new Set();
    let currentPlayerName = null;
    let selectedGearSet = null;
    let selectedStashSet = null;
    let gearSetNameInput = "";

    // ws
    let ws = null;

    let z = 0;
    var ye = t => {
        let e = 0,
            n = 0,
            o = 0;
        do o = t[z++], e |= (o & 127) << 7 * n, n++; while (o & 128);
        return e
    };
    var tr = (t, e) => {
            for (; e > 127;) t[z++] = e & 127 | 128, e >>= 7;
            t[z++] = e & 127
        },
        ti = t => t <= 0 ? 1 : Math.floor(Math.log(t) / Math.log(128)) + 1,
        bi = t => t[z] & 128 ? (255 - t[z] + 1) * -1 : t[z],
        Le = t => t[z],
        Ki = (t, e) => {
            t[z] = e, z += 1
        },
        Ot = t => t[z] | t[z + 1] << 8;
    var po = t => (t[z] | t[z + 1] << 8 | t[z + 2] << 16) + t[z + 3] * 16777216,
        p1 = new ArrayBuffer(8),
        nr = new Uint8Array(p1),
        _3 = new Float32Array(p1),
        lt = t => (nr[0] = t[z], nr[1] = t[z + 1], nr[2] = t[z + 2], nr[3] = t[z + 3], _3[0]);
    var y3 = t => {
            let e = t.length;
            for (let n = t.length - 1; n >= 0; n--) {
                let o = t.charCodeAt(n);
                o > 127 && o <= 2047 ? e++ : o > 2047 && o <= 65535 && (e += 2), o >= 56320 && o <= 57343 && n--
            }
            return e
        },
        v3 = (t, e) => {
            let n = y3(e);
            tr(t, n);
            for (let o = 0; o < e.length; o++) {
                let i = e.charCodeAt(o);
                i < 128 ? t[z++] = i : i < 2048 ? (t[z++] = i >> 6 | 192, t[z++] = i & 63 | 128) : (i & 64512) == 55296 && o + 1 < e.length && (e.charCodeAt(o + 1) & 64512) == 56320 ? (i = 65536 + ((i & 1023) << 10) + (e.charCodeAt(++o) & 1023), t[z++] = i >> 18 | 240, t[z++] = i >> 12 & 63 | 128, t[z++] = i >> 6 & 63 | 128, t[z++] = i & 63 | 128) : (t[z++] = i >> 12 | 224, t[z++] = i >> 6 & 63 | 128, t[z++] = i & 63 | 128)
            }
        };
    var h3 = {
        string: t => {
            let e = y3(t);
            return ti(e) + e
        }
    };
    var C3 = {
            encode: t => {
                let e = t,
                    n = 0;
                n += 1, n += h3.string(e.command), n += h3.string(e.string);
                let o = new Uint8Array(n);
                return z = 0, Ki(o, e._header), v3(o, e.command), v3(o, e.string), o
            }
        },
        S3 = {
            decode: t => {
                let e = t,
                    n = {};
                z = 0, n._header = Le(e), z += 1;
                let o = [];
                n.inputs = o;
                let i = ye(e);
                for (let u = 0; u < i; u++) {
                    let m = {};
                    o[u] = m, m.id = po(e), z += 4, m.jump = Le(e), z += 1, m.rot = lt(e), z += 4, m.speed = Ot(e), z += 2;
                    let g = [];
                    m.steer = g, g[0] = bi(e), z += 1;
                    let v = ye(e);
                    for (let _ = 1; _ < v; _++) g[_] = bi(e), z += 1
                }
                let s = [];
                n.log = s;
                let r = ye(e);
                for (let u = 0; u < r; u++) {
                    let m = {};
                    s[u] = m;
                    let g = [];
                    m.data = g;
                    let v = ye(e);
                    for (let _ = 0; _ < v; _++) g[_] = ye(e);
                    m.type = Le(e), z += 1
                }
                let l = [];
                n.logPersonal = l;
                let a = ye(e);
                for (let u = 0; u < a; u++) {
                    let m = {};
                    l[u] = m;
                    let g = [];
                    m.data = g;
                    let v = ye(e);
                    for (let _ = 0; _ < v; _++) g[_] = ye(e);
                    m.type = Le(e), z += 1
                }
                let c = [];
                n.movements = c;
                let f = ye(e);
                for (let u = 0; u < f; u++) {
                    let m = {};
                    c[u] = m, m.id = po(e), z += 4;
                    let g = [];
                    m.pos = g, g[0] = lt(e), z += 4, g[1] = lt(e), z += 4;
                    let v = ye(e);
                    for (let k = 2; k < v; k++) g[k] = lt(e), z += 4;
                    let _ = [];
                    m.vel = _, _[0] = lt(e), z += 4, _[1] = lt(e), z += 4;
                    let b = ye(e);
                    for (let k = 2; k < b; k++) _[k] = lt(e), z += 4
                }
                return n.tickId = po(e), z += 4, n
            }
        };

    var send = (t, e = "") => {
        if (!ws || ws.readyState !== 1) return;
        ws.send(C3.encode({_header: clientCmdHeader, command: t, string: e + ""}))
    };

    const moveItem = (fromSlot, toSlot) => send("itemmove", `${fromSlot} ${toSlot}`);
    const clientPlayerCommand  = (cmd, data) => send(cmd, data);

    function handlePersonalLog(events) {
        let needsRefresh = false;
        for (let {type, data} of events) {
            if (type === 29) { inventorySlots.set(data[0], data[1]); needsRefresh = true; continue; }
            if (type === 30) { inventorySlots.delete(data[0]); needsRefresh = true; continue; }
            if (type === 38) {
                stashSlots.clear();
                let i = 2;
                for (let g = 0; g < 2; g++) {
                    let count = data[i++];
                    for (let j = 0; j < count; j++) stashSlots.add(data[i++]);
                }
                needsRefresh = true;
            }
        }
        if (needsRefresh) refreshUI();
    }

    function interceptSocket(socket) {
        ws = socket;

        socket.addEventListener("message", (event) => {
            if (!(event.data instanceof ArrayBuffer)) return;
            let data = new Uint8Array(event.data);
            if (data[0] !== serverEntityDeltaHeader) return;
            try {
                let decoded = S3.decode(data);
                if (decoded.logPersonal && decoded.logPersonal.length) handlePersonalLog(decoded.logPersonal);
            } catch (err) {
                console.log(err)
            }
        });

        socket.addEventListener("close", () => {
            if (ws === socket) ws = null;
        });
    }

    function wsProxy(target, params) {
        let ws = new target(...params)
        if (typeof params[0] === "string" && params[0].includes("hordes.io")) {
            interceptSocket(ws);
        }
        return ws;
    }

    let Ws = window.WebSocket;
    window.WebSocket = new Proxy(Ws, {construct: wsProxy});

    function fetchProxy(target, _, params) {
        let result = target.apply(window, params);
        let urlMatch = typeof params[0] === "string" && params[0].includes("/api/item/get");
        if (!urlMatch) return result;
        result.then(async r => {
            let items = await r.clone().json();
            if (!Array.isArray(items)) return;

            for (let item of items) {
                if (!item || item.slot == null) continue;
                let dbid = item.dbid ?? inventorySlots.get(item.slot);
                if (dbid == null || item.type == null) continue;
                loadedItems.set(dbid, item);
            }

            refreshUI();
        }).catch((err) => {
            console.log(err)
        });

        return result;
    }

    let origFetch = window.fetch;
    window.fetch = new Proxy(origFetch, {apply: fetchProxy});

    // functions

    const delay = ms => new Promise(r => setTimeout(r, ms));

    function localStorageRead(key) {
        return JSON.parse(localStorage.getItem(savedGearSetsKey));
    }

    function localStorageWrite(key, value) {
        return localStorage.setItem(key, JSON.stringify(value));
    }

    function readAllSets() {
        try {
            return localStorageRead(savedGearSetsKey) || [];
        } catch (err) {
            return [];
        }
    }

    function writeAllSets(sets) {
        localStorageWrite(savedGearSetsKey, sets);
    }

    function getSetByValue(value) {
        return readAllSets().find(s => s.value === value);
    }

    function getCurrentPlayerName() {
        if (currentPlayerName) return currentPlayerName;

        let equipSlots = document.getElementById("equipslots");
        if (equipSlots) {
            let charPanel = equipSlots.parentElement;
            if (charPanel) {
                let nameSpan = charPanel.querySelector(".statcol.panel-black span.bold.textwhite");
                if (nameSpan && nameSpan.textContent) {
                    currentPlayerName = nameSpan.textContent;
                    return currentPlayerName;
                }
            }
        }

        let sets = readAllSets();
        if (sets.length) return sets[sets.length - 1].playerId;
        return null;
    }

    function getPlayerSets() {
        let name = getCurrentPlayerName();
        if (!name) return [];
        return readAllSets().filter(s => s.playerId === name);
    }

    function findFirstEmptyBagSlot(exclude = new Set()) {
        for (let i = 0; i < 100; i++) {
            if (!inventorySlots.has(i) && !exclude.has(i)) return i;
        }
        return -1;
    }

    // button events

    function gearSetCreate() {
        let equipped = [];
        let pid = getCurrentPlayerName();

        inventorySlots.forEach((dbid, slot) => {
            if (slot >= equipSlotMin) equipped.push(dbid);
        });
        if (!equipped.length || !pid) return;

        let name = gearSetNameInput || "unnamed"
        let sets = readAllSets();
        let equippedSet = new Set(equipped);

        const isDuplicate = sets.some(set => {
            if (set.playerId !== pid) return false;
            let items = set.items || [];
            return items.length === equipped.length && items.every(id => equippedSet.has(id));
        });
        if (isDuplicate) return;

        let value = Date.now().toString();
        sets.push({name: name, value, items: equipped, playerId: pid});
        writeAllSets(sets);

        selectedGearSet  = value;
        gearSetNameInput = "";
        refreshUI();
    }

    function gearSetDelete() {
        if (!selectedGearSet) return;
        let filtered = readAllSets().filter(s => s.value !== selectedGearSet);
        writeAllSets(filtered);

        let remaining = getPlayerSets().filter(s => s.value !== selectedGearSet);
        selectedGearSet = remaining.length ? remaining[0].value : null;
        refreshUI();
    }

    async function gearSetEquip(retry = 0) {
        let gearSet = selectedGearSet ? getSetByValue(selectedGearSet) : null;
        if (!gearSet) return;

        let targetIds = new Set(gearSet.items);
        let queued = new Set();
        let takenSlots = new Set();

        inventorySlots.forEach((dbid, slot) => {
            if (slot >= equipSlotMin && targetIds.has(dbid)) queued.add(dbid);
        });

        let toEquip = [];
        inventorySlots.forEach((dbid, slot) => {
            if (slot >= equipSlotMin) return;
            if (!targetIds.has(dbid)) return;
            if (queued.has(dbid)) return;

            let info = loadedItems.get(dbid);
            if (!info) return;

            let validSlots = itemEquipSlots[info.type];
            if (!validSlots) return;

            queued.add(dbid);

            let equipSlot = validSlots.find(s => !inventorySlots.has(s) && !takenSlots.has(s)) ?? validSlots.find(s => !takenSlots.has(s));

            if (equipSlot !== undefined) {
                takenSlots.add(equipSlot);
                toEquip.push({from: slot, to: equipSlot});
            }
        });

        if (toEquip.length === 0) {
            if (retry > configMaxRetryAmount) return;
            await delay(configRetryDelay);
            return gearSetEquip(retry++);
        }

        for (let {from, to} of toEquip) {
            moveItem(from, to);
            await delay(configEquipDelay);
        }
    }

    async function stashGearSetWithdraw() {
        let gearSet = selectedStashSet ? getSetByValue(selectedStashSet) : null;
        if (!gearSet) return;
        let targetIds = new Set(gearSet.items);
        let queued = new Set();
        for (let dbid of stashSlots) {
            if (!targetIds.has(dbid) || queued.has(dbid)) continue;
            if (findFirstEmptyBagSlot() === -1) break;
            queued.add(dbid);
            clientPlayerCommand("itemunstash", `${dbid}`);
            await delay(configUnstashDelay);
        }
    }

    async function stashGearSetDeposit() {
        let gearSet = selectedStashSet ? getSetByValue(selectedStashSet) : null;
        if (!gearSet) return;
        let targetIds = new Set(gearSet.items);
        let queued = new Set();
        let toStash = [];
        inventorySlots.forEach((dbid, slot) => {
            if (!targetIds.has(dbid) || queued.has(dbid)) return;
            let info = loadedItems.get(dbid);
            if (!configStashCharms && info && info.type === "charm") return;
            queued.add(dbid);
            toStash.push(slot);
        });
        let takenSlots = new Set();
        for (let slot of toStash) {
            if (slot >= equipSlotMin) {
                let emptySlot = findFirstEmptyBagSlot(takenSlots);
                if (emptySlot === -1) continue;
                takenSlots.add(emptySlot);
                clientPlayerCommand("itemmove", `${slot} ${emptySlot}`);
                await delay(configStashDelay / 2);
                clientPlayerCommand("itemstash", `${emptySlot}`);
                await delay(configStashDelay / 2);
                await delay(configStashDelay);
                continue;
            }
            clientPlayerCommand("itemstash", `${slot}`);
            await delay(configStashDelay);
        }
    }

    // UI

    function makeButton(text, _class, font, size) {
        let btn = document.createElement("button");
        btn.textContent = text;
        btn.className = _class;
        btn.style.cssText = `
        font:${font};
        min-width:${size};
        `;
        return btn;
    }

    function makeOption(name, value) {
        let option = document.createElement("option");
        option.textContent = name;
        option.value = value;
        return option;
    }

    function fillSelect(selector, getSelected, setSelected) {
        const sets = getPlayerSets();
        while (selector.firstChild) selector.removeChild(selector.firstChild);
        for (let {name, value} of sets) selector.appendChild(makeOption(name, value));
        if (!getSelected() && sets.length) setSelected(sets[0].value);
        if (getSelected()) selector.value = getSelected();
    }

    function populateCharPanelSelect(selector) {
        fillSelect(selector, () => selectedGearSet, v => {selectedGearSet = v});
    }

    function populateStashSelect(selector) {
        fillSelect(selector, () => selectedStashSet, v => {selectedStashSet = v});
    }

    let charPanelContainerCSS = `
        display:flex;
        gap:5px;
        align-items:center;
        padding:2px 0;
        width:100%;
        overflow:hidden;
        `
    let stashContainerCSS = `
        display:flex;
        gap:5px;
        align-items:center;
        order:-1;
        margin-right:auto;
        `
    let gearSetSelectorCSS = `
        max-width:100px;
        font:15px bold hordes;
        `
    let gearSetNameInputCSS = `
        font:bold 15px hordes;
        `

    function injectGearSetUI(parent) {
        if (document.getElementById(uiRowId)) return;

        let row = document.createElement("div");
        row.id = uiRowId;
        row.style.cssText = charPanelContainerCSS;

        let createBtn = makeButton("Create", "btn black textprimary", "bold 15px hordes", "70px");
        let deleteBtn = makeButton("Delete", "btn black textprimary", "bold 15px hordes", "70px");
        let equipBtn = makeButton("Equip", "btn black textgreen", "bold 15px hordes", "70px");

        let selector = document.createElement("select");
        selector.style.cssText = gearSetSelectorCSS;

        let nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = "Name";
        nameInput.className = "textwhite";
        nameInput.style.cssText = gearSetNameInputCSS;

        row.append(createBtn, deleteBtn, equipBtn, selector, nameInput);

        createBtn.addEventListener("click", gearSetCreate);
        deleteBtn.addEventListener("click", gearSetDelete);
        equipBtn.addEventListener("click", () => gearSetEquip());
        selector.addEventListener("change", e => {selectedGearSet = e.target.value || null});
        nameInput.addEventListener("input", e => {gearSetNameInput = e.target.value});

        parent.prepend(row);
        populateCharPanelSelect(selector);
    }

    function injectStashUI(formelements) {
        if (document.getElementById(stashUIRowId)) return;

        let row = document.createElement("div");
        row.id = stashUIRowId;
        row.style.cssText = stashContainerCSS;

        let withdrawBtn = makeButton("Withdraw", "btn green textblack", "bold 14px hordes", "95px");
        let depositBtn  = makeButton("Deposit", "btn cyan textblack", "bold 14px hordes", "95px");

        let selector = document.createElement("select");
        selector.style.cssText = gearSetSelectorCSS;

        row.append(selector, withdrawBtn, depositBtn);

        withdrawBtn.addEventListener("click", stashGearSetWithdraw);
        depositBtn.addEventListener("click",  stashGearSetDeposit);
        selector.addEventListener("change", e => {selectedStashSet = e.target.value || null});

        formelements.prepend(row);
        populateStashSelect(selector);
    }

    let alreadyRefreshing = false;
    function refreshUI() {
        if (alreadyRefreshing) return;
        alreadyRefreshing = true;
        requestAnimationFrame(() => {
            alreadyRefreshing = false;
            let row = document.getElementById(uiRowId);
            if (row) {
                let nameField = row.querySelector("input");
                if (nameField) nameField.value = gearSetNameInput;
                let selector = row.querySelector("select");
                if (selector) populateCharPanelSelect(selector);
            }
            let stashRow = document.getElementById(stashUIRowId);
            if (stashRow) {
                let selector = stashRow.querySelector("select");
                if (selector) populateStashSelect(selector);
            }
        });
    }

    const mutationObserver = new MutationObserver(() => {
        let equipSlots = document.getElementById("equipslots");
        if (!equipSlots) {
            document.getElementById(uiRowId)?.remove();
            currentPlayerName = null;
        }
        if (equipSlots && parent && !document.getElementById(uiRowId)) {
            injectGearSetUI(equipSlots.parentElement);
        }

        let _formelements = document.querySelector(".formelements");
        if (!_formelements) {
            document.getElementById(stashUIRowId)?.remove();
            stashSlots.clear();
        }
        if (_formelements) {
            let stash = _formelements.parentElement
            let panel = stash.querySelectorAll(".panel-black.marg-top")[1]
            let formelements = panel.querySelector(".formelements")
            if (formelements && !document.getElementById(stashUIRowId)) {
                injectStashUI(formelements);
            }
        }
    });

    mutationObserver.observe(document.documentElement, {childList: true, subtree: true});
})();