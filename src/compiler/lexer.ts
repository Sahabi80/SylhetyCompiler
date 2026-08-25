/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CompilerDiagnostic, SourceLocation, Token, TokenType } from './types';

// Convert Bangla numerals (০-৯) to Arabic numerals (0-9)
export function normalizeBanglaDigits(text: string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const index = banglaDigits.indexOf(char);
    if (index !== -1) {
      result += index.toString();
    } else {
      result += char;
    }
  }
  return result;
}

// Convert Arabic numerals (0-9) to Bangla numerals (০-৯)
export function toBanglaDigits(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => banglaDigits[parseInt(d, 10)]);
}

// Keyword map supporting Sylheti dialect, Standard Bangla, and Phonetic Romanized transliteration
const KEYWORD_MAP: Record<string, { type: TokenType; standardBangla: string }> = {
  // Variable declaration
  'ধরি': { type: 'KW_VAR', standardBangla: 'ধরি' },
  'রাখইন': { type: 'KW_VAR', standardBangla: 'ধরি' },
  'মনে_করি': { type: 'KW_VAR', standardBangla: 'ধরি' },
  'dhori': { type: 'KW_VAR', standardBangla: 'ধরি' },
  'rakhoin': { type: 'KW_VAR', standardBangla: 'ধরি' },
  'var': { type: 'KW_VAR', standardBangla: 'ধরি' },
  'let': { type: 'KW_VAR', standardBangla: 'ধরি' },

  // Constants
  'ধ্রুবক': { type: 'KW_CONST', standardBangla: 'ধ্রুবক' },
  'একদম': { type: 'KW_CONST', standardBangla: 'ধ্রুবক' },
  'বদলাইতো_নায়': { type: 'KW_CONST', standardBangla: 'ধ্রুবক' },
  'dhrubok': { type: 'KW_CONST', standardBangla: 'ধ্রুবক' },
  'ekdom': { type: 'KW_CONST', standardBangla: 'ধ্রুবক' },
  'const': { type: 'KW_CONST', standardBangla: 'ধ্রুবক' },

  // Conditionals
  'যদি': { type: 'KW_IF', standardBangla: 'যদি' },
  'zodi': { type: 'KW_IF', standardBangla: 'যদি' },
  'jodi': { type: 'KW_IF', standardBangla: 'যদি' },
  'if': { type: 'KW_IF', standardBangla: 'যদি' },

  'নইলে': { type: 'KW_ELSE', standardBangla: 'নইলে' },
  'না_অইলে': { type: 'KW_ELSE', standardBangla: 'নইলে' },
  'না_হইলে': { type: 'KW_ELSE', standardBangla: 'নইলে' },
  'অন্যথায়': { type: 'KW_ELSE', standardBangla: 'নইলে' },
  'noile': { type: 'KW_ELSE', standardBangla: 'নইলে' },
  'na_oile': { type: 'KW_ELSE', standardBangla: 'নইলে' },
  'else': { type: 'KW_ELSE', standardBangla: 'নইলে' },

  'অথবা_যদি': { type: 'KW_ELIF', standardBangla: 'অথবা_যদি' },
  'নইলে_যদি': { type: 'KW_ELIF', standardBangla: 'অথবা_যদি' },
  'othoba_zodi': { type: 'KW_ELIF', standardBangla: 'অথবা_যদি' },
  'othoba_jodi': { type: 'KW_ELIF', standardBangla: 'অথবা_যদি' },
  'elif': { type: 'KW_ELIF', standardBangla: 'অথবা_যদি' },
  'else_if': { type: 'KW_ELIF', standardBangla: 'অথবা_যদি' },

  // Loops
  'যতক্ষণ': { type: 'KW_WHILE', standardBangla: 'যতক্ষণ' },
  'যত_সময়': { type: 'KW_WHILE', standardBangla: 'যতক্ষণ' },
  'চলে': { type: 'KW_WHILE', standardBangla: 'যতক্ষণ' },
  'jotokkhon': { type: 'KW_WHILE', standardBangla: 'যতক্ষণ' },
  'jotokhon': { type: 'KW_WHILE', standardBangla: 'যতক্ষণ' },
  'while': { type: 'KW_WHILE', standardBangla: 'যতক্ষণ' },

  'ঘুরো': { type: 'KW_FOR', standardBangla: 'ঘুরো' },
  'বারবার': { type: 'KW_FOR', standardBangla: 'ঘুরো' },
  'পুনরাবৃত্তি': { type: 'KW_FOR', standardBangla: 'ঘুরো' },
  'ghuro': { type: 'KW_FOR', standardBangla: 'ঘুরো' },
  'bar_bar': { type: 'KW_FOR', standardBangla: 'ঘুরো' },
  'for': { type: 'KW_FOR', standardBangla: 'ঘুরো' },

  // I/O
  'কও': { type: 'KW_PRINT', standardBangla: 'কও' },
  'কও_দেহি': { type: 'KW_PRINT', standardBangla: 'কও' },
  'দেখাও': { type: 'KW_PRINT', standardBangla: 'কও' },
  'ছাপাও': { type: 'KW_PRINT', standardBangla: 'কও' },
  'বলো': { type: 'KW_PRINT', standardBangla: 'কও' },
  'kwa': { type: 'KW_PRINT', standardBangla: 'কও' },
  'dekhao': { type: 'KW_PRINT', standardBangla: 'কও' },
  'chapao': { type: 'KW_PRINT', standardBangla: 'কও' },
  'print': { type: 'KW_PRINT', standardBangla: 'কও' },
  'println': { type: 'KW_PRINT', standardBangla: 'কও' },

  'লও': { type: 'KW_INPUT', standardBangla: 'লও' },
  'নেও': { type: 'KW_INPUT', standardBangla: 'লও' },
  'ইনপুট': { type: 'KW_INPUT', standardBangla: 'লও' },
  'শুনো': { type: 'KW_INPUT', standardBangla: 'লও' },
  'lao': { type: 'KW_INPUT', standardBangla: 'লও' },
  'input': { type: 'KW_INPUT', standardBangla: 'লও' },

  // Functions
  'কাম': { type: 'KW_FUNCTION', standardBangla: 'কাম' },
  'কাজ': { type: 'KW_FUNCTION', standardBangla: 'কাম' },
  'ফাংশন': { type: 'KW_FUNCTION', standardBangla: 'কাম' },
  'kaam': { type: 'KW_FUNCTION', standardBangla: 'কাম' },
  'kaj': { type: 'KW_FUNCTION', standardBangla: 'কাম' },
  'function': { type: 'KW_FUNCTION', standardBangla: 'কাম' },
  'func': { type: 'KW_FUNCTION', standardBangla: 'কাম' },
  'def': { type: 'KW_FUNCTION', standardBangla: 'কাম' },

  // Return & Control
  'ফেরত': { type: 'KW_RETURN', standardBangla: 'ফেরত' },
  'দেও': { type: 'KW_RETURN', standardBangla: 'ফেরত' },
  'দিয়া_দেও': { type: 'KW_RETURN', standardBangla: 'ফেরত' },
  'ফেরত_দাও': { type: 'KW_RETURN', standardBangla: 'ফেরত' },
  'ferot': { type: 'KW_RETURN', standardBangla: 'ফেরত' },
  'dew': { type: 'KW_RETURN', standardBangla: 'ফেরত' },
  'return': { type: 'KW_RETURN', standardBangla: 'ফেরত' },

  'থামো': { type: 'KW_BREAK', standardBangla: 'থামো' },
  'ভাংগিয়া_যাও': { type: 'KW_BREAK', standardBangla: 'থামো' },
  'থামাও': { type: 'KW_BREAK', standardBangla: 'থামো' },
  'thamo': { type: 'KW_BREAK', standardBangla: 'থামো' },
  'break': { type: 'KW_BREAK', standardBangla: 'থামো' },

  'পরেরটা': { type: 'KW_CONTINUE', standardBangla: 'পরেরটা' },
  'চালাও': { type: 'KW_CONTINUE', standardBangla: 'পরেরটা' },
  'porerta': { type: 'KW_CONTINUE', standardBangla: 'পরেরটা' },
  'continue': { type: 'KW_CONTINUE', standardBangla: 'পরেরটা' },

  // Booleans & Null
  'হাছা': { type: 'KW_TRUE', standardBangla: 'হাছা' },
  'সত্য': { type: 'KW_TRUE', standardBangla: 'হাছা' },
  'ঠিক': { type: 'KW_TRUE', standardBangla: 'হাছা' },
  'hasa': { type: 'KW_TRUE', standardBangla: 'হাছা' },
  'shotto': { type: 'KW_TRUE', standardBangla: 'হাছা' },
  'true': { type: 'KW_TRUE', standardBangla: 'হাছা' },

  'মিছা': { type: 'KW_FALSE', standardBangla: 'মিছা' },
  'মিথ্যা': { type: 'KW_FALSE', standardBangla: 'মিছা' },
  'ভুল': { type: 'KW_FALSE', standardBangla: 'মিছা' },
  'misa': { type: 'KW_FALSE', standardBangla: 'মিছা' },
  'mittha': { type: 'KW_FALSE', standardBangla: 'মিছা' },
  'false': { type: 'KW_FALSE', standardBangla: 'মিছা' },

  'খালি': { type: 'KW_NULL', standardBangla: 'খালি' },
  'নাই': { type: 'KW_NULL', standardBangla: 'খালি' },
  'শূন্য': { type: 'KW_NULL', standardBangla: 'খালি' },
  'khali': { type: 'KW_NULL', standardBangla: 'খালি' },
  'null': { type: 'KW_NULL', standardBangla: 'খালি' },
  'none': { type: 'KW_NULL', standardBangla: 'খালি' },

  // Type annotations
  'আস্তা': { type: 'TYPE_INT', standardBangla: 'আস্তা' },
  'পূর্ণসংখ্যা': { type: 'TYPE_INT', standardBangla: 'আস্তা' },
  'সংখ্যা': { type: 'TYPE_INT', standardBangla: 'আস্তা' },
  'aasta': { type: 'TYPE_INT', standardBangla: 'আস্তা' },
  'int': { type: 'TYPE_INT', standardBangla: 'আস্তা' },
  'integer': { type: 'TYPE_INT', standardBangla: 'আস্তা' },

  'ভাংতি': { type: 'TYPE_FLOAT', standardBangla: 'ভাংতি' },
  'ভগ্নাংশ': { type: 'TYPE_FLOAT', standardBangla: 'ভাংতি' },
  'দশমিক': { type: 'TYPE_FLOAT', standardBangla: 'ভাংতি' },
  'bhangti': { type: 'TYPE_FLOAT', standardBangla: 'ভাংতি' },
  'float': { type: 'TYPE_FLOAT', standardBangla: 'ভাংতি' },
  'double': { type: 'TYPE_FLOAT', standardBangla: 'ভাংতি' },

  'লেখা': { type: 'TYPE_STRING', standardBangla: 'লেখা' },
  'শব্দ': { type: 'TYPE_STRING', standardBangla: 'লেখা' },
  'বাক্য': { type: 'TYPE_STRING', standardBangla: 'লেখা' },
  'lekha': { type: 'TYPE_STRING', standardBangla: 'লেখা' },
  'str': { type: 'TYPE_STRING', standardBangla: 'লেখা' },
  'string': { type: 'TYPE_STRING', standardBangla: 'লেখা' },

  'সত্যমিছা': { type: 'TYPE_BOOL', standardBangla: 'সত্যমিছা' },
  'hotthomisa': { type: 'TYPE_BOOL', standardBangla: 'সত্যমিছা' },
  'bool': { type: 'TYPE_BOOL', standardBangla: 'সত্যমিছা' },
  'boolean': { type: 'TYPE_BOOL', standardBangla: 'সত্যমিছা' },
};

