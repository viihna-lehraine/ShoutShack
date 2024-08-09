import GuestbookEntryModelPromise from '../models/GuestbookEntry';

// Get all Guestbook entries
export const getEntries = async (req, res) => {
	try {
		const entries = await GuestbookEntry.findAll();
		res.status(200).json(entries);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch entries' });
	}
};

// Create a new guestbook entry
export const createEntry = async (req, res) => {
	try {
		const newEntry = await GuestbookEntry.create(req.body);
		res.status(201).json(newEntry);
	} catch (error) {
		res.status(400).json({ error: 'Failed to create entry' });
	}
};

// Update an existing guestbook entry
export const updateEntry = async (req, res) => {
	try {
		const { id } = req.params;
		const updatedEntry = await GuestbookEntry.update(req.body, {
			where: { id },
		});
		if (updatedEntry[0] === 0) {
			return res.status(404).json({ error: 'Entry not found' });
		}
		res.status(200).json({ message: 'Entry updated' });
	} catch (error) {
		res.status(400).json({ error: 'Failed to update entry' });
	}
};

// Delete a guestbook entry
export const deleteEntry = async (req, res) => {
	try {
		const { id } = req.params;
		const deleted = await GuestbookEntry.destroy({ where: { id } });
		if (!deleted) {
			return res.status(404).json({ error: 'Entry not found' });
		}
		res.status(200).json({ message: 'Entry deleted' });
	} catch (error) {
		res.status(500).json({ error: 'Failed to delete entry' });
	}
};
