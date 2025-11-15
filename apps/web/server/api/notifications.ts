import { sub } from 'date-fns';

const notifications = [
  {
    id: 1,
    unread: true,
    sender: {
      name: 'Jordan Brown',
      email: 'jordan.brown@example.com',
      avatar: {
        src: 'https://i.pravatar.cc/128?u=2',
      },
    },
    body: 'sent you a message',
    date: sub(new Date(), { minutes: 7 }).toISOString(),
  },
];

export default eventHandler(async () => notifications);
