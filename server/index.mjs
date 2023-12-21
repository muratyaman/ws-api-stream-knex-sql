import dotenv from 'dotenv';
import { factory } from './factory.mjs';

main();

async function main() {
  dotenv.config(); // side-effect on process.env
  const f = await factory(process.env);
  f.start();
}
