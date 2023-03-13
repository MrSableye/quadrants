import { config } from 'dotenv';
import Axios from 'axios';
import Koa from 'koa';
import Router from '@koa/router';
import serve from 'koa-static';
import logger from 'koa-logger';

config();

const defaultStaticAssetsDirectory = './quadrants-client/build';
const defaultPort = 8080;
const defaultToken = '';

const getUser = async (id: string): Promise<{ avatar?: string }> => {
  const token = process.env.TOKEN || defaultToken;
  const { data } = await Axios.get(`https://discord.com/api/users/${id}`, {
    responseType: 'json',
    headers: {
      'Authorization': `Bot ${token}`,
    },
  });
  
  return data;
};

const initialize = async () => {
  const koaApp = new Koa();
  const apiRoute = new Router({ prefix: '/api' });

  apiRoute.get('/avatar', async (ctx) => {
    const id = ctx.query['id'] as string;
    let avatar = 'https://cdn.discordapp.com/embed/avatars/0.png';

    try {
      const user = await getUser(id);

      if (user.avatar) {
        if (user.avatar.startsWith('a_')) {
          avatar = `https://cdn.discordapp.com/avatars/${id}/${user.avatar}.gif?size=2048`;
        } else {
          avatar = `https://cdn.discordapp.com/avatars/${id}/${user.avatar}.png?size=2048`;
        }
      }
    } catch (e) {}

    ctx.body = { avatarUrl: avatar };
  });

  koaApp.use(logger());
  koaApp.use(apiRoute.routes());
  koaApp.use(serve(process.env.STATIC_ASSETS || defaultStaticAssetsDirectory, { index: 'index.html' }));

  const port = +(process.env.HTTP_PORT || defaultPort);
  koaApp.listen(port, () => { console.log(`Listening on port ${port}`); });
};

initialize();
