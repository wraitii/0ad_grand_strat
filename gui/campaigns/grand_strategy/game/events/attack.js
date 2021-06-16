/**
 * 'attack' is a special event that requires user interaction,
 * and happens when the player gets attacked by external forces.
 */
class GSAttack extends GSEvent
{
	constructor(data)
	{
		super("attack");
		this.data = data;
	}

	getTickerText()
	{
		return undefined;
	}
}
