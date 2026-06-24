import { TypingText } from '@mogamoga1024/typing-jp';

try {
  const hiragana = "フランスかがくアカデミーはせんろっぴゃくろくじゅうろくねんにルイじゅうよんせいがそうりつしたフランスこくりつのがくじゅつだんたいですいちじはいしされましたがのちにフランスがくしいんとしてさいけんされヨーロッパのかがくけんきゅうをけんいんしました";
  const typing = new TypingText(hiragana);
  console.log("SUCCESS");
} catch (e) {
  if (e instanceof Error) {
    console.error("ERROR", e.message);
  } else {
    console.error("ERROR", e);
  }
}
