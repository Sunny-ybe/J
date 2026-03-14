const A = {
	data: null,
	q: (s) => document.querySelector(s),
	t: (v) => (v == null ? "" : String(v))
};

function toast(msg) {
	let el = A.q("#toast");
	if (!el) {
		el = document.createElement("div");
		el.id = "toast";
		el.className = "toast";
		el.setAttribute("role", "status");
		document.body.append(el);
	}
	el.textContent = msg;
	el.classList.add("show");
	clearTimeout(toast._timer);
	toast._timer = setTimeout(() => el.classList.remove("show"), 2200);
}

function validate() {
	if (!A.t(A.data.site.title).trim() || !A.t(A.data.site.tagline).trim()) return "Site title and subtitle are required.";
	for (const s of A.data.sections) {
		if (!A.t(s.id).trim() || !A.t(s.type).trim() || !A.t(s.title).trim()) return "Each section needs id, type, and title.";
		if (Array.isArray(s.images)) for (const im of s.images) if (!A.t(im.src).trim()) return `Image src missing in section ${s.id}.`;
	}
	return "";
}

function imgEditor(si, s) {
	if (!Array.isArray(s.images)) return "";
	return `<div class="stack"><h4>Images</h4>${s.images.map((im, ii) => `<div class="admin-row"><input data-si="${si}" data-ii="${ii}" data-key="src" value="${A.t(im.src)}" placeholder="src" required /><input data-si="${si}" data-ii="${ii}" data-key="alt" value="${A.t(im.alt)}" placeholder="alt" /><input data-si="${si}" data-ii="${ii}" data-key="caption" value="${A.t(im.caption)}" placeholder="caption" /><button type="button" data-act="img-up" data-si="${si}" data-ii="${ii}">Up</button><button type="button" data-act="img-down" data-si="${si}" data-ii="${ii}">Down</button><button type="button" data-act="img-del" data-si="${si}" data-ii="${ii}">Remove</button></div>`).join("")}<button type="button" data-act="img-add" data-si="${si}">Add Image</button></div>`;
}

function sectionTextFields(si, s) {
	const keys = ["subtitle", "intro", "summary", "description", "content", "location"];
	return keys.filter((k) => k in s).map((k) => `<label>${k}<textarea data-si="${si}" data-key="${k}" rows="2">${A.t(s[k])}</textarea></label>`).join("");
}

/* Renders all editable section cards from in-memory JSON state. */
function render() {
	const root = A.q("#sections-editor");
	A.q("#site-title").value = A.t(A.data.site.title);
	A.q("#site-tagline").value = A.t(A.data.site.tagline);
	root.innerHTML = A.data.sections.map((s, si) => `<section class="stack"><div class="admin-toolbar"><h3>${si + 1}. ${A.t(s.title)}</h3><div><button type="button" data-act="sec-up" data-si="${si}">Up</button><button type="button" data-act="sec-down" data-si="${si}">Down</button><button type="button" data-act="sec-del" data-si="${si}">Remove</button></div></div><div class="admin-grid"><label>id<input data-si="${si}" data-key="id" value="${A.t(s.id)}" required /></label><label>type<input data-si="${si}" data-key="type" value="${A.t(s.type)}" required /></label><label>title<input data-si="${si}" data-key="title" value="${A.t(s.title)}" required /></label></div>${sectionTextFields(si, s)}${Array.isArray(s.items) ? `<label>items (JSON)<textarea data-si="${si}" data-key="items-json" rows="4">${JSON.stringify(s.items, null, 2)}</textarea></label>` : ""}${imgEditor(si, s)}</section>`).join("");
}

function move(arr, from, to) {
	if (to < 0 || to >= arr.length) return;
	const [x] = arr.splice(from, 1);
	arr.splice(to, 0, x);
}

function bind() {
	A.q("#site-title").addEventListener("input", (e) => { A.data.site.title = e.target.value; });
	A.q("#site-tagline").addEventListener("input", (e) => { A.data.site.tagline = e.target.value; });

	document.body.addEventListener("input", (e) => {
		const si = Number(e.target.dataset.si), ii = Number(e.target.dataset.ii), key = e.target.dataset.key;
		if (Number.isNaN(si) || !key) return;
		const s = A.data.sections[si];
		if (key === "items-json") return;
		if (!Number.isNaN(ii)) s.images[ii][key] = e.target.value;
		else s[key] = e.target.value;
	});

	document.body.addEventListener("change", (e) => {
		if (e.target.dataset.key !== "items-json") return;
		const si = Number(e.target.dataset.si);
		try {
			A.data.sections[si].items = JSON.parse(e.target.value || "[]");
		} catch {
			toast("Invalid items JSON.");
		}
	});

	document.body.addEventListener("click", (e) => {
		const b = e.target.closest("button[data-act]");
		if (!b) return;
		const si = Number(b.dataset.si), ii = Number(b.dataset.ii), s = A.data.sections[si], act = b.dataset.act;
		if (act === "sec-up") move(A.data.sections, si, si - 1);
		if (act === "sec-down") move(A.data.sections, si, si + 1);
		if (act === "sec-del") A.data.sections.splice(si, 1);
		if (act === "img-add") (s.images ||= []).push({ src: "images/new-photo.jpg", alt: "New image", caption: "New caption" });
		if (act === "img-del") s.images.splice(ii, 1);
		if (act === "img-up") move(s.images, ii, ii - 1);
		if (act === "img-down") move(s.images, ii, ii + 1);
		render();
	});

	A.q("#add-section").addEventListener("click", () => {
		A.data.sections.push({ id: `section-${A.data.sections.length + 1}`, type: "list", title: "New Section", description: "", items: ["New item"] });
		render();
		toast("Section added.");
	});

	A.q("#export-json").addEventListener("click", () => {
		const err = validate();
		if (err) return toast(err);
		const blob = new Blob([JSON.stringify(A.data, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "content.json";
		a.click();
		URL.revokeObjectURL(url);
		toast("content.json exported.");
	});
}

async function init() {
	try {
		const res = await fetch("content.json", { cache: "no-store" });
		if (!res.ok) throw new Error();
		A.data = await res.json();
		render();
		bind();
	} catch {
		A.q("#admin-app").innerHTML = "<section><h2>Failed to load content.json</h2><p>Start a local server and reload.</p></section>";
	}
}

init();