// Word-based operator keywords (e.g. 'যোগ', 'এবং', 'আর')
const WORD_OPERATORS: Record<string, TokenType> = {
  'যোগ': 'PLUS',
  'বিয়োগ': 'MINUS',
  'গুণ': 'STAR',
  'ভাগ': 'SLASH',
  'ভাগশেষ': 'PERCENT',
  'সমান': 'EQ',
  'অসমান': 'NEQ',
  'বেশি': 'GT',
  'কম': 'LT',
  'বেশি_বা_সমান': 'GTE',
  'কম_বা_সমান': 'LTE',
  'আর': 'AND',
  'এবং': 'AND',
  'বা': 'OR',
  'অথবা': 'OR',
  'না': 'NOT',
};

export class Lexer {
  private source: string;
  private start = 0;
  private current = 0;
  private line = 1;
  private column = 1;
  private lineStart = 0;
  private tokens: Token[] = [];
  private diagnostics: CompilerDiagnostic[] = [];

  constructor(source: string) {
    this.source = source;
  }

  public tokenize(): { tokens: Token[]; diagnostics: CompilerDiagnostic[] } {
    this.tokens = [];
    this.diagnostics = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.column = 1;
    this.lineStart = 0;

    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({
      type: 'EOF',
      lexeme: '',
      loc: {
        line: this.line,
        column: this.current - this.lineStart + 1,
        offset: this.current,
        length: 0,
      },
    });

    return { tokens: this.tokens, diagnostics: this.diagnostics };
  }

