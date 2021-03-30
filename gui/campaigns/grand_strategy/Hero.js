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

	canMove(code)
	{
		return this.actionsLeft > 0;
	}

	doMove(code)
	{
		this.location = code;
		this.actionsLeft--;
	}

	canAttack(code)
	{
		return this.actionsLeft > 0;
	}

	doAttack(code)
	{
		this.actionsLeft--;
		return g_GameData.playOutAttack(this.tribe, code);
	}
}
