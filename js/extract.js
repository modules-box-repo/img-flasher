// Extract screen: partition selection and output path.
function renderExtract() {
  const parts = state.blocks.filter(b => b.partname && b.partname !== "-");
  const box = $("#exRows");
  [...state.selected].forEach(n => { if (!parts.some(b => b.name === n)) state.selected.delete(n); });
  $("#exCount").textContent = state.selected.size + " selected";
  $("#exBtn").disabled = state.selected.size === 0;
  if (!parts.length) {
    box.innerHTML = `<tr class="empty-format"><td colspan="12">No partitions with a PARTNAME found.</td></tr>`;
    return;
  }
  box.innerHTML = parts.map(b => `
    <tr data-name="${b.name}" class="${state.selected.has(b.name) ? "selected" : ""}">
      <td><input type="checkbox" class="ex-check" data-name="${b.name}" ${state.selected.has(b.name) ? "checked" : ""} aria-label="Select ${b.name}"></td>
      <td class="c-name"><a href="#" class="blk-link" data-name="${b.name}">${b.name}</a></td>
      <td class="c-type-${b.type}">${b.type}</td>
      <td>${b.path}</td>
      <td>${b.partname}</td>
      <td>${b.parent}</td>
      <td>${b.sectors}</td>
      <td>${b.bytes}</td>
      <td>${b.size}</td>
      <td>${b.majmin}</td>
      <td class="${b.readOnly ? "c-ro1" : ""}">${b.ro}</td>
      <td>${b.removable}</td>
    </tr>`).join("");
  box.querySelectorAll(".ex-check").forEach(c => c.onchange = () => {
    c.checked ? state.selected.add(c.dataset.name) : state.selected.delete(c.dataset.name);
    c.closest("tr").classList.toggle("selected", c.checked);
    $("#exCount").textContent = state.selected.size + " selected";
    $("#exBtn").disabled = state.selected.size === 0;
  });
  box.querySelectorAll("tr[data-name]").forEach(tr => tr.onclick = e => {
    if (e.target.classList.contains("blk-link") || e.target.classList.contains("ex-check")) return;
    const c = tr.querySelector(".ex-check");
    c.checked = !c.checked;
    c.dispatchEvent(new Event("change"));
  });
  box.querySelectorAll(".blk-link").forEach(a => a.onclick = e => {
    e.preventDefault();
    e.stopPropagation();
    openInfo(a.dataset.name);
  });
}

function exMsg(text, error = false) {
  $("#exMessage").innerHTML = `<div class="notice ${error ? "error" : "success"}">${error ? "ERROR / " : "OK / "}${text}</div>`;
}

function isFolderPath(p) {
  p = String(p || "").trim();
  if (p.endsWith("/")) return true;
  return !p.split("/").pop().includes(".");
}

function initExtract() {
  $("#exBtn").onclick = async () => {
    const out = $("#exOut").value.trim();
    if (!state.selected.size) return exMsg("Select at least one partition.", true);
    if (!out || !out.startsWith("/")) return exMsg("Output path must be absolute (e.g. /sdcard/Download).", true);
    const folder = isFolderPath(out);
    if (!folder && state.selected.size > 1)
      return exMsg("Output is a file but multiple partitions are selected — pick a folder or select a single partition.", true);
    const base = out.replace(/\/+$/, "");
    $("#exBtn").disabled = true;
    $("#exMessage").innerHTML = "";
    showProgress("exProg", true);
    let done = 0;
    const total = [...state.selected].length;
    const errors = [];
    for (const n of [...state.selected]) {
      const b = state.blocks.find(x => x.name === n);
      if (!b) { done++; setProgress("exBar", "exPct", done, total); continue; }
      const dest = folder ? `${base}/${b.partname}.img` : out;
      $("#exMessage").innerHTML = `<div class="notice">جاري استخراج ${b.partname} (${done + 1}/${total})…</div>`;
      try {
        await api("/api/extract", { method: "POST", body: JSON.stringify({ partition: b.name, output: dest }) });
      } catch (e) {
        errors.push(`${b.partname}: ${e.message}`);
      }
      done++;
      setProgress("exBar", "exPct", done, total);
    }
    await new Promise(r => setTimeout(r, 400));
    showProgress("exProg", false);
    $("#exBtn").disabled = state.selected.size === 0;

    if (errors.length === 0) {
      exMsg(`تم الاستخراج بنجاح! ✓ (${total === 1 ? 'تم حفظ الملف' : 'تم حفظ ' + total + ' ملفات'})`, false);
    } else if (errors.length < total) {
      exMsg(`اكتمل الاستخراج مع وجود أخطاء:\n${errors.join("\n")}`, true);
    } else {
      exMsg(`فشل الاستخراج:\n${errors.join("\n")}`, true);
    }
  };
}
