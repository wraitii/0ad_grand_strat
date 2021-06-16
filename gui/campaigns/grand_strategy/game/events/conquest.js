/**
 * Conquest events - some entity has conquered a province.
 */
class GSConquest extends GSEvent
{
	constructor(data)
	{
		super("conquest");
		this.data = data;
	}

	getTickerText()
	{
		return sprintf("%(attacker)s has conquered %(target)s", {
			"attacker": g_GameData.tribes[this.data.attacker].getName(),
			"target": g_GameData.provinces[this.data.target].getName(),
		});
	}
}