  private scanToken(): void {
    const c = this.advance();

    // Whitespace handling
    if (c === ' ' || c === '\r' || c === '\t') {
      return;
    }

    if (c === '\n') {
      this.line++;
      this.lineStart = this.current;
      return;
    }

    // Comments
    if (c === '/' && this.peek() === '/') {
      while (this.peek() !== '\n' && !this.isAtEnd()) {
        this.advance();
      }
      return;
    }

    if (c === '/' && this.peek() === '*') {
      this.advance(); // consume *
      while (!(this.peek() === '*' && this.peekNext() === '/') && !this.isAtEnd()) {
        if (this.peek() === '\n') {
          this.line++;
          this.lineStart = this.current + 1;
        }
        this.advance();
      }
      if (!this.isAtEnd()) {
        this.advance(); // consume *
        this.advance(); // consume /
      } else {
        this.addError('অসমাপ্ত মন্তব্য (Unterminated block comment /* ... */)');
      }
      return;
    }

    if (c === '#') {
      // Python style comment
      while (this.peek() !== '\n' && !this.isAtEnd()) {
        this.advance();
      }
      return;
    }

    // Delimiters
    switch (c) {
      case '(':
        this.addToken('LPAREN');
        return;
      case ')':
        this.addToken('RPAREN');
        return;
      case '{':
        this.addToken('LBRACE');
        return;
      case '}':
        this.addToken('RBRACE');
        return;
      case '[':
        this.addToken('LBRACKET');
        return;
      case ']':
        this.addToken('RBRACKET');
        return;
      case ',':
        this.addToken('COMMA');
        return;
      case ':':
        this.addToken('COLON');
        return;
      case ';':
      case '।': // Bangla Danda acts as semicolon/statement terminator
        this.addToken('SEMICOLON');
        return;
      case '.':
        this.addToken('DOT');
        return;

      // Operators
      case '+':
        if (this.match('+')) {
          this.addToken('INC');
        } else if (this.match('=')) {
          this.addToken('PLUS_ASSIGN');
        } else {
          this.addToken('PLUS');
        }
        return;

      case '-':
        if (this.match('-')) {
          this.addToken('DEC');
        } else if (this.match('=')) {
          this.addToken('MINUS_ASSIGN');
        } else {
          this.addToken('MINUS');
        }
        return;

      case '*':
        this.addToken('STAR');
        return;

      case '/':
        this.addToken('SLASH');
        return;

      case '%':
        this.addToken('PERCENT');
        return;

      case '=':
        if (this.match('=')) {
          this.addToken('EQ');
        } else {
          this.addToken('ASSIGN');
        }
        return;

      case '!':
        if (this.match('=')) {
          this.addToken('NEQ');
        } else {
          this.addToken('NOT');
        }
        return;

      case '<':
        if (this.match('=')) {
          this.addToken('LTE');
        } else {
          this.addToken('LT');
        }
        return;

      case '>':
        if (this.match('=')) {
          this.addToken('GTE');
        } else {
          this.addToken('GT');
        }
        return;

      case '&':
        if (this.match('&')) {
          this.addToken('AND');
        } else {
          this.addError("একক '&' অপারেটর সমর্থিত নয়, '&&' অথবা 'আর' ব্যবহার করুন");
        }
        return;

      case '|':
        if (this.match('|')) {
          this.addToken('OR');
        } else {
          this.addError("একক '|' অপারেটর সমর্থিত নয়, '||' অথবা 'বা' ব্যবহার করুন");
        }
        return;

      // String literals
      case '"':
      case "'":
      case '“':
      case '”':
        this.scanString(c);
        return;
    }

    // Number literals (Latin digits 0-9 or Bangla digits ০-৯)
    if (this.isDigit(c)) {
      this.scanNumber();
      return;
    }

    // Identifiers and Bangla/Sylheti words
    if (this.isAlphaOrBangla(c)) {
      this.scanIdentifier();
      return;
    }

    // Unexpected character
    this.addError(`অপ্রত্যাশিত অক্ষর '${c}' (Unexpected character)`);
  }

