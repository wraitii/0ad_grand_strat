class MapType
{
	constructor(data)
	{
		this.data = data;
	}
}

class MapTypes
{
	constructor()
	{
		this.mapTypes = {};
		let files = Engine.ListDirectoryFiles("campaigns/grand_strategy/map_types/", "**.json", false);
		for (let i = 0; i < files.length; ++i)
		{
			const file = files[i];
			const data = Engine.ReadJSONFile(file);
			const code = file.replace("campaigns/grand_strategy/map_types/", "").replace(".json", "");
			this.mapTypes[code] = new MapType(data);
		}
	}

	parse(spec)
	{
		let biomes = [];
		let maps = [];
		let sp = spec;
		let nextToken = sp.search(/\+/);
		while (sp.length)
		{
			const token = sp.substring(0, nextToken);
			sp = sp.substring(nextToken+1);
			if (!(token in this.mapTypes))
			{
				warn("Unknow map type " + token);
				break;
			}
			biomes = biomes.concat(this.mapTypes[token].data.biomes ?? []);
			maps = maps.concat(this.mapTypes[token].data.maps ?? []);
		}
		return {
			"biomes": biomes,
			"maps": maps
		};
	}
}
