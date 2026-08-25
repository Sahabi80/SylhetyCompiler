/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DialectType = 'sylheti' | 'bangla' | 'phonetic' | 'english';

export interface DialectMapping {
  sylheti: string;
  bangla: string;
  phonetic: string;
  english: string;
}

export const DIALECT_DICTIONARY: DialectMapping[] = [
  { sylheti: 'ধরি', bangla: 'ধরি', phonetic: 'dhori', english: 'let' },
  { sylheti: 'রাখইন', bangla: 'রাখুন', phonetic: 'rakhoin', english: 'var' },
  { sylheti: 'ধ্রুবক', bangla: 'ধ্রুবক', phonetic: 'dhrubok', english: 'const' },
  { sylheti: 'একদম', bangla: 'স্থির', phonetic: 'ekdom', english: 'constant' },
  { sylheti: 'যদি', bangla: 'যদি', phonetic: 'zodi', english: 'if' },
  { sylheti: 'নইলে', bangla: 'নইলে', phonetic: 'noile', english: 'else' },
  { sylheti: 'না_অইলে', bangla: 'না_হলে', phonetic: 'na_oile', english: 'else' },
  { sylheti: 'অথবা_যদি', bangla: 'অথবা_যদি', phonetic: 'othoba_zodi', english: 'else if' },
  { sylheti: 'যতক্ষণ', bangla: 'যতক্ষণ', phonetic: 'jotokkhon', english: 'while' },
  { sylheti: 'চলে', bangla: 'চলাকালীন', phonetic: 'chole', english: 'while' },
  { sylheti: 'ঘুরো', bangla: 'ঘুরুন', phonetic: 'ghuro', english: 'for' },
  { sylheti: 'বারবার', bangla: 'পুনরাবৃত্তি', phonetic: 'bar_bar', english: 'repeat' },
  { sylheti: 'কও', bangla: 'ছাপাও', phonetic: 'kwa', english: 'print' },
  { sylheti: 'কও_দেহি', bangla: 'প্রদর্শন_করুন', phonetic: 'kwa_dehi', english: 'println' },
  { sylheti: 'দেখাও', bangla: 'দেখাও', phonetic: 'dekhao', english: 'print' },
  { sylheti: 'লও', bangla: 'ইনপুট_নাও', phonetic: 'lao', english: 'input' },
  { sylheti: 'কাম', bangla: 'ফাংশন', phonetic: 'kaam', english: 'function' },
  { sylheti: 'ফেরত', bangla: 'ফেরত_দাও', phonetic: 'ferot', english: 'return' },
  { sylheti: 'দেও', bangla: 'দাও', phonetic: 'dew', english: 'return' },
  { sylheti: 'থামো', bangla: 'থামো', phonetic: 'thamo', english: 'break' },
  { sylheti: 'পরেরটা', bangla: 'পরবর্তী', phonetic: 'porerta', english: 'continue' },
  { sylheti: 'হাছা', bangla: 'সত্য', phonetic: 'hasa', english: 'true' },
  { sylheti: 'মিছা', bangla: 'মিথ্যা', phonetic: 'misa', english: 'false' },
  { sylheti: 'খালি', bangla: 'শূন্য', phonetic: 'khali', english: 'null' },
  { sylheti: 'আস্তা', bangla: 'পূর্ণসংখ্যা', phonetic: 'aasta', english: 'int' },
  { sylheti: 'ভাংতি', bangla: 'ভগ্নাংশ', phonetic: 'bhangti', english: 'float' },
  { sylheti: 'লেখা', bangla: 'বাক্য', phonetic: 'lekha', english: 'string' },
  { sylheti: 'সত্যমিছা', bangla: 'বুলিয়ান', phonetic: 'hotthomisa', english: 'bool' },
  { sylheti: 'সমান', bangla: 'সমান', phonetic: 'shoman', english: '==' },
  { sylheti: 'অসমান', bangla: 'অসমান', phonetic: 'oshoman', english: '!=' },
  { sylheti: 'বেশি', bangla: 'বৃহত্তর', phonetic: 'beshi', english: '>' },
  { sylheti: 'কম', bangla: 'ক্ষুদ্রতর', phonetic: 'kom', english: '<' },
  { sylheti: 'আর', bangla: 'এবং', phonetic: 'ar', english: '&&' },
  { sylheti: 'বা', bangla: 'অথবা', phonetic: 'ba', english: '||' },
  { sylheti: 'না', bangla: 'নয়', phonetic: 'na', english: '!' },
];

export class DialectMapper {
  public static translate(sourceCode: string, fromDialect: DialectType, toDialect: DialectType): string {
    if (fromDialect === toDialect) return sourceCode;

    let result = sourceCode;

    // Word boundary-aware regex translation
    for (const mapping of DIALECT_DICTIONARY) {
      const fromWord = mapping[fromDialect];
      const toWord = mapping[toDialect];

      if (!fromWord || !toWord || fromWord === toWord) continue;

      // Escape special characters for regex
      const escapedFrom = fromWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Look for whole words or tokens
      const regex = new RegExp(`(?<=[^\\p{L}\\p{N}_]|^)${escapedFrom}(?=[^\\p{L}\\p{N}_]|$)`, 'gu');
      result = result.replace(regex, toWord);
    }

    return result;
  }
}
