declare module '@mogamoga1024/typing-jp' {
  export class TypingText {
    constructor(text: string);
    
    // 静的メソッド（クラス名から直接呼ぶやつ）
    static isValidInputKey(key: string): boolean;
    
    // インスタンスメソッド（判定を行うやつ）
    inputKey(key: string, isCapsLock: boolean): "unmatch" | "incomplete" | "complete";
    
    // プロパティ（画面に表示するやつ）
    completedText: string;
    remainingText: string;
    completedRoman: string;
    remainingRoman: string;
  }
}