import { createApp } from './app';
import { env } from './env';

createApp().listen(env.PORT, () => console.info(`Nocturne API sur http://localhost:${env.PORT}/api`));
