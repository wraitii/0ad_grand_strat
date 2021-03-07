class Province
{
	constructor(code, data)
	{
		this.code = code;
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
		this.ownerTribe = data.ownerTribe
	}
}