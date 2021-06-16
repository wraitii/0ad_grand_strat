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
		return sprintf("%(attacker)s has conquered %(target)s", this.data);
	}
}
