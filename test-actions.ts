import { getTypingText } from './src/app/game/actions';

async function run() {
  const result = await getTypingText(100, "科学");
  console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);
