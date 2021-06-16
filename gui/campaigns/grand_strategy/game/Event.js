/**
 * An event that happened.
 */
class GSEvent
{
	constructor(type)
	{
		this.type = type;
		this.data = {};
	}

	serialize()
	{
		return {
			"type": this.type,
			"data": this.data,
		};
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

	deserialize(data)
	{
		this.type = data.type;
		this.data = data.data;
	}

	getTickerText()
	{
		return undefined;
	}
}
