import { TypingText } from '@mogamoga1024/typing-jp';

try {
  const hiragana = "フランスかがくアカデミーはせんろっぴゃくろくじゅうろくねんにルイじゅうよんせいがそうりつしたフランスこくりつのがくじゅつだんたいですいちじはいしされましたがのちにフランスがくしいんとしてさいけんされヨーロッパのかがくけんきゅうをけんいんしました";
  const typing = new TypingText(hiragana);
  console.log("SUCCESS");
} catch (e) {
  console.error("ERROR", e.message);
}
