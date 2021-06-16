
var g_GSEventId = 1;

/**
 * An event that happened.
 */
class GSEvent
{
	constructor(type)
	{
		this.id = g_GSEventId++;
		this.type = type;
		this.data = {};
	}

	// Just a way to get the prototype. TODO: using 0 A.D.'s native serialization feature would make this redundant.
	static CreateFromSerialized(data)
	{
		if (data.type === "conquest")
			return new GSConquest();
		else if (data.type === "attack")
			return new GSAttack();
		error("Unknown event type " + data.type);
		return undefined;
	}

	serialize()
	{
		const ret = {
			"id": this.id,
			"type": this.type,
			"data": this.data,
		};
		if (this.processed)
			ret.processed = true;
		return ret;
	}

	deserialize(data)
	{
		this.id = data.id;
		if (data.processed)
			this.processed = data.processed;
		this.type = data.type;
		this.data = data.data;
	}

	/**
	 * If this return true, the player must process the event before they can do any action.
	 */
	needUserInput()
	{
		return false;
	}

	/**
	 * Set up the GUI of the event. Done here to make it easy to centralize event logic.
	 * @return whether the behaviour is specialized.
	 */
	setupPanel(descObj, buttons)
	{
		return false;
	}

	getTickerText()
	{
		return undefined;
	}
}
