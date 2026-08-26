# learning-to-code

Learning to program, in Python, from zero.

## How to use this

Work through the lessons in order. Each one is a file you **run**, then **edit**,
then run again. Reading code teaches you much less than breaking it does.

```
python3 lessons/01_hello.py
```

| Lesson | What it covers |
| --- | --- |
| `lessons/01_hello.py` | Printing, comments, numbers vs. text |
| `lessons/02_variables.py` | Variables, types, f-strings, `input()` |
| `lessons/03_decisions.py` | `if` / `elif` / `else`, comparisons, indentation |
| `lessons/04_loops.py` | Lists, `for`, `while`, `range()` |

Every lesson ends with a **Try it yourself** section. Do those — that's the part
that actually teaches you.

## Then do the exercises

Open `exercises/exercises.py` and fill in each function. Check your work:

```
python3 check.py
```

It tells you which exercises pass, which you haven't started, and — when an
answer is wrong — exactly what your code returned versus what was expected.

## When something breaks

It will, constantly. That's normal and it is not a sign you're bad at this.
Read the **last line** of the error message first: it names the problem.

| Error | Usually means |
| --- | --- |
| `SyntaxError` | A typo — a missing `:`, quote, or bracket |
| `IndentationError` | Spacing is off; use 4 spaces inside `if`/`for` blocks |
| `NameError` | A misspelled variable, or one used before it was created |
| `TypeError` | Mixing text and numbers — you probably need `int()` or `str()` |
