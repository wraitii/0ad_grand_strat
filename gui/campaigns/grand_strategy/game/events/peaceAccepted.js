/**
 * Diplomatic status change.
 */
class GSPeaceAccepted extends GSDiplomacyEvent
{
	constructor(data)
	{
		super("peaceAccepted", data);
	}

	needUserInput()
	{
		return false;
	}

	getTickerText()
	{
		if (this.data.originalAsker === this.data.from)
			return this.sprintfTribes("%(target)s and %(from)s have made peace.");
		return undefined;
	}
}
