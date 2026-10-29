// 密碼保護：用輸入的密碼在瀏覽器裡解密內容（AES-256-GCM，PBKDF2-SHA256）
(() => {
  const boxes = [...document.querySelectorAll("[data-lock]")];
  if (!boxes.length || !window.crypto?.subtle) return;

  const STORE = "site-pass";
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const keyCache = new Map();

  const deriveKey = async (pass, salt, iter) => {
    const id = pass + "|" + salt + "|" + iter;
    if (!keyCache.has(id)) {
      const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
      keyCache.set(id, crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: b64(salt), iterations: +iter, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]));
    }
    return keyCache.get(id);
  };

  const open = async (box, pass) => {
    const { salt, iter, iv, ct } = box.dataset;
    const key = await deriveKey(pass, salt, iter);
    const buf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(iv) }, key, b64(ct));
    const tpl = document.createElement("template");
    tpl.innerHTML = new TextDecoder().decode(buf);
    const nodes = [...tpl.content.childNodes];
    box.replaceWith(...nodes);
    // 解鎖後的內容需要重新套用互動功能
    document.dispatchEvent(new CustomEvent("content:unlocked"));
    const h = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (h) h.scrollIntoView();
  };

  const tryAll = async (pass) => {
    for (const box of boxes) await open(box, pass);
  };

  const remember = (pass) => { try { localStorage.setItem(STORE, pass); } catch (e) {} };
  const recall = () => { try { return localStorage.getItem(STORE); } catch (e) { return null; } };
  const forget = () => { try { localStorage.removeItem(STORE); } catch (e) {} };

  const saved = recall();
  const start = saved
    ? tryAll(saved).catch(() => { forget(); return Promise.reject(); })
    : Promise.reject();

  start.catch(() => {
    for (const box of boxes) {
      const form = box.querySelector("[data-lock-form]");
      const input = form.querySelector("input");
      const err = box.querySelector("[data-lock-error]");
      const btn = form.querySelector("button");
      input.focus({ preventScroll: true });
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        err.textContent = "";
        btn.disabled = true;
        btn.textContent = "解鎖中…";
        try {
          await tryAll(input.value);
          remember(input.value);
        } catch (e2) {
          err.textContent = "密碼不對，再試一次。";
          btn.disabled = false;
          btn.textContent = "解鎖";
          input.select();
        }
      });
    }
  });
})();
