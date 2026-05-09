// ==UserScript==
// @name         Hordes.io edits violentmonkey edition
// @version      3.0
// @author       Tuna
// @description  Hordes.io script
// @match        https://hordes.io/play
// @namespace    https://greasyfork.org/users/1583443
// @grant        unsafeWindow
// @grant        GM_addStyle
// @license      MIT
// @run-at       document-start
// ==/UserScript==

let clientUrl = "https://raw.githubusercontent.com/e120391sd/rmp/refs/heads/main/client.js"
let kekUrl = "https://raw.githubusercontent.com/hordesmod/kek-ui/refs/heads/main/dist/kekui.user.js"
let scriptUrl = "https://raw.githubusercontent.com/e120391sd/rmp/refs/heads/main/script.user.js"

document.write('<!DOCTYPE html><html><head></head><body></body></html>');
unsafeWindow._script = "";

(async() => {
    try {
        let html = await fetch("https://hordes.io/play").then(i => i.text())
        let element = html.match(/<script.*?client\.js.*?><\/script>/)[0]
        let url = element.match(/src="(.*?)"/)[1]
        let client = await fetch(clientUrl).then(i => i.text())
        let kek = await fetch(kekUrl).then(i => i.text())
        let userScript = await fetch(scriptUrl).then(i => i.text())
        unsafeWindow._script = client
        unsafeWindow.kek = kek
        unsafeWindow.userScript = userScript
        html = html.replace(element,`<script>eval(_script)</script><script>eval(kek)</script><script>eval(userScript)</script>`)

        document.open()
        document.write(html)
        document.close()

        unsafeWindow.document.dispatchEvent(new Event("DOMContentLoaded", {
          bubbles: true,
          cancelable: false
        }));
    } catch (e) {
        console.error(e);
    }
})();