"""
Convert all '🔍 Predict' short_code questions to quiz (MCQ) format.
Each prediction question gets 4 options (A/B/C/D) where one is the correct output.
"""
import json, re

with open('data/javascript.json') as f:
    d = json.load(f)

def extract_code(q_text):
    """Extract code block from question text."""
    m = re.search(r'```js\n(.*?)```', q_text, re.DOTALL)
    return m.group(1).strip() if m else ''

def make_mcq(orig, new_q_text, options, answer, explanation):
    """Build a quiz-type question from a prediction question."""
    return {
        "section": orig["section"],
        "topic": orig["topic"],
        "type": "quiz",
        "q": new_q_text,
        "options": options,
        "answer": answer,
        "explanation": explanation,
        "id": orig["id"]
    }

# ─── CONVERSION MAP: id → (new_q, options, answer, explanation) ───────────────
conversions = {

    # ── LOOPS ──────────────────────────────────────────────────────────────────
    170: (
        "What is the output of this code?\n\n```js\nlet sum = 0;\nfor (let i = 1; i <= 4; i++) {\n  sum += i;\n}\nconsole.log(sum);\n```",
        {"A": "4", "B": "10", "C": "6", "D": "undefined"},
        "B",
        "The loop adds 1+2+3+4 = 10 to sum and logs it."
    ),
    171: (
        "What is printed to the console?\n\n```js\nlet i = 0;\nwhile (i < 5) {\n  if (i === 3) break;\n  console.log(i);\n  i++;\n}\n```",
        {"A": "0 1 2 3", "B": "0 1 2 3 4", "C": "0\n1\n2", "D": "1\n2\n3"},
        "C",
        "The loop prints i=0, 1, 2 then `break` exits when i===3."
    ),
    172: (
        "What is the output?\n\n```js\nfor (let i = 0; i < 6; i++) {\n  if (i % 2 === 0) continue;\n  console.log(i);\n}\n```",
        {"A": "0\n2\n4", "B": "1\n2\n3\n4\n5", "C": "0\n1\n2\n3\n4\n5", "D": "1\n3\n5"},
        "D",
        "`continue` skips even numbers (0, 2, 4). Only odd numbers 1, 3, 5 are printed."
    ),
    173: (
        "What is printed?\n\n```js\nconst fruits = ['apple', 'banana', 'cherry'];\nfor (const fruit of fruits) {\n  console.log(fruit);\n}\n```",
        {"A": "0\n1\n2", "B": "apple banana cherry", "C": "apple\nbanana\ncherry", "D": "['apple', 'banana', 'cherry']"},
        "C",
        "for...of iterates over array values directly, printing each element on a new line."
    ),
    174: (
        "What does this print?\n\n```js\nlet x = 5;\ndo {\n  console.log(x);\n  x--;\n} while (x > 3);\n```",
        {"A": "5\n4\n3", "B": "5", "C": "4\n3", "D": "5\n4"},
        "D",
        "do...while runs at x=5 (prints 5), then x=4 (4>3, prints 4), then x=3 (3>3 false, stops)."
    ),
    175: (
        "What is the output?\n\n```js\nlet result = 1;\nfor (let i = 1; i <= 4; i++) {\n  result *= i;\n}\nconsole.log(result);\n```",
        {"A": "10", "B": "16", "C": "24", "D": "4"},
        "C",
        "This is a factorial: 1×1×2×3×4 = 24."
    ),
    176: (
        "What is the final value logged?\n\n```js\nlet count = 0;\nfor (let i = 1; i <= 10; i++) {\n  if (i % 3 === 0) count++;\n}\nconsole.log(count);\n```",
        {"A": "2", "B": "4", "C": "10", "D": "3"},
        "D",
        "Numbers 1–10 divisible by 3 are: 3, 6, 9 → count = 3."
    ),

    # ── ARRAYS ─────────────────────────────────────────────────────────────────
    187: (
        "What is the output?\n\n```js\nconst nums = [10, 20, 30];\nnums.push(40);\nconsole.log(nums.length);\n```",
        {"A": "3", "B": "40", "C": "4", "D": "undefined"},
        "C",
        "push(40) adds 40 to the end → array is [10,20,30,40] → length is 4."
    ),
    188: (
        "What is printed?\n\n```js\nconst arr = [1, 2, 3, 4, 5];\nconst last = arr.pop();\nconsole.log(last);\nconsole.log(arr);\n```",
        {"A": "1\n[2, 3, 4, 5]", "B": "5\n[1, 2, 3, 4]", "C": "5\n[1, 2, 3, 4, 5]", "D": "undefined\n[1, 2, 3, 4]"},
        "B",
        "pop() removes and returns the last element (5). Remaining array is [1,2,3,4]."
    ),
    189: (
        "What is the output?\n\n```js\nconst letters = ['a', 'b', 'c'];\nconst first = letters.shift();\nconsole.log(first);\nconsole.log(letters);\n```",
        {"A": "a\n['a', 'b', 'c']", "B": "c\n['a', 'b']", "C": "a\n['b', 'c']", "D": "undefined\n['b', 'c']"},
        "C",
        "shift() removes and returns the first element ('a'). Remaining: ['b','c']."
    ),
    190: (
        "What does this code print?\n\n```js\nconst matrix = [[1, 2], [3, 4], [5, 6]];\nconsole.log(matrix[1][0]);\n```",
        {"A": "1", "B": "2", "C": "4", "D": "3"},
        "D",
        "matrix[1] is the second row [3,4]. matrix[1][0] is its first element: 3."
    ),
    191: (
        "What is the output?\n\n```js\nconst items = ['pen', 'pencil', 'ruler'];\nconsole.log(items.indexOf('pencil'));\nconsole.log(items.indexOf('eraser'));\n```",
        {"A": "2\n0", "B": "1\n0", "C": "0\n-1", "D": "1\n-1"},
        "D",
        "indexOf returns index of found item (1 for 'pencil') or -1 if not found ('eraser')."
    ),
    192: (
        "What is printed?\n\n```js\nconst a = [1, 2, 3];\na.unshift(0);\nconsole.log(a);\n```",
        {"A": "[1, 2, 3, 0]", "B": "[0, 1, 2, 3]", "C": "[1, 0, 2, 3]", "D": "[0, 2, 3]"},
        "B",
        "unshift(0) adds 0 to the BEGINNING of the array → [0,1,2,3]."
    ),

    # ── TEMPLATE LITERALS & STRINGS ────────────────────────────────────────────
    201: (
        "What is the output?\n\n```js\nconst name = 'Ahmed';\nconst greeting = `Hello, ${name}! You are student #${1 + 2}.`;\nconsole.log(greeting);\n```",
        {
            "A": "Hello, ${name}! You are student #${1 + 2}.",
            "B": "Hello, Ahmed! You are student #3.",
            "C": "Hello, name! You are student #1 + 2.",
            "D": "Hello, Ahmed! You are student #12."
        },
        "B",
        "Template literals evaluate ${} expressions. 'Ahmed' and 1+2=3 are interpolated."
    ),
    202: (
        "What is printed?\n\n```js\nconst city = 'Karachi';\nconsole.log(city.toUpperCase());\nconsole.log(city.toLowerCase());\n```",
        {"A": "Karachi\nKarachi", "B": "karachi\nKARAACHI", "C": "KARACHI\nkarachi", "D": "KARACHI\nKARAACHI"},
        "C",
        "toUpperCase() → 'KARACHI', toLowerCase() → 'karachi'."
    ),
    203: (
        "What is the output?\n\n```js\nconst str = '  Hello World  ';\nconsole.log(str.trim());\n```",
        {"A": "'  Hello World  '", "B": "HelloWorld", "C": "Hello World", "D": "Hello  World"},
        "C",
        "trim() removes whitespace from both ends of the string, leaving 'Hello World'."
    ),
    204: (
        "What is printed?\n\n```js\nconst text = 'JavaScript is fun';\nconsole.log(text.includes('fun'));\nconsole.log(text.startsWith('Java'));\n```",
        {"A": "false\ntrue", "B": "true\nfalse", "C": "false\nfalse", "D": "true\ntrue"},
        "D",
        "includes('fun') is true. startsWith('Java') is true since the string begins with 'Java'."
    ),
    205: (
        "What is the output?\n\n```js\nconst str = 'hello world';\nconsole.log(str.replace('world', 'Pakistan'));\nconsole.log(str.split(' '));\n```",
        {
            "A": "hello Pakistan\n['hello', 'world']",
            "B": "hello Pakistan\nhello Pakistan",
            "C": "hello world\n['hello', 'world']",
            "D": "hello Pakistan\n'hello world'"
        },
        "A",
        "replace() swaps the matched part. split(' ') breaks on spaces → ['hello','world']."
    ),

    # ── FUNCTIONS ──────────────────────────────────────────────────────────────
    215: (
        "What is printed?\n\n```js\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet('Zara'));\n```",
        {"A": "Hello, name!", "B": "greet('Zara')", "C": "Hello, Zara!", "D": "undefined"},
        "C",
        "The function returns a template literal with 'Zara' interpolated → 'Hello, Zara!'."
    ),
    216: (
        "What is the output?\n\n```js\nconst add = (a, b) => a + b;\nconsole.log(add(3, 7));\n```",
        {"A": "37", "B": "undefined", "C": "3 + 7", "D": "10"},
        "D",
        "Arrow function with implicit return: (a, b) => a + b. 3 + 7 = 10."
    ),
    217: (
        "What does this print?\n\n```js\nfunction multiply(x, y = 2) {\n  return x * y;\n}\nconsole.log(multiply(5));\nconsole.log(multiply(5, 3));\n```",
        {"A": "5\n15", "B": "10\n15", "C": "undefined\n15", "D": "10\n10"},
        "B",
        "y=2 is the default. multiply(5) → 5×2=10. multiply(5,3) overrides y=3 → 5×3=15."
    ),
    218: (
        "What is the output?\n\n```js\nfunction isEven(n) {\n  return n % 2 === 0;\n}\nconsole.log(isEven(4));\nconsole.log(isEven(7));\n```",
        {"A": "true\ntrue", "B": "false\ntrue", "C": "true\nfalse", "D": "false\nfalse"},
        "C",
        "4 % 2 === 0 is true (even). 7 % 2 === 1 which is not 0, so false (odd)."
    ),
    219: (
        "What is the output?\n\n```js\nconst square = x => x * x;\nconsole.log(square(6));\n```",
        {"A": "12", "B": "66", "C": "36", "D": "undefined"},
        "C",
        "Single-param arrow function with implicit return: x * x. 6 × 6 = 36."
    ),
    220: (
        "What does this output?\n\n```js\nfunction counter() {\n  let count = 0;\n  count++;\n  return count;\n}\nconsole.log(counter());\nconsole.log(counter());\n```",
        {"A": "1\n2", "B": "0\n0", "C": "1\n1", "D": "0\n1"},
        "C",
        "Each call creates a NEW local `count` starting at 0, increments to 1. Both calls return 1."
    ),
    221: (
        "What is the output?\n\n```js\nfunction sum(...nums) {\n  let total = 0;\n  for (const n of nums) total += n;\n  return total;\n}\nconsole.log(sum(1, 2, 3, 4));\n```",
        {"A": "1234", "B": "undefined", "C": "4", "D": "10"},
        "D",
        "Rest parameter ...nums collects [1,2,3,4]. Loop sums them: 1+2+3+4 = 10."
    ),
}

# ─── APPLY CONVERSIONS ────────────────────────────────────────────────────────
converted = 0
for i, q in enumerate(d):
    qid = q.get('id')
    if qid in conversions and '🔍 Predict' in q.get('q', ''):
        new_q_text, options, answer, explanation = conversions[qid]
        d[i] = {
            "section": q["section"],
            "topic": q["topic"],
            "type": "quiz",
            "q": new_q_text,
            "options": options,
            "answer": answer,
            "explanation": explanation,
            "id": qid
        }
        converted += 1

print(f"Converted: {converted} questions")

# Verify no prediction short_codes remain
remaining = [q for q in d if '🔍 Predict' in q.get('q','') and q.get('type') == 'short_code']
print(f"Remaining prediction short_codes: {len(remaining)} {'✅' if not remaining else '❌'}")

# Check total & IDs
ids = [q['id'] for q in d]
dupes = [i for i in set(ids) if ids.count(i) > 1]
print(f"Total questions: {len(d)}")
print(f"Duplicate IDs: {dupes if dupes else 'None ✅'}")

with open('data/javascript.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=2, ensure_ascii=False)

print("✅ javascript.json updated!")
