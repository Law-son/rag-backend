import User from '../models/User.js';
import logger from './logger.js';

export async function seedAdminUser() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@allnations.com';
    const password = process.env.ADMIN_PASSWORD || 'admin@allnations';

    const existing = await User.findOne({ email });
    if (existing) {
      logger.info(`Admin user already exists: ${email}`);
      return;
    }

    const admin = new User({
      email,
      password,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });

    await admin.save();
    logger.info(`Seeded admin user: ${email}`);
  } catch (error) {
    logger.error('Error seeding admin user', error);
  }
}


