/**
 *
 */
class Tribe
{
	constructor(data)
	{
		this.code = data.code;
		this.data = data;

		this.color = data.color || "255 0 0";

		this.controlledProvinces = [];
		this.civ = "iber";

		this.money = 0;
		this.lastBalance = 0;
	}

	Serialize()
	{
		return {
			"money": this.money,
			"lastBalance": this.lastBalance || 0,
			"civ": this.civ,
		};
	}

	Deserialize(data)
	{
		this.money = data.money;
		this.lastBalance = data.lastBalance;
		this.civ = data.civ;

		for (let prov in g_GameData.provinces)
			if (g_GameData.provinces[prov].ownerTribe === this.code)
				this.controlledProvinces.push(prov);
	}

	GainControl(code)
	{
		if (this.controlledProvinces.indexOf(code) === -1)
			this.controlledProvinces.push(code);
	}

	LoseControl(code)
	{
		let idx = this.controlledProvinces.indexOf(code);
		if (idx !== -1)
			this.controlledProvinces.splice(idx, 1);
	}
}