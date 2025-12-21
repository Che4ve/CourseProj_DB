import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

// Фиксированный seed для воспроизводимости
faker.seed(12345);

const prisma = new PrismaClient();

const HABIT_TYPES = ['good', 'bad'] as const;
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];
const FREQUENCY_TYPES = ['daily', 'weekly', 'monthly', 'custom'] as const;
const DELIVERY_METHODS = ['push', 'email', 'sms'] as const;

async function createUsers(count: number) {
  console.log(`👥 Creating ${count} users...`);
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        passwordHash: '$2b$10$dummyHashForSeeding1234567890123456789012', // bcrypt hash placeholder
        fullName: faker.person.fullName(),
        role: i < 5 ? 'admin' : 'user',
        isActive: faker.datatype.boolean(0.95),
        loginCount: faker.number.int({ min: 0, max: 100 }),
        profile: {
          create: {
            bio: faker.datatype.boolean(0.7) ? faker.lorem.paragraph() : null,
            avatarUrl: faker.datatype.boolean(0.6) ? faker.image.avatar() : null,
            timezone: faker.location.timeZone(),
            dateOfBirth: faker.datatype.boolean(0.8) ? faker.date.birthdate({ min: 18, max: 70, mode: 'age' }) : null,
            notificationEnabled: faker.datatype.boolean(0.85),
            themePreference: faker.number.int({ min: 0, max: 2 }),
          }
        }
      }
    });
    users.push(user);
  }
  
  console.log(`✅ Created ${users.length} users`);
  return users;
}

async function createTags(count: number) {
  console.log(`🏷️  Creating ${count} tags...`);
  const tags = [];
  
  const tagNames = [
    'Health', 'Fitness', 'Productivity', 'Learning', 'Social', 
    'Finance', 'Mindfulness', 'Creativity', 'Career', 'Family',
    'Reading', 'Exercise', 'Meditation', 'Coding', 'Writing',
    'Music', 'Art', 'Sports', 'Travel', 'Cooking'
  ];
  
  for (let i = 0; i < count; i++) {
    const name = i < tagNames.length 
      ? tagNames[i] 
      : faker.word.noun() + ' ' + faker.word.adjective();
    
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    const tag = await prisma.tag.create({
      data: {
        name,
        slug: `${slug}-${i}`,
        color: faker.helpers.arrayElement(COLORS),
        usageCount: 0,
        isSystem: i < 10,
      }
    });
    tags.push(tag);
  }
  
  console.log(`✅ Created ${tags.length} tags`);
  return tags;
}

async function createHabits(users: any[], count: number) {
  console.log(`📋 Creating ${count} habits...`);
  const habits = [];
  
  const habitTemplates = [
    { name: 'Morning Exercise', type: 'good', desc: 'Start the day with physical activity' },
    { name: 'Read for 30 minutes', type: 'good', desc: 'Daily reading habit' },
    { name: 'Meditate', type: 'good', desc: 'Mindfulness practice' },
    { name: 'Drink 8 glasses of water', type: 'good', desc: 'Stay hydrated' },
    { name: 'No social media before bed', type: 'good', desc: 'Better sleep hygiene' },
    { name: 'Smoking', type: 'bad', desc: 'Quit smoking' },
    { name: 'Procrastination', type: 'bad', desc: 'Stop procrastinating' },
    { name: 'Junk food', type: 'bad', desc: 'Avoid unhealthy eating' },
    { name: 'Late night snacking', type: 'bad', desc: 'Stop eating late' },
    { name: 'Excessive screen time', type: 'bad', desc: 'Reduce screen usage' },
  ];
  
  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users);
    const template = faker.helpers.arrayElement(habitTemplates);
    
    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        name: i < habitTemplates.length * 10 
          ? `${template.name} ${faker.number.int({ min: 1, max: 50 })}`
          : faker.lorem.words(3),
        description: faker.datatype.boolean(0.7) ? template.desc : null,
        type: template.type,
        color: faker.helpers.arrayElement(COLORS),
        priority: faker.number.int({ min: 0, max: 10 }),
        isArchived: faker.datatype.boolean(0.1),
        displayOrder: i,
      }
    });
    habits.push(habit);
  }
  
  console.log(`✅ Created ${habits.length} habits`);
  return habits;
}

async function createHabitTags(habits: any[], tags: any[], count: number) {
  console.log(`🔗 Creating ${count} habit-tag relations...`);
  const habitTags = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const habit = faker.helpers.arrayElement(habits);
      const tag = faker.helpers.arrayElement(tags);
      
      const habitTag = await prisma.habitTag.create({
        data: {
          habitId: habit.id,
          tagId: tag.id,
          priority: faker.number.int({ min: 0, max: 5 }),
          isPrimary: faker.datatype.boolean(0.3),
          assignedBy: faker.helpers.arrayElement(['user', 'auto']),
        }
      });
      habitTags.push(habitTag);
    } catch (error) {
      // Skip duplicates
    }
  }
  
  console.log(`✅ Created ${habitTags.length} habit-tag relations`);
  return habitTags;
}

