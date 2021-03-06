class Province
{
	constructor(data)
	{
		this.code = data.code;
		this.data = data;
		this.gfxdata = Engine.ReadJSONFile(`art/textures/ui/campaigns/grand_strategy/provinces/${this.code}.json`);
		this.icon = undefined;
		this.ownerTribe = undefined;
		this.name = this.data.name;

		// Indicative of the defensive strength should an attack occur. Also costs money.
		this.garrison = 0;
	}

	Serialize()
	{
		return {
			"ownerTribe": this.ownerTribe,
			"garrison": this.garrison > 0 ? this.garrison : undefined
		};
	}

	Deserialize(data)
	{
		this.ownerTribe = data.ownerTribe;
		this.garrison = data.garrison || 0;
	}

	// UI

	getName()
	{
		return this.data.name;
	}

	getColor()
	{
		if (this.ownerTribe)
			return g_GameData.tribes[this.ownerTribe].color.split(" ");
		const r = Math.floor(this.data.hash / 1000000);
		const g = Math.floor((this.data.hash - r * 1000000) / 1000);
		const b = Math.floor((this.data.hash - r * 1000000 - g * 1000));
		return [r, g, b];
	}

	getHeroPos()
	{
		if (this.data.centerpoint)
			return clone(this.data.centerpoint);
		return [(this.gfxdata.size[2] + this.gfxdata.size[0]) / 2,
			(this.gfxdata.size[3] + this.gfxdata.size[1]) / 2];
	}

	getLinks()
	{
		return this.data.links || [];
	}

	getNativeCivs()
	{
		return this.data.civs ?? ["random"];
	}

	getInfoLevel(tribe)
	{
		if (this.ownerTribe === tribe)
			return 2;
		else if (tribe === g_GameData.playerTribe)
		{
			const links = this.getLinks();
			if (this.code === g_GameData.playerHero.location || links.indexOf(g_GameData.playerHero.location) !== -1)
				return 1;
		}
		return 0;
	}

	// Game

	setOwner(tribe)
	{
		if (tribe !== this.ownerTribe)
		{
			if (this.ownerTribe)
				g_GameData.tribes[this.ownerTribe].LoseControl(this.code);
			this.ownerTribe = tribe;
			g_GameData.tribes[this.ownerTribe].GainControl(this.code);
		}
	}

	getBalance()
	{
		return 100 - this.garrison * 50;
	}

	// TODO: A*
	canTravel(code)
	{
		return this.data?.links?.indexOf(code) !== -1;
	}
}