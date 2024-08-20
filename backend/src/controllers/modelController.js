// Retrieve all entries for any model
export const getEntries = async (Model) => async (req, res) => {
	try {
		const entries = await Model.findAll();
		res.status(200).json(entries);
	} catch (error) {
		res.status(500).json({
			error: `Failed to fetch entries from ${Model.name}`
		});
	}
};

// Create a new entry for any model
export const createEntry = async (Model) => async (req, res) => {
	try {
		const newEntry = await Model.create(req.body);
		res.status(201).json(newEntry);
	} catch (error) {
		res.status(400).json({
			error: `Failed to create entry in ${Model.name}`
		});
	}
};

// Update an existing entry for any model
export const updateEntry = async (Model) => async (req, res) => {
	try {
		const { id } = req.params;
		const updatedEntry = await Model.update(req.body, {
			where: { id }
		});
		if (updatedEntry[0] === 0) {
			return res
				.status(404)
				.json({ error: `${Model.name} entry not found` });
		}
		res.status(200).json({ message: `${Model.name} entry updated` });
	} catch (error) {
		res.status(400).json({
			error: `Failed to update entry in ${Model.name}`
		});
	}
};

// Delete an entry for any model
export const deleteEntry = async (Model) => async (req, res) => {
	try {
		const { id } = req.params;
		const deleted = await Model.destroy({ where: { id } });
		if (!deleted) {
			return res
				.status(404)
				.json({ error: `${Model.name} entry not found` });
		}
		res.status(200).json({ message: `${Model.name} entry deleted` });
	} catch (error) {
		res.status(500).json({
			error: `Failed to delete entry from ${Model.name}`
		});
	}
};
