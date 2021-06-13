
selectors = document.querySelectorAll("tr.province");

function enterOK(item)
{
	item.addEventListener('keypress', (e) => {
		if ((e.which || e.keyCode) !== 13) // ENTER
			return;
		item.blur();
	});
}

for (let sel of selectors)
{
	for (let child of sel.children)
		if (child.isContentEditable)
			enterOK(child);
}

document.querySelector("#update").onclick = () => {
	let updates = [];
	for (let sel of selectors)
	{
		updates.push({
			"og_code": sel.id,
			"code": sel.children[0].textContent,
			"name": sel.children[1].textContent,
			"mapTypes": sel.children[2].textContent,
			"civs": sel.children[3].textContent,
		});
	}
	fetch("update", {
		"method": "POST",
		"headers": {
			"Content-Type": "application/json"
		},
		"body": JSON.stringify(updates)
	});
};

