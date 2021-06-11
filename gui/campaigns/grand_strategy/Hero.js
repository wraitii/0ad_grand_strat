/**
 *
 */
class Hero
{
	constructor(tribe, province)
	{
		this.tribe = tribe;
		this.location = province;
		this.actionsLeft = 1;
	}

	Serialize()
	{
		return {
			"tribe": this.tribe,
			"loc": this.location,
			"moves": this.actionsLeft
		};
	}

	Deserialize(data)
	{
		this.tribe = data.tribe;
		this.location = data.loc;
		this.actionsLeft = data.moves;
	}

	ownsProvince(code)
	{
		return g_GameData.provinces[code].ownerTribe === this.tribe;
	}


	canMove(code)
	{
		if (!g_GameData.provinces[code].canTravel(this.location))
			return false;
		return this.actionsLeft >= 1;
	}

	doMove(code)
	{
		this.location = code;
		this.actionsLeft--;
	}

	canAttack(code)
	{
		return !this.ownsProvince(code) && this.actionsLeft >= 1;
	}

	doAttack(code)
	{
		this.actionsLeft--;
		return g_GameData.playOutAttack(this.tribe, code);
	}

	canStrengthen(code)
	{
		return this.ownsProvince(code) && this.actionsLeft >= 0.5 && g_GameData.provinces[code].garrison < 10;
	}

	doStrengthen(code)
	{
		this.actionsLeft -= 0.5;
		return g_GameData.changeGarrison(code, 1);
	}

	canWeaken(code)
	{
		return this.ownsProvince(code) && this.actionsLeft >= 0.5 && g_GameData.provinces[code].garrison > 0;
	}

	doWeaken(code)
	{
		this.actionsLeft -= 0.5;
		return g_GameData.changeGarrison(code, -1);
	}

}
