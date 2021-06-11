class Province
{
	constructor(data)
	{
		this.code = data.code;
		this.data = data;
		this.gfxdata = Engine.ReadJSONFile(`art/textures/ui/campaigns/grand_strategy/provinces/${this.code}.json`);
		this.icon = undefined;
		this.ownerTribe = undefined;

		// Indicative of the defensive strength should an attack occur. Also costs money.
		this.garrison = 0;
	}

	Serialize()
	{
		return {
			"code": this.code,
			"ownerTribe": this.ownerTribe,
			"garrison": this.garrison > 0 ? this.garrison : undefined
		};
	}

	Deserialize(data)
	{
		this.code = data.code;
		this.ownerTribe = data.ownerTribe;
		this.garrison = data.garrison || 0;
	}

	// UI

	getColor()
	{
		if (this.ownerTribe)
			return g_GameData.tribes[this.ownerTribe].color;
		return "255 255 255";
	}

	getHeroPos()
	{
		if (this.data.centerpoint)
			return this.data.centerpoint;
		return [(this.gfxdata.size[2] + this.gfxdata.size[0]) / 2,
			(this.gfxdata.size[3] + this.gfxdata.size[1]) / 2];
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

	getLinks()
	{
		return this.data.links || [];
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