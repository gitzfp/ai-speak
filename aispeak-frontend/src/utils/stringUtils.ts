// stringUtils.ts

/**
 * 打乱数组顺序
 * @param array 需要打乱顺序的数组
 * @returns 打乱顺序后的数组
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // 交换元素
  }
  return array;
}

/**
 * 生成一个随机字母
 * @returns 随机字母
 */
export function generateRandomLetter(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

/**
 * 处理字符串，确保字母数量为11个，并打乱顺序
 * @param zm 输入的字符串
 * @returns 包含字母和索引的对象数组
 */
export function processZm(zm: string,isShuffle: boolean = false): { index: number; letter: string }[] {
  
   // 过滤掉非字母字符
    let letters = zm.replace(/[^A-Za-z]/g, '').split('');

	// let letters = zm.split('');
  // 仅当字母不足11时补充随机字母
  if (!isShuffle) {
	 if (letters.length < 11) {
	   const needed = 11 - letters.length;
	   for (let i = 0; i < needed; i++) {
	     letters.push(generateRandomLetter());
	   }
	 } 
  }
  

  // 打乱所有字母
  letters = shuffleArray(letters);

  // 生成带下标的对象数组
  return letters.map((letter, index) => ({
    index: index,
    letter: letter,
	isSelet:false,
  }));
}