  private scanString(quoteChar: string): void {
    const endQuotes = quoteChar === '“' ? ['”', '“', '"'] : [quoteChar];
    let value = '';

    while (!this.isAtEnd() && !endQuotes.includes(this.peek())) {
      if (this.peek() === '\n') {
        this.line++;
        this.lineStart = this.current + 1;
      }
      if (this.peek() === '\\') {
        this.advance(); // consume \
        const escaped = this.advance();
        if (escaped === 'n') value += '\n';
        else if (escaped === 't') value += '\t';
        else if (escaped === 'r') value += '\r';
        else if (escaped === '\\') value += '\\';
        else if (escaped === '"' || escaped === "'") value += escaped;
        else value += escaped;
      } else {
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      this.addError('অসমাপ্ত স্ট্রিং লিটারেল (Unterminated string literal)');
      return;
    }

    this.advance(); // Closing quote
    const lexeme = this.source.substring(this.start, this.current);
    this.addToken('STRING_LITERAL', value, lexeme);
  }

  private scanNumber(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Fractional part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // consume .
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const lexeme = this.source.substring(this.start, this.current);
    const normalized = normalizeBanglaDigits(lexeme);
    const numValue = Number(normalized);

    this.addToken('NUMBER_LITERAL', numValue, lexeme);
  }

  private scanIdentifier(): void {
    while (this.isAlphaNumericOrBangla(this.peek())) {
      this.advance();
    }

    const lexeme = this.source.substring(this.start, this.current);
    const lowerLexeme = lexeme.toLowerCase();

    // Check keyword map
    if (KEYWORD_MAP[lexeme] || KEYWORD_MAP[lowerLexeme]) {
      const kw = KEYWORD_MAP[lexeme] || KEYWORD_MAP[lowerLexeme];
      this.tokens.push({
        type: kw.type,
        lexeme,
        loc: this.getCurrentLocation(),
        normalizedDialect: kw.standardBangla,
      });
      return;
    }

    // Check word-based operators (e.g. যোগ, গুণ, এবং)
    if (WORD_OPERATORS[lexeme]) {
      this.addToken(WORD_OPERATORS[lexeme]);
      return;
    }

    // Regular identifier
    this.addToken('IDENTIFIER', lexeme, lexeme);
  }

  private isDigit(c: string): boolean {
    if (!c) return false;
    return (c >= '0' && c <= '9') || (c >= '০' && c <= '৯');
  }

  private isAlphaOrBangla(c: string): boolean {
    if (!c) return false;
    // Latin letters, underscores, and Bengali Unicode block (U+0980 to U+09FF) + Sylheti Nagri block (U+A800 to U+A82F)
    const code = c.charCodeAt(0);
    return (
      (c >= 'a' && c <= 'z') ||
      (c >= 'A' && c <= 'Z') ||
      c === '_' ||
      (code >= 0x0980 && code <= 0x09ff) || // Bengali script
      (code >= 0xa800 && code <= 0xa82f) // Sylheti Nagri script
    );
  }

  private isAlphaNumericOrBangla(c: string): boolean {
    return this.isAlphaOrBangla(c) || this.isDigit(c);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }

  private advance(): string {
    return this.source[this.current++];
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private getCurrentLocation(): SourceLocation {
    const col = this.start - this.lineStart + 1;
    return {
      line: this.line,
      column: col > 0 ? col : 1,
      offset: this.start,
      length: this.current - this.start,
    };
  }

  private addToken(type: TokenType, literal?: any, customLexeme?: string): void {
    const lexeme = customLexeme || this.source.substring(this.start, this.current);
    this.tokens.push({
      type,
      lexeme,
      literal,
      loc: this.getCurrentLocation(),
    });
  }

  private addError(message: string): void {
    this.diagnostics.push({
      severity: 'error',
      message,
      loc: this.getCurrentLocation(),
      stage: 'lexer',
    });
  }
}