async function createSchedules(habits: any[]) {
  console.log(`📅 Creating schedules...`);
  let count = 0;
  
  for (const habit of habits) {
    if (faker.datatype.boolean(0.7)) {
      await prisma.habitSchedule.create({
        data: {
          habitId: habit.id,
          frequencyType: faker.helpers.arrayElement(FREQUENCY_TYPES),
          frequencyValue: faker.number.int({ min: 1, max: 7 }),
          weekdaysMask: faker.number.int({ min: 1, max: 127 }),
          startDate: faker.date.past({ years: 1 }),
          endDate: faker.datatype.boolean(0.3) ? faker.date.future({ years: 1 }) : null,
          isActive: faker.datatype.boolean(0.9),
        }
      });
      count++;
    }
  }
  
  console.log(`✅ Created ${count} schedules`);
}

async function createReminders(habits: any[], count: number) {
  console.log(`⏰ Creating ${count} reminders...`);
  let created = 0;
  
  for (let i = 0; i < count; i++) {
    const habit = faker.helpers.arrayElement(habits);
    
    await prisma.reminder.create({
      data: {
        habitId: habit.id,
        reminderTime: new Date(`2024-01-01T${faker.number.int({ min: 6, max: 22 }).toString().padStart(2, '0')}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}:00`),
        daysOfWeek: faker.number.int({ min: 1, max: 127 }),
        notificationText: faker.datatype.boolean(0.7) ? faker.lorem.sentence() : null,
        deliveryMethod: faker.helpers.arrayElement(DELIVERY_METHODS),
        isActive: faker.datatype.boolean(0.9),
      }
    });
    created++;
  }
  
  console.log(`✅ Created ${created} reminders`);
}

async function createCheckins(habits: any[], users: any[], count: number) {
  console.log(`✅ Creating ${count} checkins...`);
  const checkins = [];
  
  // Генерируем checkins за последние 180 дней
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 180);
  
  for (let i = 0; i < count; i++) {
    try {
      const habit = faker.helpers.arrayElement(habits);
      const user = users.find(u => u.id === habit.userId);
      
      const checkinDate = faker.date.between({ from: startDate, to: endDate });
      
      const checkin = await prisma.habitCheckin.create({
        data: {
          habitId: habit.id,
          userId: user.id,
          checkinDate,
          checkinTime: new Date(`2024-01-01T${faker.number.int({ min: 6, max: 23 }).toString().padStart(2, '0')}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}:00`),
          notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
          moodRating: faker.datatype.boolean(0.8) ? faker.number.int({ min: 1, max: 5 }) : null,
          durationMinutes: faker.datatype.boolean(0.6) ? faker.number.int({ min: 5, max: 120 }) : null,
        }
      });
      checkins.push(checkin);
      
      if ((i + 1) % 1000 === 0) {
        console.log(`   Progress: ${i + 1}/${count} checkins created`);
      }
    } catch (error) {
      // Skip duplicates (same habit + date)
    }
  }
  
  console.log(`✅ Created ${checkins.length} checkins`);
  return checkins;
}

async function main() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    // Очистка существующих данных (в обратном порядке зависимостей)
    console.log('🧹 Cleaning existing data...');
    await prisma.batchImportError.deleteMany();
    await prisma.batchImportJob.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.habitStat.deleteMany();
    await prisma.reminder.deleteMany();
    await prisma.habitTag.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.habitCheckin.deleteMany();
    await prisma.habitSchedule.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Cleaned\n');
    
    // Создание данных
    const users = await createUsers(100);
    const tags = await createTags(50);
    const habits = await createHabits(users, 800); // КРУПНАЯ ТАБЛИЦА
    await createHabitTags(habits, tags, 1500);
    await createSchedules(habits);
    await createReminders(habits, 600);
    await createCheckins(habits, users, 10000); // ТРАНЗАКЦИОННАЯ ТАБЛИЦА
    
    console.log('\n✨ Seeding completed successfully!');
    console.log('\n📊 Final counts:');
    console.log(`   Users: ${await prisma.user.count()}`);
    console.log(`   Habits: ${await prisma.habit.count()}`);
    console.log(`   Checkins: ${await prisma.habitCheckin.count()}`);
    console.log(`   Tags: ${await prisma.tag.count()}`);
    console.log(`   Habit-Tags: ${await prisma.habitTag.count()}`);
    console.log(`   Schedules: ${await prisma.habitSchedule.count()}`);
    console.log(`   Reminders: ${await prisma.reminder.count()}`);
    
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


