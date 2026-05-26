const bannedKeys = [
  "Enter",
  "Delete",
  "Tab",
  "CapsLock",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "Escape",
  "Fn",
  "FnLock",
  "Hyper",
  "Super",
  "OS",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "AudioVolumeUp",
  "AudioVolumeDown",
  "AudioVolumeMute",
  "End",
  "PageDown",
  "PageUp",
  "Clear",
  "Home",
];

export const isLegal = (key: string): boolean => {
  if (bannedKeys.includes(key)) return false;
  return true;
};

/** 检测中文输入法标点符号 */
export const isChineseSymbol = (val: string): boolean =>
  /[。|？|！|，|、|；|：|“|”|‘|’|（|）|《|》|〈|〉|【|】|『|』|「|」|﹃|﹄|〔|〕|…|—|～|﹏|￥]/.test(
    val
  );
