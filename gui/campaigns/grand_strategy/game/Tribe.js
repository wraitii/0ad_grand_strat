/**
 *
 */
class Tribe
{
	constructor(data, isCustomTribe)
	{
		this.code = data.code;
		this.data = data;

		this.color = data.color || "255 0 0";

		// Custom tribes don't have associated JSON data, so we need to serialize more.
		if (isCustomTribe)
			this.customTribeData = data;

		this.controlledProvinces = [];
		this.civ = data.civ;

		this.money = 0;
		this.lastBalance = 0;

		this.diplo = {};
	}

	Serialize()
	{
		const ret = {
			"money": this.money,
			"lastBalance": this.lastBalance || 0,
			"civ": this.civ,
			"diplo": Object.keys(this.diplo).map(x => [x, this.diplo[x].serialize()]),
		};
		if (this.customTribeData)
			ret.customTribeData = this.customTribeData;
		return ret;
	}

	Deserialize(data)
	{
		this.money = data.money;
		this.lastBalance = data.lastBalance;
		this.civ = data.civ;

		// TODO: do this better.
		for (const prov in g_GameData.provinces)
			if (g_GameData.provinces[prov].ownerTribe === this.code)
				this.controlledProvinces.push(prov);

		for (const [key, diplo] of data.diplo)
			this.diplo[key] = new GSDiplomacy(this.code, key).deserialize(diplo);
	}

	getName()
	{
		return this.data.name;
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

	/**
	 * Whether the tribe can attack the target.
	 * Always true if target is undefined (barbarians).
	 */
	canAttack(target)
	{
		if (!target)
			return true;
		return this.getDiplomacy(target).canAttack();
	}

	getDiplomacy(target)
	{
		if (target === this.code)
		{
			warn("Cannot get diplomacy with ourselves");
			return undefined;
		}
		// Diplomacy is lazily constructed for efficiency - things start out neutral.
		if (!this.diplo[target])
			this.diplo[target] = new GSDiplomacy(this.code, target);
		return this.diplo[target];
	}
}