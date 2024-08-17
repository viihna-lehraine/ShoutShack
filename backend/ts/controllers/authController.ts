import bcrypt from 'bcryptjs';
import { generateToken } from './jwtUtils.js';
import User from './models/User.js';

export const login = async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (!user) {
        return res.status(401).json({ message: 'Login failed - invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // generate JWT
    const token = await generateToken(user);

    res.json({ token });
};
