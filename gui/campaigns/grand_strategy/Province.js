class Province
{
	constructor(data)
	{
		this.code = data.code;
		this.data = data;
		this.gfxdata = Engine.ReadJSONFile(`art/textures/ui/campaigns/grand_strategy/provinces/${this.code}.json`);
		this.icon = undefined;
		this.ownerTribe = undefined;
	}

	Serialize()
	{
		return {
			"code": this.code,
			"ownerTribe": this.ownerTribe
		};
	}

	Deserialize(data)
	{
		this.code = data.code;
		this.ownerTribe = data.ownerTribe;
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
}